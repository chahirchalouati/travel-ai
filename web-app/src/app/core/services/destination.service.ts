import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, DestinationResponse, DestinationGuide } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class DestinationService {
  private readonly http = inject(HttpClient);

  getAll(page = 0, size = 20): Observable<DestinationResponse[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiWrapper<{ content: DestinationResponse[] }>>(`${environment.apiUrl}/destinations`, { params }).pipe(
      map(res => res.data.content)
    );
  }

  getFeatured(): Observable<DestinationResponse[]> {
    return this.http.get<ApiWrapper<DestinationResponse[]>>(`${environment.apiUrl}/destinations/featured`).pipe(
      map(res => res.data)
    );
  }

  getTrending(limit = 10): Observable<DestinationResponse[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<ApiWrapper<DestinationResponse[]>>(`${environment.apiUrl}/destinations/trending`, { params }).pipe(
      map(res => res.data)
    );
  }

  search(query: string, page = 0, size = 20): Observable<DestinationResponse[]> {
    const params = new HttpParams().set('q', query).set('page', page).set('size', size);
    return this.http.get<ApiWrapper<{ content: DestinationResponse[] }>>(`${environment.apiUrl}/destinations/search`, { params }).pipe(
      map(res => res.data.content)
    );
  }

  getById(id: string): Observable<DestinationResponse> {
    return this.http.get<ApiWrapper<DestinationResponse>>(`${environment.apiUrl}/destinations/${id}`).pipe(
      map(res => res.data)
    );
  }

  getByContinent(continent: string): Observable<DestinationResponse[]> {
    return this.http.get<ApiWrapper<DestinationResponse[]>>(`${environment.apiUrl}/destinations/continent/${continent}`).pipe(
      map(res => res.data)
    );
  }

  getGuide(id: string): Observable<DestinationGuide> {
    return this.http.get<ApiWrapper<DestinationGuide>>(`${environment.apiUrl}/destinations/${id}/guide`).pipe(
      map(res => res.data)
    );
  }
}
