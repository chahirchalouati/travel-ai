import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { CtaSectionComponent } from '../cta-section/cta-section.component';
import { TripStoriesComponent } from '../trip-stories/trip-stories.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { HeroComponent } from '../hero/hero.component';

import { DestinationService } from '../../core/services/destination.service';
import type { ContinentSummary, InterestSummary } from '../../core/services/destination.service';
import { StatsService } from '../../core/services/stats.service';
import type { PlatformStats } from '../../core/services/stats.service';
import type { DestinationResponse } from '../../core/models/api.models';

const QUICK_FILTERS = ['Beach', 'Cultural', 'Adventure', 'Romantic', 'Budget', 'Luxury'] as const;

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, CtaSectionComponent, TripStoriesComponent, RevealDirective, HeroComponent],
  template: `
    <!-- HERO — flagship live-itinerary builder -->
    <app-hero />

    <!-- CONTINENT FILTER — narrows the featured & trending strips in place -->
    @if (continents().length > 0) {
      <nav class="explore-filter" aria-label="Filter by continent">
        <button type="button" class="chip" [class.chip--active]="activeContinent() === 'all'"
                (click)="setContinent('all')">{{ 'explore.filter.all' | transloco }}</button>
        @for (c of continents(); track c.continent) {
          <button type="button" class="chip" [class.chip--active]="activeContinent() === c.continent"
                  (click)="setContinent(c.continent)">{{ c.continent }} · {{ c.destinationCount }}</button>
        }
      </nav>
    }

    <!-- FEATURED DESTINATIONS -->
    @if (filteredFeatured().length > 0) {
      <section class="section" aria-labelledby="featured-heading">
        <div class="section-header" appReveal>
          <div>
            <h2 class="section-title" id="featured-heading">{{ 'explore.sections.featured' | transloco }}</h2>
          </div>
          <button class="see-all-link" (click)="filterByTag('All')">{{ 'explore.sections.seeAll' | transloco }}
            <span class="ms see-all-arrow">arrow_forward</span>
          </button>
        </div>
        <div class="featured-scroll">
          @for (dest of filteredFeatured(); track dest.id) {
            <article class="dest-card" appReveal [appRevealDelay]="$index * 60" (click)="goToDestination(dest.id)">
              <div class="dest-card__img-wrap">
                <img
                  [src]="dest.imageUrl"
                  [alt]="dest.name"
                  class="dest-card__img"
                  width="280"
                  height="200"
                  loading="lazy"
                />
              </div>
              <div class="dest-card__body">
                <h3 class="dest-card__name">{{ dest.name }}</h3>
                <p class="dest-card__country">{{ dest.country }}</p>
                <div class="dest-card__rating">
                  <span class="rating-dots">
                    <span class="rating-dot filled"></span>
                    <span class="rating-dot filled"></span>
                    <span class="rating-dot filled"></span>
                    <span class="rating-dot filled"></span>
                    <span class="rating-dot"></span>
                  </span>
                  <span class="rating-score">{{ (dest.popularityScore / 20) | number:'1.1-1' }}</span>
                  <span class="rating-count">({{ dest.popularityScore * 24 | number:'1.0-0' }} {{ 'explore.card.reviews' | transloco }})</span>
                </div>
                <span class="dest-card__price">{{ 'explore.card.from' | transloco }} {{ dest.avgDailyCost | currency:dest.currency:'symbol':'1.0-0' }}{{ 'explore.card.perNight' | transloco }}</span>
                <div class="dest-card__tags">
                  @for (tag of parseTags(dest.tags); track tag) {
                    <span class="tag-pill">{{ tag }}</span>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      </section>
    }

    <!-- TRENDING DESTINATIONS -->
    @if (filteredTrending().length > 0) {
      <section class="section section--gray" aria-labelledby="trending-heading">
        <div class="section-header" appReveal>
          <div>
            <h2 class="section-title" id="trending-heading">{{ 'explore.sections.trending' | transloco }}</h2>
          </div>
          <button class="see-all-link" (click)="filterByTag('All')">{{ 'explore.sections.seeAll' | transloco }}
            <span class="ms see-all-arrow">arrow_forward</span>
          </button>
        </div>
        <div class="trending-scroll">
          @for (dest of filteredTrending(); track dest.id) {
            <article class="trending-card" appReveal [appRevealDelay]="$index * 60" (click)="goToDestination(dest.id)">
              <div class="trending-card__img-wrap">
                <img
                  [src]="dest.imageUrl"
                  [alt]="dest.name"
                  class="trending-card__img"
                  width="240"
                  height="160"
                  loading="lazy"
                />
              </div>
              <div class="trending-card__body">
                <h4 class="trending-card__name">{{ dest.name }}</h4>
                <p class="trending-card__country">{{ dest.country }}</p>
                <div class="trending-card__meta">
                  <span class="trending-indicator">
                    <span class="ms trending-arrow">trending_up</span>
                    {{ dest.popularityScore }}{{ 'explore.trending.thisMonth' | transloco }}
                  </span>
                  <span class="trending-reviews">{{ dest.popularityScore * 24 | number:'1.0-0' }} {{ 'explore.card.reviews' | transloco }}</span>
                </div>
              </div>
            </article>
          }
        </div>
      </section>
    }

    <!-- EXPLORE BY INTEREST -->
    <section class="section" aria-labelledby="interest-heading">
      <div class="section-header" appReveal>
        <div>
          <h2 class="section-title" id="interest-heading">{{ 'explore.sections.interests' | transloco }}</h2>
        </div>
      </div>
      <div class="interest-grid">
        @for (tile of interestTiles(); track tile.key) {
          <article class="interest-tile" appReveal [appRevealDelay]="$index * 70" (click)="filterByTag(tile.tag)">
            <img
              [src]="tile.imageUrl"
              [alt]="'explore.interests.' + tile.key | transloco"
              class="interest-tile__img"
              loading="lazy"
            />
            <div class="interest-tile__overlay"></div>
            <div class="interest-tile__content">
              <span class="ms interest-tile__icon">{{ tile.icon }}</span>
              <h3 class="interest-tile__title">{{ 'explore.interests.' + tile.key | transloco }}</h3>
              <p class="interest-tile__count">{{ tile.destinationCount }} {{ 'explore.destinations' | transloco }}</p>
            </div>
          </article>
        }
      </div>
    </section>

    <!-- TRAVEL STORIES (video showcase) -->
    <app-trip-stories />

    <!-- AI BANNER -->
    <section class="ai-banner" aria-labelledby="ai-heading" appReveal>
      <div class="ai-banner__inner">
        <span class="ms ai-banner__icon">auto_awesome</span>
        <div class="ai-banner__text">
          <strong id="ai-heading">{{ 'explore.aiBanner.label' | transloco }}</strong>
          <span class="ai-banner__sep">&mdash;</span>
          <span>{{ 'explore.aiBanner.description' | transloco }}</span>
        </div>
        <button class="ai-banner__cta" (click)="goToPlanner()">{{ 'explore.aiBanner.cta' | transloco }}</button>
      </div>
    </section>

    <!-- BROWSE BY REGION -->
    <section class="section" aria-labelledby="region-heading">
      <div class="section-header" appReveal>
        <div>
          <h2 class="section-title" id="region-heading">{{ 'explore.sections.regions' | transloco }}</h2>
        </div>
      </div>
      <div class="continent-grid">
        @for (c of continents(); track c.continent) {
          <article class="continent-card" appReveal [appRevealDelay]="$index * 70" (click)="filterByContinent(c.continent)">
            <div class="continent-card__visual">
              <img
                [src]="c.imageUrl"
                [alt]="c.continent"
                class="continent-card__img"
                loading="lazy"
              />
            </div>
            <div class="continent-card__body">
              <h3 class="continent-card__name">{{ c.continent }}</h3>
              <p class="continent-card__count">{{ c.destinationCount }} {{ 'explore.destinations' | transloco }}</p>
            </div>
          </article>
        }
      </div>
    </section>

    <app-cta-section />
  `,
  styles: [`
    /* ── Continent filter ──────────────────────────── */
    .explore-filter {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
      max-width: 1100px;
      margin: 2rem auto 0;
      padding: 0 1.5rem;
    }
    .explore-filter .chip {
      padding: 0.5rem 1.1rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      font: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 200ms ease, color 200ms ease, border-color 200ms ease;
    }
    .explore-filter .chip:hover { border-color: var(--teal); color: var(--text-primary); }
    .explore-filter .chip--active {
      background: var(--teal);
      border-color: var(--teal);
      color: #fff;
    }

    :host {
      --duration: var(--duration-fast);
      --ease: var(--ease-out-expo);
      display: block;
      background: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-body);
    }

    /* ── Section Shared ────────────────────────────── */
    .section {
      padding: clamp(3rem, 2rem + 3vw, 5rem) clamp(1rem, 0.5rem + 3vw, 4rem);
      max-width: 1280px;
      margin: 0 auto;
    }

    .section--gray {
      background: var(--bg-secondary);
      max-width: 100%;
    }

    .section--gray > * {
      max-width: 1280px;
      margin-left: auto;
      margin-right: auto;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      gap: 1rem;
    }

    .section-title {
      font-family: var(--font-body);
      font-size: clamp(1.4rem, 1rem + 1.2vw, 1.8rem);
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      letter-spacing: -0.01em;
    }

    .see-all-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      color: var(--brand);
      font-family: var(--font-body);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 6px;
      transition: background var(--duration) var(--ease);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .see-all-link:hover {
      background: var(--brand-light);
    }

    .see-all-link:focus-visible {
      outline: 2px solid var(--brand);
      outline-offset: 2px;
    }

    .see-all-arrow {
      font-size: 18px;
    }

    /* ── Featured Destination Cards (Horizontal Scroll) ─ */
    .featured-scroll {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 8px;
    }

    .featured-scroll::-webkit-scrollbar {
      height: 6px;
    }

    .featured-scroll::-webkit-scrollbar-track {
      background: var(--bg-tertiary);
      border-radius: 3px;
    }

    .featured-scroll::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 3px;
    }

    .featured-scroll::-webkit-scrollbar-thumb:hover {
      background: var(--text-tertiary);
    }

    .dest-card {
      flex: 0 0 280px;
      scroll-snap-align: start;
      background: var(--bg-primary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      overflow: hidden;
      cursor: pointer;
      transition: transform var(--duration) var(--ease),
                  box-shadow var(--duration) var(--ease);
    }

    .dest-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .dest-card:focus-visible {
      outline: 2px solid var(--brand);
      outline-offset: 2px;
    }

    .dest-card__img-wrap {
      overflow: hidden;
    }

    .dest-card__img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      display: block;
      transition: transform 300ms var(--ease);
    }

    .dest-card:hover .dest-card__img {
      transform: scale(1.04);
    }

    .dest-card__body {
      padding: 14px 16px 16px;
    }

    .dest-card__name {
      font-family: var(--font-body);
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 2px;
      line-height: 1.3;
    }

    .dest-card__country {
      font-size: 0.82rem;
      color: var(--text-secondary);
      margin: 0 0 8px;
    }

    /* ── Rating Display ────────────────────────────── */
    .dest-card__rating {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }

    .rating-dots {
      display: inline-flex;
      gap: 3px;
    }

    .rating-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--border);
    }

    .rating-dot.filled {
      background: var(--teal);
    }

    .rating-score {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .rating-count {
      font-size: 0.78rem;
      color: var(--text-tertiary);
    }

    /* ── Price ──────────────────────────────────────── */
    .dest-card__price {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--teal);
      margin-bottom: 8px;
    }

    /* ── Tag Pills ─────────────────────────────────── */
    .dest-card__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .tag-pill {
      background: var(--bg-tertiary);
      color: var(--text-tertiary);
      font-size: 0.72rem;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 20px;
      text-transform: capitalize;
    }

    /* ── Trending Cards (Horizontal Scroll) ─────── */
    .trending-scroll {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 8px;
    }

    .trending-scroll::-webkit-scrollbar {
      height: 6px;
    }

    .trending-scroll::-webkit-scrollbar-track {
      background: var(--bg-tertiary);
      border-radius: 3px;
    }

    .trending-scroll::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 3px;
    }

    .trending-card {
      flex: 0 0 240px;
      scroll-snap-align: start;
      background: var(--bg-primary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      overflow: hidden;
      cursor: pointer;
      transition: transform var(--duration) var(--ease),
                  box-shadow var(--duration) var(--ease);
    }

    .trending-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .trending-card:focus-visible {
      outline: 2px solid var(--brand);
      outline-offset: 2px;
    }

    .trending-card__img-wrap {
      overflow: hidden;
    }

    .trending-card__img {
      width: 100%;
      height: 160px;
      object-fit: cover;
      display: block;
      transition: transform 300ms var(--ease);
    }

    .trending-card:hover .trending-card__img {
      transform: scale(1.04);
    }

    .trending-card__body {
      padding: 12px 14px 14px;
    }

    .trending-card__name {
      font-family: var(--font-body);
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 2px;
    }

    .trending-card__country {
      font-size: 0.78rem;
      color: var(--text-secondary);
      margin: 0 0 8px;
    }

    .trending-card__meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .trending-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--teal);
    }

    .trending-arrow {
      font-size: 16px;
    }

    .trending-reviews {
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    /* ── Interest Grid (2x2) ───────────────────────── */
    .interest-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .interest-tile {
      position: relative;
      border-radius: var(--radius-md);
      overflow: hidden;
      cursor: pointer;
      aspect-ratio: 16 / 9;
      transition: transform var(--duration) var(--ease),
                  box-shadow var(--duration) var(--ease);
    }

    .interest-tile:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .interest-tile:hover .interest-tile__img {
      transform: scale(1.04);
    }

    .interest-tile:focus-visible {
      outline: 2px solid var(--brand);
      outline-offset: 2px;
    }

    .interest-tile__img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 300ms var(--ease);
    }

    .interest-tile__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to top,
        rgba(0, 0, 0, 0.65) 0%,
        rgba(0, 0, 0, 0.15) 50%,
        rgba(0, 0, 0, 0.05) 100%
      );
    }

    .interest-tile__content {
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 20px 24px;
    }

    .interest-tile__icon {
      font-size: 28px;
      color: #fff;
      margin-bottom: 4px;
      display: block;
      opacity: 0.9;
    }

    .interest-tile__title {
      font-family: var(--font-body);
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
      margin: 0;
      line-height: 1.2;
    }

    .interest-tile__count {
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.8);
      margin: 4px 0 0;
    }

    /* ── AI Banner (compact) ───────────────────────── */
    .ai-banner {
      background: var(--teal-light);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      padding: 14px clamp(1rem, 0.5rem + 3vw, 4rem);
    }

    .ai-banner__inner {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .ai-banner__icon {
      font-size: 22px;
      color: var(--teal);
      flex-shrink: 0;
    }

    .ai-banner__text {
      flex: 1;
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .ai-banner__text strong {
      color: var(--teal);
      font-weight: 700;
    }

    .ai-banner__sep {
      margin: 0 4px;
      color: var(--text-tertiary);
    }

    .ai-banner__cta {
      background: var(--teal);
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 8px 20px;
      font-family: var(--font-body);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background var(--duration) var(--ease);
    }

    .ai-banner__cta:hover {
      background: #0d5640;
    }

    .ai-banner__cta:focus-visible {
      outline: 2px solid var(--teal);
      outline-offset: 2px;
    }

    /* ── Continent Grid (3x2) ──────────────────────── */
    .continent-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .continent-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      overflow: hidden;
      cursor: pointer;
      transition: transform var(--duration) var(--ease),
                  box-shadow var(--duration) var(--ease);
    }

    .continent-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .continent-card:focus-visible {
      outline: 2px solid var(--brand);
      outline-offset: 2px;
    }

    .continent-card__visual {
      overflow: hidden;
    }

    .continent-card__img {
      width: 100%;
      height: 140px;
      object-fit: cover;
      display: block;
      transition: transform 300ms var(--ease);
    }

    .continent-card:hover .continent-card__img {
      transform: scale(1.04);
    }

    .continent-card__body {
      padding: 14px 16px;
    }

    .continent-card__name {
      font-family: var(--font-body);
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 2px;
    }

    .continent-card__count {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin: 0;
    }

    /* ── Responsive ─────────────────────────────────── */
    @media (max-width: 1024px) {
      .continent-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 680px) {
      .interest-grid {
        grid-template-columns: 1fr;
      }

      .continent-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .ai-banner__inner {
        justify-content: center;
        text-align: center;
      }

      .ai-banner__sep {
        display: none;
      }

      .dest-card {
        flex: 0 0 240px;
      }

      .trending-card {
        flex: 0 0 200px;
      }
    }
  `]
})
export class ExploreComponent implements OnInit {
  private readonly destinationService = inject(DestinationService);
  private readonly statsService = inject(StatsService);
  private readonly router = inject(Router);

