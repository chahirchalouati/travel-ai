import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, ReviewResponse } from '../models/api.models';

export interface ProfileStats {
  reviewCount: number;
  helpfulVotes: number;
  photoCount: number;
  tripCount: number;
  placesCount: number;
}

export interface ProfileActivity {
  icon: string;
  color: string;
  text: string;
  time: string;
}

export interface ProfileAchievement {
  icon: string;
  label: string;
  sublabel: string;
  locked: boolean;
  color: string;
}

export interface ProfileTrip {
  title: string;
  location: string;
  status: string;
  dates: string;
}

export interface ProfileOverview {
  displayName: string;
  handle: string;
  memberSinceYear: number;
  stats: ProfileStats;
  reviews: ReviewResponse[];
  photos: string[];
  activity: ProfileActivity[];
  achievements: ProfileAchievement[];
  trips: ProfileTrip[];
  places: string[];
}

export interface TravelPlace {
  id: string;
  name: string;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  visitedOn: string | null;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption: string | null;
  place: string | null;
  createdAt: string;
}

export interface ProfileMediaUpdate {
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  location?: string;
  handle?: string;
}

export interface PlaceInput {
  name: string;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  note?: string | null;
  visitedOn?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users/me`;

  getOverview(): Observable<ProfileOverview> {
    return this.http.get<ApiWrapper<ProfileOverview>>(`${this.base}/overview`).pipe(map(res => res.data));
  }

  // ── Presentation (avatar / cover / bio / location / handle) ──────────────
  updateMedia(update: ProfileMediaUpdate): Observable<unknown> {
    return this.http.patch<ApiWrapper<unknown>>(`${this.base}/media`, update).pipe(map(res => res.data));
  }

  // ── Travel-map places ────────────────────────────────────────────────────
  listPlaces(): Observable<TravelPlace[]> {
    return this.http.get<ApiWrapper<TravelPlace[]>>(`${this.base}/places`).pipe(map(res => res.data ?? []));
  }

  addPlace(place: PlaceInput): Observable<TravelPlace> {
    return this.http.post<ApiWrapper<TravelPlace>>(`${this.base}/places`, place).pipe(map(res => res.data));
  }

  updatePlace(id: string, place: PlaceInput): Observable<TravelPlace> {
    return this.http.put<ApiWrapper<TravelPlace>>(`${this.base}/places/${id}`, place).pipe(map(res => res.data));
  }

  deletePlace(id: string): Observable<unknown> {
    return this.http.delete<ApiWrapper<unknown>>(`${this.base}/places/${id}`).pipe(map(res => res.data));
  }

  // ── Photo gallery ────────────────────────────────────────────────────────
  listPhotos(): Observable<GalleryPhoto[]> {
    return this.http.get<ApiWrapper<GalleryPhoto[]>>(`${this.base}/photos`).pipe(map(res => res.data ?? []));
  }

  addPhoto(photo: { url: string; caption?: string | null; place?: string | null }): Observable<GalleryPhoto> {
    return this.http.post<ApiWrapper<GalleryPhoto>>(`${this.base}/photos`, photo).pipe(map(res => res.data));
  }

  deletePhoto(id: string): Observable<unknown> {
    return this.http.delete<ApiWrapper<unknown>>(`${this.base}/photos/${id}`).pipe(map(res => res.data));
  }
}
