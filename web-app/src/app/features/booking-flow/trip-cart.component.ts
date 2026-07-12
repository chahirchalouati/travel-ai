import { Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { PaymentService } from '../../core/services/payment.service';
import { TripCartService, type TripCartItem } from './trip-cart.service';

const VERTICAL_ICON: Record<string, string> = {
  flight: 'flight',
  restaurant: 'restaurant',
  cruise: 'directions_boat',
  hotel: 'hotel',
};

@Component({
  selector: 'app-trip-cart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, TranslocoModule],
  templateUrl: './trip-cart.component.html',
  styleUrl: './trip-cart.component.scss',
})
export class TripCartComponent {
  protected readonly cart = inject(TripCartService);
  private readonly bookings = inject(BookingService);
  private readonly payments = inject(PaymentService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly errorKey = signal<string | null>(null);
  protected readonly references = signal<string[] | null>(null);

  protected icon(type: string): string {
    return VERTICAL_ICON[type] ?? 'confirmation_number';
  }

  /** Books every item (create → pay → confirm) and shows the references. */
  protected checkout(): void {
    const items = this.cart.items();
    if (items.length === 0 || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.errorKey.set(null);

    // One shared id ties this checkout's bookings into a trip group so they can
    // share a single consolidated invoice.
    const tripGroupId = crypto.randomUUID();

    forkJoin(items.map(item => this.bookOne(item, tripGroupId)))
      .pipe(catchError((err: unknown) => of(this.toError(err))))
      .subscribe(refs => {
        this.submitting.set(false);
        if (refs === null) {
          return;
        }
        this.references.set(refs);
        this.cart.clear();
      });
  }

  private bookOne(item: TripCartItem, tripGroupId: string) {
    return this.bookings.create({ ...item.request, tripGroupId }).pipe(
      switchMap(booking =>
        this.payments
          .initiate({
            bookingId: booking.id,
            amount: booking.totalAmount,
            gateway: 'STRIPE',
            type: 'CARD',
            currency: item.currency,
          })
          .pipe(
            switchMap(payment => this.payments.confirm(payment.id)),
            map(() => booking.bookingReference),
          ),
      ),
    );
  }

  protected continueShopping(): void {
    this.router.navigate(['/']);
  }

  protected goToBookings(): void {
    this.router.navigate(['/bookings']);
  }

  private toError(err: unknown): null {
    const status = (err as { status?: number })?.status;
    this.errorKey.set(status === 401 || status === 403 ? 'booking.flow.errorAuth' : 'booking.flow.error');
    return null;
  }
}
