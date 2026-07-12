import { Injectable, signal } from '@angular/core';

export type ToastTone = 'ok' | 'danger' | 'info';

export interface AdminToast {
  readonly id: number;
  readonly text: string;
  readonly tone: ToastTone;
}

const AUTO_DISMISS_MS = 3200;

/** Central toast queue for the admin. Components push; the shell host renders. */
@Injectable({ providedIn: 'root' })
export class AdminToastService {
  private seq = 0;
  readonly toasts = signal<readonly AdminToast[]>([]);

  ok(text: string): void { this.push(text, 'ok'); }
  error(text: string): void { this.push(text, 'danger'); }
  info(text: string): void { this.push(text, 'info'); }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private push(text: string, tone: ToastTone): void {
    const id = ++this.seq;
    this.toasts.update(list => [...list, { id, text, tone }]);
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
  }
}
