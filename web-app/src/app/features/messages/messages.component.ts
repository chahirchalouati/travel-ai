import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { MessagingService } from '../../core/services/messaging.service';
import type { Conversation } from '../../core/services/messaging.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  styleUrls: ['../../shared/styles/dashboard.scss'],
  template: `
    <div class="dash-container">
      <header class="dash-head">
        <div>
          <h1 class="dash-title">{{ 'messages.title' | transloco }}</h1>
          <p class="dash-sub">{{ 'messages.subtitle' | transloco }}</p>
        </div>
        <button class="dash-cta" (click)="startNew()"><span class="ms">edit</span> {{ 'messages.newMessage' | transloco }}</button>
      </header>

      @if (loading()) {
        <div class="skeleton" style="height:420px"></div>
      } @else {
        <div class="inbox" [class.inbox--selected]="selected() !== null">
          <aside class="thread-list">
            @if (composing()) {
              <div class="compose card">
                <input class="compose-subject" [(ngModel)]="newSubject" [placeholder]="'messages.subjectPlaceholder' | transloco" maxlength="200" />
                <textarea class="compose-body" [(ngModel)]="newBody" [placeholder]="'messages.bodyPlaceholder' | transloco" rows="4" maxlength="4000"></textarea>
                <div class="compose-actions">
                  <button class="dash-cta dash-cta--ghost" (click)="cancelCompose()">{{ 'messages.cancel' | transloco }}</button>
                  <button class="dash-cta" [disabled]="!newSubject.trim() || !newBody.trim() || sending()" (click)="send()">
                    {{ (sending() ? 'messages.sending' : 'messages.send') | transloco }}
                  </button>
                </div>
              </div>
            }

            @if (conversations().length === 0 && !composing()) {
              <div class="empty" style="padding:2.5rem 1rem">
                <span class="ms">forum</span>
                <h3>{{ 'messages.emptyTitle' | transloco }}</h3>
                <p>{{ 'messages.emptyBody' | transloco }}</p>
              </div>
            }

            @for (c of conversations(); track c.id) {
              <button class="thread-item" [class.active]="selected()?.id === c.id" (click)="select(c)">
                <span class="thread-avatar"><span class="ms">support_agent</span></span>
                <span class="thread-text">
                  <span class="thread-subject">{{ c.subject }}@if (c.unread) { <span class="unread-dot"></span> }</span>
                  <span class="thread-preview">{{ c.preview }}</span>
                </span>
              </button>
            }
          </aside>

          <section class="thread-pane card">
            @if (!selected()) {
              <div class="thread-placeholder">
                <span class="ms">chat</span>
                <p>{{ 'messages.selectThread' | transloco }}</p>
              </div>
            } @else {
              <div class="thread-header">
                <button class="back-btn" (click)="selected.set(null)" type="button">
                  <span class="ms">arrow_back</span>
                </button>
                <h2>{{ selected()!.subject }}</h2>
              </div>
              <div class="thread-scroll">
                @for (m of selected()!.messages; track m.id) {
                  <div class="bubble-row" [class.mine]="m.sender === 'USER'">
                    <div class="bubble" [class.support]="m.sender === 'SUPPORT'">
                      {{ m.body }}
                      <span class="bubble-time">{{ m.createdAt | date:'short' }}</span>
                    </div>
                  </div>
                }
              </div>
              <div class="reply-bar">
                <input [(ngModel)]="replyBody" [placeholder]="'messages.replyPlaceholder' | transloco" (keyup.enter)="sendReply()" maxlength="4000" />
                <button class="reply-send" [disabled]="!replyBody.trim() || replying()" (click)="sendReply()">
                  <span class="ms">send</span>
                </button>
              </div>
            }
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .inbox { display: grid; grid-template-columns: 340px 1fr; gap: 1.25rem; align-items: start; }
    .thread-list { display: flex; flex-direction: column; gap: 0.6rem; }
    .thread-item { display: flex; align-items: center; gap: 0.75rem; text-align: left; width: 100%; background: var(--surface); border: 1px solid var(--line); border-radius: 3px; padding: 0.85rem 0.9rem; cursor: pointer; transition: border-color 120ms ease, background 120ms ease; }
    .thread-item:hover { border-color: var(--border); }
    .thread-item.active { border-color: var(--color-red-ink); background: var(--accent-soft); }
    .thread-avatar { width: 40px; height: 40px; flex: none; border-radius: 50%; background: var(--color-red); color: #fff; display: flex; align-items: center; justify-content: center; }
    .thread-text { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .thread-subject { font-weight: 700; font-size: 0.92rem; display: flex; align-items: center; gap: 6px; }
    .unread-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
    .thread-preview { color: var(--muted); font-size: 0.82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .thread-pane { min-height: 460px; display: flex; flex-direction: column; }
    .thread-placeholder { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--muted); gap: 0.5rem; }
    .thread-placeholder .ms { font-size: 42px; color: var(--border); }
    .thread-header { padding: 1.1rem 1.3rem; border-bottom: 1px solid var(--line); }
    .thread-scroll { flex: 1; overflow-y: auto; max-height: 420px; padding: 1.2rem 1.3rem; display: flex; flex-direction: column; gap: 0.7rem; }
    .bubble-row { display: flex; }
    .bubble-row.mine { justify-content: flex-end; }
    .bubble { max-width: 78%; background: var(--bg-secondary); border-radius: 3px 16px 16px 4px; padding: 0.7rem 0.95rem; font-size: 0.92rem; line-height: 1.4; }
    .bubble.support { background: var(--bg-secondary); }
    .bubble-row.mine .bubble { background: var(--accent); color: #fff; border-radius: 3px 16px 4px 16px; }
    .bubble-time { display: block; font-size: 0.66rem; opacity: 0.6; margin-top: 4px; }
    .reply-bar { display: flex; gap: 0.6rem; padding: 0.9rem 1.1rem; border-top: 1px solid var(--line); }
    .reply-bar input { flex: 1; border: 1px solid var(--line); border-radius: 2px; padding: 0.65rem 1.1rem; font-family: inherit; font-size: 0.92rem; outline: none; }
    .reply-bar input:focus { border-color: var(--color-red-ink); }
    .reply-send { width: 42px; height: 42px; flex: none; border-radius: 50%; background: var(--accent); color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .reply-send:disabled { opacity: 0.5; cursor: default; }
    .compose { padding: 1rem; display: flex; flex-direction: column; gap: 0.7rem; }
    .compose-subject, .compose-body { border: 1px solid var(--line); border-radius: 3px; padding: 0.6rem 0.8rem; font-family: inherit; font-size: 0.9rem; outline: none; resize: vertical; }
    .compose-subject:focus, .compose-body:focus { border-color: var(--color-red-ink); }
    .compose-actions { display: flex; justify-content: flex-end; gap: 0.6rem; }
    .back-btn { display: none; background: none; border: none; cursor: pointer; color: var(--color-red-ink); padding: 0; align-items: center; margin-right: 8px; }
    .back-btn .ms { font-size: 22px; }
    .thread-header { display: flex; align-items: center; }
    .thread-header h2 { flex: 1; margin: 0; font-size: 1.1rem; font-weight: 800; }
    @media (max-width: 760px) {
      .inbox { grid-template-columns: 1fr; }
      .thread-pane { display: none; }
      .inbox--selected .thread-list { display: none; }
      .inbox--selected .thread-pane { display: flex; }
      .back-btn { display: flex; }
    }
  `],
})
export class MessagesComponent implements OnInit {
  private readonly service = inject(MessagingService);

