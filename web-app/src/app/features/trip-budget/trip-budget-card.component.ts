import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { TripBudgetService } from '../../core/services/trip-budget.service';
import type {
  TripBudgetSummaryResponse,
  TripExpenseCategory,
  TripExpenseResponse,
} from '../../core/models/api.models';

const AMBER_THRESHOLD = 80;
const RED_THRESHOLD = 100;

const CATEGORY_ICONS: Record<string, string> = {
  VOLI: 'flight',
  HOTEL: 'hotel',
  RISTORANTI: 'restaurant',
  CROCIERE: 'directions_boat',
  ATTRAZIONI: 'local_activity',
  FOOD: 'lunch_dining',
  TRANSPORT: 'directions_bus',
  SHOPPING: 'shopping_bag',
  ACTIVITIES: 'hiking',
  OTHER: 'receipt_long',
};

const EXPENSE_CATEGORIES: TripExpenseCategory[] = ['FOOD', 'TRANSPORT', 'SHOPPING', 'ACTIVITIES', 'OTHER'];

/**
 * Self-contained "how much is this trip costing vs my budget" card.
 * Mount with `<app-trip-budget-card [tripId]="id" />` — it loads its own data.
 */
@Component({
  selector: 'app-trip-budget-card',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, DecimalPipe, TranslocoModule],
  templateUrl: './trip-budget-card.component.html',
  styleUrl: './trip-budget-card.component.scss',
})
export class TripBudgetCardComponent {
  private readonly budgetService = inject(TripBudgetService);

  /** Trip (travel request) id this card belongs to. */
  readonly tripId = input.required<string>();

  readonly loading = signal(true);
  readonly summary = signal<TripBudgetSummaryResponse | null>(null);
  readonly expenses = signal<TripExpenseResponse[]>([]);
  readonly saving = signal(false);
  readonly editingBudget = signal(false);

  budgetInput: number | null = null;

  // Expense form fields.
  newCategory: TripExpenseCategory = 'FOOD';
  newDescription = '';
  newAmount: number | null = null;
  newDate = '';

  readonly categories = EXPENSE_CATEGORIES;

  readonly hasBudget = computed(() => {
    const s = this.summary();
    return !!s && s.budget != null && s.budget > 0;
  });

  readonly percent = computed(() => this.summary()?.percentUsed ?? 0);

  /** Bar width is clamped to 100% even when over budget (over-spend shown via colour + figures). */
  readonly barWidth = computed(() => Math.min(this.percent(), 100));

  readonly barState = computed<'ok' | 'warn' | 'over'>(() => {
    const p = this.percent();
    if (p > RED_THRESHOLD) return 'over';
    if (p >= AMBER_THRESHOLD) return 'warn';
    return 'ok';
  });

  readonly currency = computed(() => this.summary()?.currency ?? 'EUR');

  constructor() {
    effect(() => {
      const id = this.tripId();
      if (id) {
        this.load(id);
      }
    });
  }

  private load(tripId: string): void {
    this.loading.set(true);
    this.budgetService
      .getSummary(tripId)
      .pipe(catchError(() => of(null)))
      .subscribe(summary => {
        this.summary.set(summary);
        this.budgetInput = summary?.budget ?? null;
        this.loading.set(false);
      });
    this.budgetService
      .listExpenses(tripId)
      .pipe(catchError(() => of([] as TripExpenseResponse[])))
      .subscribe(list => this.expenses.set(list));
  }

  startEditBudget(): void {
    this.budgetInput = this.summary()?.budget ?? null;
    this.editingBudget.set(true);
  }

  saveBudget(): void {
    const amount = this.budgetInput;
    if (amount == null || amount <= 0) {
      return;
    }
    this.saving.set(true);
    this.budgetService
      .setBudget(this.tripId(), amount)
      .pipe(catchError(() => of(null)))
      .subscribe(summary => {
        if (summary) {
          this.summary.set(summary);
        }
        this.saving.set(false);
        this.editingBudget.set(false);
      });
  }

  addExpense(): void {
    const amount = this.newAmount;
    if (amount == null || amount <= 0) {
      return;
    }
    this.saving.set(true);
    this.budgetService
      .addExpense(this.tripId(), {
        category: this.newCategory,
        description: this.newDescription.trim() || null,
        amount,
        spentOn: this.newDate || null,
      })
      .pipe(catchError(() => of(null)))
      .subscribe(created => {
        if (created) {
          this.expenses.update(list => [created, ...list]);
          this.resetForm();
          this.refreshSummary();
        }
        this.saving.set(false);
      });
  }

  deleteExpense(expense: TripExpenseResponse): void {
    this.budgetService
      .deleteExpense(this.tripId(), expense.id)
      .pipe(catchError(() => of(undefined)))
      .subscribe(() => {
        this.expenses.update(list => list.filter(e => e.id !== expense.id));
        this.refreshSummary();
      });
  }

  categoryIcon(category: string): string {
    return CATEGORY_ICONS[category] ?? 'receipt_long';
  }

  private refreshSummary(): void {
    this.budgetService
      .getSummary(this.tripId())
      .pipe(catchError(() => of(this.summary())))
      .subscribe(summary => this.summary.set(summary));
  }

  private resetForm(): void {
    this.newCategory = 'FOOD';
    this.newDescription = '';
    this.newAmount = null;
    this.newDate = '';
  }
}
