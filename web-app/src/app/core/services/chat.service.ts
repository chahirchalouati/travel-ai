import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ApiWrapper, ChatRequest, ChatResponse,
  ConversationResponse, ConversationDetailResponse
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);

  chat(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ApiWrapper<ChatResponse>>(`${environment.apiUrl}/chat`, request).pipe(
      map(res => res.data)
    );
  }

  getConversations(): Observable<ConversationResponse[]> {
    return this.http.get<ApiWrapper<ConversationResponse[]>>(`${environment.apiUrl}/chat/conversations`).pipe(
      map(res => res.data)
    );
  }

  getConversation(id: string): Observable<ConversationDetailResponse> {
    return this.http.get<ApiWrapper<ConversationDetailResponse>>(`${environment.apiUrl}/chat/conversations/${id}`).pipe(
      map(res => res.data)
    );
  }

  deleteConversation(id: string): Observable<void> {
    return this.http.delete<ApiWrapper<void>>(`${environment.apiUrl}/chat/conversations/${id}`).pipe(
      map(() => undefined as void)
    );
  }
}
