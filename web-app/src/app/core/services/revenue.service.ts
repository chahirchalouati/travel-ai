import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, RevenueSummaryResponse } from '../models/api.models';

/** Reads the admin revenue dashboard summary (ADMIN only). */
@Injectable({ providedIn: 'root' })
export class RevenueService {
  private readonly http = inject(HttpClient);

  summary(): Observable<RevenueSummaryResponse> {
    return this.http
      .get<ApiWrapper<RevenueSummaryResponse>>(`${environment.apiUrl}/admin/revenue/summary`)
      .pipe(map(res => res.data));
  }
}