  readonly quickFilters = QUICK_FILTERS;

  readonly featuredDestinations = signal<DestinationResponse[]>([]);
  readonly trendingDestinations = signal<DestinationResponse[]>([]);
  readonly continents = signal<ContinentSummary[]>([]);
  readonly interestTiles = signal<InterestSummary[]>([]);
  readonly stats = signal<PlatformStats | null>(null);
  readonly searchQuery = signal('');
  readonly activeContinent = signal('all');

  /** In-page continent filter applied to the featured and trending strips (client-side). */
  readonly filteredFeatured = computed(() => this.byContinent(this.featuredDestinations()));
  readonly filteredTrending = computed(() => this.byContinent(this.trendingDestinations()));

  private byContinent(list: DestinationResponse[]): DestinationResponse[] {
    const c = this.activeContinent();
    return c === 'all' ? list : list.filter(d => d.continent === c);
  }

  setContinent(continent: string): void {
    this.activeContinent.set(continent);
  }

  ngOnInit(): void {
    this.destinationService.getFeatured().pipe(
      catchError(() => of([]))
    ).subscribe(destinations => this.featuredDestinations.set(destinations));

    this.destinationService.getTrending(8).pipe(
      catchError(() => of([]))
    ).subscribe(destinations => this.trendingDestinations.set(destinations));

    this.destinationService.getContinents().pipe(
      catchError(() => of([]))
    ).subscribe(continents => this.continents.set(continents));

    this.destinationService.getInterests().pipe(
      catchError(() => of([]))
    ).subscribe(interests => this.interestTiles.set(interests));

    this.statsService.getStats().pipe(
      catchError(() => of(null))
    ).subscribe(stats => this.stats.set(stats));
  }

