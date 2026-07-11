import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges,
  ElementRef, ViewChild, AfterViewInit, OnDestroy, inject
} from '@angular/core';
import { forkJoin, of, Subscription } from 'rxjs';
import * as L from 'leaflet';
import { GeocodingService, LatLng } from '../../core/services/geocoding.service';

export interface PlannerPin {
  id: string;
  dest: string;
  total: string;       // formatted total, e.g. "1.190"
  recommended: boolean;
  lat?: number | null; // authoritative coords from the DB, when available
  lng?: number | null;
}

/** HTML-escape untrusted text before injecting it into a Leaflet DivIcon. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Full-bleed destination map for the trip planner.
 *
 * Coordinates are never hardcoded: a pin either carries authoritative lat/lng
 * from the backend (the DB stores them on hotels/destinations), or its
 * destination name is geocoded at runtime via the open Open-Meteo API (cached).
 * A destination that cannot be resolved is simply omitted from the map rather
 * than shown at a fabricated position.
 */
@Component({
  selector: 'app-planner-map',
  standalone: true,
  template: `<div class="pmap" #mapEl role="application"
                  aria-label="Destination map showing trip proposals"></div>`,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .pmap { width: 100%; height: 100%; background: #aadaff; }
    :host ::ng-deep .pmap-pin {
      display: grid; place-items: center;
      transition: transform 160ms cubic-bezier(0.16,1,0.3,1);
    }
    :host ::ng-deep .pmap-pin:hover { z-index: 1000 !important; }
    :host ::ng-deep .pmap-dot {
      position: relative;
      display: flex; align-items: center; gap: 6px;
      padding: 6px 11px 6px 8px;
      border-radius: 2px;
      background: rgba(255,255,255,0.86);
      -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
      border: 1.5px solid rgba(255,255,255,0.9);
      box-shadow: 0 6px 18px rgba(17, 17, 17, 0.14);
      font-family: var(--font-body);
      font-weight: 800; font-size: 12px; color: #14242E;
      white-space: nowrap; cursor: pointer;
    }
    :host ::ng-deep .pmap-dot__head {
      width: 18px; height: 18px; border-radius: 50%;
      display: grid; place-items: center; flex-shrink: 0;
      background: #14424E; color: #fff; font-size: 11px;
    }
    :host ::ng-deep .pmap-dot__price { font-variant-numeric: tabular-nums; }
    :host ::ng-deep .pmap-pin--sel .pmap-dot {
      background: var(--color-red);
      border-color: rgba(255,255,255,0.95);
      color: #fff;
      box-shadow: 0 10px 26px rgba(17, 17, 17, 0.14);
      transform: scale(1.06);
    }
    :host ::ng-deep .pmap-pin--sel .pmap-dot__head { background: #fff; color: var(--color-red-ink); }
    :host ::ng-deep .pmap-pin--rec:not(.pmap-pin--sel) .pmap-dot__head { background: var(--gold); }
  `]
})
export class PlannerMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() pins: PlannerPin[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<string>();

  @ViewChild('mapEl') mapEl!: ElementRef<HTMLElement>;

  private readonly geocoding = inject(GeocodingService);

  private map: L.Map | null = null;
  private markers = new Map<string, L.Marker>();
  private renderSub?: Subscription;

  /** Honour the user's reduced-motion preference for camera movement. */
  private get reducedMotion(): boolean {
    return typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl.nativeElement, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      center: [42.2, 12.8],
      zoom: 6,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    this.render();
    // Force a tile re-layout once the panel has its final size.
    setTimeout(() => this.map?.invalidateSize(), 250);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;
    if (changes['pins']) this.render();
    else if (changes['selectedId']) this.refreshSelection();
  }

  ngOnDestroy(): void {
    this.renderSub?.unsubscribe();
    this.map?.remove();
    this.map = null;
  }

  private buildIcon(pin: PlannerPin): L.DivIcon {
    const sel = pin.id === this.selectedId;
    const cls = ['pmap-pin'];
    if (sel) cls.push('pmap-pin--sel');
    if (pin.recommended) cls.push('pmap-pin--rec');
    const head = pin.recommended ? '★' : '€';
    return L.divIcon({
      className: cls.join(' '),
      html: `<div class="pmap-dot">
               <span class="pmap-dot__head">${head}</span>
               <span class="pmap-dot__name">${esc(pin.dest)}</span>
               <span class="pmap-dot__price">€${esc(pin.total)}</span>
             </div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }

  /** Coordinates for a pin: authoritative DB value if present, else geocoded. */
  private resolve(pin: PlannerPin) {
    return typeof pin.lat === 'number' && typeof pin.lng === 'number'
      ? of<LatLng>([pin.lat, pin.lng])
      : this.geocoding.geocode(pin.dest);
  }

  private render(): void {
    if (!this.map) return;
    this.renderSub?.unsubscribe();
    this.markers.forEach(m => m.remove());
    this.markers.clear();

    const pins = this.pins;
    if (!pins.length) return;

    // Resolve every pin's coordinates (DB or geocoding) before drawing, so the
    // camera can frame the real bounds of the resolved destinations.
    this.renderSub = forkJoin(pins.map(pin => this.resolve(pin))).subscribe(coords => {
      if (!this.map) return;
      const latlngs: L.LatLngTuple[] = [];

      pins.forEach((pin, i) => {
        const ll = coords[i];
        if (!ll) return; // unknown place → omit rather than fabricate a position
        latlngs.push(ll);
        const marker = L.marker(ll, { icon: this.buildIcon(pin), riseOnHover: true })
          .addTo(this.map!)
          .on('click', () => this.select.emit(pin.id));
        this.markers.set(pin.id, marker);
      });

      if (!latlngs.length) return;
      const animate = !this.reducedMotion;
      if (latlngs.length === 1) {
        this.map.flyTo(latlngs[0], 9, { animate, duration: 0.8 });
      } else {
        this.map.flyToBounds(L.latLngBounds(latlngs), {
          padding: [90, 90], maxZoom: 8, animate, duration: 0.8,
        });
      }
    });
  }

  private refreshSelection(): void {
    this.pins.forEach(pin => {
      const marker = this.markers.get(pin.id);
      marker?.setIcon(this.buildIcon(pin));
    });
    const sel = this.selectedId ? this.markers.get(this.selectedId) : null;
    if (sel && this.map) {
      // Zoom in toward the chosen destination for a "focus" feel, without
      // ever zooming back out if the user is already closer.
      const targetZoom = Math.max(this.map.getZoom(), 6);
      this.map.flyTo(sel.getLatLng(), targetZoom, {
        animate: !this.reducedMotion, duration: 0.6,
      });
    }
  }
}
