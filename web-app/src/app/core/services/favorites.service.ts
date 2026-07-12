import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import type { ApiWrapper } from '../models/api.models';

export type FavoriteType = 'flight' | 'restaurant' | 'cruise' | 'hotel' | 'attraction';

/** A saved catalog item, self-contained so /favorites can render it without a refetch. */
export interface FavoriteItem {
  readonly type: FavoriteType;
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly imageUrl?: string;
  /** Router path to the item's detail page. */
  readonly route: string;
  readonly savedAt: number;
}

/** Shape returned by the backend `/api/favorites` endpoints. */
interface FavoriteApiResponse {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  route: string;
  savedAt: string;
}

const STORAGE_KEY = 'ai_favorites';

/**
 * Wishlist of catalog items. Signed-out visitors get a localStorage-only
 * wishlist (survives reloads, no account required). Signed-in users get
 * server-persisted favorites: on login, any locally-saved guest favorites are
 * merged into the account so nothing is lost. Exposes reactive signals so
 * hearts and the count update everywhere at once, with optimistic updates
 * that roll back if the backend call fails.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly _items = signal<FavoriteItem[]>(this.load());

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);

  constructor() {
    // Runs on init (if already signed in) and again whenever isAuthenticated
    // flips to true, so a fresh login pulls the account's favorites and
    // uploads anything saved locally while signed out.
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.syncFromBackend();
      }
    });
  }

  has(type: FavoriteType, id: string): boolean {
    return this._items().some(f => f.type === type && f.id === id);
  }

  /** Adds the item if absent, removes it if present. Returns the new state. */
  toggle(item: Omit<FavoriteItem, 'savedAt'>): boolean {
    const willFavorite = !this.has(item.type, item.id);
    const previous = this._items();

    this._items.update(list =>
      willFavorite
        ? this.persist([{ ...item, savedAt: Date.now() }, ...list])
        : this.persist(list.filter(f => !(f.type === item.type && f.id === item.id)))
    );

    if (this.auth.isAuthenticated()) {
      this.http
        .post<ApiWrapper<unknown>>(`${environment.apiUrl}/favorites/toggle`, toAddRequest(item))
        .pipe(catchError(() => { this.rollback(previous); return of(null); }))
        .subscribe();
    }

    return willFavorite;
  }

  remove(type: FavoriteType, id: string): void {
    const previous = this._items();
    this._items.update(list => this.persist(list.filter(f => !(f.type === type && f.id === id))));

    if (this.auth.isAuthenticated()) {
      this.http
        .delete<ApiWrapper<void>>(`${environment.apiUrl}/favorites/${type.toUpperCase()}/${id}`)
        .pipe(catchError(() => { this.rollback(previous); return of(null); }))
        .subscribe();
    }
  }

  clear(): void {
    this._items.set(this.persist([]));
  }

  /**
   * Pulls the signed-in user's server-side favorites, merges in any
   * guest-saved items that aren't there yet, and pushes those local-only
   * items to the backend so they persist on the account going forward.
   */
  private syncFromBackend(): void {
    this.http
      .get<ApiWrapper<FavoriteApiResponse[]>>(`${environment.apiUrl}/favorites`)
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        if (!res) return;

        const remote = (res.data ?? []).map(fromApiResponse);
        const remoteKeys = new Set(remote.map(itemKey));
        const localOnly = this._items().filter(f => !remoteKeys.has(itemKey(f)));

        localOnly.forEach(item => {
          this.http
            .post<ApiWrapper<FavoriteApiResponse>>(`${environment.apiUrl}/favorites`, toAddRequest(item))
            .pipe(catchError(() => of(null)))
            .subscribe();
        });

        const merged = [...remote, ...localOnly].sort((a, b) => b.savedAt - a.savedAt);
        this._items.set(this.persist(merged));
      });
  }

  private rollback(previous: FavoriteItem[]): void {
    this._items.set(this.persist(previous));
  }

  private persist(list: FavoriteItem[]): FavoriteItem[] {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // storage unavailable (private mode / quota) — keep in-memory only
    }
    return list;
  }

  private load(): FavoriteItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as FavoriteItem[]) : [];
    } catch {
      return [];
    }
  }
}

function itemKey(item: Pick<FavoriteItem, 'type' | 'id'>): string {
  return `${item.type}:${item.id}`;
}

function toAddRequest(item: Omit<FavoriteItem, 'savedAt'>) {
  return {
    entityType: item.type.toUpperCase(),
    entityId: item.id,
    title: item.title,
    subtitle: item.subtitle,
    imageUrl: item.imageUrl,
    route: item.route,
  };
}

function fromApiResponse(res: FavoriteApiResponse): FavoriteItem {
  return {
    type: res.entityType.toLowerCase() as FavoriteType,
    id: res.entityId,
    title: res.title,
    subtitle: res.subtitle ?? undefined,
    imageUrl: res.imageUrl ?? undefined,
    route: res.route,
    savedAt: Date.parse(res.savedAt),
  };
}
