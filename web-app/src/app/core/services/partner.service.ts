import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, PageWrapper } from '../models/api.models';

/** Mirrors `com.travelai.partner.PartnerType`. */
export type PartnerType = 'HOTEL' | 'RESTAURANT' | 'CAR_RENTAL' | 'BEACH' | 'OTHER';

/** Mirrors `com.travelai.partner.PartnerStatus` — the onboarding lifecycle. */
export type PartnerStatus = 'REGISTERED' | 'CONFIGURED' | 'VALIDATED' | 'LIVE' | 'SUSPENDED';

/** Mirrors `PartnerSummaryResponse` — the list-row shape. */
export interface PartnerSummary {
  id: string;
  name: string;
  type: PartnerType;
  city: string | null;
  status: PartnerStatus;
  active: boolean;
}

/** Mirrors `PartnerResponse` — the full detail shape. */
export interface PartnerDetail {
  id: string;
  type: PartnerType;
  name: string;
  vatNumber: string | null;
  contactEmail: string;
  contactPhone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  status: PartnerStatus;
  qualityScore: number | null;
  active: boolean;
  createdAt: string;
}

/** Mirrors `RegisterPartnerRequest`. */
export interface RegisterPartnerRequest {
  type: PartnerType | '';
  name: string;
  vatNumber: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  country: string;
}

/** Mirrors `ConfigurePartnerRequest`. */
export interface ConfigurePartnerRequest {
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string;
}

/**
 * Client for the partner onboarding lifecycle exposed by `PartnerController`
 * (`/api/partners/**`): register → configure → validate → go-live, with a
 * suspend escape hatch. Distinct from `AdminCatalogService`'s generic
 * `/api/admin/partners` directory CRUD.
 */
@Injectable({ providedIn: 'root' })
export class PartnerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/partners`;

  list(page: number, size: number, type?: PartnerType | '', sortKey?: string | null, sortDir?: 'asc' | 'desc'): Observable<PageWrapper<PartnerSummary>> {
    const parts = [`page=${page}`, `size=${size}`];
    if (type) parts.push(`type=${encodeURIComponent(type)}`);
    if (sortKey) parts.push(`sort=${encodeURIComponent(sortKey)},${sortDir ?? 'asc'}`);
    return this.http
      .get<ApiWrapper<PageWrapper<PartnerSummary>>>(`${this.base}?${parts.join('&')}`)
      .pipe(map(r => r.data));
  }

  getById(id: string): Observable<PartnerDetail> {
    return this.http.get<ApiWrapper<PartnerDetail>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  register(request: RegisterPartnerRequest): Observable<PartnerDetail> {
    return this.http.post<ApiWrapper<PartnerDetail>>(this.base, request).pipe(map(r => r.data));
  }

  configure(id: string, request: ConfigurePartnerRequest): Observable<PartnerDetail> {
    return this.http.put<ApiWrapper<PartnerDetail>>(`${this.base}/${id}/configuration`, request).pipe(map(r => r.data));
  }

  validate(id: string): Observable<PartnerDetail> {
    return this.http.post<ApiWrapper<PartnerDetail>>(`${this.base}/${id}/validate`, {}).pipe(map(r => r.data));
  }

  goLive(id: string): Observable<PartnerDetail> {
    return this.http.post<ApiWrapper<PartnerDetail>>(`${this.base}/${id}/go-live`, {}).pipe(map(r => r.data));
  }

  suspend(id: string): Observable<void> {
    return this.http.post<ApiWrapper<void>>(`${this.base}/${id}/suspend`, {}).pipe(map(() => undefined));
  }
}
