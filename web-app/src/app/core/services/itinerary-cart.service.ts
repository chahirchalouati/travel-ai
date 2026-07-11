import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { TripCartService } from '../../features/booking-flow/trip-cart.service';
import type {
  CreateBookingRequest,
  ItineraryPlanResponse,
  PlannedRestaurant,
  TravelerRequest,
} from '../models/api.models';

/**
 * Turns a generated itinerary into trip-cart items (hotel + flight + distinct
 * restaurants) and drops them in the cart for a single checkout. Shared by the
 * planner page and the chat concierge so both add trips the same way.
 */
@Injectable({ providedIn: 'root' })
export class ItineraryCartService {
  private readonly cart = inject(TripCartService);
  private readonly auth = inject(AuthService);

  /** Adds the whole itinerary to the trip cart; returns how many items were added. */
  addAll(it: ItineraryPlanResponse): number {
    const items = this.build(it);
    for (const item of items) {
      this.cart.add(item);
    }
    return items.length;
  }

  private build(it: ItineraryPlanResponse) {
    const party = it.party;
    const travelers = this.leadTravelers();
    const items = [];

    if (it.hotel?.totalCost != null) {
      const amount = it.hotel.totalCost;
      items.push(this.item('hotel', it.hotel.name, `${it.nights} nights · ${it.destination}`, amount,
        it.currency, this.request({ hotelId: it.hotel.hotelId, hotelAmount: amount }, it, amount, party, travelers)));
    }
    if (it.flight?.price != null) {
      const amount = this.round(it.flight.price * party);
      items.push(this.item('flight', it.flight.airline, `${it.flight.origin} → ${it.flight.destination}`, amount,
        it.currency, this.request({ flightId: it.flight.flightId, flightAmount: amount }, it, amount, party, travelers)));
    }
    for (const r of this.distinctRestaurants(it)) {
      if (r.costPerPerson == null) {
        continue;
      }
      const amount = this.round(r.costPerPerson * party);
      items.push(this.item('restaurant', r.name, r.cuisine ?? it.destination, amount,
        it.currency, this.request({ restaurantId: r.restaurantId, restaurantAmount: amount }, it, amount, party, travelers)));
    }
    return items;
  }

  private item(type: 'hotel' | 'flight' | 'restaurant', title: string, subtitle: string,
               amount: number, currency: string, request: CreateBookingRequest) {
    return { type, title, subtitle, amount, currency, request } as const;
  }

  private request(vertical: Partial<CreateBookingRequest>, it: ItineraryPlanResponse,
                  amount: number, party: number, travelers: TravelerRequest[]): CreateBookingRequest {
    return { ...vertical, destination: it.destination, totalAmount: amount, partySize: party, travelers };
  }

  private distinctRestaurants(it: ItineraryPlanResponse): PlannedRestaurant[] {
    const seen = new Set<string>();
    const out: PlannedRestaurant[] = [];
    for (const day of it.plan) {
      const r = day.dinner;
      if (r && !seen.has(r.restaurantId)) {
        seen.add(r.restaurantId);
        out.push(r);
      }
    }
    return out;
  }

  private leadTravelers(): TravelerRequest[] {
    const u = this.auth.currentUser();
    if (!u) {
      return [];
    }
    return [{ firstName: u.firstName ?? '', lastName: u.lastName ?? '', primary: true }];
  }

  private round(n: number): number {
    return Math.round(n * 100) / 100;
  }
}
