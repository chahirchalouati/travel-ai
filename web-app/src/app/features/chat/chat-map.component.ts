import {
  Component, Input, OnChanges, SimpleChanges,
  ElementRef, ViewChild, AfterViewInit, OnDestroy
} from '@angular/core';
import * as L from 'leaflet';

export interface MapPin {
  lat: number;
  lng: number;
  label: string;
  type: string;
}

@Component({
  selector: 'app-chat-map',
  standalone: true,
  template: `<div class="map-container" #mapEl></div>`,
  styles: [`
    :host { display: block; }
    .map-container {
      width: 100%;
      height: 220px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border, #e0e0e0);
    }
  `]
})
export class ChatMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() pins: MapPin[] = [];
  @ViewChild('mapEl') mapEl!: ElementRef;

  private map: L.Map | null = null;
  private markers: L.Marker[] = [];

  private readonly iconConfig: Record<string, { color: string; icon: string }> = {
    destination: { color: '#E04A2F', icon: '📍' },
    hotel: { color: '#00856A', icon: '🏨' },
    restaurant: { color: '#F5A623', icon: '🍽️' },
  };

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pins'] && this.map) {
      this.updateMarkers();
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    this.map = L.map(this.mapEl.nativeElement, {
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(this.map);

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    this.updateMarkers();
  }

  private updateMarkers(): void {
    if (!this.map) return;

    this.markers.forEach(m => m.remove());
    this.markers = [];

    const validPins = this.pins.filter(p => p.lat && p.lng);
    if (validPins.length === 0) return;

    validPins.forEach(pin => {
      const config = this.iconConfig[pin.type] ?? this.iconConfig['destination'];

      const icon = L.divIcon({
        className: 'chat-map-pin',
        html: `<div style="
          background: ${config.color};
          color: white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid white;
        ">${config.icon}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([pin.lat, pin.lng], { icon })
        .addTo(this.map!)
        .bindPopup(`<strong>${pin.label}</strong>`, {
          closeButton: false,
          className: 'chat-map-popup',
        });

      this.markers.push(marker);
    });

    if (validPins.length === 1) {
      this.map.setView([validPins[0].lat, validPins[0].lng], 12);
    } else {
      const bounds = L.latLngBounds(validPins.map(p => [p.lat, p.lng] as L.LatLngTuple));
      this.map.fitBounds(bounds, { padding: [30, 30] });
    }
  }
}
