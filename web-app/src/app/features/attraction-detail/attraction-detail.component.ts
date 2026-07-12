import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { AttractionService } from '../../core/services/attraction.service';
import { ReviewService } from '../../core/services/review.service';
import { AuthService } from '../../core/services/auth.service';
import type {
  AttractionResponse,
  ReviewResponse,
  ReviewSummary,
  CreateReviewRequest,
} from '../../core/models/api.models';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { UiInputComponent } from '../../shared/ui/ui-input.component';
import { UiTextareaComponent } from '../../shared/ui/ui-textarea.component';
import { UiSkeletonComponent } from '../../shared/ui/ui-skeleton.component';

const TARGET_TYPE = 'ATTRACTION';

@Component({
  selector: 'app-attraction-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, TranslocoModule, RevealDirective, UiInputComponent, UiTextareaComponent, UiSkeletonComponent],
  templateUrl: './attraction-detail.component.html',
  styleUrl: './attraction-detail.component.scss',
})
export class AttractionDetailComponent implements OnInit {
  private readonly attractionService = inject(AttractionService);
  private readonly reviewService = inject(ReviewService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly attraction = signal<AttractionResponse | null>(null);
  readonly loading = signal(true);
  readonly reviews = signal<ReviewResponse[]>([]);
  readonly summary = signal<ReviewSummary | null>(null);

  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly showForm = signal(false);
  readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);

  // review form model
  formRating = 5;
  formTitle = '';
  formContent = '';

  readonly hasReviews = computed(() => this.reviews().length > 0);

  private id = '';

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.id) {
      this.router.navigate(['/attractions']);
      return;
    }
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.attractionService
      .getById(this.id)
      .pipe(catchError(() => of(null)))
      .subscribe(a => {
        this.attraction.set(a);
        this.loading.set(false);
        if (!a) {
          return;
        }
      });
    this.loadReviews();
  }

  private loadReviews(): void {
    this.reviewService
      .getSummary(TARGET_TYPE, this.id)
      .pipe(catchError(() => of(null)))
      .subscribe(s => this.summary.set(s));
    this.reviewService
      .getForTarget(TARGET_TYPE, this.id)
      .pipe(catchError(() => of([] as ReviewResponse[])))
      .subscribe(list => this.reviews.set(list));
  }

  toggleForm(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/attractions', this.id], { queryParams: { auth: 'login' } });
      return;
    }
    this.showForm.update(v => !v);
  }

  submitReview(): void {
    if (!this.formContent.trim()) {
      this.formError.set('content');
      return;
    }
    this.submitting.set(true);
    this.formError.set(null);
    const payload: CreateReviewRequest = {
      targetType: TARGET_TYPE,
      targetId: this.id,
      rating: this.formRating,
      title: this.formTitle.trim(),
      content: this.formContent.trim(),
    };
    this.reviewService
      .create(payload)
      .pipe(catchError(() => of(null)))
      .subscribe(created => {
        this.submitting.set(false);
        if (created) {
          this.showForm.set(false);
          this.formTitle = '';
          this.formContent = '';
          this.formRating = 5;
          this.loadReviews();
        } else {
          this.formError.set('submit');
        }
      });
  }

  markHelpful(review: ReviewResponse): void {
    if (!this.isAuthenticated()) {
      return;
    }
    this.reviewService
      .markHelpful(review.id)
      .pipe(catchError(() => of(null)))
      .subscribe(updated => {
        if (updated) {
          this.reviews.update(list => list.map(r => (r.id === updated.id ? updated : r)));
        }
      });
  }

  stars(n: number): number[] {
    return Array.from({ length: Math.max(0, Math.min(5, Math.round(n))) });
  }

  formatDuration(minutes: number | null): string | null {
    if (!minutes) {
      return null;
    }
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${hours}h`;
  }

  planWithAi(): void {
    const a = this.attraction();
    this.router.navigate(['/planner'], a ? { queryParams: { q: a.city } } : {});
  }

  back(): void {
    this.router.navigate(['/attractions']);
  }
}
