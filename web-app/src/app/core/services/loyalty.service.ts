import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ApiWrapper,
  LoyaltySummaryResponse,
  MemberRewardResponse,
  RedeemPreviewRequest,
  RedeemPreviewResponse,
  RewardResponse,
} from '../models/api.models';

/** Loyalty program: the member's standing and checkout redemption previews (authenticated). */
@Injectable({ providedIn: 'root' })
export class LoyaltyService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/loyalty`;

  /** Current balance, tier, progress and last transactions. */
  summary(): Observable<LoyaltySummaryResponse> {
    return this.http
      .get<ApiWrapper<LoyaltySummaryResponse>>(this.base)
      .pipe(map(res => res.data));
  }

  /**
   * Given a booking total (and optionally a chosen number of points), returns the
   * max redeemable points and the EUR discount. Never spends points — redemption
   * happens at booking creation via CreateBookingRequest.redeemPoints.
   */
  redeemPreview(amount: number, points?: number): Observable<RedeemPreviewResponse> {
    const body: RedeemPreviewRequest = { amount, points };
    return this.http
      .post<ApiWrapper<RedeemPreviewResponse>>(`${this.base}/redeem-preview`, body)
      .pipe(map(res => res.data));
  }

  /** The rewards catalogue, annotated with what the caller has unlocked / can redeem. */
  rewards(): Observable<RewardResponse[]> {
    return this.http
      .get<ApiWrapper<RewardResponse[]>>(`${this.base}/rewards`)
      .pipe(map(res => res.data));
  }

  /** The rewards the caller owns. */
  myRewards(): Observable<MemberRewardResponse[]> {
    return this.http
      .get<ApiWrapper<MemberRewardResponse[]>>(`${this.base}/rewards/me`)
      .pipe(map(res => res.data));
  }

  /** Claims a redeemable reward by spending points; returns the granted reward. */
  redeemReward(code: string): Observable<MemberRewardResponse> {
    return this.http
      .post<ApiWrapper<MemberRewardResponse>>(`${this.base}/rewards/${code}/redeem`, {})
      .pipe(map(res => res.data));
  }
}
