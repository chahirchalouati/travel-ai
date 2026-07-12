import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, AttractionResponse } from '../models/api.models';
import {
  type PagedResult,
  CATALOG_PAGE_SIZE,
} from './catalog.service';

export interface AttractionSearchQuery {
  city?: string;
  category?: string;
  priceLevel?: string;
  bookable?: boolean;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class AttractionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/attractions`;

  search(
    query: AttractionSearchQuery,
    page = 0,
    size = CATALOG_PAGE_SIZE,
  ): Observable<PagedResult<AttractionResponse>> {
    return this.http
      .get<ApiWrapper<AttractionResponse[]>>(`${this.base}/search`, {
        params: toParams({ ...query, page, size }),
      })
      .pipe(
        map(res => ({
          items: res.data ?? [],
          total: res.meta?.total ?? (res.data?.length ?? 0),
          page: res.meta?.page ?? page,
          limit: res.meta?.limit ?? size,
        })),
      );
  }

  getById(id: string): Observable<AttractionResponse> {
    return this.http
      .get<ApiWrapper<AttractionResponse>>(`${this.base}/${id}`)
      .pipe(map(res => res.data));
  }

  getFeatured(): Observable<AttractionResponse[]> {
    return this.http
      .get<ApiWrapper<AttractionResponse[]>>(`${this.base}/featured`)
      .pipe(map(res => res.data ?? []));
  }

  getCategories(): Observable<string[]> {
    return this.http
      .get<ApiWrapper<string[]>>(`${this.base}/categories`)
      .pipe(map(res => res.data ?? []));
  }
}

/** Builds HttpParams, skipping null/undefined/empty values. */
function toParams(query: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }
    params = params.set(key, String(value));
  }
  return params;
}
