import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, map, of, switchMap } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { PaymentService } from '../../core/services/payment.service';
import { PromoService } from '../../core/services/promo.service';
import { LoyaltyService } from '../../core/services/loyalty.service';
import { AncillaryService } from '../../core/services/ancillary.service';
import { SubscriptionService } from '../../core/services/subscription.service';
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
  private readonly loyalty = inject(LoyaltyService);
  private readonly ancillary = inject(AncillaryService);
  private readonly subscriptions = inject(SubscriptionService);
  private readonly router = inject(Router);

  /** Whether the signed-in member has Travel AI Prime (for the review banner). */
  protected readonly primeActive = this.store.primeActive;

  protected readonly step = signal<Step>('configure');
  protected readonly submitting = signal(false);
  protected readonly errorKey = signal<string | null>(null);
  protected readonly confirmed = signal<BookingResponse | null>(null);
  protected readonly gateway = signal<PaymentGateway>('STRIPE');
  protected promoInput = '';
  protected readonly promoMsgKey = signal<string | null>(null);

  /** Loyalty points balance (0 until loaded); the toggle shows when ≥ 500. */
  protected readonly pointsBalance = signal(0);
  protected readonly redeemOn = signal(false);
  /** Whether the member has enough points to redeem (500 minimum). */
  protected readonly canRedeem = computed(() => this.pointsBalance() >= 500);

  constructor() {
    // Load the balance once so the review step can offer redemption.
    this.loyalty.summary().pipe(catchError(() => of(null))).subscribe(res => {
      if (res) {
        this.pointsBalance.set(res.pointsBalance);
      }
    });

    // Load the add-on catalogue for this booking's vertical.
    const vertical = this.store.draft()?.vertical;
    if (vertical) {
      this.ancillary.list(vertical).pipe(catchError(() => of([]))).subscribe(options => {
        this.store.ancillaryOptions.set(options);
      });
    }

    // Apply Travel AI Prime benefits (fee waiver + member discount) when active.
    this.subscriptions.me().pipe(catchError(() => of(null))).subscribe(m => {
      this.store.primeActive.set(m?.active === true && m.serviceFeeWaived);
      this.store.memberDiscountPct.set(m?.active ? m.memberDiscountPct : 0);
    });
  }

  /**
   * Toggles points redemption. When enabled, previews the maximum redeemable
   * points against the current pre-loyalty total and wires the discount into the
   * draft; when disabled, clears it.
   */
  protected toggleRedeem(): void {
    const on = !this.redeemOn();
    this.redeemOn.set(on);
    if (!on) {
      this.store.redeemedPoints.set(0);
      this.store.loyaltyDiscount.set(0);
      return;
    }
    // Preview against the total before any loyalty discount (promo already applied).
    const amount = Math.max(0, this.store.subtotal() + this.store.serviceFee() - this.store.discount());
    this.loyalty.redeemPreview(amount).pipe(catchError(() => of(null))).subscribe(res => {
      if (res && res.maxRedeemablePoints >= 500) {
        this.store.redeemedPoints.set(res.maxRedeemablePoints);
        this.store.loyaltyDiscount.set(res.discountAmount);
      } else {
        this.redeemOn.set(false);
        this.store.redeemedPoints.set(0);
        this.store.loyaltyDiscount.set(0);
      }
    });
  }

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
