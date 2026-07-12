import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, Suggestion } from '../models/api.models';

/** Shortest query we send to the backend; matches SuggestService.MIN_QUERY_LENGTH. */
const MIN_QUERY_LENGTH = 2;

/**
 * Fetches typeahead suggestions for catalog filter fields. Each method returns
 * an empty list (never errors) for short queries or on failure, so callers can
 * pipe it straight into an autocomplete without extra guarding.
 */
@Injectable({ providedIn: 'root' })
export class SuggestService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/catalog/suggest`;

  hotelCities(q: string): Observable<Suggestion[]> {
    return this.fetch('hotel-cities', q);
  }

  restaurantCities(q: string): Observable<Suggestion[]> {
    return this.fetch('restaurant-cities', q);
  }

  cuisines(q: string): Observable<Suggestion[]> {
    return this.fetch('cuisines', q);
  }

  cruisePorts(q: string): Observable<Suggestion[]> {
    return this.fetch('cruise-ports', q);
  }

  cruiseTypes(q: string): Observable<Suggestion[]> {
    return this.fetch('cruise-types', q);
  }

  attractionCities(q: string): Observable<Suggestion[]> {
    return this.fetch('attraction-cities', q);
  }

  airports(q: string): Observable<Suggestion[]> {
    return this.fetch('airports', q);
  }

  private fetch(path: string, q: string): Observable<Suggestion[]> {
    const query = q?.trim() ?? '';
    if (query.length < MIN_QUERY_LENGTH) {
      return of([]);
    }
    return this.http
      .get<ApiWrapper<Suggestion[]>>(`${this.base}/${path}`, { params: { q: query } })
      .pipe(
        map(res => res.data ?? []),
        catchError(() => of([])),
      );
  }
}
