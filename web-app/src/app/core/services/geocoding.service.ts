import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, map, catchError, shareReplay } from 'rxjs';

/** A resolved coordinate pair, or null when the place could not be located. */
export type LatLng = [number, number] | null;

interface OpenMeteoResult {
  latitude: number;
  longitude: number;
}
interface OpenMeteoResponse {
  results?: OpenMeteoResult[];
}

const OPEN_METEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const CACHE_STORAGE_KEY = 'travelai_geocode_cache_v1';

/**
 * Resolves a free-text place name (e.g. "Amalfi", "Kyoto") to coordinates using
 * the open, key-less, CORS-friendly Open-Meteo Geocoding API.
 *
 * No coordinates are hardcoded: everything is fetched at runtime and cached
 * (in-memory + localStorage) so repeat lookups are instant and the API is hit
 * at most once per distinct place. Failures resolve to `null` — callers must
 * handle "unknown" honestly rather than inventing a position.
 *
 * NOTE: production CSP must allow `connect-src https://geocoding-api.open-meteo.com`.
 */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly http = inject(HttpClient);

  /** In-flight / resolved lookups, keyed by normalised query. */
  private readonly cache = new Map<string, Observable<LatLng>>();
  /** Persisted successful resolutions, keyed by normalised query. */
  private readonly persisted = this.loadPersisted();

  geocode(place: string): Observable<LatLng> {
    const key = place.trim().toLowerCase();
    if (!key) {
      return of(null);
    }

    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const stored = this.persisted[key];
    if (stored) {
      const hit = of<LatLng>(stored);
      this.cache.set(key, hit);
      return hit;
    }

    const params = new HttpParams()
      .set('name', place.trim())
      .set('count', '1')
      .set('language', 'en')
      .set('format', 'json');

    const request = this.http
      .get<OpenMeteoResponse>(OPEN_METEO_GEOCODING_URL, { params })
      .pipe(
        map((res): LatLng => {
          const first = res.results?.[0];
          if (!first) {
            return null;
          }
          const coord: LatLng = [first.latitude, first.longitude];
          this.remember(key, coord);
          return coord;
        }),
        catchError(() => of<LatLng>(null)),
        shareReplay(1),
      );

    this.cache.set(key, request);
    return request;
  }

  private remember(key: string, coord: [number, number]): void {
    this.persisted[key] = coord;
    try {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(this.persisted));
    } catch {
      // localStorage may be unavailable (private mode / quota) — cache stays
      // in-memory only, which is still correct.
    }
  }

  private loadPersisted(): Record<string, [number, number]> {
    try {
      const raw = localStorage.getItem(CACHE_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, [number, number]>) : {};
    } catch {
      return {};
    }
  }
}
