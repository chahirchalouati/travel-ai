import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, PromoValidationResponse, ValidatePromoRequest } from '../models/api.models';

/** Validates promo / discount codes against an order amount (public endpoint). */
@Injectable({ providedIn: 'root' })
export class PromoService {
  private readonly http = inject(HttpClient);

  /**
   * Validate a promo code for the given amount. The backend never records a
   * redemption here — it only reports whether the code applies and the resulting
   * discount / final amount.
   */
  validate(code: string, amount: number): Observable<PromoValidationResponse> {
    const body: ValidatePromoRequest = { code, amount };
    return this.http
      .post<ApiWrapper<PromoValidationResponse>>(`${environment.apiUrl}/promo/validate`, body)
      .pipe(map(res => res.data));
  }
}
