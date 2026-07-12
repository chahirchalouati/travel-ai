import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, ItineraryPlanRequest, ItineraryPlanResponse } from '../models/api.models';

/** AI trip planner: a brief in, a grounded day-by-day itinerary out (authenticated). */
@Injectable({ providedIn: 'root' })
export class TripPlannerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ai`;

  plan(request: ItineraryPlanRequest): Observable<ItineraryPlanResponse> {
    return this.http
      .post<ApiWrapper<ItineraryPlanResponse>>(`${this.base}/itinerary-plan`, request)
      .pipe(map(res => res.data));
  }
}
