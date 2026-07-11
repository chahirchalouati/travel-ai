import { Injectable, computed, signal } from '@angular/core';
import type { AncillaryOption, AncillarySelection, CreateBookingRequest, MemberRewardResponse, TravelerRequest } from '../../core/models/api.models';

/** Which catalog vertical a booking draft was started from. */
export type BookingVertical = 'flight' | 'restaurant' | 'cruise';

/** A selectable configuration option with a price multiplier (e.g. a fare bundle). */
export interface BookingOption {
  readonly id: string;
  readonly label: string;
  readonly note?: string;
  /** Multiplier applied to the base unit price (1 = no change, 1.35 = +35%). */
  readonly multiplier: number;
}

/**
 * The in-progress booking, seeded from a catalog detail page and refined through
 * the funnel steps. Immutable from the outside — only the service mutates it.
 */
export interface BookingDraft {
  readonly vertical: BookingVertical;
  readonly itemId: string;
  readonly title: string;
  readonly subtitle: string;
  readonly imageUrl?: string;
  readonly destination: string;
  /** Per-person / per-cover base price before option multipliers. */
  readonly unitPrice: number;
  readonly currency: string;
  /** ISO dates carried into the booking where the vertical has them. */
  readonly checkIn?: string;
  readonly checkOut?: string;
  /** Available configuration options for the "Configure" step (fares / cabins). */
  readonly options: readonly BookingOption[];
  /** Restaurant time slots, when applicable. */
  readonly timeSlots?: readonly string[];
  /** Optional aggregate rating shown as social proof in the funnel. */
  readonly rating?: number;
  readonly reviewCount?: number;
}

const MAX_PARTY = 12;
const SERVICE_FEE_RATE = 0.06; // transparent platform fee shown at review

function emptyTraveler(primary: boolean): TravelerRequest {
  return { firstName: '', lastName: '', documentNumber: '', primary };
}

/**
 * Holds the booking draft across the funnel. Root-provided so a catalog detail
 * page can seed it and the funnel route can read it. Pricing is derived (never
 * stored) so the review total always reflects the current selection.
 */
@Injectable({ providedIn: 'root' })
export class BookingDraftService {
  private readonly _draft = signal<BookingDraft | null>(null);

  readonly draft = this._draft.asReadonly();
  readonly hasDraft = computed(() => this._draft() !== null);

  readonly partySize = signal(2);
  readonly selectedOptionId = signal<string | null>(null);
  readonly selectedTimeSlot = signal<string | null>(null);
  readonly travelers = signal<TravelerRequest[]>([emptyTraveler(true), emptyTraveler(false)]);
  /** Applied promo discount (absolute EUR) and the code that produced it. */
  readonly discount = signal(0);
  readonly appliedPromo = signal<string | null>(null);
  /** Loyalty points redeemed on this booking and the EUR discount they buy. */
  readonly redeemedPoints = signal(0);
  readonly loyaltyDiscount = signal(0);
  /** Add-ons available for this vertical and the codes the traveller has selected. */
  readonly ancillaryOptions = signal<readonly AncillaryOption[]>([]);
  readonly selectedAncillaries = signal<readonly string[]>([]);
  /** Travel AI Prime benefits, set from the membership when the funnel loads. */
  readonly primeActive = signal(false);
  readonly memberDiscountPct = signal(0);
  /** A loyalty voucher reward the traveller chose to apply, or null. */
  readonly selectedReward = signal<MemberRewardResponse | null>(null);

  /** Currently selected configuration option, or null when the draft has none. */
  readonly selectedOption = computed<BookingOption | null>(() => {
    const d = this._draft();
    if (!d || d.options.length === 0) {
      return null;
    }
    const id = this.selectedOptionId();
    return d.options.find(o => o.id === id) ?? d.options[0];
  });

  readonly unitPrice = computed(() => {
    const d = this._draft();
    if (!d) {
      return 0;
    }
    return d.unitPrice * (this.selectedOption()?.multiplier ?? 1);
  });

  readonly subtotal = computed(() => this.unitPrice() * this.partySize());

  /** Travel AI Prime waives the platform service fee entirely. */
  readonly serviceFee = computed(() =>
    this.primeActive() ? 0 : Math.round(this.subtotal() * SERVICE_FEE_RATE * 100) / 100);

  /** Members-only discount on the subtotal, granted by an active Prime plan. */
  readonly memberDiscount = computed(() => {
    if (!this.primeActive() || this.memberDiscountPct() <= 0) {
      return 0;
    }
    return Math.round(this.subtotal() * (this.memberDiscountPct() / 100) * 100) / 100;
  });

  /** Sum of the selected add-ons (each priced from the catalogue, quantity 1). */
  readonly ancillaryTotal = computed(() => {
    const selected = this.selectedAncillaries();
    const sum = this.ancillaryOptions()
      .filter(o => selected.includes(o.code))
      .reduce((acc, o) => acc + o.price, 0);
    return Math.round(sum * 100) / 100;
  });

