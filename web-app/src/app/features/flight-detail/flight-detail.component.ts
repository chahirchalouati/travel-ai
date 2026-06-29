import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { CatalogService } from '../../core/services/catalog.service';
import type { FlightSearchResult } from '../../core/models/api.models';
import { RevealDirective } from '../../shared/reveal/reveal.directive';

@Component({
  selector: 'app-flight-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, TranslocoModule, RevealDirective],
  template: `
    @if (flight(); as f) {
      <nav style="padding: 16px 32px; max-width: 1100px; margin: 0 auto;">
        <button (click)="goBack()" class="back-link">
          <span class="ms" style="font-size:18px">arrow_back</span>
          {{ 'flight.back' | transloco }}
        </button>
      </nav>

      <div style="max-width: 1100px; margin: 0 auto; padding: 0 32px 80px;">

        <!-- HERO CARD -->
        <div class="hero-card">
          <div class="hero-card__airline">
            <span class="ms" style="font-size:40px; color:#E04A2F">flight</span>
            <div>
              <h1 class="hero-card__name">{{ f.airline }}</h1>
              <p class="hero-card__flight-no">{{ 'flight.flightNo' | transloco }} {{ f.flightNumber }}</p>
            </div>
          </div>

          <div class="route-display">
            <div class="route-point">
              <span class="route-iata">{{ f.originIata }}</span>
              <span class="route-label">{{ 'flight.origin' | transloco }}</span>
            </div>
            <div class="route-line">
              <span class="ms" style="font-size:22px; color:#E04A2F; transform:rotate(90deg); display:block">flight</span>
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
                <span class="ms" style="font-size:22px; color:#00856A">schedule</span>
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
                <span class="ms" style="font-size:22px; color:#00856A">luggage</span>
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

              <div style="height:1px; background:#efefef; margin: 16px 0;"></div>

              <div class="meta-list">
                <div class="meta-item">
                  <span class="ms" style="font-size:18px; color:#8a8a8a">event_seat</span>
                  <div>
                    <span class="meta-label">{{ 'flight.booking.seatsLeft' | transloco }}</span>
                    <span class="meta-value" [style.color]="f.seatsAvailable < 5 ? '#E04A2F' : '#1a1a1a'">
                      {{ f.seatsAvailable }} {{ f.seatsAvailable === 1 ? ('flight.booking.seat' | transloco) : ('flight.booking.seats' | transloco) }}
                    </span>
                  </div>
                </div>
                <div class="meta-item">
                  <span class="ms" style="font-size:18px; color:#8a8a8a">airline_stops</span>
                  <div>
                    <span class="meta-label">{{ 'flight.booking.route' | transloco }}</span>
                    <span class="meta-value">{{ f.originIata }} → {{ f.destIata }}</span>
                  </div>
                </div>
                <div class="meta-item">
                  <span class="ms" style="font-size:18px; color:#8a8a8a">luggage</span>
                  <div>
                    <span class="meta-label">{{ 'flight.booking.baggage' | transloco }}</span>
                    <span class="meta-value">{{ f.baggageIncluded ? ('flight.booking.included' | transloco) : ('flight.booking.notIncluded' | transloco) }}</span>
                  </div>
                </div>
              </div>

              <div style="height:1px; background:#efefef; margin: 16px 0;"></div>

              <button class="btn-book" (click)="goToPlanner()">
                <span class="ms" style="font-size:20px">travel_explore</span>
                {{ 'flight.booking.book' | transloco }}
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
      background: #f7f7f7;
      min-height: 100vh;
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
      color: #1a1a1a;
    }

    .back-link {
      display: inline-flex; align-items: center; gap: 4px;
      background: none; border: none; color: #545454;
      font-family: inherit; font-size: 14px; font-weight: 500;
      cursor: pointer; padding: 0;
      transition: color 150ms ease;
    }
    .back-link:hover { color: #E04A2F; }

    .hero-card {
      background: #fff;
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
      font-size: 14px; color: #8a8a8a; margin: 4px 0 0; font-weight: 500;
    }

    .route-display {
      display: flex; align-items: center; gap: 20px;
    }

    .route-point {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
    }

    .route-iata {
      font-size: 2rem; font-weight: 800; letter-spacing: 2px; color: #1a1a1a;
    }

    .route-label {
      font-size: 12px; color: #8a8a8a; text-transform: uppercase; letter-spacing: 0.5px;
    }

    .route-line { display: flex; flex-direction: column; align-items: center; }

    .detail-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      align-items: start;
    }

    .info-card {
      background: #fff; border-radius: 12px; padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
    }

    .card-heading {
      display: flex; align-items: center; gap: 10px;
      font-size: 18px; font-weight: 700; margin: 0 0 20px; color: #1a1a1a;
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
      font-size: 1.3rem; font-weight: 700; color: #1a1a1a;
    }

    .schedule-date {
      font-size: 12px; color: #8a8a8a; text-align: center;
    }

    .schedule-connector {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
    }

    .schedule-line {
      width: 100%; height: 1px; background: #e0e0e0;
    }

    .duration-badge {
      background: #f7f7f7; border: 1px solid #e0e0e0;
      border-radius: 100px; padding: 4px 12px;
      font-size: 12px; font-weight: 600; color: #545454;
      white-space: nowrap;
    }

    .feature-list {
      display: flex; flex-direction: column; gap: 12px;
    }

    .feature-item {
      display: flex; align-items: center; gap: 10px;
      font-size: 14px; font-weight: 500;
    }

    .feature-item--yes { color: #1a1a1a; }
    .feature-item--yes .ms { color: #00856A; }
    .feature-item--no { color: #8a8a8a; }
    .feature-item--no .ms { color: #e0e0e0; }

    .booking-card {
      background: #fff; border-radius: 12px; padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
      border: 1px solid #e0e0e0;
    }

    .price-block {
      display: flex; flex-direction: column; gap: 4px;
    }

    .price-label {
      font-size: 12px; color: #8a8a8a; text-transform: uppercase;
      letter-spacing: 0.5px; font-weight: 500;
    }

    .price-value {
      font-size: 2.2rem; font-weight: 800; color: #1a1a1a;
    }

    .meta-list {
      display: flex; flex-direction: column; gap: 14px;
    }

    .meta-item {
      display: flex; align-items: center; gap: 12px;
    }

    .meta-label {
      display: block; font-size: 11px; color: #8a8a8a;
      text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;
    }

    .meta-value {
      display: block; font-size: 15px; font-weight: 600; color: #1a1a1a;
    }

    .btn-book {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
      background: #E04A2F; color: #fff; border: none; border-radius: 10px;
      padding: 14px; font-family: inherit; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: background 150ms ease;
    }
    .btn-book:hover { background: #c93d25; }

    .urgency-note {
      display: flex; align-items: center; gap: 5px;
      margin: 12px 0 0; font-size: 13px; font-weight: 600; color: #E04A2F;
      text-align: center; justify-content: center;
    }

    @keyframes shimmer {
      0% { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }

    .shimmer {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
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

  readonly flight = signal<FlightSearchResult | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/']); return; }

    this.catalogService.getFlight(id).subscribe({
      next: (f) => this.flight.set(f),
      error: () => this.router.navigate(['/']),
    });
  }

  getDuration(departure: string, arrival: string): string {
    const diff = new Date(arrival).getTime() - new Date(departure).getTime();
    const hours = Math.floor(diff / 3_600_000);
    const mins = Math.floor((diff % 3_600_000) / 60_000);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  goBack(): void { this.router.navigate(['/']); }
  goToPlanner(): void { this.router.navigate(['/planner']); }
}
