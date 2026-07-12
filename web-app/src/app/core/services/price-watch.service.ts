import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, PriceWatchResponse, CreatePriceWatchRequest } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PriceWatchService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/price-watches`;

  list(): Observable<PriceWatchResponse[]> {
    return this.http
      .get<ApiWrapper<PriceWatchResponse[]>>(this.base)
      .pipe(map(res => res.data ?? []));
  }

  create(req: CreatePriceWatchRequest): Observable<PriceWatchResponse> {
    return this.http
      .post<ApiWrapper<PriceWatchResponse>>(this.base, req)
      .pipe(map(res => res.data));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<ApiWrapper<void>>(`${this.base}/${id}`).pipe(map(() => undefined));
  }
}
