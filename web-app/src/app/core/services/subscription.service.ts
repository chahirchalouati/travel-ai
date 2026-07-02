import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ApiWrapper,
  MembershipResponse,
  SubscribeRequest,
  SubscriptionPlanResponse,
} from '../models/api.models';

/**
 * Reads membership plans and manages the caller's Travel AI Prime subscription.
 * The current membership is cached in a signal so the booking funnel can waive
 * the service fee and apply the member discount without a round-trip each time.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/subscriptions`;

  private readonly _membership = signal<MembershipResponse | null>(null);
  readonly membership = this._membership.asReadonly();
  readonly isPrimeActive = computed(() => this._membership()?.active === true);

  /** Public: the sellable plans for the /membership landing page. */
  plans(): Observable<SubscriptionPlanResponse[]> {
    return this.http
      .get<ApiWrapper<SubscriptionPlanResponse[]>>(`${this.base}/plans`)
      .pipe(map(res => res.data));
  }

  /** Loads (and caches) the caller's membership. */
  me(): Observable<MembershipResponse> {
    return this.http
      .get<ApiWrapper<MembershipResponse>>(`${this.base}/me`)
      .pipe(map(res => res.data), tap(m => this._membership.set(m)));
  }

  subscribe(planCode: string): Observable<MembershipResponse> {
    const body: SubscribeRequest = { planCode };
    return this.http
      .post<ApiWrapper<MembershipResponse>>(`${this.base}/subscribe`, body)
      .pipe(map(res => res.data), tap(m => this._membership.set(m)));
  }

  cancel(): Observable<MembershipResponse> {
    return this.http
      .post<ApiWrapper<MembershipResponse>>(`${this.base}/cancel`, {})
      .pipe(map(res => res.data), tap(m => this._membership.set(m)));
  }
}
