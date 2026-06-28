import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, HotelSearchResult, FlightSearchResult, RestaurantSearchResult, CruiseSearchResult } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  getHotel(id: string): Observable<HotelSearchResult> {
    return this.http.get<ApiWrapper<HotelSearchResult>>(`${environment.apiUrl}/catalog/hotels/${id}`).pipe(
      map(res => res.data)
    );
  }

  getFlight(id: string): Observable<FlightSearchResult> {
    return this.http.get<ApiWrapper<FlightSearchResult>>(`${environment.apiUrl}/catalog/flights/${id}`).pipe(
      map(res => res.data)
    );
  }

  getRestaurant(id: string): Observable<RestaurantSearchResult> {
    return this.http.get<ApiWrapper<RestaurantSearchResult>>(`${environment.apiUrl}/catalog/restaurants/${id}`).pipe(
      map(res => res.data)
    );
  }

  getCruise(id: string): Observable<CruiseSearchResult> {
    return this.http.get<ApiWrapper<CruiseSearchResult>>(`${environment.apiUrl}/catalog/cruises/${id}`).pipe(
      map(res => res.data)
    );
  }
}