  /** The total before any loyalty voucher is applied. */
  readonly preVoucherTotal = computed(() =>
    Math.max(0, Math.round(
      (this.subtotal() + this.serviceFee() + this.ancillaryTotal()
        - this.memberDiscount() - this.discount() - this.loyaltyDiscount()) * 100) / 100));

  /**
   * EUR discount from the chosen voucher: its fixed amount, else a percentage of
   * the subtotal, capped at the remaining total so it never overshoots. The server
   * re-derives and validates this value against the reward.
   */
  readonly rewardDiscount = computed(() => {
    const reward = this.selectedReward();
    if (!reward) {
      return 0;
    }
    const raw = reward.discountAmount ?? (reward.discountPct
      ? Math.round(this.subtotal() * (reward.discountPct / 100) * 100) / 100
      : 0);
    return Math.min(raw, this.preVoucherTotal());
  });

  readonly total = computed(() =>
    Math.max(0, Math.round((this.preVoucherTotal() - this.rewardDiscount()) * 100) / 100));

  /** Seeds a fresh draft and resets all funnel selections. */
  start(draft: BookingDraft, party = 2): void {
    this._draft.set(draft);
    this.selectedOptionId.set(draft.options[0]?.id ?? null);
    this.selectedTimeSlot.set(draft.timeSlots?.[0] ?? null);
    this.discount.set(0);
    this.appliedPromo.set(null);
    this.redeemedPoints.set(0);
    this.loyaltyDiscount.set(0);
    this.selectedReward.set(null);
    this.ancillaryOptions.set([]);
    this.selectedAncillaries.set([]);
    this.setPartySize(party);
  }

  /** Adds or removes an add-on from the selection (idempotent per code). */
  toggleAncillary(code: string): void {
    this.selectedAncillaries.update(codes =>
      codes.includes(code) ? codes.filter(c => c !== code) : [...codes, code],
    );
  }

  isAncillarySelected(code: string): boolean {
    return this.selectedAncillaries().includes(code);
  }

  setPartySize(size: number): void {
    const clamped = Math.max(1, Math.min(MAX_PARTY, Math.trunc(size) || 1));
    this.partySize.set(clamped);
    this.travelers.update(current => this.resizeTravelers(current, clamped));
  }

  updateTraveler(index: number, patch: Partial<TravelerRequest>): void {
    this.travelers.update(list =>
      list.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    );
  }

  clear(): void {
    this._draft.set(null);
    this.selectedOptionId.set(null);
    this.selectedTimeSlot.set(null);
    this.travelers.set([emptyTraveler(true), emptyTraveler(false)]);
    this.partySize.set(2);
    this.discount.set(0);
    this.appliedPromo.set(null);
    this.redeemedPoints.set(0);
    this.loyaltyDiscount.set(0);
    this.selectedReward.set(null);
    this.ancillaryOptions.set([]);
    this.selectedAncillaries.set([]);
  }

  /** Builds the API payload from the current draft + selections. */
  toRequest(): CreateBookingRequest | null {
    const d = this._draft();
    if (!d) {
      return null;
    }
    const total = this.total();
    const option = this.selectedOption();
    const redeemPoints = this.redeemedPoints() > 0 ? this.redeemedPoints() : undefined;
    const ancillaries: AncillarySelection[] = this.selectedAncillaries().map(code => ({ code, quantity: 1 }));
    const base: CreateBookingRequest = {
      redeemPoints,
      ancillaries: ancillaries.length > 0 ? ancillaries : undefined,
      destination: d.destination,
      totalAmount: total,
      subtotal: this.subtotal(),
      memberDiscountAmount: this.memberDiscount() > 0 ? this.memberDiscount() : undefined,
      rewardId: this.selectedReward()?.id,
      rewardDiscountAmount: this.rewardDiscount() > 0 ? this.rewardDiscount() : undefined,
      partySize: this.partySize(),
      checkIn: d.checkIn,
      checkOut: d.checkOut,
      travelers: this.travelers().map(t => ({
        firstName: t.firstName.trim(),
        lastName: t.lastName.trim(),
        documentNumber: t.documentNumber?.trim() || undefined,
        primary: t.primary,
      })),
    };

    switch (d.vertical) {
      case 'flight':
        return { ...base, flightId: d.itemId, flightAmount: total, fareClass: option?.label };
      case 'restaurant':
        return {
          ...base,
          restaurantId: d.itemId,
          restaurantAmount: total,
          timeSlot: this.selectedTimeSlot() ?? undefined,
        };
      case 'cruise':
        return { ...base, cruiseId: d.itemId, cruiseAmount: total, cabinCategory: option?.label };
    }
  }

  /** Every traveler must have a first and last name. */
  travelersValid(): boolean {
    return this.travelers().every(t => t.firstName.trim() !== '' && t.lastName.trim() !== '');
  }

  private resizeTravelers(current: TravelerRequest[], size: number): TravelerRequest[] {
    if (size === current.length) {
      return current;
    }
    if (size < current.length) {
      return current.slice(0, size);
    }
    const extra = Array.from({ length: size - current.length }, () => emptyTraveler(false));
    return [...current, ...extra];
  }
}
