import { Component, OnInit, inject, signal } from '@angular/core';
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
        <button class="dash-cta dash-cta--ghost" (click)="router.navigate(['/bookings'])">
          <span class="ms">confirmation_number</span> {{ 'notifications.viewBookings' | transloco }}
        </button>
      </header>

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
            <article class="card row">
              <div class="row-icon" [class.failed]="n.status === 'FAILED'">
                <span class="ms">{{ iconFor(n) }}</span>
              </div>
              <div class="row-main">
                <div class="row-top">
                  <h3 class="row-subject">{{ n.subject || ('notifications.untitled' | transloco) }}</h3>
                  <span class="pill" [class]="'pill--' + n.status.toLowerCase()">{{ n.status }}</span>
                </div>
                <p class="row-meta">
                  <span class="ms">schedule</span> {{ formatDate(n.createdAt) }}
                  <span class="dot">·</span>
                  <span class="ms">{{ iconFor(n) }}</span> {{ n.channel }}
                </p>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .rows { display: flex; flex-direction: column; gap: 1rem; }
    .row { display: flex; align-items: center; gap: 1.1rem; padding: 1.1rem 1.3rem; }
    .row-icon { width: 48px; height: 48px; flex: none; border-radius: 12px; background: var(--accent-soft); color: var(--accent); display: flex; align-items: center; justify-content: center; }
    .row-icon .ms { font-size: 24px; }
    .row-icon.failed { background: #fdecec; color: #c0392b; }
    .row-main { flex: 1; min-width: 0; }
    .row-top { display: flex; align-items: center; gap: 0.7rem; }
    .row-subject { margin: 0; font-size: 1.05rem; font-weight: 800; letter-spacing: -0.01em; overflow: hidden; text-overflow: ellipsis; }
    .row-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; color: var(--muted); font-size: 0.86rem; margin: 0.35rem 0 0; text-transform: capitalize; }
    .row-meta .ms { font-size: 15px; }
    .dot { margin: 0 3px; }
    .pill--sent { background: rgba(0, 133, 106, 0.12); color: var(--teal, #00856A); }
    .pill--pending { background: #f3f3f3; color: var(--muted); }
    .pill--failed { background: #fdecec; color: #c0392b; }
    @media (max-width: 560px) { .row { flex-wrap: wrap; } }
  `],
})
export class NotificationsComponent implements OnInit {
  readonly router = inject(Router);
  private readonly service = inject(NotificationService);

  readonly loading = signal(true);
  readonly items = signal<NotificationView[]>([]);

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.service.list().pipe(catchError(() => of([] as NotificationView[]))).subscribe(list => {
      this.items.set(list);
      this.loading.set(false);
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
