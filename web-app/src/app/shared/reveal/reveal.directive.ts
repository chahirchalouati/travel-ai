import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Reveals the host element with a fade + rise transition the first time it
 * scrolls into view. One-shot: once revealed it stays revealed.
 *
 * Compositor-friendly (animates opacity/transform only) and honours
 * `prefers-reduced-motion` — reduced-motion users see content immediately with
 * no transition. Off the browser (SSR) content is shown straight away so it is
 * never left hidden.
 *
 * Usage:
 *   <section appReveal>…</section>
 *   <article appReveal [appRevealDelay]="$index * 60">…</article>  // staggered grid
 */
@Directive({
  selector: '[appReveal]',
  standalone: true,
  host: {
    class: 'reveal',
    '[class.reveal--visible]': 'visible',
    '[style.--reveal-delay]': 'revealDelay + "ms"',
  },
})
export class RevealDirective implements OnInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;

  /** Staggered delay (ms) before the reveal transition starts. */
  @Input('appRevealDelay') revealDelay = 0;

  /** Fraction of the element that must be visible before revealing (0–1). */
  @Input() revealThreshold = 0.12;

  visible = false;

  ngOnInit(): void {
    // No observer off the browser or when the user prefers reduced motion:
    // show content immediately so nothing stays hidden.
    if (!isPlatformBrowser(this.platformId) || this.prefersReducedMotion()) {
      this.visible = true;
      return;
    }

    this.observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          this.visible = true;
          this.observer?.disconnect();
        }
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: this.revealThreshold },
    );
    this.observer.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }
}
