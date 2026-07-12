import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ContactService } from '../../core/services/contact.service';
import { UiInputComponent } from '../../shared/ui/ui-input.component';
import { UiTextareaComponent } from '../../shared/ui/ui-textarea.component';
import { UiSelectComponent, UiSelectOption } from '../../shared/ui/ui-select.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, TranslocoModule, UiInputComponent, UiTextareaComponent, UiSelectComponent],
  template: `
    <div class="contact">
      <header class="contact-hero">
        <div class="contact-hero__inner">
          <p class="eyebrow">{{ 'contact.eyebrow' | transloco }}</p>
          <h1>{{ 'contact.headline' | transloco }}</h1>
          <p class="hero-sub">{{ 'contact.sub' | transloco }}</p>
        </div>
      </header>

      <div class="contact-body">
        <div class="contact-inner">
          <div class="contact-grid">
            <!-- Form -->
            <section class="form-card">
              @if (!sent()) {
                <h2>{{ 'contact.form.title' | transloco }}</h2>
                <form class="cform" (ngSubmit)="submit()" #f="ngForm">
                  <div class="field-row">
                    <app-ui-input name="name" required autocomplete="name"
                                  [label]="'contact.form.name' | transloco" [(ngModel)]="form.name" />
                    <app-ui-input name="email" type="email" required autocomplete="email"
                                  [label]="'contact.form.email' | transloco" [(ngModel)]="form.email" />
                  </div>
                  <div class="field">
                    <label class="flabel">{{ 'contact.form.subject' | transloco }}</label>
                    <app-ui-select name="subject" [options]="subjectOptions()" [(ngModel)]="form.subject"
                                   [ariaLabel]="'contact.form.subject' | transloco" />
                  </div>
                  <app-ui-textarea name="message" [rows]="5" required
                                   [label]="'contact.form.message' | transloco" [(ngModel)]="form.message" />
                  @if (error()) {
                    <p class="form-error" role="alert">{{ 'contact.form.error' | transloco }}</p>
                  }
                  <button type="submit" class="submit-btn" [disabled]="!f.valid || submitting()">
                    <span class="ms">{{ submitting() ? 'progress_activity' : 'send' }}</span>
                    {{ (submitting() ? 'contact.form.sending' : 'contact.form.send') | transloco }}
                  </button>
                </form>
              } @else {
                <div class="sent-state">
                  <div class="sent-icon-wrap"><span class="ms">check_circle</span></div>
                  <h2>{{ 'contact.form.sentTitle' | transloco }}</h2>
                  <p>{{ 'contact.form.sentBody' | transloco }}</p>
                  <button class="reset-btn" (click)="reset()">{{ 'contact.form.newMessage' | transloco }}</button>
                </div>
              }
            </section>

            <!-- Channels -->
            <aside class="channels">
              <h2>{{ 'contact.channels.title' | transloco }}</h2>
              <div class="channel-list">
                @for (ch of channels; track ch.icon) {
                  <div class="channel-item">
                    <div class="channel-icon-wrap"><span class="ms">{{ ch.icon }}</span></div>
                    <div>
                      <p class="channel-label">{{ ch.labelKey | transloco }}</p>
                      <a [href]="ch.href" class="channel-value">{{ ch.value }}</a>
                    </div>
                  </div>
                }
              </div>

              <div class="hours-box">
                <p class="hours-title">{{ 'contact.hours.title' | transloco }}</p>
                <p class="hours-body">{{ 'contact.hours.body' | transloco }}</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); }

    .contact-hero {
      background: linear-gradient(155deg, var(--brand-light) 0%, var(--bg-secondary) 100%);
      padding: clamp(5rem, 10vw, 8.5rem) 1.5rem clamp(3.5rem, 7vw, 5.5rem);
      text-align: center;
    }
    .contact-hero__inner { max-width: 640px; margin: 0 auto; }
    .eyebrow { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-red-ink); margin: 0 0 1rem; }
    .contact-hero h1 { font-family: var(--font-display); font-size: clamp(2.6rem, 5vw, 4.5rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.06; margin: 0 0 1.2rem; }
    .hero-sub { font-size: 1.05rem; color: var(--text-secondary); margin: 0; line-height: 1.7; }

    .contact-body { padding: clamp(3rem, 6vw, 5.5rem) 1.5rem; }
    .contact-inner { max-width: 1020px; margin: 0 auto; }
    .contact-grid { display: grid; grid-template-columns: 1fr 380px; gap: 2.5rem; align-items: start; }

    /* Form card */
    .form-card { background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: 2.25rem; }
    .form-card h2 { font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; margin: 0 0 1.75rem; letter-spacing: -0.02em; }

    .cform { display: flex; flex-direction: column; gap: 1.1rem; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.35rem; }
    .flabel { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); letter-spacing: 0.02em; }
    .finput {
      border: 1px solid var(--border); border-radius: 3px; padding: 11px 14px;
      font-family: inherit; font-size: 0.95rem; color: var(--text-primary); background: var(--bg-primary); width: 100%;
      transition: border-color 140ms ease;
      &:focus { outline: none; border-color: var(--color-red-ink); }
    }
    .finput--select { cursor: pointer; }
    .finput--ta { resize: vertical; min-height: 120px; }
    .form-error { margin: 0; font-size: 0.85rem; font-weight: 600; color: var(--color-red-ink); }
    .submit-btn {
      display: inline-flex; align-items: center; gap: 8px; align-self: flex-start;
      background: var(--brand); color: #fff; border: none; border-radius: 2px;
      padding: 13px 28px; font-family: inherit; font-weight: 700; font-size: 0.95rem; cursor: pointer;
      transition: background 140ms ease, transform 140ms ease;
      .ms { font-size: 20px; }
      &:hover:not(:disabled) { background: var(--brand-hover); transform: translateY(-1px); }
      &:disabled { opacity: 0.55; cursor: default; }
    }

    /* Sent state */
    .sent-state { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem; padding: 2rem 0; }
    .sent-icon-wrap { width: 72px; height: 72px; border-radius: 50%; background: var(--teal-light); display: flex; align-items: center; justify-content: center; .ms { font-size: 2.5rem; color: var(--teal); } }
    .sent-state h2 { font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; margin: 0; }
    .sent-state p { font-size: 1rem; color: var(--text-secondary); margin: 0; }
    .reset-btn { background: none; border: 1px solid var(--border); border-radius: 2px; padding: 10px 22px; font-family: inherit; font-weight: 700; font-size: 0.9rem; cursor: pointer; color: var(--text-primary); &:hover { background: var(--bg-secondary); } }

    /* Channels */
    .channels { display: flex; flex-direction: column; gap: 1.5rem; }
    .channels h2 { font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; margin: 0; letter-spacing: -0.02em; }
    .channel-list { display: flex; flex-direction: column; gap: 1rem; }
    .channel-item { display: flex; align-items: center; gap: 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: 1.1rem 1.25rem; }
    .channel-icon-wrap { width: 42px; height: 42px; flex-shrink: 0; border-radius: 3px; background: var(--brand-light); display: flex; align-items: center; justify-content: center; .ms { font-size: 1.4rem; color: var(--color-red-ink); } }
    .channel-label { font-size: 0.78rem; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 2px; }
    .channel-value { font-size: 0.9rem; font-weight: 600; color: var(--color-red-ink); text-decoration: none; &:hover { text-decoration: underline; } }
    .hours-box { background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: 3px; padding: 1.25rem; }
    .hours-title { font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-tertiary); margin: 0 0 6px; }
    .hours-body { font-size: 0.9rem; color: var(--text-secondary); margin: 0; line-height: 1.6; }

    @media (max-width: 820px) { .contact-grid { grid-template-columns: 1fr; } }
    @media (max-width: 480px) { .field-row { grid-template-columns: 1fr; } }
  `]
})
export class ContactComponent {
  private readonly contactService = inject(ContactService);
  private readonly transloco = inject(TranslocoService);

