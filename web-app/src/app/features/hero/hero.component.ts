import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

type ItemKind = 'flight' | 'stay' | 'do' | 'eat';

interface ItineraryItem {
  time: string;
  icon: string;
  /** Transloco key resolved at render time. */
  titleKey: string;
  metaKey: string;
  kind: ItemKind;
}

interface ItineraryDay {
  day: number;
  /** Transloco key for the place label. */
  placeKey: string;
  items: ItineraryItem[];
}

interface MapPin {
  x: number; // 0-100 %
  y: number; // 0-100 %
  n: number;
}

interface TripSample {
  key: string;
  /** Transloco key for the typed brief line. */
  briefKey: string;
  summaryKey: string;
  /** Cinematic backdrop shown behind the stage while this trip builds. */
  image: string;
  days: ItineraryDay[];
  pins: MapPin[];
}

interface QuickPick {
  emoji: string;
  labelKey: string;
  key: string;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  private readonly reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  searchQuery = signal('');

  // Build-sequence state
  phase = signal<'thinking' | 'building' | 'done'>('thinking');
  typedBrief = signal('');
  revealed = signal(0); // number of itinerary items revealed
  pinsShown = signal(0);
  activeSample = signal<TripSample | null>(null);

  // Pointer parallax — normalized -1..1 offsets the stage layers track.
  mx = signal(0);
  my = signal(0);

  /** How long a finished trip lingers before the carousel moves on. */
  private readonly dwellMs = 2600;

  private timers: ReturnType<typeof setTimeout>[] = [];
  private cycleTimer: ReturnType<typeof setTimeout> | null = null;
  private cycleIndex = 0;
  private autoplay = true;
  private hoverPaused = false;
  private langSub: Subscription | null = null;

