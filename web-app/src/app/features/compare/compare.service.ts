import { Injectable, computed, signal } from '@angular/core';
import type { HotelSearchResult } from '../../core/models/api.models';

/** Max options compared side by side (spec-sheet stays readable at 3). */
const MAX_COMPARE = 3;

/**
 * Holds the hotels the user has picked to compare. Root-provided so the
 * catalog cards, the floating tray, and the /compare view share one list.
 */
@Injectable({ providedIn: 'root' })
export class CompareService {
  private readonly _items = signal<HotelSearchResult[]>([]);

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);
  readonly isFull = computed(() => this._items().length >= MAX_COMPARE);
  readonly max = MAX_COMPARE;

  has(id: string): boolean {
    return this._items().some((h) => h.id === id);
  }

  /** Add if room, remove if already present. */
  toggle(hotel: HotelSearchResult): void {
    const current = this._items();
    if (current.some((h) => h.id === hotel.id)) {
      this._items.set(current.filter((h) => h.id !== hotel.id));
    } else if (current.length < MAX_COMPARE) {
      this._items.set([...current, hotel]);
    }
  }

  remove(id: string): void {
    this._items.set(this._items().filter((h) => h.id !== id));
  }

  clear(): void {
    this._items.set([]);
  }
}
