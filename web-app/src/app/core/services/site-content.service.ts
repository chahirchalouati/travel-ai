import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper } from '../models/api.models';

export interface SiteContentItem {
  section: string;
  title: string | null;
  body: string | null;
  icon: string | null;
  accent: string | null;
  value: string | null;
  bullets: string[];
}

@Injectable({ providedIn: 'root' })
export class SiteContentService {
  private readonly http = inject(HttpClient);

  /** Fetch all content blocks for a marketing page (about, partners, developers). */
  getPage(page: string): Observable<SiteContentItem[]> {
    return this.http
      .get<ApiWrapper<SiteContentItem[]>>(`${environment.apiUrl}/site-content/${page}`)
      .pipe(map(res => res.data));
  }
}
