import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, PageWrapper } from '../models/api.models';

/** A catalog/content row — shape varies per resource, so kept loosely typed. */
export type AdminEntity = Record<string, unknown> & { id: string };

export interface PartnerOption {
  id: string;
  name: string;
}

/** Sort direction for a list query. */
export type SortDir = 'asc' | 'desc';

/** Optional filtering/sorting for admin list queries. */
export interface ListQuery {
  /** Free-text search across the resource's key columns. */
  search?: string;
  /** Column key to sort by. */
  sortKey?: string;
  sortDir?: SortDir;
  /** Exact/contains field filters: field key → value. */
  filters?: Record<string, string>;
}

function buildParams(page: number, size: number, q?: ListQuery): string {
  const parts = [`page=${page}`, `size=${size}`];
  if (q?.sortKey) parts.push(`sort=${encodeURIComponent(q.sortKey)},${q.sortDir ?? 'asc'}`);
  if (q?.search?.trim()) parts.push(`search=${encodeURIComponent(q.search.trim())}`);
  if (q?.filters) {
    for (const [key, value] of Object.entries(q.filters)) {
      if (value !== null && value !== undefined && `${value}`.trim() !== '') {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    }
  }
  return parts.join('&');
}

/**
 * Generic admin CRUD client for catalog, destinations, stories and partners.
 * `resource` is the path under `/admin`, e.g. `catalog/hotels` or `partners`.
 */
@Injectable({ providedIn: 'root' })
export class AdminCatalogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  list(resource: string, page = 0, size = 20, query?: ListQuery): Observable<PageWrapper<AdminEntity>> {
    return this.http
      .get<ApiWrapper<PageWrapper<AdminEntity>>>(`${this.base}/${resource}?${buildParams(page, size, query)}`)
      .pipe(map(r => r.data));
  }

  create(resource: string, body: Record<string, unknown>): Observable<AdminEntity> {
    return this.http.post<ApiWrapper<AdminEntity>>(`${this.base}/${resource}`, body).pipe(map(r => r.data));
  }

  update(resource: string, id: string, body: Record<string, unknown>): Observable<AdminEntity> {
    return this.http.put<ApiWrapper<AdminEntity>>(`${this.base}/${resource}/${id}`, body).pipe(map(r => r.data));
  }

  remove(resource: string, id: string): Observable<unknown> {
    return this.http.delete<ApiWrapper<unknown>>(`${this.base}/${resource}/${id}`).pipe(map(r => r.data));
  }

  activate(resource: string, id: string): Observable<unknown> {
    return this.http.patch<unknown>(`${this.base}/${resource}/${id}/activate`, {});
  }

  suspend(resource: string, id: string): Observable<unknown> {
    return this.http.patch<unknown>(`${this.base}/${resource}/${id}/suspend`, {});
  }

  /** Partner picker options for hotel/restaurant forms. */
  partnerOptions(): Observable<PartnerOption[]> {
    return this.http
      .get<ApiWrapper<PageWrapper<PartnerOption>>>(`${this.base}/partners?page=0&size=200`)
      .pipe(map(r => (r.data.content ?? []).map(p => ({ id: p.id, name: p.name }))));
  }
}
