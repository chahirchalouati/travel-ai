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

/** A single page of catalog search results plus pagination metadata. */
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/** Default page size; must match the backend controller default. */
export const CATALOG_PAGE_SIZE = 12;

/** An empty page, used as a safe fallback when a search request fails. */
export function emptyPage<T>(page = 0, total = 0): PagedResult<T> {
  return { items: [], total, page, limit: CATALOG_PAGE_SIZE };
}

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

  // ── Search (paginated; backend wraps results in ApiResponse) ──
  searchHotels(
    query: HotelSearchQuery,
    page = 0,
    size = CATALOG_PAGE_SIZE,
  ): Observable<PagedResult<HotelSearchResult>> {
    return this.searchPaged<HotelSearchResult>('hotels', query, page, size);
  }

  searchFlights(
    query: FlightSearchQuery,
    page = 0,
    size = CATALOG_PAGE_SIZE,
  ): Observable<PagedResult<FlightSearchResult>> {
    return this.searchPaged<FlightSearchResult>('flights', query, page, size);
  }

  searchRestaurants(
    query: RestaurantSearchQuery,
    page = 0,
    size = CATALOG_PAGE_SIZE,
  ): Observable<PagedResult<RestaurantSearchResult>> {
    return this.searchPaged<RestaurantSearchResult>('restaurants', query, page, size);
  }

  searchCruises(
    query: CruiseSearchQuery,
    page = 0,
    size = CATALOG_PAGE_SIZE,
  ): Observable<PagedResult<CruiseSearchResult>> {
    return this.searchPaged<CruiseSearchResult>('cruises', query, page, size);
  }

  /** Shared paginated search: appends page/size and unwraps the ApiResponse envelope. */
  private searchPaged<T>(
    resource: string,
    query: object,
    page: number,
    size: number,
  ): Observable<PagedResult<T>> {
    return this.http
      .get<ApiWrapper<T[]>>(`${this.base}/${resource}/search`, {
        params: toParams({ ...query, page, size }),
      })
      .pipe(
        map(res => ({
          items: res.data ?? [],
          total: res.meta?.total ?? (res.data?.length ?? 0),
          page: res.meta?.page ?? page,
          limit: res.meta?.limit ?? size,
        })),
      );
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
