import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { AdminSectionComponent } from '../ui/admin-section.component';
import { UiSelectComponent, UiSelectOption } from '../../../shared/ui/ui-select.component';
import { AdminToastService } from '../ui/admin-toast.service';
import { AdminConfirmService } from '../ui/admin-confirm.service';

const ROLES = ['', 'TRAVELER', 'PARTNER', 'OPERATIONS', 'ADMIN'];

/** Broadcast: composes and sends a notification to an audience segment. */
@Component({
  selector: 'app-admin-broadcast',
  standalone: true,
  imports: [FormsModule, TranslocoModule, AdminSectionComponent, UiSelectComponent],
  styleUrls: ['./section-shared.scss'],
  styles: [`
    .bc { max-width: 640px; background: var(--ad-surface); border: 1px solid var(--ad-line); border-radius: var(--ad-r-md); padding: var(--ad-sp-6); display: flex; flex-direction: column; gap: var(--ad-sp-4); }
    .bc__hint { color: var(--ad-text-dim); margin: 0; font-size: var(--ad-fx-sm); }
    .bc__count { font-size: var(--ad-fx-xs); color: var(--ad-text-faint); text-align: right; }
  `],
  template: `
    <admin-section eyebrow="05 / SYSTEM" [title]="'admin.navBroadcast' | transloco" state="ready">
      <div class="bc">
        <p class="bc__hint">{{ 'admin.broadcastHint' | transloco }}</p>
        <label class="fld"><span class="fld__l">{{ 'admin.broadcastAudience' | transloco }}</span>
          <app-ui-select [options]="roleOpts()" [(ngModel)]="role" [ariaLabel]="'admin.broadcastAudience' | transloco" />
        </label>
        <label class="fld"><span class="fld__l">{{ 'admin.broadcastSubject' | transloco }} *</span>
          <input type="text" [(ngModel)]="subject" maxlength="140" />
          <span class="bc__count">{{ subject.length }}/140</span>
        </label>
        <label class="fld"><span class="fld__l">{{ 'admin.broadcastMessage' | transloco }} *</span>
          <textarea rows="6" [(ngModel)]="body"></textarea></label>
        <div>
          <button type="button" class="sec-btn sec-btn--primary" [disabled]="sending()" (click)="send()">
            <span class="ad-ms">{{ sending() ? 'hourglass_top' : 'send' }}</span>
            {{ (sending() ? 'admin.broadcastSending' : 'admin.broadcastSend') | transloco }}
          </button>
        </div>
      </div>
    </admin-section>
  `,
})
export class AdminBroadcastComponent {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(AdminToastService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly t = inject(TranslocoService);

  readonly roles = ROLES;
  roleOpts(): UiSelectOption[] {
    return ROLES.map(r => ({ value: r, label: r || this.t.translate('admin.broadcastEveryone') }));
  }
  role = '';
  subject = '';
  body = '';
  readonly sending = signal(false);

  async send(): Promise<void> {
    if (!this.subject.trim() || !this.body.trim()) { this.toast.error(this.t.translate('admin.broadcastIncomplete')); return; }
    const ok = await this.confirm.ask({
      title: this.t.translate('admin.broadcastSend'), message: this.t.translate('admin.broadcastConfirm'),
      confirmLabel: this.t.translate('admin.broadcastSend'), cancelLabel: this.t.translate('admin.cancel'), tone: 'accent',
    });
    if (!ok) return;
    this.sending.set(true);
    this.admin.broadcast(this.subject, this.body, this.role).pipe(catchError(() => of(null))).subscribe(res => {
      this.sending.set(false);
      if (res) { this.toast.ok(this.t.translate('admin.broadcastSent', { count: res.recipients })); this.subject = ''; this.body = ''; }
      else this.toast.error(this.t.translate('admin.broadcastFailed'));
    });
  }
}
