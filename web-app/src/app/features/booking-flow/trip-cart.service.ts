import { Injectable, computed, signal } from '@angular/core';
import type { CreateBookingRequest } from '../../core/models/api.models';
import type { BookingVertical } from './booking-draft.service';

/** One finalized item in the multi-vertical trip cart, ready to be booked. */
export interface TripCartItem {
  readonly type: BookingVertical;
  readonly title: string;
  readonly subtitle: string;
  readonly amount: number;
  readonly currency: string;
  /** Fully-built booking payload captured from the funnel selection. */
  readonly request: CreateBookingRequest;
}

const STORAGE_KEY = 'ai_trip_cart';

/**
 * Holds a multi-vertical trip (flight + hotel + restaurant + cruise) so the user
 * can assemble a whole trip and book it in one checkout. Persisted to
 * localStorage and signal-based so the header badge and cart update live.
 */
@Injectable({ providedIn: 'root' })
export class TripCartService {
  private readonly _items = signal<TripCartItem[]>(this.load());

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);
  readonly total = computed(() => this._items().reduce((sum, i) => sum + i.amount, 0));
  readonly currency = computed(() => this._items()[0]?.currency ?? 'EUR');

  add(item: TripCartItem): void {
    this._items.update(list => this.persist([...list, item]));
  }

  removeAt(index: number): void {
    this._items.update(list => this.persist(list.filter((_, i) => i !== index)));
  }

  clear(): void {
    this._items.set(this.persist([]));
  }

  private persist(list: TripCartItem[]): TripCartItem[] {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // storage unavailable — keep in-memory only
    }
    return list;
  }

  private load(): TripCartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as TripCartItem[]) : [];
    } catch {
      return [];
    }
  }
}
