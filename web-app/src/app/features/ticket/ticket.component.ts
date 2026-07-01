import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { BookingService } from '../../core/services/booking.service';
import type { BookingResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  template: `
    <div class="ticket-page">
      @if (loading()) {
        <div class="skeleton" style="height:360px;max-width:640px;border-radius:20px"></div>
      } @else if (!booking()) {
        <div class="ticket-missing">
          <span class="ms">error_outline</span>
          <h2>{{ 'ticket.notFound' | transloco }}</h2>
          <button class="tk-back" (click)="router.navigate(['/bookings'])">
            <span class="ms">arrow_back</span> {{ 'ticket.back' | transloco }}
          </button>
        </div>
      } @else {
        <div class="ticket-actions no-print">
          <button class="tk-back" (click)="router.navigate(['/bookings'])">
            <span class="ms">arrow_back</span> {{ 'ticket.back' | transloco }}
          </button>
          <button class="tk-print" (click)="print()">
            <span class="ms">print</span> {{ 'ticket.print' | transloco }}
          </button>
        </div>

        <article class="pass">
          <div class="pass-main">
            <div class="pass-brand">
              <span class="ms">confirmation_number</span>
              <span>TravelAI</span>
              <span class="pass-status" [class]="'pass-status--' + booking()!.status.toLowerCase()">
                {{ ('ticket.statusValue.' + booking()!.status.toLowerCase()) | transloco }}
              </span>
            </div>

            <h1 class="pass-dest">{{ booking()!.destination || ('ticket.title' | transloco) }}</h1>

            <div class="pass-grid">
              <div class="pass-cell pass-cell--dates">
                <span class="pass-label">{{ 'ticket.dates' | transloco }}</span>
                <span class="pass-value">
                  @if (booking()!.checkIn) {
                    {{ booking()!.checkIn | date: 'mediumDate' }}
                    @if (booking()!.checkOut) { <span class="pass-arrow">→</span> {{ booking()!.checkOut | date: 'mediumDate' }} }
                  } @else { — }
                </span>
              </div>
              <div class="pass-cell">
                <span class="pass-label">{{ 'ticket.guests' | transloco }}</span>
                <span class="pass-value">{{ partySize() }}</span>
              </div>
            </div>

            @if (travellerNames().length) {
              <div class="pass-cell pass-cell--full">
                <span class="pass-label">{{ 'ticket.travellers' | transloco }}</span>
                <span class="pass-value">{{ travellerNames().join(' · ') }}</span>
              </div>
            }
          </div>

          <div class="pass-stub">
            <span class="pass-label">{{ 'ticket.reference' | transloco }}</span>
            <span class="pass-ref">{{ booking()!.bookingReference }}</span>
            <span class="pass-status pass-status--stub" [class]="'pass-status--' + booking()!.status.toLowerCase()">
              {{ ('ticket.statusValue.' + booking()!.status.toLowerCase()) | transloco }}
            </span>
          </div>
        </article>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .ticket-page { max-width: 720px; margin: 0 auto; padding: clamp(1.5rem, 3vw, 3rem) 1.25rem; font-family: 'Hanken Grotesk', system-ui, sans-serif; }
    .ticket-actions { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
    .tk-back, .tk-print { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 8px 18px; font-weight: 700; font-size: 0.86rem; cursor: pointer; border: 1px solid #e8e8e8; background: #fff; color: #1a1a1a; transition: background 120ms ease, color 120ms ease, border-color 120ms ease; }
    .tk-back:hover { background: #f6f6f6; }
    .tk-print { background: #E04A2F; border-color: #E04A2F; color: #fff; }
    .tk-print:hover { background: #c93d25; border-color: #c93d25; }
    .tk-back .ms, .tk-print .ms { font-size: 18px; }

    .pass { display: flex; border-radius: 20px; overflow: hidden; box-shadow: 0 18px 44px rgba(26,26,26,0.12); background: #fff; border: 1px solid #e8e8e8; }
    .pass-main { flex: 1; padding: 2rem 2.2rem; min-width: 0; }
    .pass-brand { display: flex; align-items: center; gap: 8px; font-weight: 800; letter-spacing: 0.02em; color: #E04A2F; text-transform: uppercase; font-size: 0.82rem; }
    .pass-brand .ms { font-size: 20px; }
    .pass-status { margin-left: auto; padding: 3px 12px; border-radius: 999px; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.04em; background: #f3f3f3; color: #8a8a8a; }
    .pass-status--confirmed { background: rgba(0,133,106,0.12); color: #00856A; }
    .pass-status--completed { background: rgba(0,133,106,0.12); color: #00856A; }
    .pass-status--pending { background: rgba(224,74,47,0.12); color: #E04A2F; }
    .pass-status--cancelled { background: #f3f3f3; color: #8a8a8a; }

    .pass-dest { margin: 1rem 0 1.6rem; font-size: clamp(1.7rem, 4vw, 2.4rem); font-weight: 800; letter-spacing: -0.02em; color: #1a1a1a; line-height: 1.05; }
    .pass-grid { display: grid; grid-template-columns: 1fr auto; gap: 1.4rem 2rem; }
    .pass-cell { display: flex; flex-direction: column; gap: 5px; }
    .pass-cell--full { margin-top: 1.4rem; }
    .pass-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #8a8a8a; }
    .pass-value { font-size: 1.02rem; font-weight: 600; color: #1a1a1a; }
    .pass-arrow { color: #8a8a8a; margin: 0 4px; }

    .pass-stub { position: relative; width: 200px; flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 2rem 1.4rem; background: linear-gradient(160deg, #1a1a1a, #2b2b2b); color: #fff; text-align: center; }
    .pass-stub::before { content: ''; position: absolute; left: -9px; top: 0; bottom: 0; width: 18px; background-image: radial-gradient(circle, transparent 8px, #fff 9px); background-size: 18px 22px; background-repeat: repeat-y; }
    .pass-stub .pass-label { color: rgba(255,255,255,0.6); }
    .pass-ref { font-family: 'SFMono-Regular', ui-monospace, 'Menlo', monospace; font-size: 1.55rem; font-weight: 700; letter-spacing: 0.06em; word-break: break-all; }
    .pass-status--stub { margin: 0; }

    .ticket-missing { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 1rem; text-align: center; color: #8a8a8a; }
    .ticket-missing .ms { font-size: 48px; color: #E04A2F; }
    .ticket-missing h2 { margin: 0; color: #1a1a1a; }

    @media (max-width: 560px) {
      .pass { flex-direction: column; }
      .pass-stub { width: auto; }
      .pass-stub::before { display: none; }
    }

    @media print {
      .no-print { display: none !important; }
      .ticket-page { padding: 0; }
      .pass { box-shadow: none; border: 1px solid #ccc; }
    }
  `],
})
export class TicketComponent implements OnInit {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(BookingService);

  readonly loading = signal(true);
  readonly booking = signal<BookingResponse | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.service
      .getBooking(id)
      .pipe(catchError(() => of(null)))
      .subscribe(b => {
        this.booking.set(b);
        this.loading.set(false);
      });
  }

  partySize(): number {
    const count = this.booking()?.travelers?.length ?? 0;
    return count > 0 ? count : 1;
  }

  travellerNames(): string[] {
    return (this.booking()?.travelers ?? []).map(t => `${t.firstName} ${t.lastName}`.trim());
  }

  print(): void {
    window.print();
  }
}
