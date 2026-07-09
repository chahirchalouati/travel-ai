import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { TripCollabService } from '../../core/services/trip-collab.service';
import type { SegmentVotesResponse, VoteValue } from '../../core/models/api.models';

/**
 * Thumbs up/down voting for one itinerary segment. Mount inline on each segment;
 * pass the trip (booking) id, segment id, and the initial vote state from the
 * trip-wide votes payload.
 */
@Component({
  selector: 'app-segment-vote',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  template: `
    <ng-container *transloco="let t">
      <div class="sv" role="group" [attr.aria-label]="t('tripCollab.vote.aria')">
        <button class="sv-btn" type="button"
                [class.is-active]="myVote() === 'UP'"
                [attr.aria-pressed]="myVote() === 'UP'"
                [attr.aria-label]="t('tripCollab.vote.up')"
                [disabled]="busy()" (click)="cast('UP')">
          <span class="ms">thumb_up</span>
        </button>
        <span class="sv-score" [class.is-pos]="score() > 0" [class.is-neg]="score() < 0">
          {{ score() > 0 ? '+' : '' }}{{ score() }}
        </span>
        <button class="sv-btn" type="button"
                [class.is-active]="myVote() === 'DOWN'"
                [attr.aria-pressed]="myVote() === 'DOWN'"
                [attr.aria-label]="t('tripCollab.vote.down')"
                [disabled]="busy()" (click)="cast('DOWN')">
          <span class="ms">thumb_down</span>
        </button>
        @if (voterCount() > 0) {
          <span class="sv-count">{{ voterCount() }} {{ t('tripCollab.vote.voters') }}</span>
        }
      </div>
    </ng-container>
  `,
  styles: [`
    .sv { display: inline-flex; align-items: center; gap: 0.35rem; }
    .sv-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border: 1px solid var(--border); background: var(--surface); border-radius: 8px; cursor: pointer; color: var(--text-tertiary); transition: background 120ms, color 120ms, border-color 120ms; }
    .sv-btn:hover:not(:disabled) { border-color: var(--color-red-ink); color: var(--color-red-ink); }
    .sv-btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .sv-btn .ms { font-size: 17px; }
    .sv-btn.is-active { background: var(--brand); border-color: var(--color-red-ink); color: #fff; }
    .sv-score { min-width: 1.6rem; text-align: center; font-weight: 800; font-size: 0.9rem; color: var(--text-tertiary); }
    .sv-score.is-pos { color: #15803d; }
    .sv-score.is-neg { color: #b91c1c; }
    .sv-count { font-size: 0.72rem; color: var(--text-tertiary); margin-left: 0.2rem; }
  `],
})
export class SegmentVoteComponent {
  @Input({ required: true }) tripId!: string;
  @Input({ required: true }) segmentId!: string;

  /** Optional seed from the trip-wide votes call to avoid an initial flash. */
  @Input() set state(value: SegmentVotesResponse | undefined) {
    if (value) {
      this.score.set(value.score);
      this.myVote.set(value.myVote);
      this.voterCount.set(value.votes.length);
    }
  }

  private readonly collab = inject(TripCollabService);

  readonly score = signal(0);
  readonly myVote = signal<VoteValue | null>(null);
  readonly voterCount = signal(0);
  readonly busy = signal(false);

  cast(vote: VoteValue): void {
    this.busy.set(true);
    this.collab
      .vote(this.tripId, this.segmentId, vote)
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        this.busy.set(false);
        if (res) {
          this.score.set(res.score);
          this.myVote.set(res.myVote);
          this.voterCount.set(res.votes.length);
        }
      });
  }
}
