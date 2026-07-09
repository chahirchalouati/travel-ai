import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { NotificationService } from '../../core/services/notification.service';
import type { NotificationView } from '../../core/models/api.models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  styleUrls: ['../../shared/styles/dashboard.scss'],
  template: `
    <div class="dash-container">
      <header class="dash-head">
        <div>
          <h1 class="dash-title">{{ 'notifications.title' | transloco }}</h1>
          <p class="dash-sub">{{ 'notifications.subtitle' | transloco }}</p>
        </div>
        <div class="dash-actions">
          @if (unreadCount() > 0) {
            <button class="dash-cta dash-cta--ghost mark-all-btn" (click)="markAllRead()" type="button">
              <span class="ms">done_all</span> {{ 'notifications.markAllRead' | transloco }}
            </button>
          }
          <button class="dash-cta dash-cta--ghost" (click)="router.navigate(['/bookings'])" type="button">
            <span class="ms">confirmation_number</span> {{ 'notifications.viewBookings' | transloco }}
          </button>
        </div>
      </header>

      @if (unreadCount() > 0) {
        <div class="unread-banner">
          <span class="ms">notifications_active</span>
          <span>{{ unreadCount() }} {{ 'notifications.unread' | transloco }}</span>
        </div>
      }

      @if (loading()) {
        <div style="display:flex;flex-direction:column;gap:1rem">
          @for (s of [1,2,3]; track s) { <div class="skeleton" style="height:84px"></div> }
        </div>
      } @else if (items().length === 0) {
        <div class="empty">
          <span class="ms">notifications_none</span>
          <h3>{{ 'notifications.empty' | transloco }}</h3>
          <p>{{ 'notifications.emptyBody' | transloco }}</p>
        </div>
      } @else {
        <div class="rows">
          @for (n of items(); track n.id) {
            <article class="card row" [class.row--unread]="!n.readAt" (click)="onRowClick(n)">
              <div class="row-icon" [class.failed]="n.status === 'FAILED'">
                <span class="ms">{{ iconFor(n) }}</span>
              </div>
              <div class="row-main">
                <div class="row-top">
                  <h3 class="row-subject">
                    @if (!n.readAt) { <span class="unread-dot"></span> }
                    {{ n.subject || ('notifications.untitled' | transloco) }}
                  </h3>
                  <span class="pill" [class]="'pill--' + n.status.toLowerCase()">{{ n.status }}</span>
                </div>
                <p class="row-meta">
                  <span class="ms">schedule</span> {{ formatDate(n.createdAt) }}
                  <span class="dot">·</span>
                  <span class="ms">{{ iconFor(n) }}</span> {{ n.channel }}
                  @if (n.readAt) {
                    <span class="dot">·</span>
                    <span class="ms read-icon">check_circle</span>
                    <span>{{ 'notifications.read' | transloco }}</span>
                  }
                </p>
              </div>
              @if (!n.readAt) {
                <button
                  class="mark-btn"
                  (click)="markRead($event, n)"
                  [disabled]="markingId() === n.id"
                  type="button"
                  [title]="'notifications.markRead' | transloco">
                  <span class="ms">{{ markingId() === n.id ? 'hourglass_empty' : 'mark_email_read' }}</span>
                </button>
              }
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dash-actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
    .mark-all-btn { border-color: var(--accent) !important; color: var(--accent) !important; }
    .unread-banner {
      display: flex; align-items: center; gap: 0.6rem;
      background: var(--accent-soft); color: var(--accent);
      border-radius: 3px; padding: 0.7rem 1.1rem;
      font-size: 0.9rem; font-weight: 700; margin-bottom: 1.25rem;
    }
    .rows { display: flex; flex-direction: column; gap: 1rem; }
    .row { display: flex; align-items: center; gap: 1.1rem; padding: 1.1rem 1.3rem; cursor: pointer; transition: box-shadow 200ms; }
    .row:hover { box-shadow: var(--shadow-md); }
    .row--unread { border-left: 3px solid var(--accent); }
    .row-icon { width: 48px; height: 48px; flex: none; border-radius: 3px; background: var(--accent-soft); color: var(--accent); display: flex; align-items: center; justify-content: center; }
    .row-icon .ms { font-size: 24px; }
    .row-icon.failed { background: #fdecec; color: #c0392b; }
    .row-main { flex: 1; min-width: 0; }
    .row-top { display: flex; align-items: center; gap: 0.7rem; }
    .row-subject { margin: 0; font-size: 1.05rem; font-weight: 800; letter-spacing: -0.01em; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 0.5rem; }
    .unread-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
    .row-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; color: var(--muted); font-size: 0.86rem; margin: 0.35rem 0 0; text-transform: capitalize; }
    .row-meta .ms { font-size: 15px; }
    .read-icon { color: var(--teal); }
    .dot { margin: 0 3px; }
    .pill--sent { background: var(--teal-light); color: var(--teal); }
    .pill--pending { background: var(--bg-secondary); color: var(--muted); }
    .pill--failed { background: #fdecec; color: #c0392b; }
    .mark-btn {
      flex-shrink: 0; background: none; border: 1.5px solid var(--border); border-radius: var(--radius-sm);
      width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
      color: var(--muted); cursor: pointer; transition: border-color 200ms, color 200ms;
    }
    .mark-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
    .mark-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .mark-btn .ms { font-size: 20px; }
    @media (max-width: 560px) { .row { flex-wrap: wrap; } .dash-actions { flex-direction: column; align-items: flex-start; } }
  `],
})
export class NotificationsComponent implements OnInit {
  readonly router = inject(Router);
  private readonly service = inject(NotificationService);

  readonly loading = signal(true);
  readonly items = signal<NotificationView[]>([]);
  readonly markingId = signal<string | null>(null);

  readonly unreadCount = computed(() => this.items().filter(n => !n.readAt).length);

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.service.list().pipe(catchError(() => of([] as NotificationView[]))).subscribe(list => {
      this.items.set(list);
      this.loading.set(false);
    });
  }

  onRowClick(n: NotificationView): void {
    if (!n.readAt) this.doMarkRead(n.id);
  }

  markRead(event: Event, n: NotificationView): void {
    event.stopPropagation();
    this.doMarkRead(n.id);
  }

  markAllRead(): void {
    const unread = this.items().filter(n => !n.readAt);
    unread.forEach(n => this.doMarkRead(n.id));
  }

  private doMarkRead(id: string): void {
    if (this.markingId() === id) return;
    this.markingId.set(id);
    this.service.markRead(id).pipe(catchError(() => of(null))).subscribe(updated => {
      this.markingId.set(null);
      if (updated) {
        this.items.update(list => list.map(n => n.id === id ? { ...n, readAt: updated.readAt } : n));
      }
    });
  }

  iconFor(n: NotificationView): string {
    switch (n.channel) {
      case 'EMAIL': return 'mail';
      case 'PUSH': return 'notifications_active';
      default: return 'notifications';
    }
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
}
