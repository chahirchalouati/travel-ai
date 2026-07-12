import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper } from '../models/api.models';

export interface TravelStory {
  id: string;
  place: string;
  country: string;
  tag: string;
  minutes: number;
  posterUrl: string;
  videoUrl: string | null;
  featured: boolean;
}

@Injectable({ providedIn: 'root' })
export class StoryService {
  private readonly http = inject(HttpClient);

  getStories(): Observable<TravelStory[]> {
    return this.http.get<ApiWrapper<TravelStory[]>>(`${environment.apiUrl}/stories`).pipe(
      map(res => res.data)
    );
  }
}