  readonly samples: TripSample[] = [
    {
      key: 'japan',
      briefKey: 'hero.samples.japan.brief',
      summaryKey: 'hero.samples.japan.summary',
      image: 'assets/hero/japan.webp',
      days: [
        {
          day: 1, placeKey: 'hero.places.kyoto',
          items: [
            { time: '09:10', icon: 'flight_land', titleKey: 'hero.samples.japan.items.kansai.title', metaKey: 'hero.samples.japan.items.kansai.meta', kind: 'flight' },
            { time: '14:00', icon: 'hotel', titleKey: 'hero.samples.japan.items.ryokan.title', metaKey: 'hero.samples.japan.items.ryokan.meta', kind: 'stay' },
            { time: '17:30', icon: 'temple_buddhist', titleKey: 'hero.samples.japan.items.fushimi.title', metaKey: 'hero.samples.japan.items.fushimi.meta', kind: 'do' },
          ],
        },
        {
          day: 2, placeKey: 'hero.places.kyoto',
          items: [
            { time: '08:00', icon: 'forest', titleKey: 'hero.samples.japan.items.arashiyama.title', metaKey: 'hero.samples.japan.items.arashiyama.meta', kind: 'do' },
            { time: '13:00', icon: 'ramen_dining', titleKey: 'hero.samples.japan.items.omurice.title', metaKey: 'hero.samples.japan.items.omurice.meta', kind: 'eat' },
          ],
        },
        {
          day: 4, placeKey: 'hero.places.hakone',
          items: [
            { time: '11:00', icon: 'train', titleKey: 'hero.samples.japan.items.romancecar.title', metaKey: 'hero.samples.japan.items.romancecar.meta', kind: 'do' },
            { time: '16:00', icon: 'hot_tub', titleKey: 'hero.samples.japan.items.onsen.title', metaKey: 'hero.samples.japan.items.onsen.meta', kind: 'stay' },
          ],
        },
      ],
      pins: [{ x: 30, y: 64, n: 1 }, { x: 46, y: 52, n: 2 }, { x: 66, y: 40, n: 3 }],
    },
    {
      key: 'portugal',
      briefKey: 'hero.samples.portugal.brief',
      summaryKey: 'hero.samples.portugal.summary',
      image: 'assets/hero/portugal.webp',
      days: [
        {
          day: 1, placeKey: 'hero.places.lisbon',
          items: [
            { time: '12:20', icon: 'flight_land', titleKey: 'hero.samples.portugal.items.lisbon.title', metaKey: 'hero.samples.portugal.items.lisbon.meta', kind: 'flight' },
            { time: '15:00', icon: 'hotel', titleKey: 'hero.samples.portugal.items.casa.title', metaKey: 'hero.samples.portugal.items.casa.meta', kind: 'stay' },
            { time: '19:30', icon: 'restaurant', titleKey: 'hero.samples.portugal.items.fado.title', metaKey: 'hero.samples.portugal.items.fado.meta', kind: 'eat' },
          ],
        },
        {
          day: 2, placeKey: 'hero.places.sintra',
          items: [
            { time: '09:00', icon: 'castle', titleKey: 'hero.samples.portugal.items.pena.title', metaKey: 'hero.samples.portugal.items.pena.meta', kind: 'do' },
            { time: '14:00', icon: 'local_cafe', titleKey: 'hero.samples.portugal.items.travesseiros.title', metaKey: 'hero.samples.portugal.items.travesseiros.meta', kind: 'eat' },
          ],
        },
        {
          day: 4, placeKey: 'hero.places.algarve',
          items: [
            { time: '10:30', icon: 'sailing', titleKey: 'hero.samples.portugal.items.benagil.title', metaKey: 'hero.samples.portugal.items.benagil.meta', kind: 'do' },
            { time: '17:00', icon: 'beach_access', titleKey: 'hero.samples.portugal.items.marinha.title', metaKey: 'hero.samples.portugal.items.marinha.meta', kind: 'do' },
          ],
        },
      ],
      pins: [{ x: 28, y: 46, n: 1 }, { x: 22, y: 40, n: 2 }, { x: 38, y: 70, n: 3 }],
    },
    {
      key: 'iceland',
      briefKey: 'hero.samples.iceland.brief',
      summaryKey: 'hero.samples.iceland.summary',
      image: 'assets/hero/iceland.webp',
      days: [
        {
          day: 1, placeKey: 'hero.places.reykjavik',
          items: [
            { time: '06:40', icon: 'flight_land', titleKey: 'hero.samples.iceland.items.keflavik.title', metaKey: 'hero.samples.iceland.items.keflavik.meta', kind: 'flight' },
            { time: '15:00', icon: 'hotel', titleKey: 'hero.samples.iceland.items.ioncity.title', metaKey: 'hero.samples.iceland.items.ioncity.meta', kind: 'stay' },
          ],
        },
        {
          day: 2, placeKey: 'hero.places.southCoast',
          items: [
            { time: '09:00', icon: 'waterfall', titleKey: 'hero.samples.iceland.items.waterfalls.title', metaKey: 'hero.samples.iceland.items.waterfalls.meta', kind: 'do' },
            { time: '21:30', icon: 'nightlight', titleKey: 'hero.samples.iceland.items.aurora.title', metaKey: 'hero.samples.iceland.items.aurora.meta', kind: 'do' },
          ],
        },
        {
          day: 3, placeKey: 'hero.places.vik',
          items: [
            { time: '10:00', icon: 'landscape', titleKey: 'hero.samples.iceland.items.reynisfjara.title', metaKey: 'hero.samples.iceland.items.reynisfjara.meta', kind: 'do' },
            { time: '13:00', icon: 'ramen_dining', titleKey: 'hero.samples.iceland.items.soup.title', metaKey: 'hero.samples.iceland.items.soup.meta', kind: 'eat' },
          ],
        },
      ],
      pins: [{ x: 24, y: 38, n: 1 }, { x: 52, y: 58, n: 2 }, { x: 70, y: 66, n: 3 }],
    },
  ];

  readonly quickPicks: QuickPick[] = [
    { emoji: '⛩️', labelKey: 'hero.picks.japan', key: 'japan' },
    { emoji: '🌊', labelKey: 'hero.picks.portugal', key: 'portugal' },
    { emoji: '❄️', labelKey: 'hero.picks.iceland', key: 'iceland' },
  ];

  ngOnInit(): void {
    this.runBuild(this.samples[0]);
    // Re-run the current build when the language changes so the typed brief,
    // which is resolved imperatively, picks up the new translation.
    this.langSub = this.transloco.langChanges$.subscribe(() => {
      const current = this.activeSample() ?? this.samples[0];
      this.runBuild(current);
    });
  }

  ngOnDestroy(): void {
    this.clearTimers();
    if (this.cycleTimer) clearTimeout(this.cycleTimer);
    this.langSub?.unsubscribe();
  }

  /** Total revealable items in the active sample. */
  totalItems(): number {
    return this.activeSample()?.days.reduce((n, d) => n + d.items.length, 0) ?? 0;
  }

  /** Global reveal index of an item, so it can be staged in sequence. */
  flatIndex(dayIdx: number, itemIdx: number): number {
    const days = this.activeSample()?.days ?? [];
    let n = 0;
    for (let i = 0; i < dayIdx; i++) n += days[i].items.length;
    return n + itemIdx;
  }

