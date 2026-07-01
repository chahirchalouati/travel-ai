import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, PageWrapper, NotificationView } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);

  /** Lists the current user's in-app notifications (paged, newest first). */
  list(page = 0, size = 50): Observable<NotificationView[]> {
    return this.http
      .get<ApiWrapper<PageWrapper<NotificationView>>>(
        `${environment.apiUrl}/notifications?page=${page}&size=${size}`
      )
      .pipe(map(res => res.data?.content ?? []));
  }
}
