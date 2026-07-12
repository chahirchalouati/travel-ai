import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper } from '../models/api.models';

export type MediaFolder = 'avatars' | 'covers' | 'gallery' | 'stories' | 'content';

export interface MediaUploadResponse {
  url: string;
  key: string;
  contentType: string;
  size: number;
}

/** Uploads images to the backend object-storage endpoint (MinIO/S3). */
@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);

  upload(file: File, folder: MediaFolder): Observable<MediaUploadResponse> {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);
    return this.http
      .post<ApiWrapper<MediaUploadResponse>>(`${environment.apiUrl}/media`, form)
      .pipe(map(res => res.data));
  }
}