  isItemShown(dayIdx: number, itemIdx: number): boolean {
    return this.flatIndex(dayIdx, itemIdx) < this.revealed();
  }

  isDayShown(dayIdx: number): boolean {
    return this.flatIndex(dayIdx, 0) < this.revealed();
  }

  /** SVG polyline points ("x,y x,y …") for the route between pins. */
  routePoints(): string {
    return (this.activeSample()?.pins ?? []).map((p) => `${p.x},${p.y}`).join(' ');
  }

  private clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }

  /** Run the staged "AI is assembling your trip" sequence. */
  private runBuild(sample: TripSample): void {
    this.clearTimers();
    if (this.cycleTimer) {
      clearTimeout(this.cycleTimer);
      this.cycleTimer = null;
    }
    this.activeSample.set(sample);
    this.revealed.set(0);
    this.pinsShown.set(0);
    this.typedBrief.set('');

    const brief = this.transloco.translate(sample.briefKey);

    if (this.reduceMotion) {
      this.typedBrief.set(brief);
      this.phase.set('done');
      this.revealed.set(this.totalItems());
      this.pinsShown.set(sample.pins.length);
      return;
    }

    this.phase.set('thinking');

    // 1) Type the trip brief, character by character.
    const text = brief;
    const typeSpeed = 26;
    for (let i = 1; i <= text.length; i++) {
      this.after(180 + i * typeSpeed, () => this.typedBrief.set(text.slice(0, i)));
    }
    const typedDone = 180 + text.length * typeSpeed;

    // 2) Reveal itinerary items one by one.
    this.after(typedDone + 240, () => this.phase.set('building'));
    const total = this.totalItems();
    for (let i = 1; i <= total; i++) {
      this.after(typedDone + 360 + i * 240, () => this.revealed.set(i));
    }

    // 3) Drop map pins in step with the items they belong to.
    sample.pins.forEach((_, i) => {
      this.after(typedDone + 520 + i * 360, () => this.pinsShown.set(i + 1));
    });

    // 4) Settle, then — if still on autoplay — queue the next destination.
    const settleAt = typedDone + 480 + total * 240;
    this.after(settleAt, () => this.phase.set('done'));
    if (this.autoplay) {
      this.cycleTimer = setTimeout(() => this.advance(), settleAt + this.dwellMs);
    }
  }

  /** Advance the carousel to the next destination, unless the user is hovering. */
  private advance(): void {
    if (!this.autoplay || this.reduceMotion) return;
    if (this.hoverPaused) {
      this.cycleTimer = setTimeout(() => this.advance(), 900);
      return;
    }
    this.cycleIndex = (this.cycleIndex + 1) % this.samples.length;
    this.runBuild(this.samples[this.cycleIndex]);
  }

  /** The user took the wheel — freeze the carousel on whatever is showing. */
  private stopAutoplay(): void {
    this.autoplay = false;
    if (this.cycleTimer) {
      clearTimeout(this.cycleTimer);
      this.cycleTimer = null;
    }
  }

  /** Hovering the stage holds the current trip in view. */
  onStageEnter(): void {
    this.hoverPaused = true;
  }
  onStageLeave(): void {
    this.hoverPaused = false;
  }

  /** Track the pointer to drive layered parallax. Change detection coalesces
   *  the signal writes to one update per frame, so no manual throttling. */
  onPointerMove(event: PointerEvent): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (this.reduceMotion || !w || !h) return;
    this.mx.set((event.clientX / w - 0.5) * 2);
    this.my.set((event.clientY / h - 0.5) * 2);
  }

  onPointerLeave(): void {
    this.mx.set(0);
    this.my.set(0);
  }

  selectPick(pick: QuickPick): void {
    const sample = this.samples.find((s) => s.key === pick.key) ?? this.samples[0];
    this.router.navigate(['/planner'], {
      queryParams: { q: this.transloco.translate(sample.briefKey) },
    });
  }

  /** Stop the carousel as soon as the user engages the search field. */
  onSearchFocus(): void {
    this.stopAutoplay();
  }

  /** Submit the typed brief to the planner, carrying the sentence as a query. */
  planTrip(): void {
    const q = this.searchQuery().trim();
    this.router.navigate(['/planner'], q ? { queryParams: { q } } : {});
  }

  openFullPlan(): void {
    const q =
      this.searchQuery().trim() ||
      (this.activeSample() ? this.transloco.translate(this.activeSample()!.briefKey) : '');
    this.router.navigate(['/chat'], q ? { queryParams: { q } } : {});
  }
}
