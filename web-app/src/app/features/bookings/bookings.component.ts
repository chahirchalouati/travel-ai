import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { BookingService } from '../../core/services/booking.service';
import type { BookingResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  styleUrls: ['../../shared/styles/dashboard.scss'],
  template: `
    <div class="dash-container">
      <header class="dash-head">
        <div>
          <h1 class="dash-title">{{ 'bookings.title' | transloco }}</h1>
          <p class="dash-sub">{{ 'bookings.subtitle' | transloco }}</p>
        </div>
        <button class="dash-cta dash-cta--ghost" (click)="router.navigate(['/hotels'])">
          <span class="ms">search</span> {{ 'bookings.findStay' | transloco }}
        </button>
      </header>

      @if (toast()) { <div class="toast">{{ toast() }}</div> }

      @if (loading()) {
        <div style="display:flex;flex-direction:column;gap:1rem">
          @for (s of [1,2,3]; track s) { <div class="skeleton" style="height:96px"></div> }
        </div>
      } @else if (bookings().length === 0) {
        <div class="empty">
          <span class="ms">confirmation_number</span>
          <h3>{{ 'bookings.emptyTitle' | transloco }}</h3>
          <p>{{ 'bookings.emptyBody' | transloco }}</p>
          <button class="dash-cta" (click)="router.navigate(['/'])"><span class="ms">explore</span> {{ 'bookings.emptyCta' | transloco }}</button>
        </div>
      } @else {
        <div class="rows">
          @for (b of bookings(); track b.id) {
            <article class="card row" [attr.id]="b.id">
              <div class="row-icon" [class.cancelled]="b.status === 'CANCELLED'">
                <span class="ms">{{ iconFor(b) }}</span>
              </div>
              <div class="row-main">
                <div class="row-top">
                  <h3 class="row-dest">{{ b.destination || ('bookings.reservationFallback' | transloco) }}</h3>
                  <span class="pill" [class]="'pill--' + b.status.toLowerCase()">{{ b.status }}</span>
                </div>
                <p class="row-meta">
                  <span class="ms">tag</span> {{ b.bookingReference }}
                  @if (b.checkIn) { <span class="dot">·</span> <span class="ms">event</span> {{ b.checkIn }}@if (b.checkOut) { → {{ b.checkOut }} } }
                </p>
              </div>
              <div class="row-side">
                <span class="row-amount">{{ b.totalAmount | currency }}</span>
                @if (b.status === 'PENDING' || b.status === 'CONFIRMED') {
                  <button class="row-cancel" (click)="cancel(b)" [disabled]="cancelling() === b.id">
                    {{ (cancelling() === b.id ? 'bookings.cancelling' : 'bookings.cancel') | transloco }}
                  </button>
                }
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
    .row-icon.cancelled { background: #f3f3f3; color: var(--muted); }
    .row-main { flex: 1; min-width: 0; }
    .row-top { display: flex; align-items: center; gap: 0.7rem; }
    .row-dest { margin: 0; font-size: 1.1rem; font-weight: 800; letter-spacing: -0.01em; }
    .row-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; color: var(--muted); font-size: 0.86rem; margin: 0.35rem 0 0; }
    .row-meta .ms { font-size: 15px; }
    .dot { margin: 0 3px; }
    .row-side { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex: none; }
    .row-amount { font-weight: 800; font-size: 1.05rem; }
    .row-cancel { background: none; border: 1px solid var(--line); color: #c0392b; border-radius: 999px; padding: 5px 14px; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: background 120ms ease; }
    .row-cancel:hover:not(:disabled) { background: #fdecec; }
    .row-cancel:disabled { opacity: 0.6; cursor: default; }
    .toast { background: var(--ink); color: #fff; padding: 0.7rem 1.1rem; border-radius: 12px; margin-bottom: 1.2rem; font-weight: 600; font-size: 0.9rem; }
    @media (max-width: 560px) { .row { flex-wrap: wrap; } .row-side { width: 100%; flex-direction: row; justify-content: space-between; } }
  `],
})
export class BookingsComponent implements OnInit {
  readonly router = inject(Router);
  private readonly service = inject(BookingService);
  private readonly transloco = inject(TranslocoService);

  readonly loading = signal(true);
  readonly bookings = signal<BookingResponse[]>([]);
  readonly cancelling = signal<string | null>(null);
  readonly toast = signal<string>('');

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.service.list().pipe(catchError(() => of([] as BookingResponse[]))).subscribe(list => {
      this.bookings.set([...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
      this.loading.set(false);
    });
  }

  cancel(b: BookingResponse): void {
    this.cancelling.set(b.id);
    this.service.cancel(b.id).pipe(catchError(() => of(null))).subscribe(updated => {
      this.cancelling.set(null);
      if (updated) {
        this.bookings.update(list => list.map(x => (x.id === b.id ? updated : x)));
        this.flash(this.transloco.translate('bookings.cancelled'));
      } else {
        this.flash(this.transloco.translate('bookings.cancelError'));
      }
    });
  }

  iconFor(b: BookingResponse): string {
    if (b.flightId) return 'flight';
    if (b.restaurantId) return 'restaurant';
    if (b.hotelId) return 'hotel';
    return 'luggage';
  }

  private flash(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
