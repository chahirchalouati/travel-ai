import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper } from '../models/api.models';

export interface PlatformStats {
  destinationCount: number;
  reviewCount: number;
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly http = inject(HttpClient);

  getStats(): Observable<PlatformStats> {
    return this.http.get<ApiWrapper<PlatformStats>>(`${environment.apiUrl}/stats`).pipe(
      map(res => res.data)
    );
  }
}
