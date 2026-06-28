import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';

import { DestinationService } from '../../core/services/destination.service';
import type { DestinationResponse } from '../../core/models/api.models';

interface ContinentCard {
  readonly name: string;
  readonly imageUrl: string;
  readonly destinationCount: number;
}

const QUICK_FILTERS = ['Beach', 'Cultural', 'Adventure', 'Romantic', 'Budget', 'Luxury'] as const;

const CONTINENTS: readonly ContinentCard[] = [
  { name: 'Europe', imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80', destinationCount: 47 },
  { name: 'Asia', imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80', destinationCount: 38 },
  { name: 'North America', imageUrl: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f04?w=600&q=80', destinationCount: 24 },
  { name: 'South America', imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600&q=80', destinationCount: 19 },
  { name: 'Africa', imageUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&q=80', destinationCount: 22 },
  { name: 'Oceania', imageUrl: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=600&q=80', destinationCount: 14 },
] as const;

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- HERO -->
    <section class="hero">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <p class="hero-eyebrow">Travel AI</p>
        <h1 class="hero-headline">Discover Your Next Adventure</h1>
        <p class="hero-subtitle">AI-powered travel planning, reviews, and personalized recommendations</p>

        <div class="search-bar">
          <span class="ms search-icon">search</span>
          <input
            type="text"
            class="search-input"
            placeholder="Where do you want to go?"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            (keydown.enter)="search()"
          />
          <button class="search-btn" (click)="search()">Search</button>
        </div>

        <div class="quick-filters">
          @for (tag of quickFilters; track tag) {
            <button class="filter-chip" (click)="filterByTag(tag)">{{ tag }}</button>
          }
        </div>
      </div>
    </section>

    <!-- FEATURED DESTINATIONS -->
    @if (featuredDestinations().length > 0) {
      <section class="section featured-section">
        <div class="section-header">
          <h2 class="section-title">Featured Destinations</h2>
          <p class="section-subtitle">Handpicked by our editorial team</p>
        </div>
        <div class="bento-grid">
          @for (dest of featuredDestinations(); track dest.id; let i = $index) {
            <article
              class="bento-card"
              [class.bento-card--hero]="i === 0"
              (click)="goToDestination(dest.id)"
            >
              <img
                [src]="dest.imageUrl"
                [alt]="dest.name"
                class="bento-card__img"
                loading="lazy"
              />
              <div class="bento-card__overlay"></div>
              <div class="bento-card__content">
                <div class="bento-card__tags">
                  @for (tag of parseTags(dest.tags); track tag) {
                    <span class="tag-pill">{{ tag }}</span>
                  }
                </div>
                <h3 class="bento-card__name">{{ dest.name }}</h3>
                <p class="bento-card__country">{{ dest.country }}</p>
                <span class="bento-card__price">
                  <span class="ms" style="font-size: 16px;">payments</span>
                  {{ dest.avgDailyCost | currency:dest.currency:'symbol':'1.0-0' }}/day
                </span>
              </div>
            </article>
          }
        </div>
      </section>
    }

    <!-- TRENDING DESTINATIONS -->
    @if (trendingDestinations().length > 0) {
      <section class="section trending-section">
        <div class="section-header">
          <h2 class="section-title">Trending Now</h2>
          <p class="section-subtitle">Most popular destinations this season</p>
        </div>
        <div class="trending-scroll">
          @for (dest of trendingDestinations(); track dest.id; let i = $index) {
            <article class="trending-card" (click)="goToDestination(dest.id)">
              <span class="trending-rank">#{{ i + 1 }}</span>
              <img
                [src]="dest.imageUrl"
                [alt]="dest.name"
                class="trending-card__img"
                loading="lazy"
              />
              <div class="trending-card__body">
                <h4 class="trending-card__name">{{ dest.name }}</h4>
                <p class="trending-card__country">{{ dest.country }}</p>
                <div class="popularity-bar">
                  <div
                    class="popularity-bar__fill"
                    [style.width.%]="dest.popularityScore"
                  ></div>
                </div>
              </div>
            </article>
          }
        </div>
      </section>
    }

    <!-- AI CONCIERGE CTA -->
    <section class="section cta-section">
      <div class="cta-inner">
        <div class="cta-text">
          <span class="ms cta-icon">auto_awesome</span>
          <h2 class="cta-headline">Plan your trip with AI</h2>
          <p class="cta-body">
            Chat with our AI travel concierge to plan the perfect trip,
            or let the planner build a full itinerary tailored to your budget and style.
          </p>
        </div>
        <div class="cta-actions">
          <button class="cta-btn cta-btn--primary" (click)="goToChat()">
            <span class="ms" style="font-size: 20px;">chat</span>
            Start a conversation
          </button>
          <button class="cta-btn cta-btn--secondary" (click)="goToPlanner()">
            <span class="ms" style="font-size: 20px;">map</span>
            Open trip planner
          </button>
        </div>
      </div>
    </section>

    <!-- EXPLORE BY CONTINENT -->
    <section class="section continent-section">
      <div class="section-header">
        <h2 class="section-title">Explore by Continent</h2>
        <p class="section-subtitle">Find inspiration across the globe</p>
      </div>
      <div class="continent-grid">
        @for (c of continents; track c.name) {
          <article class="continent-card" (click)="filterByContinent(c.name)">
            <img
              [src]="c.imageUrl"
              [alt]="c.name"
              class="continent-card__img"
              loading="lazy"
            />
            <div class="continent-card__overlay"></div>
            <div class="continent-card__content">
              <h3 class="continent-card__name">{{ c.name }}</h3>
              <p class="continent-card__count">{{ c.destinationCount }} destinations</p>
            </div>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    /* ── Tokens ─────────────────────────────────────── */
    :host {
      --bg: #EFE8DC;
      --bg-card: #fff;
      --border-card: #EADFCD;
      --text: #241C15;
      --text-muted: #6B5D4F;
      --accent: #D9694C;
      --accent-light: #FBEDE7;
      --price: #2E7D67;
      --heading: 'Instrument Serif', Georgia, serif;
      --body: 'Hanken Grotesk', system-ui, sans-serif;
      --radius-sm: 6px;
      --radius-md: 12px;
      --radius-lg: 20px;
      --duration: 300ms;
      --ease: cubic-bezier(0.16, 1, 0.3, 1);

      display: block;
      background: var(--bg);
      color: var(--text);
      font-family: var(--body);
    }

    /* ── Hero ───────────────────────────────────────── */
    .hero {
      position: relative;
      min-height: 92vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background:
        url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80')
        center / cover no-repeat;
      overflow: hidden;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        175deg,
        rgba(36, 28, 21, 0.72) 0%,
        rgba(36, 28, 21, 0.38) 50%,
        rgba(217, 105, 76, 0.22) 100%
      );
    }

    .hero-content {
      position: relative;
      z-index: 1;
      max-width: 760px;
      padding: 2rem;
      text-align: center;
    }

    .hero-eyebrow {
      font-family: var(--body);
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 1rem;
    }

    .hero-headline {
      font-family: var(--heading);
      font-size: clamp(2.8rem, 1.2rem + 6vw, 5.6rem);
      font-weight: 400;
      line-height: 1.05;
      color: #fff;
      margin: 0 0 1.2rem;
    }

    .hero-subtitle {
      font-size: clamp(1rem, 0.85rem + 0.6vw, 1.25rem);
      color: rgba(255, 255, 255, 0.82);
      line-height: 1.6;
      margin-bottom: 2.4rem;
    }

    /* ── Search bar ─────────────────────────────────── */
    .search-bar {
      display: flex;
      align-items: center;
      gap: 0;
      background: var(--bg-card);
      border-radius: 60px;
      padding: 6px 6px 6px 20px;
      max-width: 560px;
      margin: 0 auto 1.6rem;
      box-shadow: 0 8px 32px rgba(36, 28, 21, 0.18);
    }

    .search-icon {
      font-size: 22px;
      color: var(--text-muted);
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: var(--body);
      font-size: 1rem;
      color: var(--text);
      padding: 12px 14px;
    }

    .search-input::placeholder {
      color: #A89B8C;
    }

    .search-btn {
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 50px;
      padding: 12px 28px;
      font-family: var(--body);
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: background var(--duration) var(--ease);
      white-space: nowrap;
    }

    .search-btn:hover {
      background: #C4573D;
    }

    .search-btn:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }

    /* ── Quick filter chips ──────────────────────────── */
    .quick-filters {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
    }

    .filter-chip {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(6px);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 40px;
      padding: 8px 20px;
      font-family: var(--body);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition:
        background var(--duration) var(--ease),
        transform var(--duration) var(--ease);
    }

    .filter-chip:hover {
      background: rgba(255, 255, 255, 0.28);
      transform: translateY(-1px);
    }

    .filter-chip:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    /* ── Section shared ──────────────────────────────── */
    .section {
      padding: clamp(3rem, 2rem + 4vw, 6rem) clamp(1rem, 1rem + 3vw, 4rem);
      max-width: 1280px;
      margin: 0 auto;
    }

    .section-header {
      margin-bottom: 2.4rem;
    }

    .section-title {
      font-family: var(--heading);
      font-size: clamp(1.8rem, 1.2rem + 2vw, 2.8rem);
      font-weight: 400;
      margin: 0 0 0.4rem;
    }

    .section-subtitle {
      font-size: 1rem;
      color: var(--text-muted);
      margin: 0;
    }

    /* ── Bento grid (Featured) ───────────────────────── */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .bento-card {
      position: relative;
      border-radius: var(--radius-lg);
      overflow: hidden;
      cursor: pointer;
      aspect-ratio: 4 / 3;
      transition: transform var(--duration) var(--ease);
    }

    .bento-card--hero {
      grid-column: span 2;
      aspect-ratio: 16 / 9;
    }

    .bento-card:hover {
      transform: scale(1.02);
    }

    .bento-card:focus-visible {
      outline: 3px solid var(--accent);
      outline-offset: 3px;
    }

    .bento-card__img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .bento-card__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to top,
        rgba(36, 28, 21, 0.78) 0%,
        transparent 55%
      );
    }

    .bento-card__content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 24px;
    }

    .bento-card__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 10px;
    }

    .tag-pill {
      background: var(--accent-light);
      color: var(--accent);
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
      text-transform: capitalize;
    }

    .bento-card__name {
      font-family: var(--heading);
      font-size: 1.6rem;
      color: #fff;
      margin: 0;
      line-height: 1.2;
    }

    .bento-card--hero .bento-card__name {
      font-size: 2.2rem;
    }

    .bento-card__country {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.75);
      margin: 4px 0 8px;
    }

    .bento-card__price {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--price);
      background: rgba(255, 255, 255, 0.92);
      padding: 4px 12px;
      border-radius: 20px;
    }

    /* ── Trending (horizontal scroll) ────────────────── */
    .trending-scroll {
      display: flex;
      gap: 20px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 8px;
    }

    .trending-scroll::-webkit-scrollbar {
      height: 6px;
    }

    .trending-scroll::-webkit-scrollbar-track {
      background: var(--border-card);
      border-radius: 3px;
    }

    .trending-scroll::-webkit-scrollbar-thumb {
      background: #C4AA86;
      border-radius: 3px;
    }

    .trending-card {
      flex: 0 0 240px;
      scroll-snap-align: start;
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: var(--radius-md);
      overflow: hidden;
      cursor: pointer;
      position: relative;
      transition: transform var(--duration) var(--ease), box-shadow var(--duration) var(--ease);
    }

    .trending-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(36, 28, 21, 0.10);
    }

    .trending-rank {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 2;
      font-family: var(--heading);
      font-size: 1.4rem;
      color: #fff;
      background: var(--accent);
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 400;
      box-shadow: 0 2px 8px rgba(217, 105, 76, 0.35);
    }

    .trending-card__img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      display: block;
    }

    .trending-card__body {
      padding: 14px 16px 18px;
    }

    .trending-card__name {
      font-family: var(--heading);
      font-size: 1.15rem;
      margin: 0 0 2px;
    }

    .trending-card__country {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin: 0 0 10px;
    }

    .popularity-bar {
      height: 5px;
      background: var(--border-card);
      border-radius: 3px;
      overflow: hidden;
    }

    .popularity-bar__fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent), #E89B54);
      border-radius: 3px;
      transition: width 600ms var(--ease);
    }

    /* ── AI CTA ──────────────────────────────────────── */
    .cta-section {
      padding-left: clamp(1rem, 1rem + 3vw, 4rem);
      padding-right: clamp(1rem, 1rem + 3vw, 4rem);
    }

    .cta-inner {
      background: var(--text);
      border-radius: var(--radius-lg);
      padding: clamp(2.4rem, 2rem + 3vw, 4rem);
      display: flex;
      align-items: center;
      gap: 3rem;
      flex-wrap: wrap;
    }

    .cta-text {
      flex: 1 1 340px;
    }

    .cta-icon {
      font-size: 36px;
      color: var(--accent);
      margin-bottom: 0.6rem;
      display: block;
    }

    .cta-headline {
      font-family: var(--heading);
      font-size: clamp(1.6rem, 1rem + 2vw, 2.4rem);
      color: #fff;
      margin: 0 0 0.8rem;
      font-weight: 400;
    }

    .cta-body {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.72);
      line-height: 1.7;
      margin: 0;
    }

    .cta-actions {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
    }

    .cta-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: none;
      border-radius: 50px;
      padding: 14px 28px;
      font-family: var(--body);
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition:
        background var(--duration) var(--ease),
        transform var(--duration) var(--ease);
      white-space: nowrap;
    }

    .cta-btn:hover {
      transform: translateY(-2px);
    }

    .cta-btn:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }

    .cta-btn--primary {
      background: var(--accent);
      color: #fff;
    }

    .cta-btn--primary:hover {
      background: #C4573D;
    }

    .cta-btn--secondary {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .cta-btn--secondary:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* ── Continent grid ──────────────────────────────── */
    .continent-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 18px;
    }

    .continent-card {
      position: relative;
      border-radius: var(--radius-md);
      overflow: hidden;
      cursor: pointer;
      aspect-ratio: 3 / 2;
      transition: transform var(--duration) var(--ease);
    }

    .continent-card:hover {
      transform: scale(1.03);
    }

    .continent-card:focus-visible {
      outline: 3px solid var(--accent);
      outline-offset: 3px;
    }

    .continent-card__img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .continent-card__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to top,
        rgba(36, 28, 21, 0.68) 0%,
        rgba(36, 28, 21, 0.12) 60%
      );
    }

    .continent-card__content {
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 18px 20px;
    }

    .continent-card__name {
      font-family: var(--heading);
      font-size: 1.5rem;
      color: #fff;
      margin: 0;
      line-height: 1.15;
    }

    .continent-card__count {
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.72);
      margin: 4px 0 0;
    }

    /* ── Responsive adjustments ──────────────────────── */
    @media (max-width: 680px) {
      .bento-card--hero {
        grid-column: span 1;
        aspect-ratio: 4 / 3;
      }

      .bento-card--hero .bento-card__name {
        font-size: 1.6rem;
      }

      .cta-inner {
        flex-direction: column;
        text-align: center;
      }

      .cta-actions {
        justify-content: center;
      }

      .search-bar {
        flex-direction: column;
        border-radius: var(--radius-md);
        padding: 10px;
        gap: 8px;
      }

      .search-icon {
        display: none;
      }

      .search-input {
        text-align: center;
      }

      .search-btn {
        width: 100%;
      }
    }
  `]
})
export class ExploreComponent implements OnInit {
  private readonly destinationService = inject(DestinationService);
  private readonly router = inject(Router);

  readonly quickFilters = QUICK_FILTERS;
  readonly continents = CONTINENTS;

  readonly featuredDestinations = signal<DestinationResponse[]>([]);
  readonly trendingDestinations = signal<DestinationResponse[]>([]);
  readonly searchQuery = signal('');

  ngOnInit(): void {
    this.destinationService.getFeatured().pipe(
      catchError(() => of([]))
    ).subscribe(destinations => this.featuredDestinations.set(destinations));

    this.destinationService.getTrending(8).pipe(
      catchError(() => of([]))
    ).subscribe(destinations => this.trendingDestinations.set(destinations));
  }

  search(): void {
    const query = this.searchQuery().trim();
    if (query.length === 0) {
      return;
    }
    this.router.navigate(['/explore'], { queryParams: { q: query } });
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
    this.router.navigate(['/explore'], { queryParams: { continent } });
  }

  filterByTag(tag: string): void {
    this.router.navigate(['/explore'], { queryParams: { q: tag } });
  }

  parseTags(tags: string): string[] {
    if (!tags) {
      return [];
    }
    return tags.split(',').map(t => t.trim()).filter(t => t.length > 0).slice(0, 3);
  }
}
