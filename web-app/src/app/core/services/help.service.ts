import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper } from '../models/api.models';

export interface HelpFaq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

@Injectable({ providedIn: 'root' })
export class HelpService {
  private readonly http = inject(HttpClient);

  getFaqs(): Observable<HelpFaq[]> {
    return this.http
      .get<ApiWrapper<HelpFaq[]>>(`${environment.apiUrl}/help/faqs`)
      .pipe(map(res => res.data));
  }
}
