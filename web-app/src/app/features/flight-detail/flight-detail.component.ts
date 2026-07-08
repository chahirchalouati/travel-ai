import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { ReviewService } from '../../core/services/review.service';
import { PriceWatchService } from '../../core/services/price-watch.service';
import type { FlightSearchResult, ReviewSummary } from '../../core/models/api.models';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { BookingDraftService } from '../booking-flow/booking-draft.service';
import { TripContextService } from '../../core/services/trip-context.service';
import { FavoritesService } from '../../core/services/favorites.service';

@Component({
  selector: 'app-flight-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, TranslocoModule, RevealDirective],
  template: `
    @if (flight(); as f) {
      <nav style="padding: 16px 32px; max-width: 1100px; margin: 0 auto; display:flex; align-items:center; justify-content:space-between;">
        <button (click)="goBack()" class="back-link">
          <span class="ms" style="font-size:18px">arrow_back</span>
          {{ 'flight.back' | transloco }}
        </button>
        <button class="fav-toggle" [class.fav-toggle--on]="isFav()" (click)="toggleFav(f)"
                [attr.aria-label]="'favorites.save' | transloco">
          <span class="ms">{{ isFav() ? 'favorite' : 'favorite_border' }}</span>
          {{ (isFav() ? 'favorites.saved' : 'favorites.save') | transloco }}
        </button>
      </nav>

      <div style="max-width: 1100px; margin: 0 auto; padding: 0 32px 80px;">

        <!-- HERO CARD -->
        <div class="hero-card">
          <div class="hero-card__airline">
            <span class="ms" style="font-size:40px; color:var(--brand)">flight</span>
            <div>
              <h1 class="hero-card__name">{{ f.airline }}</h1>
              <p class="hero-card__flight-no">{{ 'flight.flightNo' | transloco }} {{ f.flightNumber }}</p>
              <div class="hero-badges">
                @if (summary(); as s) {
                  @if (s.totalReviews > 0) {
                    <span class="rating-badge">
                      <span class="ms" style="font-size:14px; vertical-align:middle">star</span>
                      {{ s.averageRating | number:'1.1-1' }} · {{ s.totalReviews }} {{ 'common.reviews' | transloco }}
                    </span>
                  }
                }
                @if (tripFit(); as place) {
                  <span class="ai-badge">
                    <span class="ms" style="font-size:14px; vertical-align:middle">auto_awesome</span>
                    {{ 'common.fitsTrip' | transloco:{ place: place } }}
                  </span>
                }
              </div>
            </div>
          </div>

          <div class="route-display">
            <div class="route-point">
              <span class="route-iata">{{ f.originIata }}</span>
              <span class="route-label">{{ 'flight.origin' | transloco }}</span>
            </div>
            <div class="route-line">
              <span class="ms" style="font-size:22px; color:var(--brand); transform:rotate(90deg); display:block">flight</span>
            </div>
            <div class="route-point">
              <span class="route-iata">{{ f.destIata }}</span>
              <span class="route-label">{{ 'flight.destination' | transloco }}</span>
            </div>
          </div>
        </div>

        <div class="detail-grid">
          <!-- LEFT: Schedule + Details -->
          <div style="display:flex; flex-direction:column; gap:20px;">

            <!-- Schedule -->
            <section class="info-card" appReveal>
              <h2 class="card-heading">
                <span class="ms" style="font-size:22px; color:var(--teal)">schedule</span>
                {{ 'flight.schedule' | transloco }}
              </h2>
              <div class="schedule-row">
                <div class="schedule-point">
                  <span class="schedule-iata">{{ f.originIata }}</span>
                  <span class="schedule-time">{{ f.departureAt | date:'HH:mm' }}</span>
                  <span class="schedule-date">{{ f.departureAt | date:'EEE, dd MMM yyyy' }}</span>
                </div>
                <div class="schedule-connector">
                  <div class="schedule-line"></div>
                  <div class="duration-badge">
                    {{ getDuration(f.departureAt, f.arrivalAt) }}
                  </div>
                  <div class="schedule-line"></div>
                </div>
                <div class="schedule-point">
                  <span class="schedule-iata">{{ f.destIata }}</span>
                  <span class="schedule-time">{{ f.arrivalAt | date:'HH:mm' }}</span>
                  <span class="schedule-date">{{ f.arrivalAt | date:'EEE, dd MMM yyyy' }}</span>
                </div>
              </div>
            </section>

            <!-- Inclusions -->
            <section class="info-card" appReveal>
              <h2 class="card-heading">
                <span class="ms" style="font-size:22px; color:var(--teal)">luggage</span>
                {{ 'flight.inclusions' | transloco }}
              </h2>
              <div class="feature-list">
                <div class="feature-item" [class.feature-item--yes]="f.baggageIncluded" [class.feature-item--no]="!f.baggageIncluded">
                  <span class="ms" style="font-size:20px">{{ f.baggageIncluded ? 'check_circle' : 'cancel' }}</span>
                  {{ 'flight.baggage' | transloco }}
                </div>
                <div class="feature-item feature-item--yes">
                  <span class="ms" style="font-size:20px">check_circle</span>
                  {{ 'flight.carryOn' | transloco }}
                </div>
                <div class="feature-item feature-item--yes">
                  <span class="ms" style="font-size:20px">check_circle</span>
                  {{ 'flight.seatSelection' | transloco }}
                </div>
              </div>
            </section>

          </div>

          <!-- RIGHT: Booking Sidebar -->
          <aside style="position:sticky; top:80px;">
            <div class="booking-card">
              <div class="price-block">
                <span class="price-label">{{ 'flight.booking.pricePerPerson' | transloco }}</span>
                <span class="price-value">{{ f.price | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>

              <div style="height:1px; background:var(--border-light); margin: 16px 0;"></div>

              <div class="meta-list">
                <div class="meta-item">
                  <span class="ms" style="font-size:18px; color:var(--text-tertiary)">event_seat</span>
                  <div>
                    <span class="meta-label">{{ 'flight.booking.seatsLeft' | transloco }}</span>
                    <span class="meta-value" [style.color]="f.seatsAvailable < 5 ? 'var(--brand)' : 'var(--text-primary)'">
                      {{ f.seatsAvailable }} {{ f.seatsAvailable === 1 ? ('flight.booking.seat' | transloco) : ('flight.booking.seats' | transloco) }}
                    </span>
                  </div>
                </div>
                <div class="meta-item">
                  <span class="ms" style="font-size:18px; color:var(--text-tertiary)">airline_stops</span>
                  <div>
                    <span class="meta-label">{{ 'flight.booking.route' | transloco }}</span>
                    <span class="meta-value">{{ f.originIata }} → {{ f.destIata }}</span>
                  </div>
                </div>
                <div class="meta-item">
                  <span class="ms" style="font-size:18px; color:var(--text-tertiary)">luggage</span>
                  <div>
                    <span class="meta-label">{{ 'flight.booking.baggage' | transloco }}</span>
                    <span class="meta-value">{{ f.baggageIncluded ? ('flight.booking.included' | transloco) : ('flight.booking.notIncluded' | transloco) }}</span>
                  </div>
                </div>
              </div>

              <div style="height:1px; background:var(--border-light); margin: 16px 0;"></div>

              <button class="btn-book" (click)="book(f)">
                <span class="ms" style="font-size:20px">confirmation_number</span>
                {{ 'flight.booking.book' | transloco }}
              </button>
              <button class="btn-watch" [class.btn-watch--on]="watchId()" (click)="toggleWatch(f)">
                <span class="ms" style="font-size:18px">{{ watchId() ? 'notifications_active' : 'notifications' }}</span>
                {{ (watchId() ? 'priceWatch.watching' : 'priceWatch.watch') | transloco }}
              </button>

              @if (f.seatsAvailable < 10 && f.seatsAvailable > 0) {
                <p class="urgency-note">
                  <span class="ms" style="font-size:15px">bolt</span>
                  {{ 'flight.booking.urgency' | transloco:{ count: f.seatsAvailable, unit: f.seatsAvailable === 1 ? ('flight.booking.seat' | transloco) : ('flight.booking.seats' | transloco) } }}
                </p>
              }
            </div>
          </aside>
        </div>
      </div>
    } @else {
      <div class="skeleton-wrap">
        <div style="max-width:1100px; margin:0 auto; padding:32px;">
          <div class="shimmer" style="height:200px; border-radius:16px; margin-bottom:24px;"></div>
          <div style="display:grid; grid-template-columns:2fr 1fr; gap:24px;">
            <div style="display:flex; flex-direction:column; gap:20px;">
              <div class="shimmer" style="height:180px; border-radius:12px;"></div>
              <div class="shimmer" style="height:140px; border-radius:12px;"></div>
            </div>
            <div class="shimmer" style="height:340px; border-radius:12px;"></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      background: var(--bg-primary);
      min-height: 100vh;
      font-family: var(--font-body);
      color: var(--text-primary);
    }

    .back-link {
      display: inline-flex; align-items: center; gap: 4px;
      background: none; border: none; color: var(--text-secondary);
      font-family: inherit; font-size: 14px; font-weight: 500;
      cursor: pointer; padding: 0;
      transition: color 150ms ease;
    }
    .back-link:hover { color: var(--brand); }
    .fav-toggle { display: inline-flex; align-items: center; gap: 6px; background: none; border: 1px solid var(--border); border-radius: 999px; padding: 7px 14px; font-family: inherit; font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all 150ms ease; }
    .fav-toggle:hover { border-color: var(--brand); color: var(--brand); }
    .fav-toggle--on { border-color: var(--brand); color: var(--brand); background: var(--brand-light); }
    .fav-toggle .ms { font-size: 18px; }

    .hero-card {
      background: var(--surface);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 24px;
    }

    .hero-card__airline {
      display: flex; align-items: center; gap: 16px;
    }

    .hero-card__name {
      font-size: clamp(1.6rem, 1.2rem + 1.5vw, 2.2rem);
      font-weight: 800; margin: 0; line-height: 1.1;
    }

    .hero-card__flight-no {
      font-size: 14px; color: var(--text-tertiary); margin: 4px 0 0; font-weight: 500;
    }
    .hero-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .ai-badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 12px; font-weight: 700; color: var(--teal);
      background: var(--teal-light); border-radius: 999px; padding: 3px 10px;
    }
    .ai-badge .ms { color: var(--teal); }
    .rating-badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 12px; font-weight: 700; color: var(--gold);
      background: var(--gold-light); border-radius: 999px; padding: 3px 10px;
    }
    .rating-badge .ms { color: var(--gold); }

    .route-display {
      display: flex; align-items: center; gap: 20px;
    }

    .route-point {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
    }

    .route-iata {
      font-size: 2rem; font-weight: 800; letter-spacing: 2px; color: var(--text-primary);
    }

    .route-label {
      font-size: 12px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px;
    }

    .route-line { display: flex; flex-direction: column; align-items: center; }

    .detail-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      align-items: start;
    }

    .info-card {
      background: var(--surface); border-radius: 12px; padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
    }

    .card-heading {
      display: flex; align-items: center; gap: 10px;
      font-size: 18px; font-weight: 700; margin: 0 0 20px; color: var(--text-primary);
    }

    .schedule-row {
      display: flex; align-items: center; gap: 16px; justify-content: space-between;
    }

    .schedule-point {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
    }

    .schedule-iata {
      font-size: 2rem; font-weight: 800; letter-spacing: 2px;
    }

    .schedule-time {
      font-size: 1.3rem; font-weight: 700; color: var(--text-primary);
    }

    .schedule-date {
      font-size: 12px; color: var(--text-tertiary); text-align: center;
    }

    .schedule-connector {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
    }

    .schedule-line {
      width: 100%; height: 1px; background: var(--border);
    }

    .duration-badge {
      background: var(--bg-secondary); border: 1px solid var(--border);
      border-radius: 100px; padding: 4px 12px;
      font-size: 12px; font-weight: 600; color: var(--text-secondary);
      white-space: nowrap;
    }

    .feature-list {
      display: flex; flex-direction: column; gap: 12px;
    }

    .feature-item {
      display: flex; align-items: center; gap: 10px;
      font-size: 14px; font-weight: 500;
    }

    .feature-item--yes { color: var(--text-primary); }
    .feature-item--yes .ms { color: var(--teal); }
    .feature-item--no { color: var(--text-tertiary); }
    .feature-item--no .ms { color: var(--border); }

    .booking-card {
      background: var(--surface); border-radius: 12px; padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
      border: 1px solid var(--border);
    }

    .price-block {
      display: flex; flex-direction: column; gap: 4px;
    }

    .price-label {
      font-size: 12px; color: var(--text-tertiary); text-transform: uppercase;
      letter-spacing: 0.5px; font-weight: 500;
    }

    .price-value {
      font-size: 2.2rem; font-weight: 800; color: var(--text-primary);
    }

    .meta-list {
      display: flex; flex-direction: column; gap: 14px;
    }

    .meta-item {
      display: flex; align-items: center; gap: 12px;
    }

    .meta-label {
      display: block; font-size: 11px; color: var(--text-tertiary);
      text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;
    }

    .meta-value {
      display: block; font-size: 15px; font-weight: 600; color: var(--text-primary);
    }

    .btn-book {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
      background: var(--brand); color: #fff; border: none; border-radius: 10px;
      padding: 14px; font-family: inherit; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: background 150ms ease;
    }
    .btn-book:hover { background: var(--brand-hover); }
    .btn-watch { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 10px; background: var(--surface); color: var(--text-secondary); border: 1px solid var(--border); border-radius: 10px; padding: 12px; font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 150ms ease; }
    .btn-watch:hover { border-color: var(--brand); color: var(--brand); }
    .btn-watch--on { border-color: var(--brand); color: var(--brand); background: var(--brand-light); }

    .urgency-note {
      display: flex; align-items: center; gap: 5px;
      margin: 12px 0 0; font-size: 13px; font-weight: 600; color: var(--brand);
      text-align: center; justify-content: center;
    }

    @keyframes shimmer {
      0% { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }

    .shimmer {
      background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
      background-size: 800px 100%;
      animation: shimmer 1.8s ease-in-out infinite;
    }

    @media (max-width: 768px) {
      .detail-grid { grid-template-columns: 1fr; }
      .hero-card { flex-direction: column; align-items: flex-start; }
      .route-display { width: 100%; justify-content: center; }
    }
  `],
})
export class FlightDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly bookingDraft = inject(BookingDraftService);
  private readonly tripContext = inject(TripContextService);
  private readonly reviewService = inject(ReviewService);
  private readonly favorites = inject(FavoritesService);
  private readonly priceWatch = inject(PriceWatchService);

  readonly flight = signal<FlightSearchResult | null>(null);
  readonly summary = signal<ReviewSummary | null>(null);
  readonly watchId = signal<string | null>(null);

  toggleWatch(f: FlightSearchResult): void {
    const existing = this.watchId();
    if (existing) {
      this.priceWatch.remove(existing).pipe(catchError(() => of(undefined)))
        .subscribe(() => this.watchId.set(null));
    } else {
      this.priceWatch.create({ flightId: f.id }).pipe(catchError(() => of(null)))
        .subscribe(w => { if (w) { this.watchId.set(w.id); } });
    }
  }
  readonly isFav = computed(() => {
    const f = this.flight();
    return f ? this.favorites.has('flight', f.id) : false;
  });

  toggleFav(f: FlightSearchResult): void {
    this.favorites.toggle({
      type: 'flight',
      id: f.id,
      title: `${f.airline} ${f.flightNumber}`,
      subtitle: `${f.originCity ?? f.originIata} → ${f.destCity ?? f.destIata}`,
      route: `/flights/${f.id}`,
    });
  }
  readonly tripFit = computed(() => {
    const f = this.flight();
    return f ? this.tripContext.match(f.destCity ?? f.destIata) : null;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/']); return; }

    this.catalogService.getFlight(id).subscribe({
      next: (f) => this.flight.set(f),
      error: () => this.router.navigate(['/']),
    });
    this.reviewService.getSummary('FLIGHT', id)
      .pipe(catchError(() => of(null)))
      .subscribe(s => this.summary.set(s));
    this.priceWatch.list().pipe(catchError(() => of([])))
      .subscribe(ws => this.watchId.set(ws.find(w => w.flightId === id)?.id ?? null));
    this.tripContext.ensureLoaded();
  }

  getDuration(departure: string, arrival: string): string {
    const diff = new Date(arrival).getTime() - new Date(departure).getTime();
    const hours = Math.floor(diff / 3_600_000);
    const mins = Math.floor((diff % 3_600_000) / 60_000);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  goBack(): void { this.router.navigate(['/']); }
  goToPlanner(): void { this.router.navigate(['/planner']); }

  /** Seeds the booking funnel with fare bundles and opens it. */
  book(f: FlightSearchResult): void {
    const route = `${f.originCity ?? f.originIata} → ${f.destCity ?? f.destIata}`;
    this.bookingDraft.start({
      vertical: 'flight',
      itemId: f.id,
      title: `${f.airline} ${f.flightNumber}`,
      subtitle: route,
      destination: f.destCity ?? f.destIata,
      unitPrice: f.price,
      currency: 'EUR',
      checkIn: f.departureAt.slice(0, 10),
      options: [
        { id: 'basic', label: 'Basic', note: 'Carry-on only', multiplier: 1 },
        { id: 'standard', label: 'Standard', note: 'Checked bag + seat choice', multiplier: 1.18 },
        { id: 'flex', label: 'Flex', note: 'Refundable + free changes', multiplier: 1.42 },
      ],
    }, 1);
    this.router.navigate(['/book']);
  }
}
