import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { TripCollabService } from '../../core/services/trip-collab.service';
import type { TripMemberResponse, TripRole } from '../../core/models/api.models';

/**
 * Self-contained "Compagni di viaggio" panel. Mount it on the live-itinerary
 * page with the trip (booking) id. Owners see the invite form and remove
 * buttons; companions just see the roster.
 */
@Component({
  selector: 'app-trip-companions',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  template: `
    <ng-container *transloco="let t">
      <section class="tc-panel" aria-labelledby="tc-heading">
        <header class="tc-panel__head">
          <span class="tc-eyebrow"><span class="ms">group</span> {{ t('tripCollab.title') }}</span>
          <h2 id="tc-heading" class="tc-panel__title">{{ t('tripCollab.subtitle') }}</h2>
        </header>

        @if (loading()) {
          <div class="tc-skeleton"></div>
        } @else {
          @if (members().length === 0) {
            <p class="tc-empty">{{ t('tripCollab.empty') }}</p>
          } @else {
            <ul class="tc-list">
              @for (m of members(); track m.id) {
                <li class="tc-member">
                  <span class="tc-avatar" [attr.aria-hidden]="true">{{ initials(m) }}</span>
                  <div class="tc-member__main">
                    <span class="tc-member__name">{{ m.displayName || m.invitedEmail }}</span>
                    <span class="tc-member__email">{{ m.invitedEmail }}</span>
                  </div>
                  <span class="tc-chip tc-chip--role">{{ t('tripCollab.role.' + m.role) }}</span>
                  <span class="tc-chip tc-chip--status" [attr.data-status]="m.status">
                    {{ t('tripCollab.status.' + m.status) }}
                  </span>
                  @if (owner) {
                    <button class="tc-remove" [attr.aria-label]="t('tripCollab.remove')"
                            (click)="remove(m)">
                      <span class="ms">close</span>
                    </button>
                  }
                </li>
              }
            </ul>
          }

          @if (owner) {
            <form class="tc-invite" (ngSubmit)="invite()">
              <input class="tc-input" type="email" name="inviteEmail" [(ngModel)]="email"
                     [placeholder]="t('tripCollab.emailPlaceholder')" required />
              <select class="tc-input tc-input--role" name="inviteRole" [(ngModel)]="role">
                <option value="VIEWER">{{ t('tripCollab.role.VIEWER') }}</option>
                <option value="EDITOR">{{ t('tripCollab.role.EDITOR') }}</option>
              </select>
              <button class="tc-btn" type="submit" [disabled]="submitting() || !email.trim()">
                <span class="ms">send</span> {{ t('tripCollab.invite') }}
              </button>
            </form>
            @if (error()) { <p class="tc-error">{{ t('tripCollab.inviteError') }}</p> }
            @if (invited()) { <p class="tc-ok">{{ t('tripCollab.inviteSent') }}</p> }
          }
        }
      </section>
    </ng-container>
  `,
  styles: [`
    .tc-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: 1.25rem 1.4rem; margin-top: 1.5rem; }
    .tc-eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--teal); }
    .tc-eyebrow .ms { font-size: 16px; }
    .tc-panel__title { margin: 0.35rem 0 1rem; font-size: 1.15rem; font-weight: 800; letter-spacing: -0.01em; }
    .tc-skeleton { height: 64px; border-radius: 3px; background: linear-gradient(90deg, var(--bg-secondary), var(--bg-tertiary), var(--bg-secondary)); background-size: 200% 100%; animation: tc-sh 1.2s infinite; }
    @keyframes tc-sh { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
    .tc-empty { color: var(--text-tertiary); font-size: 0.9rem; margin: 0 0 1rem; }
    .tc-list { list-style: none; margin: 0 0 1rem; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
    .tc-member { display: flex; align-items: center; gap: 0.7rem; padding: 0.6rem 0.7rem; border: 1px solid var(--border); border-radius: 3px; }
    .tc-avatar { flex: 0 0 34px; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font-size: 0.78rem; font-weight: 800; color: #fff; background: var(--brand); }
    .tc-member__main { display: flex; flex-direction: column; min-width: 0; margin-right: auto; }
    .tc-member__name { font-weight: 700; font-size: 0.92rem; }
    .tc-member__email { font-size: 0.75rem; color: var(--text-tertiary); overflow: hidden; text-overflow: ellipsis; }
    .tc-chip { font-size: 0.68rem; font-weight: 700; padding: 3px 9px; border-radius: 2px; white-space: nowrap; }
    .tc-chip--role { background: var(--brand-light); color: var(--color-red-ink); }
    .tc-chip--status[data-status="ACCEPTED"] { background: #dcfce7; color: #15803d; }
    .tc-chip--status[data-status="PENDING"] { background: #fef9c3; color: #a16207; }
    .tc-chip--status[data-status="DECLINED"] { background: #fee2e2; color: #b91c1c; }
    .tc-remove { border: none; background: transparent; color: var(--text-tertiary); cursor: pointer; border-radius: 8px; padding: 4px; transition: background 120ms, color 120ms; }
    .tc-remove:hover { background: #fee2e2; color: #b91c1c; }
    .tc-remove .ms { font-size: 18px; }
    .tc-invite { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .tc-input { flex: 1 1 180px; padding: 0.6rem 0.8rem; border: 1px solid var(--border); border-radius: 3px; font: inherit; }
    .tc-input--role { flex: 0 0 130px; }
    .tc-btn { display: inline-flex; align-items: center; gap: 6px; background: var(--brand); color: #fff; border: none; border-radius: 3px; padding: 0.6rem 1.1rem; font-weight: 700; cursor: pointer; transition: filter 120ms; }
    .tc-btn:hover:not(:disabled) { filter: brightness(1.08); }
    .tc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .tc-btn .ms { font-size: 16px; }
    .tc-error { color: #b91c1c; font-size: 0.82rem; margin: 0.6rem 0 0; }
    .tc-ok { color: #15803d; font-size: 0.82rem; margin: 0.6rem 0 0; }
  `],
})
export class TripCompanionsComponent implements OnInit {
  /** Trip (booking) id. */
  @Input({ required: true }) tripId!: string;
  /** Whether the current user owns the trip (shows invite/remove controls). */
  @Input() owner = false;

  private readonly collab = inject(TripCollabService);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly members = signal<TripMemberResponse[]>([]);
  readonly error = signal(false);
  readonly invited = signal(false);

  email = '';
  role: TripRole = 'VIEWER';

  ngOnInit(): void {
    this.reload();
  }

  private reload(): void {
    this.collab
      .listMembers(this.tripId)
      .pipe(catchError(() => of([] as TripMemberResponse[])))
      .subscribe(list => {
        this.members.set(list);
        this.loading.set(false);
      });
  }

  invite(): void {
    if (!this.email.trim()) {
      return;
    }
    this.submitting.set(true);
    this.error.set(false);
    this.invited.set(false);
    this.collab
      .invite(this.tripId, { email: this.email.trim(), role: this.role })
      .pipe(catchError(() => of(null)))
      .subscribe(member => {
        this.submitting.set(false);
        if (member) {
          this.email = '';
          this.role = 'VIEWER';
          this.invited.set(true);
          this.reload();
        } else {
          this.error.set(true);
        }
      });
  }

  remove(member: TripMemberResponse): void {
    this.collab
      .removeMember(this.tripId, member.id)
      .pipe(catchError(() => of(undefined)))
      .subscribe(() => this.reload());
  }

  initials(m: TripMemberResponse): string {
    const source = m.displayName || m.invitedEmail;
    return source.trim().slice(0, 2).toUpperCase();
  }
}
