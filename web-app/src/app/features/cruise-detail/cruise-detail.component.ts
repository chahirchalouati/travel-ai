import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { ReviewService } from '../../core/services/review.service';
import { PriceWatchService } from '../../core/services/price-watch.service';
import type { CruiseSearchResult, CruiseCabin, CruiseDay, ReviewSummary } from '../../core/models/api.models';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { BookingDraftService } from '../booking-flow/booking-draft.service';
import { TripContextService } from '../../core/services/trip-context.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { UiFareGridComponent, type FareDay } from '../../shared/ui';

@Component({
  selector: 'app-cruise-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, TranslocoModule, RevealDirective, UiFareGridComponent],
  template: `
    @if (cruise(); as c) {
      <nav style="padding: 16px 32px; max-width: 1100px; margin: 0 auto; display:flex; align-items:center; justify-content:space-between;">
        <button (click)="goBack()" class="back-link">
          <span class="ms" style="font-size:18px">arrow_back</span>
          {{ 'cruise.back' | transloco }}
        </button>
        <button class="fav-toggle" [class.fav-toggle--on]="isFav()" (click)="toggleFav(c)"
                [attr.aria-label]="'favorites.save' | transloco">
          <span class="ms">{{ isFav() ? 'favorite' : 'favorite_border' }}</span>
          {{ (isFav() ? 'favorites.saved' : 'favorites.save') | transloco }}
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
              <span class="ms" style="font-size:72px; color:var(--border)">directions_boat</span>
            </div>
          }

          <div class="hero-card__overlay">
            <div class="hero-card__badges">
              @if (c.cruiseType) {
                <span class="badge badge--blue">{{ c.cruiseType }}</span>
              }
              @if (c.allInclusive) {
                <span class="badge badge--teal">{{ 'catalog.cruises.allInclusive' | transloco }}</span>
              }
              @if (summary(); as s) {
                @if (s.totalReviews > 0) {
                  <span class="badge badge--rating">
                    <span class="ms" style="font-size:14px; vertical-align:middle">star</span>
                    {{ s.averageRating | number:'1.1-1' }} · {{ s.totalReviews }} {{ 'common.reviews' | transloco }}
                  </span>
                }
              }
              @if (tripFit(); as place) {
                <span class="badge badge--ai">
                  <span class="ms" style="font-size:14px; vertical-align:middle">auto_awesome</span>
                  {{ 'common.fitsTrip' | transloco:{ place: place } }}
                </span>
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
              <section class="info-card" appReveal>
                <h2 class="card-heading">
                  <span class="ms" style="font-size:22px; color:var(--teal)">info</span>
                  {{ 'cruise.about' | transloco }}
                </h2>
                <p style="font-size:15px; color:var(--text-secondary); line-height:1.75; margin:0;">{{ c.description }}</p>
              </section>
            }

            <!-- Schedule -->
            <section class="info-card" appReveal>
              <h2 class="card-heading">
                <span class="ms" style="font-size:22px; color:var(--teal)">calendar_month</span>
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

            <!-- Itinerary: day-by-day timeline (falls back to freeform text) -->
            @if (itineraryDays().length > 0 || c.itinerary) {
              <section class="info-card" appReveal>
                <h2 class="card-heading">
                  <span class="ms" style="font-size:22px; color:var(--teal)">map</span>
                  {{ 'cruise.itinerary' | transloco }}
                </h2>
                @if (itineraryDays().length > 0) {
                  <ol class="cruise-timeline">
                    @for (day of itineraryDays(); track day.dayNumber) {
                      <li class="cruise-timeline__item">
                        <span class="cruise-timeline__day">{{ 'cruise.day' | transloco }} {{ day.dayNumber }}</span>
                        <div class="cruise-timeline__body">
                          <span class="cruise-timeline__port">
                            <span class="ms" style="font-size:15px; vertical-align:middle">{{ day.port === 'At sea' ? 'sailing' : 'anchor' }}</span>
                            {{ day.port }}
                          </span>
                          <span class="cruise-timeline__desc">{{ day.description }}</span>
                        </div>
                      </li>
                    }
                  </ol>
                } @else {
                  <p style="font-size:14px; color:var(--text-secondary); line-height:1.75; margin:0; white-space:pre-line;">{{ c.itinerary }}</p>
                }
              </section>
            }

            <!-- Cabin categories -->
            @if (cabins().length > 0) {
              <section class="info-card" appReveal>
                <h2 class="card-heading">
                  <span class="ms" style="font-size:22px; color:var(--teal)">king_bed</span>
                  {{ 'cruise.cabinCategories' | transloco }}
                </h2>
                <div class="cabin-grid">
                  @for (cab of cabins(); track cab.name) {
                    <div class="cabin-card">
                      <div class="cabin-card__head">
                        <span class="cabin-card__name">{{ cab.name }}</span>
                        <span class="cabin-card__price">{{ cab.price | currency:'EUR':'symbol':'1.0-0' }}</span>
                      </div>
                      <p class="cabin-card__desc">{{ cab.description }}</p>
                      <span class="cabin-card__avail">{{ cab.cabinsAvailable }} {{ 'cruise.booking.cabins' | transloco }}</span>
                    </div>
                  }
                </div>
              </section>
            }

            <!-- What's included -->
            <section class="info-card" appReveal>
              <h2 class="card-heading">
                <span class="ms" style="font-size:22px; color:var(--teal)">checklist</span>
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

              @if (fareDays().length) {
                <div class="fare-strip">
                  <span class="fare-strip__label">{{ 'cruise.booking.nearbyDates' | transloco }}</span>
                  <app-ui-fare-grid [days]="fareDays()" currency="USD" [(selected)]="fareSelected" />
                </div>
              }

              <div style="height:1px; background:var(--border-light); margin:16px 0;"></div>

              <div class="meta-list">
                <div class="meta-item">
                  <span class="ms" style="font-size:20px; color:var(--text-tertiary)">directions_boat</span>
                  <div>
                    <span class="meta-label">{{ 'cruise.booking.ship' | transloco }}</span>
                    <span class="meta-value">{{ c.shipName }}</span>
                  </div>
                </div>
                <div class="meta-item">
                  <span class="ms" style="font-size:20px; color:var(--text-tertiary)">business</span>
                  <div>
                    <span class="meta-label">{{ 'cruise.booking.operator' | transloco }}</span>
                    <span class="meta-value">{{ c.operator }}</span>
                  </div>
                </div>
                <div class="meta-item">
                  <span class="ms" style="font-size:20px; color:var(--text-tertiary)">bed</span>
                  <div>
                    <span class="meta-label">{{ 'cruise.booking.cabinsAvailable' | transloco }}</span>
                    <span class="meta-value" [style.color]="c.cabinsAvailable < 5 ? 'var(--brand)' : 'var(--text-primary)'">
                      {{ c.cabinsAvailable }} {{ c.cabinsAvailable === 1 ? ('cruise.booking.cabin' | transloco) : ('cruise.booking.cabins' | transloco) }}
                    </span>
                  </div>
                </div>
                @if (c.cruiseType) {
                  <div class="meta-item">
                    <span class="ms" style="font-size:20px; color:var(--text-tertiary)">explore</span>
                    <div>
                      <span class="meta-label">{{ 'cruise.booking.type' | transloco }}</span>
                      <span class="meta-value">{{ c.cruiseType }}</span>
                    </div>
                  </div>
                }
              </div>

              <div style="height:1px; background:var(--border-light); margin:16px 0;"></div>

              <button class="btn-book" (click)="book(c)">
                <span class="ms" style="font-size:20px">confirmation_number</span>
                {{ 'cruise.booking.book' | transloco }}
              </button>
              <button class="btn-watch" [class.btn-watch--on]="watchId()" (click)="toggleWatch(c)">
                <span class="ms" style="font-size:18px">{{ watchId() ? 'notifications_active' : 'notifications' }}</span>
                {{ (watchId() ? 'priceWatch.watching' : 'priceWatch.watch') | transloco }}
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
        <div class="shimmer" style="height:300px; border-radius: 3px; margin-bottom:24px;"></div>
        <div style="display:grid; grid-template-columns:2fr 1fr; gap:24px;">
          <div style="display:flex; flex-direction:column; gap:20px;">
            <div class="shimmer" style="height:180px; border-radius: 3px;"></div>
            <div class="shimmer" style="height:200px; border-radius: 3px;"></div>
            <div class="shimmer" style="height:140px; border-radius: 3px;"></div>
          </div>
          <div class="shimmer" style="height:400px; border-radius: 3px;"></div>
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
      cursor: pointer; padding: 0; transition: color 150ms ease;
    }
    .back-link:hover { color: var(--color-red-ink); }
    .fav-toggle { display: inline-flex; align-items: center; gap: 6px; background: none; border: 1px solid var(--border); border-radius: 2px; padding: 7px 14px; font-family: inherit; font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all 150ms ease; }
    .fav-toggle:hover { border-color: var(--color-red-ink); color: var(--color-red-ink); }
    .fav-toggle--on { border-color: var(--color-red-ink); color: var(--color-red-ink); background: var(--brand-light); }
    .fav-toggle .ms { font-size: 18px; }

    .hero-card {
      position: relative; border-radius: 3px; overflow: hidden;
      margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,.15);
    }

    .hero-card__img {
      width: 100%; height: 300px; object-fit: cover; display: block;
    }

    .hero-card__img-placeholder {
      width: 100%; height: 300px; background: #1c1c1c;
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
      display: inline-block; border-radius: 2px;
      padding: 4px 12px; font-size: 12px; font-weight: 600;
    }
    .badge--teal { background: var(--teal); color: #fff; }
    .badge--blue { background: rgba(255,255,255,.2); color: #fff; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,.3); }
    .badge--ai { display: inline-flex; align-items: center; gap: 4px; background: var(--teal-light); color: var(--teal); }
    .badge--ai .ms { color: var(--teal); }
    .badge--rating { display: inline-flex; align-items: center; gap: 4px; background: var(--gold-light); color: var(--gold); }
    .badge--rating .ms { color: var(--gold); }

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
      border-radius: 2px; padding: 3px 12px; font-size: 12px; font-weight: 600;
      backdrop-filter: blur(4px);
    }

    .detail-grid {
      display: grid; grid-template-columns: 2fr 1fr;
      gap: 24px; align-items: start;
    }

    .info-card {
      background: var(--surface); border-radius: 3px; padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
    }

    .card-heading {
      display: flex; align-items: center; gap: 10px;
      font-size: 18px; font-weight: 700; margin: 0 0 20px; color: var(--text-primary);
    }

    .schedule-grid {
      display: flex; align-items: center; gap: 16px; justify-content: space-between;
    }

    .schedule-item {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
    }

    .schedule-label {
      font-size: 11px; color: var(--text-tertiary); text-transform: uppercase;
      letter-spacing: 0.5px; font-weight: 500;
    }

    .schedule-value {
      font-size: 15px; font-weight: 700; color: var(--text-primary); text-align: center;
    }

    .schedule-port {
      font-size: 12px; color: var(--text-tertiary); text-align: center;
    }

    .schedule-divider {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
    }

    .divider-line { width: 100%; height: 1px; background: var(--border); }

    .divider-badge {
      background: var(--bg-primary); border: 1px solid var(--border);
      border-radius: 2px; padding: 4px 12px;
      font-size: 12px; font-weight: 600; color: var(--text-secondary);
      white-space: nowrap;
    }

    .feature-list { display: flex; flex-direction: column; gap: 12px; }

    .feature-item {
      display: flex; align-items: center; gap: 10px;
      font-size: 14px; font-weight: 500;
    }
    .feature-item--yes { color: var(--text-primary); }
    .feature-item--yes .ms { color: var(--teal); }
    .feature-item--no { color: var(--text-tertiary); }
    .feature-item--no .ms { color: var(--border); }

    .booking-card {
      background: var(--surface); border-radius: 3px; padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.08); border: 1px solid var(--border);
    }

    .price-block { display: flex; flex-direction: column; gap: 4px; }

    .price-label {
      font-size: 12px; color: var(--text-tertiary); text-transform: uppercase;
      letter-spacing: 0.5px; font-weight: 500;
    }

    .price-value { font-size: 2.2rem; font-weight: 800; color: var(--text-primary); }

    .price-note { font-size: 13px; color: var(--text-tertiary); }

    .fare-strip { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
    .fare-strip__label {
      font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em;
      text-transform: uppercase; color: var(--text-secondary);
    }

    .meta-list { display: flex; flex-direction: column; gap: 14px; }
    .meta-item { display: flex; align-items: center; gap: 12px; }
    .meta-label {
      display: block; font-size: 11px; color: var(--text-tertiary);
      text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;
    }
    .meta-value { display: block; font-size: 15px; font-weight: 600; color: var(--text-primary); }

    .btn-book {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
      background: var(--brand); color: #fff; border: none; border-radius: 2px;
      padding: 14px; font-family: inherit; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: background 150ms ease; margin-bottom: 10px;
    }
    .btn-book:hover { background: var(--brand-hover); }
    .btn-watch { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 10px; background: var(--surface); color: var(--text-secondary); border: 1px solid var(--border); border-radius: 2px; padding: 12px; font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 150ms ease; }
    .btn-watch:hover { border-color: var(--color-red-ink); color: var(--color-red-ink); }
    .btn-watch--on { border-color: var(--color-red-ink); color: var(--color-red-ink); background: var(--brand-light); }

    .btn-chat {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
      background: var(--surface); color: var(--color-red-ink); border: 1.5px solid var(--brand); border-radius: 2px;
      padding: 13px; font-family: inherit; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: background 150ms ease;
    }
    .btn-chat:hover { background: var(--brand-light); }

    .urgency-note {
      display: flex; align-items: center; gap: 5px;
      margin: 12px 0 0; font-size: 13px; font-weight: 600; color: var(--color-red-ink);
      text-align: center; justify-content: center;
    }

    @keyframes shimmer {
      0% { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    .shimmer {
      background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
      background-size: 800px 100%; animation: shimmer 1.8s ease-in-out infinite;
    }

    @media (max-width: 768px) {
      .detail-grid { grid-template-columns: 1fr; }
      .schedule-grid { flex-direction: column; gap: 12px; }
      .schedule-divider { flex-direction: row; width: 100%; }
      .divider-line { height: auto; width: 1px; flex: 1; background: var(--border); }
    }

    /* Day-by-day itinerary timeline */
    .cruise-timeline { list-style: none; margin: 0; padding: 0; }
    .cruise-timeline__item {
      display: flex; gap: 14px; padding: 0 0 18px 4px; position: relative;
    }
    .cruise-timeline__item:not(:last-child)::before {
      content: ''; position: absolute; left: 47px; top: 26px; bottom: 0;
      width: 2px; background: var(--border);
    }
    .cruise-timeline__day {
      flex-shrink: 0; width: 78px; text-align: center;
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
      color: var(--teal); background: var(--teal-light); border-radius: 2px; padding: 6px 0; height: fit-content;
    }
    .cruise-timeline__body { display: flex; flex-direction: column; gap: 2px; padding-top: 2px; }
    .cruise-timeline__port { font-size: 15px; font-weight: 700; color: var(--text-primary); }
    .cruise-timeline__port .ms { color: var(--teal); }
    .cruise-timeline__desc { font-size: 13px; color: var(--text-tertiary); line-height: 1.5; }

    /* Cabin categories */
    .cabin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
    .cabin-card { border: 1px solid var(--border); border-radius: 3px; padding: 14px; }
    .cabin-card__head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .cabin-card__name { font-size: 15px; font-weight: 700; }
    .cabin-card__price { font-size: 15px; font-weight: 800; color: var(--color-red-ink); }
    .cabin-card__desc { font-size: 13px; color: var(--text-tertiary); margin: 6px 0 10px; line-height: 1.5; }
    .cabin-card__avail { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
  `],
})
export class CruiseDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly bookingDraft = inject(BookingDraftService);
  private readonly tripContext = inject(TripContextService);
  private readonly reviewService = inject(ReviewService);
  private readonly favorites = inject(FavoritesService);
  private readonly priceWatch = inject(PriceWatchService);

  readonly watchId = signal<string | null>(null);
  readonly cruise = signal<CruiseSearchResult | null>(null);

  /** Illustrative fare strip of weekly departures around this sailing. */
  private readonly fareMultipliers = [1.12, 0.88, 1.0, 1.22, 1.4];
  readonly fareSelected = signal(2);
  readonly fareDays = computed<FareDay[]>(() => {
    const c = this.cruise();
    if (!c) return [];
    const base = new Date(c.departureDate);
    return this.fareMultipliers.map((m, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + (i - 2) * 7);
      return { date: d.toISOString().slice(0, 10), price: Math.round(c.pricePerPerson * m) };
    });
  });

  toggleWatch(c: CruiseSearchResult): void {
    const existing = this.watchId();
    if (existing) {
      this.priceWatch.remove(existing).pipe(catchError(() => of(undefined)))
        .subscribe(() => this.watchId.set(null));
    } else {
      this.priceWatch.create({ cruiseId: c.id }).pipe(catchError(() => of(null)))
        .subscribe(w => { if (w) { this.watchId.set(w.id); } });
    }
  }
  readonly cabins = signal<CruiseCabin[]>([]);
  readonly itineraryDays = signal<CruiseDay[]>([]);
  readonly summary = signal<ReviewSummary | null>(null);
  readonly tripFit = computed(() => {
    const c = this.cruise();
    return c ? (this.tripContext.match(c.arrivalPort) ?? this.tripContext.match(c.departurePort)) : null;
  });
  readonly isFav = computed(() => {
    const c = this.cruise();
    return c ? this.favorites.has('cruise', c.id) : false;
  });

  toggleFav(c: CruiseSearchResult): void {
    this.favorites.toggle({
      type: 'cruise',
      id: c.id,
      title: c.name,
      subtitle: `${c.operator} · ${c.shipName}`,
      imageUrl: c.imageUrl,
      route: `/cruises/${c.id}`,
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/']); return; }

    this.tripContext.ensureLoaded();
    this.catalogService.getCruise(id).subscribe({
      next: (c) => this.cruise.set(c),
      error: () => this.router.navigate(['/']),
    });
    this.catalogService.cruiseCabins(id).pipe(catchError(() => of([] as CruiseCabin[])))
      .subscribe(cabins => this.cabins.set(cabins));
    this.catalogService.cruiseItinerary(id).pipe(catchError(() => of([] as CruiseDay[])))
      .subscribe(days => this.itineraryDays.set(days));
    this.reviewService.getSummary('CRUISE', id).pipe(catchError(() => of(null)))
      .subscribe(s => this.summary.set(s));
    this.priceWatch.list().pipe(catchError(() => of([])))
      .subscribe(ws => this.watchId.set(ws.find(w => w.cruiseId === id)?.id ?? null));
  }

  goBack(): void { this.router.navigate(['/']); }
  goToPlanner(): void { this.router.navigate(['/planner']); }
  goToChat(): void {
    const c = this.cruise();
    const q = c ? `Tell me about the cruise ${c.name}${c.durationNights ? '. It lasts ' + c.durationNights + ' nights' : ''}${c.departurePort ? ', departing from ' + c.departurePort + '.' : '.'}` : undefined;
    this.router.navigate(['/chat'], q ? { queryParams: { q } } : {});
  }

  /** Seeds the booking funnel with the cruise's real cabin tiers and opens it. */
  book(c: CruiseSearchResult): void {
    const cabins = this.cabins();
    const options = cabins.length > 0
      ? cabins.map(cab => ({ id: cab.name.toLowerCase().replace(/\s+/g, '-'), label: cab.name, note: cab.description, multiplier: cab.priceMultiplier }))
      : [
          { id: 'interior', label: 'Interior', note: 'Cosy cabin, no window', multiplier: 1 },
          { id: 'ocean', label: 'Ocean View', note: 'Window with sea view', multiplier: 1.25 },
          { id: 'balcony', label: 'Balcony', note: 'Private balcony', multiplier: 1.55 },
          { id: 'suite', label: 'Suite', note: 'Suite + premium perks', multiplier: 2.2 },
        ];
    this.bookingDraft.start({
      vertical: 'cruise',
      itemId: c.id,
      title: c.name,
      subtitle: `${c.operator} · ${c.shipName}`,
      imageUrl: c.imageUrl,
      destination: c.arrivalPort,
      unitPrice: c.pricePerPerson,
      currency: 'EUR',
      checkIn: c.departureDate,
      checkOut: c.returnDate,
      options,
    });
    this.router.navigate(['/book']);
  }
}