  readonly loading = signal(true);
  readonly conversations = signal<Conversation[]>([]);
  readonly selected = signal<Conversation | null>(null);
  readonly composing = signal(false);
  readonly sending = signal(false);
  readonly replying = signal(false);

  newSubject = '';
  newBody = '';
  replyBody = '';

  ngOnInit(): void {
    this.service.list().pipe(catchError(() => of([] as Conversation[]))).subscribe(list => {
      this.conversations.set(list);
      this.loading.set(false);
    });
  }

  select(c: Conversation): void {
    this.composing.set(false);
    this.service.thread(c.id).pipe(catchError(() => of(c))).subscribe(full => {
      this.selected.set(full);
      this.conversations.update(list => list.map(x => (x.id === c.id ? { ...x, unread: false } : x)));
    });
  }

  startNew(): void {
    this.composing.set(true);
    this.selected.set(null);
    this.newSubject = '';
    this.newBody = '';
  }

  cancelCompose(): void { this.composing.set(false); }

  send(): void {
    if (!this.newSubject.trim() || !this.newBody.trim()) return;
    this.sending.set(true);
    this.service.start(this.newSubject.trim(), this.newBody.trim())
      .pipe(catchError(() => of(null)))
      .subscribe(conv => {
        this.sending.set(false);
        if (conv) {
          this.conversations.update(list => [conv, ...list]);
          this.selected.set(conv);
          this.composing.set(false);
        }
      });
  }

  sendReply(): void {
    const conv = this.selected();
    if (!conv || !this.replyBody.trim()) return;
    const body = this.replyBody.trim();
    this.replyBody = '';
    this.replying.set(true);
    this.service.reply(conv.id, body).pipe(catchError(() => of(null))).subscribe(updated => {
      this.replying.set(false);
      if (updated) {
        this.selected.set(updated);
        this.conversations.update(list => list.map(x => (x.id === updated.id ? { ...x, preview: updated.preview } : x)));
      }
    });
  }
}
