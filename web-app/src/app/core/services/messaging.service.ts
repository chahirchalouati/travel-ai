import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper } from '../models/api.models';

export type MessageSenderType = 'USER' | 'SUPPORT';

export interface ConversationMessage {
  id: string;
  sender: MessageSenderType;
  body: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  subject: string;
  lastMessageAt: string;
  unread: boolean;
  preview: string;
  messages: ConversationMessage[];
}

/** Inbox of conversations with the platform. */
@Injectable({ providedIn: 'root' })
export class MessagingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/messages`;

  list(): Observable<Conversation[]> {
    return this.http.get<ApiWrapper<Conversation[]>>(this.base).pipe(map(r => r.data ?? []));
  }

  thread(id: string): Observable<Conversation> {
    return this.http.get<ApiWrapper<Conversation>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  start(subject: string, body: string): Observable<Conversation> {
    return this.http
      .post<ApiWrapper<Conversation>>(this.base, { subject, body })
      .pipe(map(r => r.data));
  }

  reply(id: string, body: string): Observable<Conversation> {
    return this.http
      .post<ApiWrapper<Conversation>>(`${this.base}/${id}/reply`, { body })
      .pipe(map(r => r.data));
  }
}
