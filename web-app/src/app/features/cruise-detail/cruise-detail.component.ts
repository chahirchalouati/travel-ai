import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { CatalogService } from '../../core/services/catalog.service';
import type { CruiseSearchResult } from '../../core/models/api.models';

@Component({
  selector: 'app-cruise-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, TranslocoModule],
  template: `
    @if (cruise(); as c) {
      <nav style="padding: 16px 32px; max-width: 1100px; margin: 0 auto;">
        <button (click)="goBack()" class="back-link">
          <span class="ms" style="font-size:18px">arrow_back</span>
          {{ 'cruise.back' | transloco }}
        </button>
      </nav>

      <div style="max-width: 1100px; margin: 0 auto; padding: 0 32px 80px;">

        <!-- HERO CARD -->
        <div class="hero-card">
          @if (c.imageUrl) {
            <img
              [src]="c.imageUrl"
              [alt]="c.name"
              class="hero-card__img"
              width="500"
              height="300"
              loading="eager"
              fetchpriority="high"
            />
          } @else {
            <div class="hero-card__img-placeholder">
              <span class="ms" style="font-size:72px; color:#e0e0e0">directions_boat</span>
            </div>
          }

          <div class="hero-card__overlay">
            <div class="hero-card__badges">
              @if (c.cruiseType) {
                <span class="badge badge--blue">{{ c.cruiseType }}</span>
              }
              @if (c.allInclusive) {
                <span class="badge badge--teal">All Inclusive</span>
              }
            </div>
            <h1 class="hero-card__name">{{ c.name }}</h1>
            <p class="hero-card__operator">
              <span class="ms" style="font-size:16px; vertical-align:middle">directions_boat</span>
              {{ c.operator }} &middot; {{ c.shipName }}
            </p>
            <div class="route-bar">
              <span class="route-port">{{ c.departurePort }}</span>
              <span class="ms" style="font-size:20px; color:rgba(255,255,255,.7)">arrow_forward</span>
              <span class="route-port">{{ c.arrivalPort || c.departurePort }}</span>
              <span class="duration-chip">{{ c.durationNights }} nights</span>
            </div>
          </div>
        </div>

        <div class="detail-grid">
          <!-- LEFT -->
          <div style="display:flex; flex-direction:column; gap:20px;">

            <!-- About -->
            @if (c.description) {
              <section class="info-card">
                <h2 class="card-heading">
                  <span class="ms" style="font-size:22px; color:#00856A">info</span>
                  {{ 'cruise.about' | transloco }}
                </h2>
                <p style="font-size:15px; color:#545454; line-height:1.75; margin:0;">{{ c.description }}</p>
              </section>
            }

            <!-- Schedule -->
            <section class="info-card">
              <h2 class="card-heading">
                <span class="ms" style="font-size:22px; color:#00856A">calendar_month</span>
                {{ 'cruise.schedule' | transloco }}
              </h2>
              <div class="schedule-grid">
                <div class="schedule-item">
                  <span class="schedule-label">{{ 'cruise.departure' | transloco }}</span>
                  <span class="schedule-value">{{ c.departureDate | date:'EEE, dd MMM yyyy' }}</span>
                  <span class="schedule-port">{{ c.departurePort }}</span>
                </div>
                <div class="schedule-divider">
                  <div class="divider-line"></div>
                  <div class="divider-badge">{{ c.durationNights }} {{ 'cruise.nights' | transloco }}</div>
                  <div class="divider-line"></div>
                </div>
                <div class="schedule-item">
                  <span class="schedule-label">{{ 'cruise.return' | transloco }}</span>
                  <span class="schedule-value">{{ c.returnDate | date:'EEE, dd MMM yyyy' }}</span>
                  <span class="schedule-port">{{ c.arrivalPort || c.departurePort }}</span>
                </div>
              </div>
            </section>

            <!-- Itinerary -->
            @if (c.itinerary) {
              <section class="info-card">
                <h2 class="card-heading">
                  <span class="ms" style="font-size:22px; color:#00856A">map</span>
                  {{ 'cruise.itinerary' | transloco }}
                </h2>
                <p style="font-size:14px; color:#545454; line-height:1.75; margin:0; white-space:pre-line;">{{ c.itinerary }}</p>
              </section>
            }

            <!-- What's included -->
            <section class="info-card">
              <h2 class="card-heading">
                <span class="ms" style="font-size:22px; color:#00856A">checklist</span>
                {{ 'cruise.whatsIncluded' | transloco }}
              </h2>
              <div class="feature-list">
                <div class="feature-item" [class.feature-item--yes]="c.allInclusive" [class.feature-item--no]="!c.allInclusive">
                  <span class="ms" style="font-size:20px">{{ c.allInclusive ? 'check_circle' : 'cancel' }}</span>
                  {{ 'cruise.allInclusive' | transloco }}
                </div>
                <div class="feature-item feature-item--yes">
                  <span class="ms" style="font-size:20px">check_circle</span>
                  {{ 'cruise.cabin' | transloco }}
                </div>
                <div class="feature-item feature-item--yes">
                  <span class="ms" style="font-size:20px">check_circle</span>
                  {{ 'cruise.entertainment' | transloco }}
                </div>
                <div class="feature-item feature-item--yes">
                  <span class="ms" style="font-size:20px">check_circle</span>
                  {{ 'cruise.portTransfers' | transloco }}
                </div>
              </div>
            </section>

          </div>

          <!-- RIGHT: Booking Sidebar -->
          <aside style="position:sticky; top:80px;">
            <div class="booking-card">
              <div class="price-block">
                <span class="price-label">{{ 'cruise.booking.fromPerPerson' | transloco }}</span>
                <span class="price-value">{{ c.pricePerPerson | currency:'USD':'symbol':'1.0-0' }}</span>
                <span class="price-note">{{ c.durationNights }}{{ 'cruise.booking.nightCruise' | transloco }}</span>
              </div>

              <div style="height:1px; background:#efefef; margin:16px 0;"></div>

              <div class="meta-list">
                <div class="meta-item">
                  <span class="ms" style="font-size:20px; color:#8a8a8a">directions_boat</span>
                  <div>
                    <span class="meta-label">{{ 'cruise.booking.ship' | transloco }}</span>
                    <span class="meta-value">{{ c.shipName }}</span>
                  </div>
                </div>
                <div class="meta-item">
                  <span class="ms" style="font-size:20px; color:#8a8a8a">business</span>
                  <div>
                    <span class="meta-label">{{ 'cruise.booking.operator' | transloco }}</span>
                    <span class="meta-value">{{ c.operator }}</span>
                  </div>
                </div>
                <div class="meta-item">
                  <span class="ms" style="font-size:20px; color:#8a8a8a">bed</span>
                  <div>
                    <span class="meta-label">{{ 'cruise.booking.cabinsAvailable' | transloco }}</span>
                    <span class="meta-value" [style.color]="c.cabinsAvailable < 5 ? '#E04A2F' : '#1a1a1a'">
                      {{ c.cabinsAvailable }} {{ c.cabinsAvailable === 1 ? ('cruise.booking.cabin' | transloco) : ('cruise.booking.cabins' | transloco) }}
                    </span>
                  </div>
                </div>
                @if (c.cruiseType) {
                  <div class="meta-item">
                    <span class="ms" style="font-size:20px; color:#8a8a8a">explore</span>
                    <div>
                      <span class="meta-label">{{ 'cruise.booking.type' | transloco }}</span>
                      <span class="meta-value">{{ c.cruiseType }}</span>
                    </div>
                  </div>
                }
              </div>

              <div style="height:1px; background:#efefef; margin:16px 0;"></div>

              <button class="btn-book" (click)="goToPlanner()">
                <span class="ms" style="font-size:20px">travel_explore</span>
                {{ 'cruise.booking.book' | transloco }}
              </button>
              <button class="btn-chat" (click)="goToChat()">
                <span class="ms" style="font-size:20px">chat</span>
                {{ 'cruise.booking.askAi' | transloco }}
              </button>

              @if (c.cabinsAvailable < 10 && c.cabinsAvailable > 0) {
                <p class="urgency-note">
                  <span class="ms" style="font-size:15px">bolt</span>
                  {{ 'cruise.booking.urgency' | transloco:{ count: c.cabinsAvailable, unit: c.cabinsAvailable === 1 ? ('cruise.booking.cabin' | transloco) : ('cruise.booking.cabins' | transloco) } }}
                </p>
              }
            </div>
          </aside>
        </div>
      </div>
    } @else {
      <div style="max-width:1100px; margin:0 auto; padding:32px;">
        <div class="shimmer" style="height:300px; border-radius:16px; margin-bottom:24px;"></div>
        <div style="display:grid; grid-template-columns:2fr 1fr; gap:24px;">
          <div style="display:flex; flex-direction:column; gap:20px;">
            <div class="shimmer" style="height:180px; border-radius:12px;"></div>
            <div class="shimmer" style="height:200px; border-radius:12px;"></div>
            <div class="shimmer" style="height:140px; border-radius:12px;"></div>
          </div>
          <div class="shimmer" style="height:400px; border-radius:12px;"></div>
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
      cursor: pointer; padding: 0; transition: color 150ms ease;
    }
    .back-link:hover { color: #E04A2F; }

    .hero-card {
      position: relative; border-radius: 16px; overflow: hidden;
      margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,.15);
    }

    .hero-card__img {
      width: 100%; height: 300px; object-fit: cover; display: block;
    }

    .hero-card__img-placeholder {
      width: 100%; height: 300px; background: #1a2a4a;
      display: flex; align-items: center; justify-content: center;
    }

    .hero-card__overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.3) 50%, rgba(0,0,0,.1) 100%);
      display: flex; flex-direction: column; justify-content: flex-end;
      padding: 32px;
    }

    .hero-card__badges {
      display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;
    }

    .badge {
      display: inline-block; border-radius: 100px;
      padding: 4px 12px; font-size: 12px; font-weight: 600;
    }
    .badge--teal { background: #00856A; color: #fff; }
    .badge--blue { background: rgba(255,255,255,.2); color: #fff; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,.3); }

    .hero-card__name {
      font-size: clamp(1.8rem, 1.2rem + 2vw, 2.6rem);
      font-weight: 800; color: #fff; margin: 0 0 6px; line-height: 1.1;
    }

    .hero-card__operator {
      font-size: 14px; color: rgba(255,255,255,.8); margin: 0 0 12px; font-weight: 500;
    }

    .route-bar {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    }

    .route-port {
      font-size: 15px; font-weight: 700; color: #fff;
    }

    .duration-chip {
      background: rgba(255,255,255,.2); color: #fff; border: 1px solid rgba(255,255,255,.3);
      border-radius: 100px; padding: 3px 12px; font-size: 12px; font-weight: 600;
      backdrop-filter: blur(4px);
    }

    .detail-grid {
      display: grid; grid-template-columns: 2fr 1fr;
      gap: 24px; align-items: start;
    }

    .info-card {
      background: #fff; border-radius: 12px; padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
    }

    .card-heading {
      display: flex; align-items: center; gap: 10px;
      font-size: 18px; font-weight: 700; margin: 0 0 20px; color: #1a1a1a;
    }

    .schedule-grid {
      display: flex; align-items: center; gap: 16px; justify-content: space-between;
    }

    .schedule-item {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
    }

    .schedule-label {
      font-size: 11px; color: #8a8a8a; text-transform: uppercase;
      letter-spacing: 0.5px; font-weight: 500;
    }

    .schedule-value {
      font-size: 15px; font-weight: 700; color: #1a1a1a; text-align: center;
    }

    .schedule-port {
      font-size: 12px; color: #8a8a8a; text-align: center;
    }

    .schedule-divider {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
    }

    .divider-line { width: 100%; height: 1px; background: #e0e0e0; }

    .divider-badge {
      background: #f7f7f7; border: 1px solid #e0e0e0;
      border-radius: 100px; padding: 4px 12px;
      font-size: 12px; font-weight: 600; color: #545454;
      white-space: nowrap;
    }

    .feature-list { display: flex; flex-direction: column; gap: 12px; }

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
      box-shadow: 0 1px 3px rgba(0,0,0,.08); border: 1px solid #e0e0e0;
    }

    .price-block { display: flex; flex-direction: column; gap: 4px; }

    .price-label {
      font-size: 12px; color: #8a8a8a; text-transform: uppercase;
      letter-spacing: 0.5px; font-weight: 500;
    }

    .price-value { font-size: 2.2rem; font-weight: 800; color: #1a1a1a; }

    .price-note { font-size: 13px; color: #8a8a8a; }

    .meta-list { display: flex; flex-direction: column; gap: 14px; }
    .meta-item { display: flex; align-items: center; gap: 12px; }
    .meta-label {
      display: block; font-size: 11px; color: #8a8a8a;
      text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;
    }
    .meta-value { display: block; font-size: 15px; font-weight: 600; color: #1a1a1a; }

    .btn-book {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
      background: #E04A2F; color: #fff; border: none; border-radius: 10px;
      padding: 14px; font-family: inherit; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: background 150ms ease; margin-bottom: 10px;
    }
    .btn-book:hover { background: #c93d25; }

    .btn-chat {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
      background: #fff; color: #E04A2F; border: 1.5px solid #E04A2F; border-radius: 10px;
      padding: 13px; font-family: inherit; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: background 150ms ease;
    }
    .btn-chat:hover { background: #FFF0ED; }

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
      background-size: 800px 100%; animation: shimmer 1.8s ease-in-out infinite;
    }

    @media (max-width: 768px) {
      .detail-grid { grid-template-columns: 1fr; }
      .schedule-grid { flex-direction: column; gap: 12px; }
      .schedule-divider { flex-direction: row; width: 100%; }
      .divider-line { height: auto; width: 1px; flex: 1; background: #e0e0e0; }
    }
  `],
})
export class CruiseDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);

  readonly cruise = signal<CruiseSearchResult | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/']); return; }

    this.catalogService.getCruise(id).subscribe({
      next: (c) => this.cruise.set(c),
      error: () => this.router.navigate(['/']),
    });
  }

  goBack(): void { this.router.navigate(['/']); }
  goToPlanner(): void { this.router.navigate(['/planner']); }
  goToChat(): void { this.router.navigate(['/chat']); }
}
