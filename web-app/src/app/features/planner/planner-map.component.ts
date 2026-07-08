import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges,
  ElementRef, ViewChild, AfterViewInit, OnDestroy
} from '@angular/core';
import * as L from 'leaflet';

export interface PlannerPin {
  id: string;
  dest: string;
  total: string;       // formatted total, e.g. "1.190"
  recommended: boolean;
}

/**
 * Full-bleed destination map for the trip planner.
 * Resolves coordinates from the destination name / id against a known table
 * (demo Italian destinations), falling back to spread points around Italy so
 * backend-generated proposals still render distinct, tappable pins.
 */
@Component({
  selector: 'app-planner-map',
  standalone: true,
  template: `<div class="pmap" #mapEl></div>`,
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
      border-radius: 999px;
      background: rgba(255,255,255,0.86);
      -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
      border: 1.5px solid rgba(255,255,255,0.9);
      box-shadow: 0 6px 18px rgba(8,28,38,0.28);
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
      background: linear-gradient(135deg, var(--brand), var(--brand-hover));
      border-color: rgba(255,255,255,0.95);
      color: #fff;
      box-shadow: 0 10px 26px rgba(190,67,41,0.5);
      transform: scale(1.06);
    }
    :host ::ng-deep .pmap-pin--sel .pmap-dot__head { background: #fff; color: var(--brand); }
    :host ::ng-deep .pmap-pin--rec:not(.pmap-pin--sel) .pmap-dot__head { background: var(--gold); }
  `]
})
export class PlannerMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() pins: PlannerPin[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<string>();

  @ViewChild('mapEl') mapEl!: ElementRef<HTMLElement>;

  private map: L.Map | null = null;
  private markers = new Map<string, L.Marker>();

  // Known demo destinations → [lat, lng]
  private readonly coords: Record<string, [number, number]> = {
    amalfi: [40.634, 14.602], positano: [40.628, 14.485], cinque: [44.135, 9.684],
    vernazza: [44.135, 9.684], venezia: [45.438, 12.327], venice: [45.438, 12.327],
    firenze: [43.769, 11.256], florence: [43.769, 11.256], sardegna: [40.121, 9.012],
    sardinia: [40.121, 9.012], capri: [40.551, 14.243], napoli: [40.852, 14.268],
    naples: [40.852, 14.268], roma: [41.902, 12.496], rome: [41.902, 12.496],
    sicilia: [37.600, 14.015], sicily: [37.600, 14.015], matera: [40.666, 16.604],
    puglia: [40.793, 17.103], apulia: [40.793, 17.103],
  };

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
    this.map?.remove();
    this.map = null;
  }

  private resolve(pin: PlannerPin, index: number): [number, number] {
    const key = Object.keys(this.coords).find(k =>
      pin.id.toLowerCase().includes(k) || pin.dest.toLowerCase().includes(k)
    );
    if (key) return this.coords[key];
    // Fallback: spread unknown points around central Italy
    const angle = (index / Math.max(1, this.pins.length)) * Math.PI * 2;
    return [42.2 + Math.sin(angle) * 2.4, 12.8 + Math.cos(angle) * 2.8];
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
               <span class="pmap-dot__name">${pin.dest}</span>
               <span class="pmap-dot__price">€${pin.total}</span>
             </div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }

  private render(): void {
    if (!this.map) return;
    this.markers.forEach(m => m.remove());
    this.markers.clear();
    if (!this.pins.length) return;

    const latlngs: L.LatLngTuple[] = [];
    this.pins.forEach((pin, i) => {
      const ll = this.resolve(pin, i);
      latlngs.push(ll);
      const marker = L.marker(ll, { icon: this.buildIcon(pin), riseOnHover: true })
        .addTo(this.map!)
        .on('click', () => this.select.emit(pin.id));
      this.markers.set(pin.id, marker);
    });

    if (latlngs.length === 1) {
      this.map.setView(latlngs[0], 9, { animate: true });
    } else {
      this.map.fitBounds(L.latLngBounds(latlngs), { padding: [90, 90], maxZoom: 8 });
    }
  }

  private refreshSelection(): void {
    this.pins.forEach(pin => {
      const marker = this.markers.get(pin.id);
      marker?.setIcon(this.buildIcon(pin));
    });
    const sel = this.selectedId ? this.markers.get(this.selectedId) : null;
    if (sel && this.map) {
      this.map.panTo(sel.getLatLng(), { animate: true });
    }
  }
}
