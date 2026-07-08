import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper } from '../models/api.models';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readMin: number;
  dateLabel: string;
  icon: string | null;
  accent: string | null;
  featured: boolean;
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);

  getPosts(): Observable<BlogPost[]> {
    return this.http
      .get<ApiWrapper<BlogPost[]>>(`${environment.apiUrl}/blog/posts`)
      .pipe(map(res => res.data));
  }
}
