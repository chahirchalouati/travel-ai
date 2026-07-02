import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';

import { TripBudgetCardComponent } from './trip-budget-card.component';
import { TripBudgetService } from '../../core/services/trip-budget.service';
import type { TripBudgetSummaryResponse } from '../../core/models/api.models';

function translocoStub() {
  return TranslocoTestingModule.forRoot({
    langs: { en: {} },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

function summary(partial: Partial<TripBudgetSummaryResponse>): TripBudgetSummaryResponse {
  return {
    budget: null,
    currency: 'EUR',
    totalSpent: 0,
    remaining: null,
    percentUsed: null,
    breakdown: [],
    ...partial,
  };
}

describe('TripBudgetCardComponent', () => {
  let fixture: ComponentFixture<TripBudgetCardComponent>;
  let component: TripBudgetCardComponent;
  let service: jasmine.SpyObj<TripBudgetService>;

  async function setup(s: TripBudgetSummaryResponse): Promise<void> {
    service = jasmine.createSpyObj<TripBudgetService>('TripBudgetService', [
      'getSummary', 'setBudget', 'listExpenses', 'addExpense', 'deleteExpense', 'resolveTripForBooking',
    ]);
    service.getSummary.and.returnValue(of(s));
    service.listExpenses.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TripBudgetCardComponent, translocoStub()],
      providers: [{ provide: TripBudgetService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(TripBudgetCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tripId', 'trip-1');
    fixture.detectChanges();
  }

  it('loads the summary for its trip id', async () => {
    await setup(summary({ totalSpent: 120 }));
    expect(service.getSummary).toHaveBeenCalledWith('trip-1');
    expect(component.hasBudget()).toBeFalse();
  });

  it('marks the bar green under 80% used', async () => {
    await setup(summary({ budget: 1000, totalSpent: 500, percentUsed: 50, remaining: 500 }));
    expect(component.hasBudget()).toBeTrue();
    expect(component.barState()).toBe('ok');
  });

  it('marks the bar amber between 80 and 100%', async () => {
    await setup(summary({ budget: 1000, totalSpent: 900, percentUsed: 90, remaining: 100 }));
    expect(component.barState()).toBe('warn');
  });

  it('marks the bar red and clamps width when over budget', async () => {
    await setup(summary({ budget: 1000, totalSpent: 1300, percentUsed: 130, remaining: -300 }));
    expect(component.barState()).toBe('over');
    expect(component.barWidth()).toBe(100);
  });
});
