import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper } from '../models/api.models';

export interface PressCoverage {
  id: string;
  outlet: string;
  headline: string;
  url: string | null;
  icon: string | null;
  dateLabel: string;
}

@Injectable({ providedIn: 'root' })
export class PressService {
  private readonly http = inject(HttpClient);

  getCoverage(): Observable<PressCoverage[]> {
    return this.http
      .get<ApiWrapper<PressCoverage[]>>(`${environment.apiUrl}/press/coverage`)
      .pipe(map(res => res.data));
  }
}
