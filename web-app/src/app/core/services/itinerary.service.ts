import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ApiWrapper,
  LiveItineraryResponse,
  ItineraryProposalResponse,
  ReportEventRequest,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ItineraryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/itinerary`;

  getByBooking(bookingId: string): Observable<LiveItineraryResponse> {
    return this.http
      .get<ApiWrapper<LiveItineraryResponse>>(`${this.base}/booking/${bookingId}`)
      .pipe(map(res => res.data));
  }

  reportEvent(itineraryId: string, request: ReportEventRequest): Observable<void> {
    return this.http
      .post<ApiWrapper<void>>(`${this.base}/${itineraryId}/events`, request)
      .pipe(map(() => undefined));
  }

  listProposals(itineraryId: string): Observable<ItineraryProposalResponse[]> {
    return this.http
      .get<ApiWrapper<ItineraryProposalResponse[]>>(`${this.base}/${itineraryId}/proposals`)
      .pipe(map(res => res.data ?? []));
  }

  approve(proposalId: string): Observable<void> {
    return this.http
      .post<ApiWrapper<void>>(`${this.base}/proposals/${proposalId}/approve`, {})
      .pipe(map(() => undefined));
  }

  reject(proposalId: string): Observable<void> {
    return this.http
      .post<ApiWrapper<void>>(`${this.base}/proposals/${proposalId}/reject`, {})
      .pipe(map(() => undefined));
  }

  /**
   * Opens an SSE stream of real-time proposal alerts. EventSource cannot set the
   * Authorization header, so the JWT is passed as an `access_token` query param.
   * Returns null if there is no token or EventSource is unavailable.
   */
  openStream(accessToken: string | null): EventSource | null {
    if (!accessToken || typeof EventSource === 'undefined') {
      return null;
    }
    const url = `${this.base}/stream?access_token=${encodeURIComponent(accessToken)}`;
    return new EventSource(url);
  }
}
