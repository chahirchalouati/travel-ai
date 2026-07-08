import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, map, of } from 'rxjs';
import * as L from 'leaflet';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, TripMapResponse, TripMapStop } from '../../core/models/api.models';

/** Consistent color per trip day; cycles when a trip is longer than the palette. */
const DAY_PALETTE = [
  '#0f766e', // teal (app accent)
  '#e15023', // burnt orange
  '#7c3aed', // violet
  '#0369a1', // ocean blue
  '#ca8a04', // amber
  '#be185d', // magenta
  '#15803d', // green
  '#b45309', // copper
];

const MATERIAL_ICONS: Record<string, string> = {
  FLIGHT: 'flight',
  HOTEL: 'hotel',
  RESTAURANT: 'restaurant',
};

/**
 * Self-contained day-by-day trip map: fetches /api/trips/{bookingId}/map and
 * renders the itinerary's stops as numbered, day-colored Leaflet markers with
 * a polyline per day and day filter chips.
 */
@Component({
  selector: 'app-trip-map',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  template: `
    <ng-container *transloco="let t">
      @if (!loading() && stops().length > 0) {
        <div class="tm-card">
          <div class="tm-head">
            <h2 class="tm-title"><span class="ms">map</span> {{ t('tripMap.title') }}</h2>
            <div class="tm-chips" role="tablist" [attr.aria-label]="t('tripMap.title')">
              <button
                class="tm-chip"
                role="tab"
                [class.is-active]="activeDay() === null"
                [attr.aria-selected]="activeDay() === null"
                (click)="selectDay(null)"
              >
                {{ t('tripMap.all') }}
              </button>
              @for (d of days(); track d) {
                <button
                  class="tm-chip"
                  role="tab"
                  [class.is-active]="activeDay() === d"
                  [attr.aria-selected]="activeDay() === d"
                  [style.--chip-color]="dayColor(d)"
                  (click)="selectDay(d)"
                >
                  <span class="tm-chip__dot"></span>
                  {{ t('tripMap.day', { n: d }) }}
                </button>
              }
            </div>
          </div>
          <div class="tm-map" #mapEl></div>
          @if (missingCoords() > 0) {
            <p class="tm-missing">
              <span class="ms">location_off</span>
              {{ t('tripMap.missing', { count: missingCoords() }) }}
            </p>
          }
        </div>
      } @else if (!loading()) {
        <div class="tm-card tm-empty">
          <span class="ms">location_off</span>
          <p class="tm-empty__title">{{ t('tripMap.empty') }}</p>
          <p class="tm-empty__hint">{{ t('tripMap.emptyHint') }}</p>
        </div>
      }
    </ng-container>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .tm-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: 18px;
        overflow: hidden;
      }
      .tm-head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 14px 18px;
      }
      .tm-title {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        font-size: 1.05rem;
        font-weight: 800;
        letter-spacing: -0.01em;
        color: var(--text-primary);
        .ms {
          font-size: 20px;
          color: var(--teal);
        }
      }
      .tm-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .tm-chip {
        --chip-color: var(--teal);
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: var(--bg-secondary);
        color: var(--text-secondary);
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        transition:
          background 140ms ease,
          color 140ms ease,
          border-color 140ms ease,
          transform 140ms ease;
        &:hover {
          transform: translateY(-1px);
          border-color: var(--chip-color);
        }
        &:focus-visible {
          outline: 2px solid var(--chip-color);
          outline-offset: 2px;
        }
        &.is-active {
          background: var(--chip-color);
          border-color: var(--chip-color);
          color: #fff;
          .tm-chip__dot {
            background: #fff;
          }
        }
      }
      .tm-chip__dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--chip-color);
      }
      .tm-map {
        width: 100%;
        height: 420px;
        background: var(--teal-light);
      }
      @media (max-width: 640px) {
        .tm-map {
          height: 320px;
        }
      }
      .tm-missing {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0;
        padding: 10px 18px;
        border-top: 1px dashed var(--border);
        font-size: 0.8rem;
        color: var(--text-secondary);
        .ms {
          font-size: 16px;
        }
      }
      .tm-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 40px 20px;
        text-align: center;
        color: var(--text-secondary);
        .ms {
          font-size: 40px;
          opacity: 0.45;
          margin-bottom: 6px;
        }
      }
      .tm-empty__title {
        margin: 0;
        font-weight: 700;
        color: var(--text-primary);
      }
      .tm-empty__hint {
        margin: 0;
        font-size: 0.85rem;
      }
      :host ::ng-deep .tm-pin {
        display: grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 2.5px solid #fff;
        box-shadow: 0 4px 12px rgba(10, 25, 30, 0.35);
        color: #fff;
        font-family: inherit;
        font-size: 13px;
        font-weight: 800;
        line-height: 1;
      }
      :host ::ng-deep .tm-popup {
        font-family: inherit;
        min-width: 140px;
      }
      :host ::ng-deep .tm-popup__title {
        display: block;
        font-weight: 800;
        margin-bottom: 2px;
      }
      :host ::ng-deep .tm-popup__meta {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.78rem;
        color: var(--text-secondary);
        .ms {
          font-size: 15px;
        }
      }
    `,
  ],
})
export class TripMapComponent implements OnInit, OnDestroy {
  @Input({ required: true }) bookingId = '';

