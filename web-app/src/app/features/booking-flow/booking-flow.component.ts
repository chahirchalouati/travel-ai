import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, map, of, switchMap } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { PaymentService } from '../../core/services/payment.service';
import { PromoService } from '../../core/services/promo.service';
import type { BookingResponse, PaymentGateway } from '../../core/models/api.models';
import { BookingDraftService } from './booking-draft.service';
import { TripCartService } from './trip-cart.service';

type Step = 'configure' | 'travelers' | 'review' | 'done';

const STEP_ORDER: readonly Step[] = ['configure', 'travelers', 'review', 'done'];

const GATEWAYS: readonly PaymentGateway[] = ['STRIPE', 'PAYPAL', 'KLARNA'];

const VERTICAL_ICON: Record<string, string> = {
  flight: 'flight',
  restaurant: 'restaurant',
  cruise: 'directions_boat',
};

@Component({
  selector: 'app-booking-flow',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, TranslocoModule],
  templateUrl: './booking-flow.component.html',
  styleUrl: './booking-flow.component.scss',
})
export class BookingFlowComponent {
  protected readonly store = inject(BookingDraftService);
  protected readonly cart = inject(TripCartService);
  private readonly bookings = inject(BookingService);
  private readonly payments = inject(PaymentService);
  private readonly promo = inject(PromoService);
  private readonly router = inject(Router);

  protected readonly step = signal<Step>('configure');
  protected readonly submitting = signal(false);
  protected readonly errorKey = signal<string | null>(null);
  protected readonly confirmed = signal<BookingResponse | null>(null);
  protected readonly gateway = signal<PaymentGateway>('STRIPE');
  protected promoInput = '';
  protected readonly promoMsgKey = signal<string | null>(null);

  /** Validates the entered promo code against the pre-discount amount. */
  protected applyPromo(): void {
    const code = this.promoInput.trim();
    if (!code) {
      return;
    }
    const amount = this.store.subtotal() + this.store.serviceFee();
    this.promo.validate(code, amount).pipe(catchError(() => of(null))).subscribe(res => {
      if (res && res.valid) {
        this.store.discount.set(res.discountAmount);
        this.store.appliedPromo.set(res.code);
        this.promoMsgKey.set('booking.flow.promoApplied');
      } else {
        this.store.discount.set(0);
        this.store.appliedPromo.set(null);
        this.promoMsgKey.set('booking.flow.promoInvalid');
      }
    });
  }

  protected readonly steps = STEP_ORDER;
  protected readonly gateways = GATEWAYS;
  protected readonly stepIndex = computed(() => STEP_ORDER.indexOf(this.step()));

  protected icon(): string {
    return VERTICAL_ICON[this.store.draft()?.vertical ?? 'flight'] ?? 'confirmation_number';
  }

  protected next(): void {
    if (this.step() === 'configure') {
      this.step.set('travelers');
    } else if (this.step() === 'travelers') {
      this.step.set('review');
    }
  }

  protected back(): void {
    if (this.step() === 'travelers') {
      this.step.set('configure');
    } else if (this.step() === 'review') {
      this.step.set('travelers');
    }
  }

  protected confirm(): void {
    const req = this.store.toRequest();
    if (!req || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.errorKey.set(null);

    // Booking is created PENDING, then the simulated gateway is initiated and
    // confirmed; the backend flips the booking to CONFIRMED on payment completion.
    this.bookings
      .create(req)
      .pipe(
        switchMap(booking =>
          this.payments
            .initiate({
              bookingId: booking.id,
              amount: booking.totalAmount,
              gateway: this.gateway(),
              type: 'CARD',
              currency: 'EUR',
            })
            .pipe(
              switchMap(payment => this.payments.confirm(payment.id)),
              map(() => booking),
            ),
        ),
        catchError((err: unknown) => of(this.toError(err))),
      )
      .subscribe(result => {
        this.submitting.set(false);
        if (result === null) {
          return;
        }
        this.confirmed.set(result);
        this.step.set('done');
      });
  }

  /** Adds the current selection to the trip cart instead of booking it alone. */
  protected addToTrip(): void {
    const req = this.store.toRequest();
    const d = this.store.draft();
    if (!req || !d) {
      return;
    }
    this.cart.add({
      type: d.vertical,
      title: d.title,
      subtitle: d.subtitle,
      amount: this.store.total(),
      currency: d.currency,
      request: req,
    });
    this.store.clear();
    this.router.navigate(['/trip-cart']);
  }

  protected goToBookings(): void {
    this.store.clear();
    this.router.navigate(['/bookings']);
  }

  protected cancel(): void {
    this.store.clear();
    this.router.navigate(['/']);
  }

  /** Maps an HTTP error to an i18n key, returns null to signal "do not advance". */
  private toError(err: unknown): null {
    const status = (err as { status?: number })?.status;
    this.errorKey.set(status === 401 || status === 403 ? 'booking.flow.errorAuth' : 'booking.flow.error');
    return null;
  }
}
