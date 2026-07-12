import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { ReviewService } from '../../core/services/review.service';
import { TripContextService } from '../../core/services/trip-context.service';
import { FavoritesService } from '../../core/services/favorites.service';
import type { RestaurantSearchResult, RestaurantSlot, ReviewSummary } from '../../core/models/api.models';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { UiInputComponent } from '../../shared/ui/ui-input.component';
import { UiDatepickerComponent } from '../../shared/ui/ui-datepicker.component';
import { UiSkeletonComponent } from '../../shared/ui/ui-skeleton.component';
import { BookingDraftService } from '../booking-flow/booking-draft.service';

const PRICE_TIER_LABELS: Record<number, string> = {
  1: '$ Budget-friendly',
  2: '$$ Moderate',
  3: '$$$ Upscale',
  4: '$$$$ Fine Dining',
};

/** Indicative per-cover spend (EUR) by price tier, used to estimate the bill. */
const TIER_ESTIMATE: Record<number, number> = { 1: 20, 2: 40, 3: 70, 4: 110 };

const RESERVATION_SLOTS = ['12:00', '12:30', '13:00', '13:30', '19:00', '19:30', '20:00', '20:30', '21:00'];

/** Local calendar date as YYYY-MM-DD (avoids the UTC off-by-one of toISOString). */
function localToday(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, RevealDirective, UiInputComponent, UiDatepickerComponent, UiSkeletonComponent],
  template: `
    @if (loading()) {
      <nav style="padding: 16px 32px; max-width: 1100px; margin: 0 auto; display:flex; align-items:center; justify-content:space-between;">
        <app-ui-skeleton width="90px" height="18px" />
        <app-ui-skeleton width="120px" height="34px" radius="2px" />
      </nav>

      <div style="max-width: 1100px; margin: 0 auto; padding: 0 32px 80px;">
        <!-- HERO CARD skeleton -->
        <div class="hero-card">
          <app-ui-skeleton width="100%" height="440px" radius="0" />
          <div class="hero-card__content">
            <div class="hero-card__badges">
              <app-ui-skeleton width="90px" height="26px" radius="2px" />
              <app-ui-skeleton width="110px" height="26px" radius="2px" />
            </div>
            <app-ui-skeleton width="60%" height="48px" radius="4px" />
            <app-ui-skeleton width="30%" height="18px" radius="2px" />
            <div class="hero-card__features">
              <app-ui-skeleton width="110px" height="30px" radius="2px" />
              <app-ui-skeleton width="100px" height="30px" radius="2px" />
              <app-ui-skeleton width="95px" height="30px" radius="2px" />
            </div>
          </div>
        </div>

        <div class="detail-grid">
          <div style="display:flex; flex-direction:column; gap:20px;">
            <section class="info-card">
              <app-ui-skeleton width="140px" height="22px" radius="2px" />
              <div style="height:16px"></div>
              <app-ui-skeleton width="100%" height="14px" />
              <div style="height:8px"></div>
              <app-ui-skeleton width="95%" height="14px" />
              <div style="height:8px"></div>
              <app-ui-skeleton width="80%" height="14px" />
            </section>
            <section class="info-card">
              <app-ui-skeleton width="160px" height="22px" radius="2px" />
              <div style="height:16px"></div>
              <app-ui-skeleton width="60%" height="16px" />
              <div style="height:10px"></div>
              <app-ui-skeleton width="55%" height="16px" />
              <div style="height:10px"></div>
              <app-ui-skeleton width="65%" height="16px" />
            </section>
          </div>
          <aside style="position:sticky; top:80px;">
            <div class="booking-card">
              <app-ui-skeleton width="140px" height="20px" radius="2px" />
              <div style="height:20px"></div>
              <app-ui-skeleton width="100%" height="18px" />
              <div style="height:14px"></div>
              <app-ui-skeleton width="90%" height="18px" />
              <div style="height:14px"></div>
              <app-ui-skeleton width="85%" height="18px" />
              <div style="height:24px"></div>
              <app-ui-skeleton width="100%" height="46px" radius="2px" />
            </div>
          </aside>
        </div>
      </div>
    } @else {
      @if (restaurant(); as r) {
      <nav style="padding: 16px 32px; max-width: 1100px; margin: 0 auto; display:flex; align-items:center; justify-content:space-between;">
        <button (click)="goBack()" class="back-link">
          <span class="ms" style="font-size:18px">arrow_back</span>
          {{ 'restaurant.back' | transloco }}
        </button>
        <button class="fav-toggle" [class.fav-toggle--on]="isFav()" (click)="toggleFav(r)"
                [attr.aria-label]="'favorites.save' | transloco">
          <span class="ms">{{ isFav() ? 'favorite' : 'favorite_border' }}</span>
          {{ (isFav() ? 'favorites.saved' : 'favorites.save') | transloco }}
        </button>
      </nav>

      <div style="max-width: 1100px; margin: 0 auto; padding: 0 32px 80px;">

        <!-- HERO CARD -->
        <div class="hero-card">
          @if (r.imageUrl) {
            <img
              [src]="r.imageUrl"
              [alt]="r.name"
              class="hero-card__img"
              width="1200"
              height="440"
              loading="eager"
              fetchpriority="high"
            />
          } @else {
            <div class="hero-card__img-placeholder">
              <span class="ms" style="font-size:72px; color:rgba(255,255,255,.6)">restaurant</span>
            </div>
          }
          <div class="hero-card__scrim"></div>

          <div class="hero-card__content">
            <div class="hero-card__badges">
              @if (r.cuisineType) {
                <span class="badge badge--teal">{{ r.cuisineType }}</span>
              }
              @if (r.priceTier) {
                <span class="badge badge--gray">{{ getPriceTierLabel(r.priceTier) }}</span>
              }
              @if (summary(); as s) {
                @if (s.totalReviews > 0) {
                  <span class="badge badge--rating">
                    <span class="ms" style="font-size:15px; vertical-align:middle">star</span>
                    {{ s.averageRating | number:'1.1-1' }} · {{ s.totalReviews }} {{ 'restaurant.reviewsLabel' | transloco }}
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
            <h1 class="hero-card__name display">{{ r.name }}</h1>
            <p class="hero-card__city">
              <span class="ms" style="font-size:18px; vertical-align:middle">location_on</span>
              {{ r.city }}
            </p>
            <div class="hero-card__features">
              @if (r.petFriendly) {
                <span class="feature-chip">
                  <span class="ms" style="font-size:16px">pets</span> Pet friendly
                </span>
              }
              @if (r.accessible) {
                <span class="feature-chip">
                  <span class="ms" style="font-size:16px">accessible</span> Accessible
                </span>
              }
              @if (r.available) {
                <span class="feature-chip feature-chip--green">
                  <span class="ms" style="font-size:16px">check_circle</span> Available
                </span>
              }
            </div>
          </div>
        </div>

        <div class="detail-grid">
          <!-- LEFT -->
          <div style="display:flex; flex-direction:column; gap:20px;">

            <!-- About -->
            @if (r.description) {
              <section class="info-card" appReveal>
                <h2 class="card-heading">
                  <span class="ms" style="font-size:22px; color:var(--teal)">info</span>
                  {{ 'restaurant.about' | transloco }}
                </h2>
                <p style="font-size:15px; color:var(--text-secondary); line-height:1.75; margin:0;">{{ r.description }}</p>
              </section>
            }

            <!-- What's included -->
            <section class="info-card" appReveal>
              <h2 class="card-heading">
                <span class="ms" style="font-size:22px; color:var(--teal)">checklist</span>
                {{ 'restaurant.amenities' | transloco }}
              </h2>
              <div class="feature-list">
                <div class="feature-item" [class.feature-item--yes]="r.petFriendly" [class.feature-item--no]="!r.petFriendly">
                  <span class="ms" style="font-size:20px">{{ r.petFriendly ? 'check_circle' : 'cancel' }}</span>
                  {{ 'restaurant.petFriendly' | transloco }}
                </div>
                <div class="feature-item" [class.feature-item--yes]="r.accessible" [class.feature-item--no]="!r.accessible">
                  <span class="ms" style="font-size:20px">{{ r.accessible ? 'check_circle' : 'cancel' }}</span>
                  {{ 'restaurant.accessible' | transloco }}
                </div>
                <div class="feature-item" [class.feature-item--yes]="r.available" [class.feature-item--no]="!r.available">
                  <span class="ms" style="font-size:20px">{{ r.available ? 'check_circle' : 'cancel' }}</span>
                  {{ 'restaurant.reservations' | transloco }}
                </div>
              </div>
            </section>

          </div>

          <!-- RIGHT: Booking Sidebar -->
          <aside style="position:sticky; top:80px;">
            <div class="booking-card">
              <h3 style="font-size:18px; font-weight:700; margin:0 0 16px; color:var(--text-primary);">{{ 'restaurant.quickInfo' | transloco }}</h3>

              <div class="meta-list">
                <div class="meta-item">
                  <span class="ms" style="font-size:20px; color:var(--text-tertiary)">location_on</span>
                  <div>
                    <span class="meta-label">{{ 'restaurant.city' | transloco }}</span>
                    <span class="meta-value">{{ r.city }}</span>
                  </div>
                </div>

                @if (r.cuisineType) {
                  <div class="meta-item">
                    <span class="ms" style="font-size:20px; color:var(--text-tertiary)">restaurant_menu</span>
                    <div>
                      <span class="meta-label">{{ 'restaurant.cuisine' | transloco }}</span>
                      <span class="meta-value">{{ r.cuisineType }}</span>
                    </div>
                  </div>
                }

                @if (r.priceTier) {
                  <div class="meta-item">
                    <span class="ms" style="font-size:20px; color:var(--text-tertiary)">payments</span>
                    <div>
                      <span class="meta-label">{{ 'restaurant.priceRange' | transloco }}</span>
                      <span class="meta-value">{{ getPriceTierLabel(r.priceTier) }}</span>
                    </div>
                  </div>
                }

                <div class="meta-item">
                  <span class="ms" style="font-size:20px; color:var(--text-tertiary)">event_available</span>
                  <div>
                    <span class="meta-label">{{ 'restaurant.availability' | transloco }}</span>
                    <span class="meta-value" [style.color]="r.available ? 'var(--teal)' : 'var(--brand)'">
                      {{ r.available ? ('restaurant.availableNow' | transloco) : ('restaurant.notAvailable' | transloco) }}
                    </span>
                  </div>
                </div>
              </div>

              <div style="height:1px; background:var(--border-light); margin:20px 0;"></div>

              <!-- Real reservation availability (OpenTable-style slot grid) -->
              <div class="reserve">
                <div class="reserve__controls">
                  <label class="reserve__field">
                    <span>{{ 'restaurant.pickDate' | transloco }}</span>
                    <app-ui-datepicker [ngModel]="reserveDate()" [min]="today"
                                       (ngModelChange)="onDateChange($event)"
                                       [ariaLabel]="'restaurant.pickDate' | transloco" />
                  </label>
                  <label class="reserve__field">
                    <span>{{ 'restaurant.guests' | transloco }}</span>
                    <app-ui-input type="number" [min]="1" [max]="12" [ngModel]="covers()"
                                  (ngModelChange)="onCoversChange($event)"
                                  [ariaLabel]="'restaurant.guests' | transloco" />
                  </label>
                </div>

                <span class="reserve__label">{{ 'restaurant.availableTables' | transloco }}</span>
                @if (loadingSlots()) {
                  <div class="reserve__chips">
                    @for (s of [1,2,3,4,5,6]; track s) { <span class="reserve__skel"></span> }
                  </div>
                } @else if (slots().length === 0) {
                  <p class="reserve__empty"><span class="ms" style="font-size:16px">event_busy</span>{{ 'restaurant.noTables' | transloco }}</p>
                } @else {
                  <div class="reserve__chips">
                    @for (slot of slots(); track slot.timeSlot) {
                      <button type="button" class="reserve__chip"
                              [class.reserve__chip--on]="selectedSlot() === slot.timeSlot"
                              (click)="selectedSlot.set(slot.timeSlot)">{{ slot.timeSlot.slice(0, 5) }}</button>
                    }
                  </div>
                }
              </div>

              <button class="btn-book" (click)="book(r)" [disabled]="!selectedSlot()">
                <span class="ms" style="font-size:20px">confirmation_number</span>
                {{ 'restaurant.book' | transloco }}
              </button>
              <button class="btn-chat" (click)="goToChat()">
                <span class="ms" style="font-size:20px">chat</span>
                {{ 'restaurant.askAi' | transloco }}
              </button>
            </div>
          </aside>
        </div>
      </div>
      } @else {
      <div style="max-width:1100px; margin:0 auto; padding:80px 32px; text-align:center;">
        <span class="ms" style="font-size:56px; color:var(--text-tertiary)">restaurant</span>
        <p style="font-size:16px; color:var(--text-secondary); margin:16px 0 24px;">{{ 'common.error' | transloco }}</p>
        <button (click)="goBack()" class="back-link" style="justify-content:center;">
          <span class="ms" style="font-size:18px">arrow_back</span>
          {{ 'restaurant.back' | transloco }}
        </button>
      </div>
      }
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
      position: relative; border-radius: var(--radius-xl); overflow: hidden;
      margin-bottom: 24px; box-shadow: var(--shadow-lg); min-height: 440px; display: block;
    }

    .hero-card__img, .hero-card__img-placeholder {
      position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
    }

    .hero-card__img-placeholder {
      background: var(--color-deep-ocean);
      display: flex; align-items: center; justify-content: center;
    }
    .hero-card__scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15,23,42,0) 32%, rgba(15,23,42,.55) 68%, rgba(15,23,42,.88) 100%); }

    .hero-card__content {
      position: absolute; left: 0; right: 0; bottom: 0; z-index: 2;
      padding: clamp(24px, 3vw, 40px); display: flex; flex-direction: column; gap: 12px;
    }

    .hero-card__badges {
      display: flex; gap: 8px; flex-wrap: wrap;
    }

    .badge {
      display: inline-flex; align-items: center; gap: 4px; border-radius: 2px;
      padding: 5px 13px; font-size: 12.5px; font-weight: 700;
    }
    .badge--teal { background: rgba(255,255,255,.94); color: var(--teal); }
    .badge--gray { background: rgba(255,255,255,.16); color: #fff; border: 1px solid rgba(255,255,255,.28); backdrop-filter: blur(8px); }
    .badge--rating { background: rgba(255,255,255,.94); color: #B26A00; }
    .badge--rating .ms { color: var(--color-rating); }
    .badge--ai { background: rgba(229,53,43,.92); color: #fff; }
    .badge--ai .ms { color: #fff; }

    .hero-card__name {
      font-size: clamp(2rem, 1.4rem + 2.4vw, 3rem);
      font-weight: 800; margin: 0; line-height: 1.05; color: #fff;
      text-shadow: 0 2px 20px rgba(0,0,0,.3);
    }

    .hero-card__city {
      font-size: 15px; color: rgba(255,255,255,.9); margin: 0; font-weight: 500;
      display: flex; align-items: center; gap: 5px;
    }

    .hero-card__features {
      display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px;
    }

    .feature-chip {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.28); border-radius: 2px;
      padding: 6px 13px; font-size: 12.5px; font-weight: 600; color: #fff; backdrop-filter: blur(8px);
    }

    .feature-chip--green { background: rgba(16,185,129,.9); border-color: transparent; color: #fff; }

    .detail-grid {
      display: grid; grid-template-columns: 2fr 1fr;
      gap: 24px; align-items: start;
    }

    .info-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 26px;
      box-shadow: var(--shadow-sm);
    }

    .card-heading {
      display: flex; align-items: center; gap: 10px;
      font-size: 18px; font-weight: 700; margin: 0 0 20px; color: var(--text-primary);
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
      background: var(--surface); border-radius: var(--radius-lg); padding: 26px;
      box-shadow: var(--shadow-md); border: 1px solid var(--border);
    }

    .meta-list { display: flex; flex-direction: column; gap: 14px; }

    .meta-item { display: flex; align-items: center; gap: 12px; }

    .meta-label {
      display: block; font-size: 11px; color: var(--text-tertiary);
      text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;
    }
    .meta-value { display: block; font-size: 15px; font-weight: 600; color: var(--text-primary); }

    .reserve { margin-bottom: 18px; }
    .reserve__controls { display: flex; gap: 10px; margin-bottom: 16px; }
    .reserve__field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .reserve__field span {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.4px; color: var(--text-tertiary);
    }
    .reserve__field input {
      border: 1px solid var(--border); border-radius: 8px; padding: 9px 10px;
      font-family: inherit; font-size: 14px; color: var(--text-primary);
    }
    .reserve__field input:focus { outline: none; border-color: var(--color-red-ink); }
    .reserve__label {
      display: block; font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.4px; color: var(--text-tertiary); margin-bottom: 8px;
    }
    .reserve__chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .reserve__chip {
      border: 1px solid var(--border); background: var(--surface); border-radius: 8px;
      padding: 8px 13px; font-family: inherit; font-size: 14px; font-weight: 600;
      color: var(--text-primary); cursor: pointer; transition: all 150ms ease;
    }
    .reserve__chip:hover { border-color: var(--color-red-ink); }
    .reserve__chip--on { background: var(--brand); border-color: var(--color-red-ink); color: #fff; }
    .reserve__skel {
      width: 56px; height: 35px; border-radius: 8px;
      background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
      background-size: 600px 100%; animation: shimmer 1.6s ease-in-out infinite;
    }
    .reserve__empty {
      display: flex; align-items: center; gap: 6px; margin: 0;
      font-size: 13px; color: var(--text-tertiary);
    }

    .btn-book {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
      background: var(--brand); color: #fff; border: none; border-radius: 2px;
      padding: 14px; font-family: inherit; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: background 150ms ease; margin-bottom: 10px;
    }
    .btn-book:hover:not(:disabled) { background: var(--brand-hover); }
    .btn-book:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-chat {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
      background: var(--surface); color: var(--color-red-ink); border: 1.5px solid var(--brand); border-radius: 2px;
      padding: 13px; font-family: inherit; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: background 150ms ease;
    }
    .btn-chat:hover { background: var(--brand-light); }

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
      .hero-card { min-height: 340px; }
    }
  `],
})
export class RestaurantDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly reviewService = inject(ReviewService);
  private readonly tripContext = inject(TripContextService);
  private readonly favorites = inject(FavoritesService);
  private readonly bookingDraft = inject(BookingDraftService);

  readonly restaurant = signal<RestaurantSearchResult | null>(null);
  readonly loading = signal(true);
  readonly summary = signal<ReviewSummary | null>(null);
  readonly tripFit = computed(() => this.tripContext.match(this.restaurant()?.city ?? null));
  readonly isFav = computed(() => {
    const r = this.restaurant();
    return r ? this.favorites.has('restaurant', r.id) : false;
  });

  toggleFav(r: RestaurantSearchResult): void {
    this.favorites.toggle({
      type: 'restaurant',
      id: r.id,
      title: r.name,
      subtitle: `${r.city} · ${r.cuisineType}`,
      imageUrl: r.imageUrl,
      route: `/restaurants/${r.id}`,
    });
  }

  readonly today = localToday();
  readonly reserveDate = signal(this.today);
  readonly covers = signal(2);
  readonly slots = signal<RestaurantSlot[]>([]);
  readonly loadingSlots = signal(true);
  readonly selectedSlot = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/']); return; }

    this.catalogService.getRestaurant(id).subscribe({
      next: (r) => { this.restaurant.set(r); this.loading.set(false); this.loadSlots(); },
      error: () => { this.loading.set(false); this.router.navigate(['/']); },
    });

    this.reviewService.getSummary('RESTAURANT', id)
      .pipe(catchError(() => of(null)))
      .subscribe(s => this.summary.set(s));

    this.tripContext.ensureLoaded();
  }

  getPriceTierLabel(tier: number): string {
    return PRICE_TIER_LABELS[tier] ?? '$$';
  }

  onDateChange(date: string): void {
    this.reserveDate.set(date || this.today);
    this.loadSlots();
  }

  onCoversChange(value: number): void {
    this.covers.set(Math.max(1, Math.min(12, Math.trunc(value) || 1)));
    this.loadSlots();
  }

  /** Fetches real bookable slots for the chosen date and party size. */
  private loadSlots(): void {
    const r = this.restaurant();
    if (!r) { return; }
    this.loadingSlots.set(true);
    this.selectedSlot.set(null);
    this.catalogService
      .restaurantAvailability(r.id, this.reserveDate(), this.covers())
      .pipe(catchError(() => of([] as RestaurantSlot[])))
      .subscribe(slots => {
        this.slots.set(slots);
        this.selectedSlot.set(slots[0]?.timeSlot ?? null);
        this.loadingSlots.set(false);
      });
  }

  goBack(): void { this.router.navigate(['/']); }
  goToPlanner(): void { this.router.navigate(['/planner']); }
  goToChat(): void {
    const r = this.restaurant();
    const q = r ? `Tell me about ${r.name}${r.city ? ' in ' + r.city : ''}${r.cuisineType ? '. It is a ' + r.cuisineType + ' restaurant.' : ''}` : undefined;
    this.router.navigate(['/chat'], q ? { queryParams: { q } } : {});
  }

  /** Seeds the booking funnel with the real chosen date/slot and opens it. */
  book(r: RestaurantSearchResult): void {
    const chosen = this.selectedSlot();
    if (!chosen) { return; }
    const available = this.slots().map(s => s.timeSlot.slice(0, 5));
    this.bookingDraft.start({
      vertical: 'restaurant',
      itemId: r.id,
      title: r.name,
      subtitle: `${r.city} · ${r.cuisineType}`,
      imageUrl: r.imageUrl,
      destination: r.city,
      unitPrice: TIER_ESTIMATE[r.priceTier] ?? 40,
      currency: 'EUR',
      checkIn: this.reserveDate(),
      options: [],
      timeSlots: available.length ? available : RESERVATION_SLOTS,
      rating: this.summary()?.totalReviews ? this.summary()?.averageRating : undefined,
      reviewCount: this.summary()?.totalReviews || undefined,
    }, this.covers());
    this.bookingDraft.selectedTimeSlot.set(chosen.slice(0, 5));
    this.router.navigate(['/book']);
  }
}
