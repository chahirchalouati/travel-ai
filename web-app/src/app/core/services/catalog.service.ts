import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ApiWrapper,
  HotelSearchResult,
  FlightSearchResult,
  RestaurantSearchResult,
  CruiseSearchResult,
} from '../models/api.models';

export interface HotelSearchQuery {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  maxBudget?: number;
}

export interface FlightSearchQuery {
  originIata?: string;
  destIata?: string;
  departureDate?: string;
  passengers?: number;
  maxPrice?: number;
}

export interface RestaurantSearchQuery {
  city?: string;
  date?: string;
  preferredTime?: string;
  covers?: number;
  maxBudgetPerPerson?: number;
  cuisineType?: string;
}

export interface CruiseSearchQuery {
  departurePort?: string;
  cruiseType?: string;
  departureDate?: string;
  passengers?: number;
  maxPrice?: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/catalog`;

  // ── Search (backend returns raw arrays) ──────────────────────
  searchHotels(query: HotelSearchQuery): Observable<HotelSearchResult[]> {
    return this.http.get<HotelSearchResult[]>(`${this.base}/hotels/search`, {
      params: toParams(query),
    });
  }

  searchFlights(query: FlightSearchQuery): Observable<FlightSearchResult[]> {
    return this.http.get<FlightSearchResult[]>(`${this.base}/flights/search`, {
      params: toParams(query),
    });
  }

  searchRestaurants(query: RestaurantSearchQuery): Observable<RestaurantSearchResult[]> {
    return this.http.get<RestaurantSearchResult[]>(`${this.base}/restaurants/search`, {
      params: toParams(query),
    });
  }

  searchCruises(query: CruiseSearchQuery): Observable<CruiseSearchResult[]> {
    return this.http.get<CruiseSearchResult[]>(`${this.base}/cruises/search`, {
      params: toParams(query),
    });
  }

  // ── Detail (wrapped in ApiResponse) ──────────────────────────
  getHotel(id: string): Observable<HotelSearchResult> {
    return this.http
      .get<ApiWrapper<HotelSearchResult>>(`${this.base}/hotels/${id}`)
      .pipe(map(res => res.data));
  }

  getFlight(id: string): Observable<FlightSearchResult> {
    return this.http
      .get<ApiWrapper<FlightSearchResult>>(`${this.base}/flights/${id}`)
      .pipe(map(res => res.data));
  }

  getRestaurant(id: string): Observable<RestaurantSearchResult> {
    return this.http
      .get<ApiWrapper<RestaurantSearchResult>>(`${this.base}/restaurants/${id}`)
      .pipe(map(res => res.data));
  }

  getCruise(id: string): Observable<CruiseSearchResult> {
    return this.http
      .get<ApiWrapper<CruiseSearchResult>>(`${this.base}/cruises/${id}`)
      .pipe(map(res => res.data));
  }
}

/** Builds HttpParams, skipping null/undefined/empty values. */
function toParams(query: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }
    params = params.set(key, String(value));
  }
  return params;
}
