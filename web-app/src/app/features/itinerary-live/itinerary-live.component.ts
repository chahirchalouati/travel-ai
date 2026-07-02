import { Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, interval, of, switchMap } from 'rxjs';
import { ItineraryService } from '../../core/services/itinerary.service';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { TripCollabService } from '../../core/services/trip-collab.service';
import type {
  LiveItineraryResponse,
  ItinerarySegmentResponse,
  ItineraryProposalResponse,
  SegmentStatus,
  SegmentVotesResponse,
  BookingResponse,
} from '../../core/models/api.models';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { TripMapComponent } from './trip-map.component';
import { TripCompanionsComponent } from '../trip-collab/trip-companions.component';
import { SegmentVoteComponent } from '../trip-collab/segment-vote.component';

const POLL_INTERVAL_MS = 20000;

@Component({
  selector: 'app-itinerary-live',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CurrencyPipe, DatePipe, TranslocoModule, RevealDirective,
    TripMapComponent, TripCompanionsComponent, SegmentVoteComponent,
  ],
  templateUrl: './itinerary-live.component.html',
  styleUrl: './itinerary-live.component.scss',
})
export class ItineraryLiveComponent implements OnInit, OnDestroy {
  private readonly itineraryService = inject(ItineraryService);
  private readonly auth = inject(AuthService);
  private readonly bookings = inject(BookingService);
  private readonly collab = inject(TripCollabService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private stream: EventSource | null = null;

  readonly loading = signal(true);
  readonly itinerary = signal<LiveItineraryResponse | null>(null);
  readonly proposals = signal<ItineraryProposalResponse[]>([]);

  /** True when the current user owns the booking (owns invite/remove controls). */
  readonly isOwner = signal(false);
  /** Vote state per segment id, refreshed alongside the itinerary. */
  readonly votes = signal<Record<string, SegmentVotesResponse>>({});

  readonly reportingSegmentId = signal<string | null>(null);
  readonly submitting = signal(false);
  reportText = '';

  readonly pendingProposals = computed(() =>
    this.proposals().filter(p => p.status === 'PENDING_APPROVAL'),
  );
  readonly hasAlert = computed(() => this.pendingProposals().length > 0);

  private bookingId = '';

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.bookingId) {
      this.router.navigate(['/trips']);
      return;
    }
    this.load();

    // Poll proposals so newly generated re-plans surface without a manual refresh.
    interval(POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => {
          const it = this.itinerary();
          return it
            ? this.itineraryService.listProposals(it.id).pipe(catchError(() => of(this.proposals())))
            : of(this.proposals());
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(list => this.proposals.set(list));
  }

  private load(): void {
    this.loading.set(true);
    this.itineraryService
      .getByBooking(this.bookingId)
      .pipe(catchError(() => of(null)))
      .subscribe(it => {
        this.itinerary.set(it);
        this.proposals.set(it?.pendingProposals ?? []);
        this.loading.set(false);
        if (it) {
          this.refreshProposals();
          this.connectStream();
          this.loadVotes();
          this.resolveOwnership();
        }
      });
  }

  /** Owner = the booking appears in the user's own bookings list. */
  private resolveOwnership(): void {
    this.bookings
      .list()
      .pipe(catchError(() => of([] as BookingResponse[])))
      .subscribe(list => this.isOwner.set(list.some(b => b.id === this.bookingId)));
  }

  private loadVotes(): void {
    this.collab
      .listVotes(this.bookingId)
      .pipe(catchError(() => of([] as SegmentVotesResponse[])))
      .subscribe(list => {
        const map: Record<string, SegmentVotesResponse> = {};
        for (const v of list) {
          map[v.segmentId] = v;
        }
        this.votes.set(map);
      });
  }

  voteFor(segmentId: string): SegmentVotesResponse | undefined {
    return this.votes()[segmentId];
  }

  /** Subscribe to instant proposal alerts via SSE; the 20s poll remains as fallback. */
  private connectStream(): void {
    if (this.stream) {
      return;
    }
    const es = this.itineraryService.openStream(this.auth.getToken());
    if (!es) {
      return;
    }
    es.addEventListener('proposal', () => this.refreshProposals());
    es.onerror = () => {
      es.close();
      this.stream = null;
    };
    this.stream = es;
  }

  ngOnDestroy(): void {
    this.stream?.close();
    this.stream = null;
  }

  private refreshProposals(): void {
    const it = this.itinerary();
    if (!it) {
      return;
    }
    this.itineraryService
      .listProposals(it.id)
      .pipe(catchError(() => of([] as ItineraryProposalResponse[])))
      .subscribe(list => this.proposals.set(list));
  }

  startReport(segment: ItinerarySegmentResponse): void {
    this.reportingSegmentId.set(segment.id);
    this.reportText = '';
  }

  cancelReport(): void {
    this.reportingSegmentId.set(null);
    this.reportText = '';
  }

  submitReport(segment: ItinerarySegmentResponse): void {
    const it = this.itinerary();
    if (!it || !this.reportText.trim()) {
      return;
    }
    this.submitting.set(true);
    this.itineraryService
      .reportEvent(it.id, { segmentId: segment.id, description: this.reportText.trim() })
      .pipe(catchError(() => of(undefined)))
      .subscribe(() => {
        this.submitting.set(false);
        this.reportingSegmentId.set(null);
        this.reportText = '';
        // Mark optimistically; the AI re-plan arrives via polling.
        this.itinerary.update(cur =>
          cur
            ? {
                ...cur,
                segments: cur.segments.map(s =>
                  s.id === segment.id ? { ...s, currentStatus: 'DELAYED' as SegmentStatus } : s,
                ),
              }
            : cur,
        );
        this.refreshProposals();
      });
  }

  approve(proposal: ItineraryProposalResponse): void {
    this.itineraryService
      .approve(proposal.id)
      .pipe(catchError(() => of(undefined)))
      .subscribe(() => this.load());
  }

  reject(proposal: ItineraryProposalResponse): void {
    this.itineraryService
      .reject(proposal.id)
      .pipe(catchError(() => of(undefined)))
      .subscribe(() => this.refreshProposals());
  }

  statusIcon(status: SegmentStatus): string {
    return {
      ON_SCHEDULE: 'check_circle',
      DELAYED: 'schedule',
      CANCELLED: 'cancel',
      CLOSED: 'block',
      REBOOKED: 'autorenew',
    }[status];
  }

  segmentIcon(type: string): string {
    return { FLIGHT: 'flight', HOTEL: 'hotel', RESTAURANT: 'restaurant' }[type] ?? 'place';
  }

  back(): void {
    this.router.navigate(['/trips']);
  }
}
