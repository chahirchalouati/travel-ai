import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { TripPlannerService } from '../../core/services/trip-planner.service';
import { AuthService } from '../../core/services/auth.service';
import { ItineraryCartService } from '../../core/services/itinerary-cart.service';
import type { ItineraryPlanResponse } from '../../core/models/api.models';

/**
 * AI trip planner: a short brief produces a grounded, day-by-day itinerary from
 * the real catalogue, which the traveller can drop into the trip cart in one tap
 * (hotel + flight + restaurants) and check out together.
 */
@Component({
  selector: 'app-trip-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  templateUrl: './trip-planner.component.html',
  styleUrl: './trip-planner.component.scss',
})
export class TripPlannerComponent {
  private readonly planner = inject(TripPlannerService);
  private readonly itineraryCart = inject(ItineraryCartService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isAuthenticated = this.auth.isAuthenticated;

  // Brief form
  protected destination = '';
  protected days = 3;
  protected adults = 2;
  protected children = 0;
  protected budget: number | null = null;
  protected interests = '';

  protected readonly itinerary = signal<ItineraryPlanResponse | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly added = signal(false);

  protected readonly currency = computed(() => this.itinerary()?.currency ?? 'EUR');

  protected plan(): void {
    const destination = this.destination.trim();
    if (!destination || this.loading()) {
      return;
    }
    if (!this.isAuthenticated()) {
      this.router.navigate(['/'], { queryParams: { auth: 'login', next: '/trip-planner' } });
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.added.set(false);
    this.itinerary.set(null);

    this.planner.plan({
      destination,
      days: this.days,
      adults: this.adults,
      children: this.children,
      budget: this.budget ?? undefined,
      interests: this.parseInterests(),
    }).pipe(
      catchError(() => {
        this.error.set('tripPlanner.error');
        return of(null);
      }),
    ).subscribe(result => {
      this.loading.set(false);
      this.itinerary.set(result);
    });
  }

  /** Drops the whole itinerary (hotel + flight + distinct restaurants) into the trip cart. */
  protected addAllToTrip(): void {
    const it = this.itinerary();
    if (!it) {
      return;
    }
    this.itineraryCart.addAll(it);
    this.added.set(true);
    this.router.navigate(['/trip-cart']);
  }

  private parseInterests(): string[] | undefined {
    const parts = this.interests.split(',').map(s => s.trim()).filter(Boolean);
    return parts.length > 0 ? parts : undefined;
  }
}
