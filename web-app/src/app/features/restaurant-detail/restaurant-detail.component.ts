import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { CatalogService } from '../../core/services/catalog.service';
import type { RestaurantSearchResult } from '../../core/models/api.models';

const PRICE_TIER_LABELS: Record<number, string> = {
  1: '$ Budget-friendly',
  2: '$$ Moderate',
  3: '$$$ Upscale',
  4: '$$$$ Fine Dining',
};

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  template: `
    @if (restaurant(); as r) {
      <nav style="padding: 16px 32px; max-width: 1100px; margin: 0 auto;">
        <button (click)="goBack()" class="back-link">
          <span class="ms" style="font-size:18px">arrow_back</span>
          {{ 'restaurant.back' | transloco }}
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
              width="400"
              height="260"
              loading="eager"
              fetchpriority="high"
            />
          } @else {
            <div class="hero-card__img-placeholder">
              <span class="ms" style="font-size:64px; color:#e0e0e0">restaurant</span>
            </div>
          }

          <div class="hero-card__content">
            <div class="hero-card__badges">
              @if (r.cuisineType) {
                <span class="badge badge--teal">{{ r.cuisineType }}</span>
              }
              @if (r.priceTier) {
                <span class="badge badge--gray">{{ getPriceTierLabel(r.priceTier) }}</span>
              }
            </div>
            <h1 class="hero-card__name">{{ r.name }}</h1>
            <p class="hero-card__city">
              <span class="ms" style="font-size:16px; color:#8a8a8a; vertical-align:middle">location_on</span>
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
              <section class="info-card">
                <h2 class="card-heading">
                  <span class="ms" style="font-size:22px; color:#00856A">info</span>
                  {{ 'restaurant.about' | transloco }}
                </h2>
                <p style="font-size:15px; color:#545454; line-height:1.75; margin:0;">{{ r.description }}</p>
              </section>
            }

            <!-- What's included -->
            <section class="info-card">
              <h2 class="card-heading">
                <span class="ms" style="font-size:22px; color:#00856A">checklist</span>
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
              <h3 style="font-size:18px; font-weight:700; margin:0 0 16px; color:#1a1a1a;">{{ 'restaurant.quickInfo' | transloco }}</h3>

              <div class="meta-list">
                <div class="meta-item">
                  <span class="ms" style="font-size:20px; color:#8a8a8a">location_on</span>
                  <div>
                    <span class="meta-label">{{ 'restaurant.city' | transloco }}</span>
                    <span class="meta-value">{{ r.city }}</span>
                  </div>
                </div>

                @if (r.cuisineType) {
                  <div class="meta-item">
                    <span class="ms" style="font-size:20px; color:#8a8a8a">restaurant_menu</span>
                    <div>
                      <span class="meta-label">{{ 'restaurant.cuisine' | transloco }}</span>
                      <span class="meta-value">{{ r.cuisineType }}</span>
                    </div>
                  </div>
                }

                @if (r.priceTier) {
                  <div class="meta-item">
                    <span class="ms" style="font-size:20px; color:#8a8a8a">payments</span>
                    <div>
                      <span class="meta-label">{{ 'restaurant.priceRange' | transloco }}</span>
                      <span class="meta-value">{{ getPriceTierLabel(r.priceTier) }}</span>
                    </div>
                  </div>
                }

                <div class="meta-item">
                  <span class="ms" style="font-size:20px; color:#8a8a8a">event_available</span>
                  <div>
                    <span class="meta-label">{{ 'restaurant.availability' | transloco }}</span>
                    <span class="meta-value" [style.color]="r.available ? '#00856A' : '#E04A2F'">
                      {{ r.available ? ('restaurant.availableNow' | transloco) : ('restaurant.notAvailable' | transloco) }}
                    </span>
                  </div>
                </div>
              </div>

              <div style="height:1px; background:#efefef; margin:20px 0;"></div>

              <button class="btn-book" (click)="goToPlanner()">
                <span class="ms" style="font-size:20px">travel_explore</span>
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
      <div style="max-width:1100px; margin:0 auto; padding:32px;">
        <div class="shimmer" style="height:260px; border-radius:16px; margin-bottom:24px;"></div>
        <div style="display:grid; grid-template-columns:2fr 1fr; gap:24px;">
          <div style="display:flex; flex-direction:column; gap:20px;">
            <div class="shimmer" style="height:180px; border-radius:12px;"></div>
            <div class="shimmer" style="height:140px; border-radius:12px;"></div>
          </div>
          <div class="shimmer" style="height:340px; border-radius:12px;"></div>
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
      background: #fff; border-radius: 16px; overflow: hidden;
      margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,.08);
      display: flex; gap: 0;
    }

    .hero-card__img {
      width: 400px; height: 260px; object-fit: cover; flex-shrink: 0;
    }

    .hero-card__img-placeholder {
      width: 400px; height: 260px; background: #f0f0f0; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }

    .hero-card__content {
      padding: 28px; display: flex; flex-direction: column; gap: 10px; flex: 1;
    }

    .hero-card__badges {
      display: flex; gap: 8px; flex-wrap: wrap;
    }

    .badge {
      display: inline-block; border-radius: 100px;
      padding: 4px 12px; font-size: 12px; font-weight: 600;
    }
    .badge--teal { background: #E6F5F0; color: #00856A; }
    .badge--gray { background: #f7f7f7; color: #545454; border: 1px solid #e0e0e0; }

    .hero-card__name {
      font-size: clamp(1.6rem, 1.2rem + 1.5vw, 2.2rem);
      font-weight: 800; margin: 0; line-height: 1.1;
    }

    .hero-card__city {
      font-size: 14px; color: #8a8a8a; margin: 0; font-weight: 500;
    }

    .hero-card__features {
      display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;
    }

    .feature-chip {
      display: inline-flex; align-items: center; gap: 5px;
      background: #f7f7f7; border: 1px solid #e0e0e0; border-radius: 100px;
      padding: 5px 12px; font-size: 12px; font-weight: 600; color: #545454;
    }

    .feature-chip--green { background: #E6F5F0; border-color: #00856A; color: #00856A; }

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
      .hero-card { flex-direction: column; }
      .hero-card__img, .hero-card__img-placeholder { width: 100%; height: 200px; }
    }
  `],
})
export class RestaurantDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);

  readonly restaurant = signal<RestaurantSearchResult | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/']); return; }

    this.catalogService.getRestaurant(id).subscribe({
      next: (r) => this.restaurant.set(r),
      error: () => this.router.navigate(['/']),
    });
  }

  getPriceTierLabel(tier: number): string {
    return PRICE_TIER_LABELS[tier] ?? '$$';
  }

  goBack(): void { this.router.navigate(['/']); }
  goToPlanner(): void { this.router.navigate(['/planner']); }
  goToChat(): void { this.router.navigate(['/chat']); }
}
