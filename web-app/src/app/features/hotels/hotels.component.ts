import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import type { HotelSearchQuery } from '../../core/services/catalog.service';
import type { HotelSearchResult } from '../../core/models/api.models';

const HEADER_IMG =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80';

@Component({
  selector: 'app-hotels',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, TranslocoModule],
  template: `
    <header class="catalog-header">
      <div class="catalog-header__bg" [style.background-image]="'url(' + headerImg + ')'"></div>
      <div class="catalog-header__scrim"></div>
      <span class="catalog-eyebrow"><span class="ms" style="font-size:15px">hotel</span> {{ 'catalog.hotels.eyebrow' | transloco }}</span>
      <h1 class="catalog-title">{{ 'catalog.hotels.title' | transloco }}</h1>
      <p class="catalog-subtitle">{{ 'catalog.hotels.subtitle' | transloco }}</p>

      <form class="filter-bar" (ngSubmit)="runSearch()">
        <div class="field">
          <label for="h-city">{{ 'catalog.fields.city' | transloco }}</label>
          <input id="h-city" type="text" [(ngModel)]="city" name="city"
                 [placeholder]="'catalog.fields.cityPlaceholder' | transloco" />
        </div>
        <div class="field">
          <label for="h-in">{{ 'catalog.fields.checkIn' | transloco }}</label>
          <input id="h-in" type="date" [(ngModel)]="checkIn" name="checkIn" />
        </div>
        <div class="field">
          <label for="h-out">{{ 'catalog.fields.checkOut' | transloco }}</label>
          <input id="h-out" type="date" [(ngModel)]="checkOut" name="checkOut" />
        </div>
        <div class="field">
          <label for="h-guests">{{ 'catalog.fields.guests' | transloco }}</label>
          <input id="h-guests" type="number" min="1" [(ngModel)]="guests" name="guests" />
        </div>
        <div class="field">
          <label for="h-budget">{{ 'catalog.fields.maxBudget' | transloco }}</label>
          <input id="h-budget" type="number" min="0" [(ngModel)]="maxBudget" name="maxBudget" placeholder="€" />
        </div>
        <button class="search-submit" type="submit">{{ 'catalog.search' | transloco }}</button>
      </form>
    </header>

    <section class="results">
      @if (loading()) {
        <div class="skeleton-grid">
          @for (s of [1,2,3,4,5,6]; track s) {
            <div class="skeleton"><div class="skeleton__img"></div><div class="skeleton__line"></div><div class="skeleton__line" style="width:60%"></div></div>
          }
        </div>
      } @else if (results().length === 0) {
        <div class="state">
          <span class="ms">search_off</span>
          <h3>{{ 'catalog.empty.title' | transloco }}</h3>
          <p>{{ 'catalog.empty.subtitle' | transloco }}</p>
        </div>
      } @else {
        <div class="results-head">
          <p class="results-count">{{ results().length }} <span>{{ 'catalog.hotels.found' | transloco }}</span></p>
        </div>
        <div class="card-grid">
          @for (h of results(); track h.id) {
            <article class="card" tabindex="0" (click)="open(h.id)" (keydown.enter)="open(h.id)">
              <div class="card__img-wrap">
                <img class="card__img" [src]="h.imageUrl" [alt]="h.name" loading="lazy" />
                @if (h.stars) { <span class="card__badge"><span class="stars">{{ starString(h.stars) }}</span></span> }
                @if (!h.available) { <span class="card__badge card__badge--teal" style="left:auto;right:10px;background:#888">{{ 'catalog.soldOut' | transloco }}</span> }
              </div>
              <div class="card__body">
                <h3 class="card__title">{{ h.name }}</h3>
                <p class="card__sub"><span class="ms" style="font-size:14px">location_on</span>{{ h.city }}</p>
                <p class="card__desc">{{ h.description }}</p>
                <div class="card__tags">
                  @if (h.seaProximity) { <span class="tag-pill">{{ 'catalog.amenities.sea' | transloco }}</span> }
                  @if (h.familyFriendly) { <span class="tag-pill">{{ 'catalog.amenities.family' | transloco }}</span> }
                  @if (h.petFriendly) { <span class="tag-pill">{{ 'catalog.amenities.pet' | transloco }}</span> }
                  @if (h.accessible) { <span class="tag-pill">{{ 'catalog.amenities.accessible' | transloco }}</span> }
                </div>
                <div class="card__foot">
                  <span class="card__price">{{ h.pricePerNight | currency:'EUR':'symbol':'1.0-0' }} <small>/ {{ 'catalog.perNight' | transloco }}</small></span>
                  <span class="card__cta">{{ 'catalog.view' | transloco }} <span class="ms" style="font-size:16px">arrow_forward</span></span>
                </div>
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
  styleUrl: '../catalog/catalog-shared.scss',
})
export class HotelsComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly headerImg = HEADER_IMG;
  readonly results = signal<HotelSearchResult[]>([]);
  readonly loading = signal(true);

  city = '';
  checkIn = '';
  checkOut = '';
  guests = 2;
  maxBudget?: number;

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap.get('city') ?? this.route.snapshot.queryParamMap.get('q');
    if (q) {
      this.city = q;
    }
    this.runSearch();
  }

  runSearch(): void {
    this.loading.set(true);
    const query: HotelSearchQuery = {
      city: this.city.trim() || undefined,
      checkIn: this.checkIn || undefined,
      checkOut: this.checkOut || undefined,
      guests: this.guests || 1,
      maxBudget: this.maxBudget,
    };
    this.catalog
      .searchHotels(query)
      .pipe(catchError(() => of([])))
      .subscribe(list => {
        this.results.set(list);
        this.loading.set(false);
      });
  }

  starString(stars: number): string {
    return '★'.repeat(Math.max(0, Math.min(5, stars)));
  }

  open(id: string): void {
    this.router.navigate(['/hotels', id]);
  }
}
