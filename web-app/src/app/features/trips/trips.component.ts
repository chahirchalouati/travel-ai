import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { BookingService } from '../../core/services/booking.service';
import type { BookingResponse } from '../../core/models/api.models';

interface TripCard extends BookingResponse {
  isPast: boolean;
}

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  styleUrls: ['../../shared/styles/dashboard.scss'],
  template: `
    <div class="dash-container">
      <header class="dash-head">
        <div>
          <h1 class="dash-title">{{ 'trips.title' | transloco }}</h1>
          <p class="dash-sub">{{ 'trips.subtitle' | transloco }}</p>
        </div>
        <button class="dash-cta" (click)="router.navigate(['/planner'])">
          <span class="ms">add</span> {{ 'trips.planNew' | transloco }}
        </button>
      </header>

      @if (loading()) {
        <div class="grid">
          @for (s of [1,2,3]; track s) { <div class="skeleton" style="height:230px"></div> }
        </div>
      } @else if (trips().length === 0) {
        <div class="empty">
          <span class="ms">travel_explore</span>
          <h3>{{ 'trips.emptyTitle' | transloco }}</h3>
          <p>{{ 'trips.emptyBody' | transloco }}</p>
          <button class="dash-cta" (click)="router.navigate(['/planner'])">
            <span class="ms">auto_awesome</span> {{ 'trips.emptyCta' | transloco }}
          </button>
        </div>
      } @else {
        @if (upcoming().length) {
          <h2 class="section-h">{{ 'trips.upcoming' | transloco }} · {{ upcoming().length }}</h2>
          <div class="grid">
            @for (t of upcoming(); track t.id) {
              <article class="card trip" (click)="open(t)">
                <div class="trip-banner" [style.background-image]="bannerFor(t)">
                  <span class="pill" [class]="pillClass(t.status)">{{ t.status }}</span>
                  @if (t.status === 'CONFIRMED') {
                    <button class="trip-live" (click)="openLive($event, t)">
                      <span class="ms">radar</span> {{ 'itinerary.liveBadge' | transloco }}
                    </button>
                  }
                </div>
                <div class="trip-body">
                  <h3 class="trip-dest">{{ t.destination || ('trips.tripFallback' | transloco) }}</h3>
                  <p class="trip-dates"><span class="ms">calendar_today</span> {{ dateRange(t) }}</p>
                  <div class="trip-foot">
                    <span class="trip-ref">{{ t.bookingReference }}</span>
                    <span class="trip-amount">{{ t.totalAmount | currency }}</span>
                  </div>
                </div>
              </article>
            }
          </div>
        }

        @if (past().length) {
          <h2 class="section-h" style="margin-top:2.5rem">{{ 'trips.past' | transloco }} · {{ past().length }}</h2>
          <div class="grid">
            @for (t of past(); track t.id) {
              <article class="card trip trip--past" (click)="open(t)">
                <div class="trip-banner" [style.background-image]="bannerFor(t)">
                  <span class="pill" [class]="pillClass(t.status)">{{ t.status }}</span>
                </div>
                <div class="trip-body">
                  <h3 class="trip-dest">{{ t.destination || ('trips.tripFallback' | transloco) }}</h3>
                  <p class="trip-dates"><span class="ms">calendar_today</span> {{ dateRange(t) }}</p>
                  <div class="trip-foot">
                    <span class="trip-ref">{{ t.bookingReference }}</span>
                    <span class="trip-amount">{{ t.totalAmount | currency }}</span>
                  </div>
                </div>
              </article>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .section-h { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin: 0 0 1rem; }
    .trip { cursor: pointer; }
    .trip-banner { height: 132px; background-size: cover; background-position: center; position: relative; display: flex; align-items: flex-start; padding: 12px; }
    .trip-banner .pill { background: rgba(255,255,255,0.92); }
    .trip-live { position: absolute; top: 12px; right: 12px; display: inline-flex; align-items: center; gap: 5px; background: var(--accent-soft); border: 1px solid var(--accent); color: var(--accent); border-radius: 2px; padding: 5px 12px; font-weight: 700; font-size: 0.78rem; cursor: pointer; transition: background 120ms ease, color 120ms ease; }
    .trip-live:hover { background: var(--accent); color: #fff; }
    .trip-live .ms { font-size: 15px; }
    .trip--past .trip-banner { filter: grayscale(0.35); }
    .trip-body { padding: 1rem 1.1rem 1.2rem; }
    .trip-dest { margin: 0 0 0.35rem; font-size: 1.18rem; font-weight: 800; letter-spacing: -0.01em; }
    .trip-dates { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 0.9rem; margin: 0 0 0.9rem; }
    .trip-dates .ms { font-size: 16px; }
    .trip-foot { display: flex; align-items: center; justify-content: space-between; padding-top: 0.8rem; border-top: 1px solid var(--line); }
    .trip-ref { font-size: 0.78rem; color: var(--muted); letter-spacing: 0.03em; }
    .trip-amount { font-weight: 800; }
  `],
})
export class TripsComponent implements OnInit {
  readonly router = inject(Router);
  private readonly bookings = inject(BookingService);
  private readonly transloco = inject(TranslocoService);

  private static readonly BANNERS = [
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80',
    'https://images.unsplash.com/photo-1493558103817-58b2924bce98?w=600&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  ];

  readonly loading = signal(true);
  readonly trips = signal<TripCard[]>([]);
  readonly upcoming = computed(() => this.trips().filter(t => !t.isPast));
  readonly past = computed(() => this.trips().filter(t => t.isPast));

  ngOnInit(): void {
    this.bookings.list().pipe(catchError(() => of([] as BookingResponse[]))).subscribe(list => {
      const today = new Date().toISOString().slice(0, 10);
      this.trips.set(
        list.map(b => ({ ...b, isPast: !!b.checkOut && b.checkOut < today }))
          .sort((a, b) => (a.checkIn || '').localeCompare(b.checkIn || ''))
      );
      this.loading.set(false);
    });
  }

  bannerFor(t: BookingResponse): string {
    const idx = Math.abs(this.hash(t.id)) % TripsComponent.BANNERS.length;
    return `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45)), url(${TripsComponent.BANNERS[idx]})`;
  }

  dateRange(t: BookingResponse): string {
    if (!t.checkIn) return this.transloco.translate('trips.datesTbc');
    const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return t.checkOut ? `${fmt(t.checkIn)} → ${fmt(t.checkOut)}` : fmt(t.checkIn);
  }

  pillClass(status: string): string { return `pill--${status.toLowerCase()}`; }

  open(t: BookingResponse): void { this.router.navigate(['/bookings'], { fragment: t.id }); }

  openLive(event: Event, t: BookingResponse): void {
    event.stopPropagation();
    this.router.navigate(['/trips', t.id, 'live']);
  }

  private hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
    return h;
  }
}
