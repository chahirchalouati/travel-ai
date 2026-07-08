import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper } from '../models/api.models';

export interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  id: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);

  submit(req: ContactRequest): Observable<ContactResponse> {
    return this.http
      .post<ApiWrapper<ContactResponse>>(`${environment.apiUrl}/contact`, req)
      .pipe(map(res => res.data));
  }
}
