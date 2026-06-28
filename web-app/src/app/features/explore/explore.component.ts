import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { CtaSectionComponent } from '../cta-section/cta-section.component';
import { TripStoriesComponent } from '../trip-stories/trip-stories.component';

import { DestinationService } from '../../core/services/destination.service';
import type { ContinentSummary, InterestSummary } from '../../core/services/destination.service';
import { StatsService } from '../../core/services/stats.service';
import type { PlatformStats } from '../../core/services/stats.service';
import type { DestinationResponse } from '../../core/models/api.models';

interface HeroSlide {
  readonly url: string;
  readonly place: string;
  readonly country: string;
}

interface CategoryFilter {
  readonly key: string;
  readonly tag: string;
}

/** Shown only until featured destinations load from the backend. */
const HERO_FALLBACK_SLIDES: readonly HeroSlide[] = [
  { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&q=80', place: 'Lake Valley', country: 'Switzerland' },
  { url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=80', place: 'Paris', country: 'France' },
  { url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=80', place: 'Kyoto', country: 'Japan' },
] as const;

const POPULAR_FALLBACK_LINKS = ['Paris', 'Tokyo', 'Bali', 'New York', 'Rome'] as const;

const HERO_ROTATE_MS = 6000;

const QUICK_FILTERS = ['Beach', 'Cultural', 'Adventure', 'Romantic', 'Budget', 'Luxury'] as const;

const CATEGORY_FILTER_KEYS: readonly CategoryFilter[] = [
  { key: 'explore.categories.all', tag: 'All' },
  { key: 'explore.categories.destinations', tag: 'Destinations' },
  { key: 'explore.categories.hotels', tag: 'Hotels' },
  { key: 'explore.categories.restaurants', tag: 'Restaurants' },
  { key: 'explore.categories.thingsToDo', tag: 'Things to Do' },
] as const;

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, CtaSectionComponent, TripStoriesComponent],
  template: `
    <!-- HERO / SEARCH -->
    <section class="hero" aria-label="Search destinations">
      <!-- Rotating cinematic backdrop -->
      <div class="hero-stage" aria-hidden="true">
        @for (slide of heroSlides(); track slide.url; let i = $index) {
          <div
            class="hero-slide"
            [class.is-active]="i === activeSlide()"
            [style.background-image]="'url(' + slide.url + ')'"
          ></div>
        }
        <div class="hero-scrim"></div>
        <div class="hero-grain"></div>
      </div>

      <div class="hero-content">
        <div class="hero-eyebrow">
          <span class="ms" style="font-size:16px">explore</span>
          {{ heroSlides()[activeSlide()].place }}
          <span class="hero-eyebrow-dot"></span>
          {{ heroSlides()[activeSlide()].country }}
        </div>

        <h1 class="hero-headline">{{ 'explore.hero.headline' | transloco }}</h1>
        <p class="hero-subtitle">{{ 'explore.hero.subtitle' | transloco }}</p>

        <div class="search-bar">
          <span class="ms search-icon">search</span>
          <input
            type="text"
            class="search-input"
            [placeholder]="'explore.search.placeholder' | transloco"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            (keydown.enter)="search()"
          />
          <button class="ask-ai-btn" (click)="goToChat()">
            <span class="ms" style="font-size:16px">auto_awesome</span>
            {{ 'explore.search.askAi' | transloco }}
          </button>
          <button class="search-btn" (click)="search()">{{ 'explore.search.button' | transloco }}</button>
        </div>

        <div class="category-chips">
          @for (cat of categoryFilterKeys; track cat.key) {
            <button
              class="category-chip"
              [class.category-chip--active]="cat.key === 'explore.categories.all'"
              (click)="filterByTag(cat.tag)"
            >{{ cat.key | transloco }}</button>
          }
        </div>

        <div class="popular-links">
          <span class="popular-label">{{ 'explore.popular' | transloco }}</span>
          @for (link of popularLinks(); track link; let last = $last) {
            <button class="popular-link" (click)="filterByTag(link)">{{ link }}</button>
            @if (!last) {
              <span class="popular-dot">&middot;</span>
            }
          }
        </div>
      </div>

      <!-- Trust strip -->
      <div class="hero-trust">
        <div class="trust-item">
          <span class="trust-num">{{ stats() ? compact(stats()!.travelerCount) : '—' }}</span>
          <span class="trust-label">{{ 'explore.trust.travelers' | transloco }}</span>
        </div>
        <span class="trust-divider"></span>
        <div class="trust-item">
          <span class="trust-num">{{ stats() ? stats()!.countryCount + '+' : '—' }}</span>
          <span class="trust-label">{{ 'explore.trust.countries' | transloco }}</span>
        </div>
        <span class="trust-divider"></span>
        <div class="trust-item">
          <span class="trust-num">
            <span class="ms" style="font-size:18px;color:var(--gold);vertical-align:-2px">star</span>
            {{ stats() ? (stats()!.avgRating | number:'1.1-1') : '—' }}
          </span>
          <span class="trust-label">{{ 'explore.trust.rating' | transloco }}</span>
        </div>

        <div class="hero-dots" role="tablist" aria-label="Featured places">
          @for (slide of heroSlides(); track slide.url; let i = $index) {
            <button
              class="hero-dot"
              [class.is-active]="i === activeSlide()"
              (click)="setSlide(i)"
              [attr.aria-label]="slide.place"
            ></button>
          }
        </div>
      </div>
    </section>

    <!-- FEATURED DESTINATIONS -->
    @if (featuredDestinations().length > 0) {
      <section class="section" aria-labelledby="featured-heading">
        <div class="section-header">
          <div>
            <h2 class="section-title" id="featured-heading">{{ 'explore.sections.featured' | transloco }}</h2>
          </div>
          <button class="see-all-link" (click)="filterByTag('All')">{{ 'explore.sections.seeAll' | transloco }}
            <span class="ms see-all-arrow">arrow_forward</span>
          </button>
        </div>
        <div class="featured-scroll">
          @for (dest of featuredDestinations(); track dest.id) {
            <article class="dest-card" (click)="goToDestination(dest.id)">
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
    @if (trendingDestinations().length > 0) {
      <section class="section section--gray" aria-labelledby="trending-heading">
        <div class="section-header">
          <div>
            <h2 class="section-title" id="trending-heading">{{ 'explore.sections.trending' | transloco }}</h2>
          </div>
          <button class="see-all-link" (click)="filterByTag('All')">{{ 'explore.sections.seeAll' | transloco }}
            <span class="ms see-all-arrow">arrow_forward</span>
          </button>
        </div>
        <div class="trending-scroll">
          @for (dest of trendingDestinations(); track dest.id) {
            <article class="trending-card" (click)="goToDestination(dest.id)">
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
      <div class="section-header">
        <div>
          <h2 class="section-title" id="interest-heading">{{ 'explore.sections.interests' | transloco }}</h2>
        </div>
      </div>
      <div class="interest-grid">
        @for (tile of interestTiles(); track tile.key) {
          <article class="interest-tile" (click)="filterByTag(tile.tag)">
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
    <section class="ai-banner" aria-labelledby="ai-heading">
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
      <div class="section-header">
        <div>
          <h2 class="section-title" id="region-heading">{{ 'explore.sections.regions' | transloco }}</h2>
        </div>
      </div>
      <div class="continent-grid">
        @for (c of continents(); track c.continent) {
          <article class="continent-card" (click)="filterByContinent(c.continent)">
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
    /* ── Design Tokens ─────────────────────────────── */
    :host {
      --bg-primary: #ffffff;
      --bg-secondary: #f7f7f7;
      --bg-tertiary: #f0f0f0;
      --brand: #E04A2F;
      --brand-hover: #c93d25;
      --brand-light: #FFF0ED;
      --teal: #00856A;
      --teal-light: #E6F5F0;
      --gold: #F5A623;
      --text-primary: #1a1a1a;
      --text-secondary: #545454;
      --text-tertiary: #8a8a8a;
      --border: #e0e0e0;
      --border-light: #efefef;
      --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
      --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --duration: 200ms;
      --ease: cubic-bezier(0.16, 1, 0.3, 1);

      display: block;
      background: var(--bg-primary);
      color: var(--text-primary);
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
    }

    /* ── Hero / Search ─────────────────────────────── */
    .hero {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      padding: clamp(6rem, 4rem + 8vw, 9rem) 1.5rem clamp(5.5rem, 4rem + 4vw, 7rem);
      text-align: center;
      color: #fff;
    }

    .hero-stage {
      position: absolute;
      inset: 0;
      z-index: -1;
    }

    .hero-slide {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      opacity: 0;
      transform: scale(1.08);
      transition: opacity 1400ms var(--ease);
      will-change: opacity, transform;
    }

    .hero-slide.is-active {
      opacity: 1;
      animation: heroKenBurns 9s ease-out forwards;
    }

    @keyframes heroKenBurns {
      from { transform: scale(1.12); }
      to   { transform: scale(1.0); }
    }

    .hero-scrim {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(120% 80% at 50% 0%, rgba(0,0,0,0.15), transparent 55%),
        linear-gradient(180deg, rgba(15,18,22,0.55) 0%, rgba(15,18,22,0.35) 35%, rgba(15,18,22,0.78) 100%);
    }

    .hero-grain {
      position: absolute;
      inset: 0;
      opacity: 0.06;
      mix-blend-mode: overlay;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    .hero-content {
      max-width: 720px;
      margin: 0 auto;
      animation: fadeInUp 700ms var(--ease) both;
    }

    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 14px;
      margin-bottom: 1.25rem;
      border-radius: 40px;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.25);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      color: #fff;
    }

    .hero-eyebrow-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(255,255,255,0.6);
    }

    .hero-headline {
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
      font-size: clamp(2.6rem, 1.6rem + 5vw, 4.6rem);
      font-weight: 800;
      line-height: 1.05;
      color: #fff;
      margin: 0 0 0.85rem;
      letter-spacing: -0.03em;
      text-shadow: 0 2px 30px rgba(0,0,0,0.35);
    }

    .hero-subtitle {
      font-size: clamp(1.05rem, 0.95rem + 0.4vw, 1.25rem);
      color: rgba(255,255,255,0.88);
      line-height: 1.6;
      margin: 0 auto 2.25rem;
      max-width: 540px;
      text-shadow: 0 1px 16px rgba(0,0,0,0.3);
    }

    /* ── Search Bar ────────────────────────────────── */
    .search-bar {
      display: flex;
      align-items: center;
      gap: 0;
      background: var(--bg-primary);
      border: 2px solid transparent;
      border-radius: 60px;
      padding: 6px 6px 6px 22px;
      max-width: 640px;
      margin: 0 auto 1.75rem;
      box-shadow: 0 18px 50px -12px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2);
      transition: border-color var(--duration) var(--ease),
                  box-shadow var(--duration) var(--ease),
                  transform var(--duration) var(--ease);
    }

    .search-bar:focus-within {
      border-color: var(--brand);
      box-shadow: 0 0 0 4px rgba(224,74,47,0.25), 0 18px 50px -12px rgba(0,0,0,0.5);
      transform: translateY(-1px);
    }

    .search-icon {
      font-size: 22px;
      color: var(--text-tertiary);
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
      font-size: 1rem;
      color: var(--text-primary);
      padding: 12px 12px;
    }

    .search-input::placeholder {
      color: var(--text-tertiary);
    }

    .search-btn {
      background: var(--brand);
      color: #fff;
      border: none;
      border-radius: 50px;
      padding: 12px 28px;
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background var(--duration) var(--ease);
      white-space: nowrap;
    }

    .search-btn:hover {
      background: var(--brand-hover);
    }

    .search-btn:focus-visible {
      outline: 2px solid var(--brand);
      outline-offset: 3px;
    }

    /* ── Category Chips ────────────────────────────── */
    .category-chips {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      margin-bottom: 1.2rem;
    }

    .category-chip {
      background: rgba(255,255,255,0.12);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.28);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 40px;
      padding: 7px 18px;
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: background var(--duration) var(--ease),
                  border-color var(--duration) var(--ease),
                  color var(--duration) var(--ease);
    }

    .category-chip:hover {
      background: rgba(255,255,255,0.22);
      border-color: rgba(255,255,255,0.5);
      color: #fff;
    }

    .category-chip--active {
      background: #fff;
      color: var(--text-primary);
      border-color: #fff;
      font-weight: 600;
    }

    .category-chip--active:hover {
      background: #fff;
      color: var(--text-primary);
      border-color: #fff;
    }

    .category-chip:focus-visible {
      outline: 2px solid var(--brand);
      outline-offset: 2px;
    }

    /* ── Popular Links ─────────────────────────────── */
    .popular-links {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .popular-label {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.7);
      font-weight: 500;
    }

    .popular-link {
      background: none;
      border: none;
      color: #fff;
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      transition: background var(--duration) var(--ease), color var(--duration) var(--ease);
    }

    .popular-link:hover {
      background: rgba(255,255,255,0.15);
      color: #fff;
    }

    .popular-link:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }

    .popular-dot {
      color: rgba(255,255,255,0.45);
      font-size: 0.85rem;
      user-select: none;
    }

    /* ── Hero Trust Strip ──────────────────────────── */
    .hero-trust {
      position: relative;
      z-index: 1;
      max-width: 720px;
      margin: clamp(2rem, 1rem + 3vw, 3rem) auto 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: clamp(1rem, 0.5rem + 2vw, 2.25rem);
      flex-wrap: wrap;
    }

    .trust-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .trust-num {
      font-size: clamp(1.15rem, 1rem + 0.6vw, 1.5rem);
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.01em;
      line-height: 1;
    }

    .trust-label {
      font-size: 0.72rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: rgba(255,255,255,0.7);
    }

    .trust-divider {
      width: 1px;
      height: 28px;
      background: rgba(255,255,255,0.25);
    }

    .hero-dots {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: clamp(0.5rem, 0.2rem + 1vw, 1rem);
    }

    .hero-dot {
      width: 8px;
      height: 8px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: rgba(255,255,255,0.35);
      cursor: pointer;
      transition: width var(--duration) var(--ease), background var(--duration) var(--ease);
    }

    .hero-dot.is-active {
      width: 24px;
      border-radius: 5px;
      background: #fff;
    }

    .hero-dot:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 3px;
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
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
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
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
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
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
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
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
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
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
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

    /* ── Ask AI Button (in search bar) ─────────────── */
    .ask-ai-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: var(--teal-light);
      color: var(--teal);
      border: 1px solid var(--teal);
      border-radius: 50px;
      padding: 10px 16px;
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background var(--duration) var(--ease),
                  color var(--duration) var(--ease);
    }

    .ask-ai-btn:hover {
      background: var(--teal);
      color: #fff;
    }

    .ask-ai-btn:focus-visible {
      outline: 2px solid var(--teal);
      outline-offset: 2px;
    }

    /* ── AI Banner (compact) ───────────────────────── */
    .ai-banner {
      background: var(--teal-light);
      border-top: 1px solid rgba(0, 133, 106, 0.15);
      border-bottom: 1px solid rgba(0, 133, 106, 0.15);
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
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background var(--duration) var(--ease);
    }

    .ai-banner__cta:hover {
      background: #006e58;
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
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
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
      .hero {
        padding: clamp(4.5rem, 3rem + 6vw, 6rem) 1rem clamp(3.5rem, 2.5rem + 3vw, 4.5rem);
      }

      .hero-trust {
        gap: 0.9rem 1.1rem;
      }

      .trust-divider {
        display: none;
      }

      .hero-dots {
        flex-basis: 100%;
        justify-content: center;
        margin: 0.5rem 0 0;
      }

      .search-bar {
        flex-direction: column;
        border-radius: var(--radius-md);
        padding: 10px;
        gap: 6px;
      }

      .search-icon {
        display: none;
      }

      .search-input {
        text-align: center;
      }

      .search-btn {
        width: 100%;
        border-radius: var(--radius-sm);
      }

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

      .ask-ai-btn {
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
export class ExploreComponent implements OnInit, OnDestroy {
  private readonly destinationService = inject(DestinationService);
  private readonly statsService = inject(StatsService);
  private readonly router = inject(Router);

  readonly quickFilters = QUICK_FILTERS;
  readonly categoryFilterKeys = CATEGORY_FILTER_KEYS;

  readonly featuredDestinations = signal<DestinationResponse[]>([]);
  readonly trendingDestinations = signal<DestinationResponse[]>([]);
  readonly continents = signal<ContinentSummary[]>([]);
  readonly interestTiles = signal<InterestSummary[]>([]);
  readonly stats = signal<PlatformStats | null>(null);
  readonly searchQuery = signal('');
  readonly activeSlide = signal(0);

  /** Hero slides come from featured destinations; fall back to curated set until loaded. */
  readonly heroSlides = computed<readonly HeroSlide[]>(() => {
    const featured = this.featuredDestinations();
    if (featured.length === 0) {
      return HERO_FALLBACK_SLIDES;
    }
    return featured
      .filter(d => !!d.imageUrl)
      .slice(0, 5)
      .map(d => ({ url: d.imageUrl, place: d.name, country: d.country }));
  });

  /** Popular quick-links derived from the most popular destinations. */
  readonly popularLinks = computed<readonly string[]>(() => {
    const featured = this.featuredDestinations();
    return featured.length > 0
      ? featured.slice(0, 5).map(d => d.name)
      : POPULAR_FALLBACK_LINKS;
  });

  private slideTimer: ReturnType<typeof setInterval> | null = null;

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

    this.startHeroRotation();
  }

  ngOnDestroy(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
  }

  private startHeroRotation(): void {
    this.slideTimer = setInterval(() => {
      const count = this.heroSlides().length;
      if (count > 0) {
        this.activeSlide.update(i => (i + 1) % count);
      }
    }, HERO_ROTATE_MS);
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

  setSlide(index: number): void {
    this.activeSlide.set(index);
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
    this.startHeroRotation();
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
