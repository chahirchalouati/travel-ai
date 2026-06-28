import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, InitiatePaymentRequest, PaymentResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);

  initiate(req: InitiatePaymentRequest): Observable<PaymentResponse> {
    return this.http.post<ApiWrapper<PaymentResponse>>(`${environment.apiUrl}/payments`, req).pipe(
      map(res => res.data)
    );
  }

  confirm(paymentId: string): Observable<PaymentResponse> {
    return this.http.post<ApiWrapper<PaymentResponse>>(`${environment.apiUrl}/payments/${paymentId}/confirm`, {}).pipe(
      map(res => res.data)
    );
  }
}
