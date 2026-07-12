import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ApiWrapper,
  PageWrapper,
  ForumQuestionResponse,
  ForumQuestionDetail,
  ForumAnswerResponse,
  AskQuestionRequest,
  ForumAnswerRequest,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ForumService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/forum`;

  list(query?: string, page = 0, size = 20): Observable<ForumQuestionResponse[]> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (query) {
      params = params.set('q', query);
    }
    return this.http
      .get<ApiWrapper<PageWrapper<ForumQuestionResponse>>>(`${this.base}/questions`, { params })
      .pipe(map(res => res.data.content ?? []));
  }

  get(id: string): Observable<ForumQuestionDetail> {
    return this.http
      .get<ApiWrapper<ForumQuestionDetail>>(`${this.base}/questions/${id}`)
      .pipe(map(res => res.data));
  }

  ask(req: AskQuestionRequest): Observable<ForumQuestionResponse> {
    return this.http
      .post<ApiWrapper<ForumQuestionResponse>>(`${this.base}/questions`, req)
      .pipe(map(res => res.data));
  }

  answer(questionId: string, req: ForumAnswerRequest): Observable<ForumAnswerResponse> {
    return this.http
      .post<ApiWrapper<ForumAnswerResponse>>(`${this.base}/questions/${questionId}/answers`, req)
      .pipe(map(res => res.data));
  }

  markHelpful(answerId: string): Observable<ForumAnswerResponse> {
    return this.http
      .post<ApiWrapper<ForumAnswerResponse>>(`${this.base}/answers/${answerId}/helpful`, {})
      .pipe(map(res => res.data));
  }
}