  /** Compact number formatting for the trust strip, e.g. 30 → "30", 2_400_000 → "2.4M+". */
  compact(value: number): string {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M+`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K+`;
    }
    return `${value}+`;
  }

  search(): void {
    const query = this.searchQuery().trim();
    if (query.length === 0) {
      this.router.navigate(['/search']);
      return;
    }
    this.router.navigate(['/search'], { queryParams: { q: query } });
  }

  goToDestination(id: string): void {
    this.router.navigate(['/destination', id]);
  }

  goToChat(): void {
    this.router.navigate(['/chat']);
  }

  goToPlanner(): void {
    this.router.navigate(['/planner']);
  }

  filterByContinent(continent: string): void {
    this.router.navigate(['/search'], { queryParams: { q: continent } });
  }

  filterByTag(tag: string): void {
    // Route category chips to their dedicated listing pages where one exists.
    const routeByTag: Record<string, string> = {
      Hotels: '/hotels',
      Restaurants: '/restaurants',
      Cruises: '/cruises',
      Flights: '/flights',
    };
    const dedicated = routeByTag[tag];
    if (dedicated) {
      this.router.navigate([dedicated]);
      return;
    }
    if (tag === 'All' || tag === 'Destinations') {
      this.router.navigate(['/search']);
      return;
    }
    this.router.navigate(['/search'], { queryParams: { q: tag } });
  }

  parseTags(tags: string): string[] {
    if (!tags) {
      return [];
    }
    return tags.split(',').map(t => t.trim()).filter(t => t.length > 0).slice(0, 3);
  }
}
