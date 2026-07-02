import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ApiWrapper,
  BookingResponse,
  CancellationPreview,
  CancellationResult,
  CreateBookingRequest,
  PageWrapper,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  /** Lists the current user's bookings (paged). */
  list(page = 0, size = 50): Observable<BookingResponse[]> {
    return this.http
      .get<ApiWrapper<PageWrapper<BookingResponse>>>(
        `${environment.apiUrl}/bookings?page=${page}&size=${size}`
      )
      .pipe(map(res => res.data?.content ?? []));
  }

  create(req: CreateBookingRequest): Observable<BookingResponse> {
    return this.http.post<ApiWrapper<BookingResponse>>(`${environment.apiUrl}/bookings`, req).pipe(
      map(res => res.data)
    );
  }

  getBooking(id: string): Observable<BookingResponse> {
    return this.http.get<ApiWrapper<BookingResponse>>(`${environment.apiUrl}/bookings/${id}`).pipe(
      map(res => res.data)
    );
  }

  /** Refund quote for cancelling a booking now, without cancelling it. */
  cancellationPreview(id: string): Observable<CancellationPreview> {
    return this.http
      .get<ApiWrapper<CancellationPreview>>(`${environment.apiUrl}/bookings/${id}/cancellation-preview`)
      .pipe(map(res => res.data));
  }

  /** Cancels the booking; the backend refunds per policy and restores inventory. */
  cancel(id: string, reason?: string): Observable<CancellationResult> {
    return this.http
      .post<ApiWrapper<CancellationResult>>(`${environment.apiUrl}/bookings/${id}/cancel`, {
        reason: reason?.trim() || null,
      })
      .pipe(map(res => res.data));
  }
}
