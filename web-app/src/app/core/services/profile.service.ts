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

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  getOverview(): Observable<ProfileOverview> {
    return this.http.get<ApiWrapper<ProfileOverview>>(`${environment.apiUrl}/users/me/overview`).pipe(
      map(res => res.data)
    );
  }
}
