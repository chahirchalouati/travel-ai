import { Injectable, computed, signal } from '@angular/core';

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

const STORAGE_KEY = 'ai_favorites';

/**
 * Wishlist of catalog items, persisted to localStorage (survives reloads, no
 * account required). Exposes reactive signals so hearts and the count update
 * everywhere at once.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly _items = signal<FavoriteItem[]>(this.load());

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);

  has(type: FavoriteType, id: string): boolean {
    return this._items().some(f => f.type === type && f.id === id);
  }

  /** Adds the item if absent, removes it if present. Returns the new state. */
  toggle(item: Omit<FavoriteItem, 'savedAt'>): boolean {
    if (this.has(item.type, item.id)) {
      this.remove(item.type, item.id);
      return false;
    }
    this._items.update(list => this.persist([{ ...item, savedAt: Date.now() }, ...list]));
    return true;
  }

  remove(type: FavoriteType, id: string): void {
    this._items.update(list => this.persist(list.filter(f => !(f.type === type && f.id === id))));
  }

  clear(): void {
    this._items.set(this.persist([]));
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
