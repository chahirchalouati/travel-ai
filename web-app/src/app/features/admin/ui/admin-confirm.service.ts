import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly tone?: 'danger' | 'accent';
  /** When set, the confirm button stays disabled until the user types this phrase verbatim. */
  readonly confirmPhrase?: string;
  /** Hint shown above the phrase input, e.g. "Type the email to confirm". */
  readonly phraseHint?: string;
}

interface PendingConfirm extends ConfirmRequest {
  readonly resolve: (ok: boolean) => void;
}

/** Promise-based confirm dialog with optional type-to-confirm guardrail for sensitive actions. */
@Injectable({ providedIn: 'root' })
export class AdminConfirmService {
  readonly current = signal<PendingConfirm | null>(null);

  ask(req: ConfirmRequest): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.current.set({ ...req, resolve });
    });
  }

  resolve(ok: boolean): void {
    const req = this.current();
    if (!req) return;
    this.current.set(null);
    req.resolve(ok);
  }
}
