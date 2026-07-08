import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper } from '../models/api.models';

export interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  applyEmail: string;
}

@Injectable({ providedIn: 'root' })
export class CareersService {
  private readonly http = inject(HttpClient);

  getPositions(): Observable<JobPosition[]> {
    return this.http
      .get<ApiWrapper<JobPosition[]>>(`${environment.apiUrl}/careers/positions`)
      .pipe(map(res => res.data));
  }
}
