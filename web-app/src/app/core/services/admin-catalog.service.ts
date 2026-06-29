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

/**
 * Generic admin CRUD client for catalog, destinations, stories and partners.
 * `resource` is the path under `/admin`, e.g. `catalog/hotels` or `partners`.
 */
@Injectable({ providedIn: 'root' })
export class AdminCatalogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  list(resource: string, page = 0, size = 20): Observable<PageWrapper<AdminEntity>> {
    return this.http
      .get<ApiWrapper<PageWrapper<AdminEntity>>>(`${this.base}/${resource}?page=${page}&size=${size}`)
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
