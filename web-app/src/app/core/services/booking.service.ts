import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, CreateBookingRequest, BookingResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

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

  cancel(id: string): Observable<BookingResponse> {
    return this.http.patch<ApiWrapper<BookingResponse>>(`${environment.apiUrl}/bookings/${id}/cancel`, {}).pipe(
      map(res => res.data)
    );
  }
}
