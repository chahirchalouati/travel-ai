import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ApiWrapper,
  TripBudgetSummaryResponse,
  TripExpenseResponse,
  TripExpenseRequest,
  TripRefResponse,
} from '../models/api.models';

/** Trip budget & spending summary API (authenticated, owner-scoped). */
@Injectable({ providedIn: 'root' })
export class TripBudgetService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/trips`;

  getSummary(tripId: string): Observable<TripBudgetSummaryResponse> {
    return this.http
      .get<ApiWrapper<TripBudgetSummaryResponse>>(`${this.base}/${tripId}/budget`)
      .pipe(map(res => res.data));
  }

  setBudget(tripId: string, amount: number): Observable<TripBudgetSummaryResponse> {
    return this.http
      .put<ApiWrapper<TripBudgetSummaryResponse>>(`${this.base}/${tripId}/budget`, { amount })
      .pipe(map(res => res.data));
  }

  listExpenses(tripId: string): Observable<TripExpenseResponse[]> {
    return this.http
      .get<ApiWrapper<TripExpenseResponse[]>>(`${this.base}/${tripId}/expenses`)
      .pipe(map(res => res.data ?? []));
  }

  addExpense(tripId: string, req: TripExpenseRequest): Observable<TripExpenseResponse> {
    return this.http
      .post<ApiWrapper<TripExpenseResponse>>(`${this.base}/${tripId}/expenses`, req)
      .pipe(map(res => res.data));
  }

  deleteExpense(tripId: string, expenseId: string): Observable<void> {
    return this.http
      .delete<ApiWrapper<void>>(`${this.base}/${tripId}/expenses/${expenseId}`)
      .pipe(map(() => undefined));
  }

  /** Resolves the trip behind a booking so booking-scoped pages can show the budget card. */
  resolveTripForBooking(bookingId: string): Observable<TripRefResponse> {
    return this.http
      .get<ApiWrapper<TripRefResponse>>(`${this.base}/for-booking/${bookingId}`)
      .pipe(map(res => res.data));
  }
}
