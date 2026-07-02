import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AncillaryOption, ApiWrapper } from '../models/api.models';

/** Reads the public catalogue of purchasable add-ons offered at checkout. */
@Injectable({ providedIn: 'root' })
export class AncillaryService {
  private readonly http = inject(HttpClient);

  /** Options offered for a vertical (plus the vertical-agnostic ones). */
  list(vertical: string): Observable<AncillaryOption[]> {
    const params = new HttpParams().set('vertical', vertical);
    return this.http
      .get<ApiWrapper<AncillaryOption[]>>(`${environment.apiUrl}/catalog/ancillaries`, { params })
      .pipe(map(res => res.data));
  }
}