  private readonly http = inject(HttpClient);
  private readonly transloco = inject(TranslocoService);

  readonly loading = signal(true);
  readonly stops = signal<TripMapStop[]>([]);
  readonly missingCoords = signal(0);
  readonly activeDay = signal<number | null>(null);
  readonly days = computed(() => [...new Set(this.stops().map(s => s.day))].sort((a, b) => a - b));

  private map: L.Map | null = null;
  private layers: L.Layer[] = [];

  /** The map container only exists once data has loaded; init Leaflet when it appears. */
  @ViewChild('mapEl')
  set mapRef(ref: ElementRef<HTMLElement> | undefined) {
    if (ref && !this.map) {
      this.initMap(ref.nativeElement);
    }
  }

  ngOnInit(): void {
    this.http
      .get<ApiWrapper<TripMapResponse>>(`${environment.apiUrl}/trips/${this.bookingId}/map`)
      .pipe(
        map(res => res.data),
        catchError(() => of<TripMapResponse>({ stops: [], missingCoords: 0 })),
      )
      .subscribe(res => {
        this.stops.set(res?.stops ?? []);
        this.missingCoords.set(res?.missingCoords ?? 0);
        this.loading.set(false);
      });
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  selectDay(day: number | null): void {
    this.activeDay.set(day);
    this.render();
  }

  dayColor(day: number): string {
    return DAY_PALETTE[(day - 1) % DAY_PALETTE.length];
  }

  private initMap(host: HTMLElement): void {
    this.map = L.map(host, { scrollWheelZoom: false, center: [42.2, 12.8], zoom: 5 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);
    this.render();
    // Re-layout tiles once the card has its final size.
    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  private visibleStops(): TripMapStop[] {
    const day = this.activeDay();
    const all = this.stops();
    return day === null ? all : all.filter(s => s.day === day);
  }

  private render(): void {
    if (!this.map) {
      return;
    }
    this.layers.forEach(layer => layer.remove());
    this.layers = [];

    const visible = this.visibleStops();
    if (visible.length === 0) {
      return;
    }

    // One polyline per day, connecting that day's stops in itinerary order.
    for (const day of new Set(visible.map(s => s.day))) {
      const points = visible.filter(s => s.day === day).map(s => [s.lat, s.lng] as L.LatLngTuple);
      if (points.length > 1) {
        const line = L.polyline(points, {
          color: this.dayColor(day),
          weight: 3,
          opacity: 0.75,
          dashArray: '6 8',
        }).addTo(this.map);
        this.layers.push(line);
      }
    }

    visible.forEach((stop, index) => {
      const marker = L.marker([stop.lat, stop.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div class="tm-pin" style="background:${this.dayColor(stop.day)}">${index + 1}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -16],
        }),
        riseOnHover: true,
      })
        .bindPopup(this.popupHtml(stop))
        .addTo(this.map!);
      this.layers.push(marker);
    });

    const bounds = L.latLngBounds(visible.map(s => [s.lat, s.lng] as L.LatLngTuple));
    this.map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
  }

  private popupHtml(stop: TripMapStop): string {
    const icon = MATERIAL_ICONS[stop.type] ?? 'place';
    const dayLabel = this.transloco.translate('tripMap.day', { n: stop.day });
    const dateLabel = stop.date ? ` · ${this.formatDate(stop.date)}` : '';
    return `<div class="tm-popup">
        <span class="tm-popup__title">${escapeHtml(stop.title)}</span>
        <span class="tm-popup__meta"><span class="ms">${icon}</span>${escapeHtml(dayLabel)}${escapeHtml(dateLabel)}</span>
      </div>`;
  }

  private formatDate(isoDate: string): string {
    const lang = this.transloco.getActiveLang() || 'fr';
    return new Date(isoDate).toLocaleDateString(lang, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
