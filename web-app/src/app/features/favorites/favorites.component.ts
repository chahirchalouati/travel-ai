import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { FavoritesService } from '../../core/services/favorites.service';
import type { FavoriteType } from '../../core/services/favorites.service';

const TYPE_ICON: Record<FavoriteType, string> = {
  flight: 'flight',
  restaurant: 'restaurant',
  cruise: 'directions_boat',
  hotel: 'hotel',
  attraction: 'attractions',
};

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  styleUrls: ['../../shared/styles/dashboard.scss'],
  template: `
    <div class="dash-container">
      <header class="dash-head">
        <div>
          <h1 class="dash-title">{{ 'favorites.title' | transloco }}</h1>
          <p class="dash-sub">{{ 'favorites.subtitle' | transloco }}</p>
        </div>
      </header>

      @if (fav.items().length === 0) {
        <div class="empty">
          <span class="ms">favorite</span>
          <h3>{{ 'favorites.emptyTitle' | transloco }}</h3>
          <p>{{ 'favorites.emptyBody' | transloco }}</p>
          <button class="dash-cta" (click)="router.navigate(['/'])"><span class="ms">explore</span> {{ 'favorites.emptyCta' | transloco }}</button>
        </div>
      } @else {
        <div class="fav-grid">
          @for (f of fav.items(); track f.type + f.id) {
            <article class="fav-card" (click)="router.navigateByUrl(f.route)" tabindex="0" (keydown.enter)="router.navigateByUrl(f.route)">
              @if (f.imageUrl) {
                <img class="fav-card__img" [src]="f.imageUrl" [alt]="f.title" loading="lazy" />
              } @else {
                <div class="fav-card__img fav-card__img--icon"><span class="ms">{{ icon(f.type) }}</span></div>
              }
              <div class="fav-card__body">
                <span class="fav-card__type">{{ ('favorites.type.' + f.type) | transloco }}</span>
                <h3 class="fav-card__title">{{ f.title }}</h3>
                @if (f.subtitle) { <p class="fav-card__sub">{{ f.subtitle }}</p> }
              </div>
              <button class="fav-card__remove" (click)="$event.stopPropagation(); fav.remove(f.type, f.id)"
                      [attr.aria-label]="'favorites.remove' | transloco">
                <span class="ms">close</span>
              </button>
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .fav-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.1rem; }
    .fav-card { position: relative; display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; cursor: pointer; background: var(--surface, #fff); transition: transform 150ms ease, box-shadow 150ms ease; }
    .fav-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,.08); }
    .fav-card__img { width: 100%; height: 150px; object-fit: cover; }
    .fav-card__img--icon { display: grid; place-items: center; background: linear-gradient(135deg,#fff1ec,#ffe3da); color: #e04a2f; }
    .fav-card__img--icon .ms { font-size: 40px; }
    .fav-card__body { padding: 0.9rem 1rem 1.1rem; }
    .fav-card__type { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #e04a2f; }
    .fav-card__title { margin: 4px 0 2px; font-size: 1.05rem; font-weight: 800; letter-spacing: -0.01em; }
    .fav-card__sub { margin: 0; font-size: 0.85rem; color: var(--muted); }
    .fav-card__remove { position: absolute; top: 8px; right: 8px; width: 30px; height: 30px; border: none; border-radius: 50%; background: rgba(0,0,0,.5); color: #fff; cursor: pointer; display: grid; place-items: center; }
    .fav-card__remove .ms { font-size: 18px; }
  `],
})
export class FavoritesComponent {
  readonly fav = inject(FavoritesService);
  readonly router = inject(Router);

  icon(type: FavoriteType): string {
    return TYPE_ICON[type] ?? 'favorite';
  }
}
