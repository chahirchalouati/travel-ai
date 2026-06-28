import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, ReviewResponse, ReviewSummary, CreateReviewRequest } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);

  getForTarget(targetType: string, targetId: string, page = 0, size = 10): Observable<ReviewResponse[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiWrapper<{ content: ReviewResponse[] }>>(
      `${environment.apiUrl}/reviews/target/${targetType}/${targetId}`, { params }
    ).pipe(map(res => res.data.content));
  }

  getSummary(targetType: string, targetId: string): Observable<ReviewSummary> {
    return this.http.get<ApiWrapper<ReviewSummary>>(
      `${environment.apiUrl}/reviews/target/${targetType}/${targetId}/summary`
    ).pipe(map(res => res.data));
  }

  create(review: CreateReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ApiWrapper<ReviewResponse>>(`${environment.apiUrl}/reviews`, review).pipe(
      map(res => res.data)
    );
  }

  markHelpful(reviewId: string): Observable<ReviewResponse> {
    return this.http.post<ApiWrapper<ReviewResponse>>(`${environment.apiUrl}/reviews/${reviewId}/helpful`, {}).pipe(
      map(res => res.data)
    );
  }

  getByUser(userId: string, page = 0, size = 10): Observable<ReviewResponse[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiWrapper<{ content: ReviewResponse[] }>>(`${environment.apiUrl}/reviews/user/${userId}`, { params }).pipe(
      map(res => res.data.content)
    );
  }
}