  sent = signal(false);
  submitting = signal(false);
  error = signal(false);

  form = { name: '', email: '', subject: 'contact.subjects.general', message: '' };

  subjects = [
    { key: 'contact.subjects.general' },
    { key: 'contact.subjects.booking' },
    { key: 'contact.subjects.technical' },
    { key: 'contact.subjects.partnership' },
    { key: 'contact.subjects.press' },
    { key: 'contact.subjects.other' },
  ];

  /** Re-emits on language change so the translated option labels stay current. */
  private readonly lang = toSignal(this.transloco.langChanges$, { initialValue: this.transloco.getActiveLang() });
  readonly subjectOptions = computed<UiSelectOption[]>(() => {
    this.lang();
    return this.subjects.map(s => ({ value: s.key, label: this.transloco.translate(s.key) }));
  });

  channels = [
    { icon: 'mail', labelKey: 'contact.channels.email', value: 'hello@travelai.com', href: 'mailto:hello@travelai.com' },
    { icon: 'chat', labelKey: 'contact.channels.chat', value: 'Live chat', href: '/chat' },
    { icon: 'help_center', labelKey: 'contact.channels.help', value: 'Help centre', href: '/help' },
  ];

  submit(): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set(false);

    this.contactService
      .submit({
        name: this.form.name.trim(),
        email: this.form.email.trim(),
        subject: this.transloco.translate(this.form.subject),
        message: this.form.message.trim(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.sent.set(true);
        },
        error: () => {
          this.submitting.set(false);
          this.error.set(true);
        },
      });
  }

  reset(): void {
    this.sent.set(false);
    this.error.set(false);
    this.form = { name: '', email: '', subject: 'contact.subjects.general', message: '' };
  }
}
