import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { BookingService } from './booking.service';
import type { BookingResponse } from '../models/api.models';

/** A destination the user has an active (non-cancelled) trip to. */
export interface TripDestination {
  readonly destination: string;
  readonly checkIn?: string;
  readonly checkOut?: string;
}

const MIN_MATCH_LEN = 3;

/**
 * Lightweight context of the signed-in user's active trips, derived from their
 * bookings. Powers the AI "fits your trip" badge: catalog items whose place
 * matches an active trip destination are flagged as coherent with the plan.
 *
 * Loads lazily once; silently empty when the user is not signed in.
 */
@Injectable({ providedIn: 'root' })
export class TripContextService {
  private readonly bookings = inject(BookingService);
  private readonly _trips = signal<TripDestination[]>([]);
  private loaded = false;

  readonly trips = this._trips.asReadonly();
  readonly hasTrips = computed(() => this._trips().length > 0);

  /** Loads active-trip destinations once. Safe to call repeatedly. */
  ensureLoaded(): void {
    if (this.loaded) {
      return;
    }
    this.loaded = true;
    this.bookings
      .list()
      .pipe(catchError(() => of([] as BookingResponse[])))
      .subscribe(list => this._trips.set(this.toDestinations(list)));
  }

  /**
   * Returns the matching trip destination for a place (city, port, …), or null.
   * Matches case-insensitively in either direction so "Roma" ↔ "Roma, Italy".
   */
  match(place: string | null | undefined): string | null {
    const needle = (place ?? '').trim().toLowerCase();
    if (needle.length < MIN_MATCH_LEN) {
      return null;
    }
    for (const trip of this._trips()) {
      const dest = trip.destination.trim().toLowerCase();
      if (dest.length >= MIN_MATCH_LEN && (dest.includes(needle) || needle.includes(dest))) {
        return trip.destination;
      }
    }
    return null;
  }

  private toDestinations(list: readonly BookingResponse[]): TripDestination[] {
    const byDest = new Map<string, TripDestination>();
    for (const b of list) {
      if (b.status === 'CANCELLED' || !b.destination?.trim()) {
        continue;
      }
      const key = b.destination.trim().toLowerCase();
      if (!byDest.has(key)) {
        byDest.set(key, { destination: b.destination.trim(), checkIn: b.checkIn, checkOut: b.checkOut });
      }
    }
    return [...byDest.values()];
  }
}
