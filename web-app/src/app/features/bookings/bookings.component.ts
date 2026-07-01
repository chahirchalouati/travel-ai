import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { BookingService } from '../../core/services/booking.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { ReviewService } from '../../core/services/review.service';
import type { BookingResponse } from '../../core/models/api.models';

/** Maps a booking to the reviewable catalog entity it represents. */
interface ReviewTarget {
  type: 'RESTAURANT' | 'CRUISE' | 'FLIGHT' | 'HOTEL';
  id: string;
}

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
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
                @if (b.status === 'CONFIRMED') {
                  <button class="row-live" (click)="router.navigate(['/trips', b.id, 'live'])">
                    <span class="ms">radar</span> {{ 'itinerary.liveBadge' | transloco }}
                  </button>
                  <button class="row-invoice" (click)="invoices.downloadForBooking(b.id, b.bookingReference)">
                    <span class="ms">receipt_long</span> {{ 'bookings.invoice' | transloco }}
                  </button>
                  @if (b.tripGroupId) {
                    <button class="row-invoice" (click)="invoices.downloadForTrip(b.tripGroupId)">
                      <span class="ms">luggage</span> {{ 'bookings.tripInvoice' | transloco }}
                    </button>
                  }
                }
                @if (b.status === 'CONFIRMED' && reviewTarget(b) && !reviewedIds().has(b.id)) {
                  <button class="row-review" (click)="openReview(b)">
                    <span class="ms">rate_review</span> {{ 'bookings.writeReview' | transloco }}
                  </button>
                }
                @if (reviewedIds().has(b.id)) {
                  <span class="row-reviewed"><span class="ms">check_circle</span> {{ 'bookings.reviewThanks' | transloco }}</span>
                }
                @if (b.status === 'PENDING' || b.status === 'CONFIRMED') {
                  <button class="row-cancel" (click)="cancel(b)" [disabled]="cancelling() === b.id">
                    {{ (cancelling() === b.id ? 'bookings.cancelling' : 'bookings.cancel') | transloco }}
                  </button>
                }
              </div>

              @if (reviewing() === b.id) {
                <div class="review-form">
                  <span class="review-form__label">{{ 'bookings.yourRating' | transloco }}</span>
                  <div class="stars">
                    @for (n of [1,2,3,4,5]; track n) {
                      <button type="button" class="star" [class.star--on]="draftRating() >= n"
                              (click)="draftRating.set(n)" [attr.aria-label]="n">
                        <span class="ms">star</span>
                      </button>
                    }
                  </div>
                  <input class="review-input" type="text" [(ngModel)]="draftTitle"
                         [placeholder]="'bookings.reviewTitle' | transloco" maxlength="120" />
                  <textarea class="review-input" rows="3" [(ngModel)]="draftContent"
                            [placeholder]="'bookings.reviewBody' | transloco" maxlength="2000"></textarea>
                  <div class="review-actions">
                    <button class="review-cancel" (click)="closeReview()">{{ 'booking.flow.cancel' | transloco }}</button>
                    <button class="review-submit" (click)="submitReview(b)"
                            [disabled]="submitting() || draftTitle.trim() === '' || draftContent.trim() === ''">
                      {{ (submitting() ? 'bookings.cancelling' : 'bookings.submitReview') | transloco }}
                    </button>
                  </div>
                </div>
              }
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
    .row-live { display: inline-flex; align-items: center; gap: 5px; background: var(--accent-soft); border: 1px solid var(--accent); color: var(--accent); border-radius: 999px; padding: 5px 14px; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: background 120ms ease; }
    .row-live:hover { background: var(--accent); color: #fff; }
    .row-live .ms { font-size: 15px; }
    .toast { background: var(--ink); color: #fff; padding: 0.7rem 1.1rem; border-radius: 12px; margin-bottom: 1.2rem; font-weight: 600; font-size: 0.9rem; }
    .row-review { display: inline-flex; align-items: center; gap: 5px; background: none; border: 1px solid var(--line); color: var(--accent); border-radius: 999px; padding: 5px 14px; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: background 120ms ease; }
    .row-invoice { display: inline-flex; align-items: center; gap: 5px; background: none; border: 1px solid var(--line); color: var(--muted); border-radius: 999px; padding: 5px 14px; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 120ms ease; }
    .row-invoice:hover { border-color: var(--accent); color: var(--accent); }
    .row-review:hover { background: var(--accent-soft); }
    .row-review .ms { font-size: 15px; }
    .row-reviewed { display: inline-flex; align-items: center; gap: 4px; color: #00856A; font-weight: 700; font-size: 0.8rem; }
    .row-reviewed .ms { font-size: 16px; }
    .row { flex-wrap: wrap; }
    .review-form { flex-basis: 100%; border-top: 1px dashed var(--line); margin-top: 0.9rem; padding-top: 0.9rem; display: flex; flex-direction: column; gap: 0.6rem; }
    .review-form__label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: var(--muted); }
    .stars { display: flex; gap: 2px; }
    .star { background: none; border: none; cursor: pointer; padding: 2px; color: #d8d8d8; line-height: 0; }
    .star .ms { font-size: 26px; }
    .star--on { color: #F5A623; }
    .review-input { width: 100%; border: 1px solid var(--line); border-radius: 10px; padding: 9px 12px; font: inherit; font-size: 0.9rem; resize: vertical; }
    .review-input:focus { outline: none; border-color: var(--accent); }
    .review-actions { display: flex; justify-content: flex-end; gap: 0.6rem; }
    .review-cancel { background: none; border: 1px solid var(--line); border-radius: 999px; padding: 7px 16px; font-weight: 700; font-size: 0.82rem; cursor: pointer; }
    .review-submit { background: var(--accent); color: #fff; border: none; border-radius: 999px; padding: 7px 18px; font-weight: 700; font-size: 0.82rem; cursor: pointer; }
    .review-submit:disabled { opacity: 0.5; cursor: default; }
    @media (max-width: 560px) { .row-side { width: 100%; flex-direction: row; justify-content: space-between; flex-wrap: wrap; } }
  `],
})
export class BookingsComponent implements OnInit {
  readonly router = inject(Router);
  readonly invoices = inject(InvoiceService);
  private readonly service = inject(BookingService);
  private readonly reviews = inject(ReviewService);
  private readonly transloco = inject(TranslocoService);

  readonly loading = signal(true);
  readonly bookings = signal<BookingResponse[]>([]);
  readonly cancelling = signal<string | null>(null);
  readonly toast = signal<string>('');

  // Post-stay review form state
  readonly reviewing = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly reviewedIds = signal<Set<string>>(new Set());
  readonly draftRating = signal(5);
  draftTitle = '';
  draftContent = '';

  ngOnInit(): void { this.load(); }

  /** The reviewable catalog entity behind a booking, or null. */
  reviewTarget(b: BookingResponse): ReviewTarget | null {
    if (b.restaurantId) return { type: 'RESTAURANT', id: b.restaurantId };
    if (b.cruiseId) return { type: 'CRUISE', id: b.cruiseId };
    if (b.flightId) return { type: 'FLIGHT', id: b.flightId };
    if (b.hotelId) return { type: 'HOTEL', id: b.hotelId };
    return null;
  }

  openReview(b: BookingResponse): void {
    this.reviewing.set(b.id);
    this.draftRating.set(5);
    this.draftTitle = '';
    this.draftContent = '';
  }

  closeReview(): void {
    this.reviewing.set(null);
  }

  submitReview(b: BookingResponse): void {
    const target = this.reviewTarget(b);
    if (!target || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.reviews
      .create({
        targetType: target.type,
        targetId: target.id,
        rating: this.draftRating(),
        title: this.draftTitle.trim(),
        content: this.draftContent.trim(),
      })
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        this.submitting.set(false);
        if (res) {
          this.reviewedIds.update(s => new Set(s).add(b.id));
          this.reviewing.set(null);
          this.flash(this.transloco.translate('bookings.reviewSaved'));
        } else {
          this.flash(this.transloco.translate('bookings.reviewError'));
        }
      });
  }

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
