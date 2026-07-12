import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';

/**
 * Emits `scrolled` when the host element (a sentinel placed at the end of a list)
 * scrolls into view, so the parent can load the next page.
 *
 * Usage:
 *   <div appInfiniteScroll [scrollDisabled]="loadingMore() || !hasMore()"
 *        (scrolled)="loadMore()"></div>
 */
@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true,
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;
  private disabled = false;

  /** When true, intersections are ignored (e.g. a request is in flight or no pages remain). */
  @Input()
  set scrollDisabled(value: boolean) {
    const wasDisabled = this.disabled;
    this.disabled = value;
    // Re-arm once a load finishes: the sentinel may still be in view, and the
    // observer only fires on intersection *transitions*, so without this the
    // next page would never load while the sentinel stays on screen.
    if (wasDisabled && !value) {
      this.rearm();
    }
  }
  get scrollDisabled(): boolean {
    return this.disabled;
  }

  /** Prefetch distance: start loading before the sentinel is fully visible. */
  @Input() rootMargin = '400px';

  @Output() readonly scrolled = new EventEmitter<void>();

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && !this.scrollDisabled) {
          this.scrolled.emit();
        }
      },
      { root: null, rootMargin: this.rootMargin, threshold: 0 },
    );
    this.observer.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  /** Forces a fresh intersection check by re-observing the sentinel node. */
  private rearm(): void {
    const el = this.host.nativeElement;
    this.observer?.unobserve(el);
    this.observer?.observe(el);
  }
}
