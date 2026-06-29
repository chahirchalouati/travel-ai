import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type ItemKind = 'flight' | 'stay' | 'do' | 'eat';

interface ItineraryItem {
  time: string;
  icon: string;
  title: string;
  meta: string;
  kind: ItemKind;
}

interface ItineraryDay {
  day: string;
  place: string;
  items: ItineraryItem[];
}

interface MapPin {
  x: number; // 0-100 %
  y: number; // 0-100 %
  n: number;
}

interface TripSample {
  key: string;
  brief: string;
  summary: string;
  days: ItineraryDay[];
  pins: MapPin[];
}

interface QuickPick {
  emoji: string;
  label: string;
  key: string;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);

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

  private timers: ReturnType<typeof setTimeout>[] = [];

  readonly samples: TripSample[] = [
    {
      key: 'japan',
      brief: '10 days in Japan — temples, food & quiet mornings',
      summary: 'Kyoto · Hakone · Tokyo',
      days: [
        {
          day: 'Day 1', place: 'Kyoto',
          items: [
            { time: '09:10', icon: 'flight_land', title: 'Land at Kansai (KIX)', meta: 'Haruka express → Kyoto', kind: 'flight' },
            { time: '14:00', icon: 'hotel', title: 'Ryokan Genhouin', meta: 'Tatami suite · 9.4', kind: 'stay' },
            { time: '17:30', icon: 'temple_buddhist', title: 'Fushimi Inari at dusk', meta: 'Beat the crowds', kind: 'do' },
          ],
        },
        {
          day: 'Day 2', place: 'Kyoto',
          items: [
            { time: '08:00', icon: 'forest', title: 'Arashiyama bamboo grove', meta: 'Go before 9am', kind: 'do' },
            { time: '13:00', icon: 'ramen_dining', title: 'Omurice at Kichi Kichi', meta: 'Reserved · locals love', kind: 'eat' },
          ],
        },
        {
          day: 'Day 4', place: 'Hakone',
          items: [
            { time: '11:00', icon: 'train', title: 'Romancecar to Hakone', meta: 'Mt. Fuji views right side', kind: 'do' },
            { time: '16:00', icon: 'hot_tub', title: 'Onsen ryokan stay', meta: 'Private rotenburo · 9.6', kind: 'stay' },
          ],
        },
      ],
      pins: [{ x: 30, y: 64, n: 1 }, { x: 46, y: 52, n: 2 }, { x: 66, y: 40, n: 3 }],
    },
    {
      key: 'portugal',
      brief: 'A week along the coast of Portugal',
      summary: 'Lisbon · Sintra · Algarve',
      days: [
        {
          day: 'Day 1', place: 'Lisbon',
          items: [
            { time: '12:20', icon: 'flight_land', title: 'Arrive Lisbon (LIS)', meta: 'Aerobus → Baixa', kind: 'flight' },
            { time: '15:00', icon: 'hotel', title: 'Casa do Príncipe', meta: 'Alfama view · 9.2', kind: 'stay' },
            { time: '19:30', icon: 'restaurant', title: 'Fado dinner in Alfama', meta: 'Tasca do Chico', kind: 'eat' },
          ],
        },
        {
          day: 'Day 2', place: 'Sintra',
          items: [
            { time: '09:00', icon: 'castle', title: 'Pena Palace early entry', meta: 'First slot beats lines', kind: 'do' },
            { time: '14:00', icon: 'local_cafe', title: 'Travesseiros at Piriquita', meta: 'Worth the queue', kind: 'eat' },
          ],
        },
        {
          day: 'Day 4', place: 'Algarve',
          items: [
            { time: '10:30', icon: 'sailing', title: 'Benagil sea caves', meta: 'Kayak at low tide', kind: 'do' },
            { time: '17:00', icon: 'beach_access', title: 'Praia da Marinha', meta: 'Golden hour cliffs', kind: 'do' },
          ],
        },
      ],
      pins: [{ x: 28, y: 46, n: 1 }, { x: 22, y: 40, n: 2 }, { x: 38, y: 70, n: 3 }],
    },
    {
      key: 'iceland',
      brief: 'Iceland ring road in 6 days, chasing the aurora',
      summary: 'Reykjavík · South Coast · Vík',
      days: [
        {
          day: 'Day 1', place: 'Reykjavík',
          items: [
            { time: '06:40', icon: 'flight_land', title: 'Land at Keflavík', meta: 'Blue Lagoon on the way', kind: 'flight' },
            { time: '15:00', icon: 'hotel', title: 'Ion City boutique', meta: 'Aurora wake-up call · 9.1', kind: 'stay' },
          ],
        },
        {
          day: 'Day 2', place: 'South Coast',
          items: [
            { time: '09:00', icon: 'waterfall', title: 'Seljalandsfoss + Skógafoss', meta: 'Walk behind the falls', kind: 'do' },
            { time: '21:30', icon: 'nightlight', title: 'Aurora hunt', meta: 'KP 4 forecast · clear', kind: 'do' },
          ],
        },
        {
          day: 'Day 3', place: 'Vík',
          items: [
            { time: '10:00', icon: 'landscape', title: 'Reynisfjara black sand', meta: 'Mind the sneaker waves', kind: 'do' },
            { time: '13:00', icon: 'ramen_dining', title: 'Soup at Black Beach', meta: 'Lamb stew · cosy', kind: 'eat' },
          ],
        },
      ],
      pins: [{ x: 24, y: 38, n: 1 }, { x: 52, y: 58, n: 2 }, { x: 70, y: 66, n: 3 }],
    },
  ];

  readonly quickPicks: QuickPick[] = [
    { emoji: '⛩️', label: 'Japan', key: 'japan' },
    { emoji: '🌊', label: 'Portugal', key: 'portugal' },
    { emoji: '❄️', label: 'Iceland', key: 'iceland' },
  ];

  ngOnInit(): void {
    this.runBuild(this.samples[0]);
  }

  ngOnDestroy(): void {
    this.clearTimers();
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
    this.activeSample.set(sample);
    this.revealed.set(0);
    this.pinsShown.set(0);
    this.typedBrief.set('');

    if (this.reduceMotion) {
      this.typedBrief.set(sample.brief);
      this.phase.set('done');
      this.revealed.set(this.totalItems());
      this.pinsShown.set(sample.pins.length);
      return;
    }

    this.phase.set('thinking');

    // 1) Type the trip brief, character by character.
    const text = sample.brief;
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

    // 4) Settle.
    this.after(typedDone + 480 + total * 240, () => this.phase.set('done'));
  }

  selectPick(pick: QuickPick): void {
    const sample = this.samples.find((s) => s.key === pick.key) ?? this.samples[0];
    this.searchQuery.set(sample.brief);
    this.runBuild(sample);
  }

  /** Match a free-text query to the closest sample for the live preview. */
  private matchSample(query: string): TripSample {
    const q = query.toLowerCase();
    return (
      this.samples.find((s) =>
        [s.key, s.summary, s.brief].some((t) => t.toLowerCase().includes(q) || q.includes(s.key)),
      ) ?? this.samples[0]
    );
  }

  planTrip(): void {
    const q = this.searchQuery().trim();
    if (!q) return;
    this.runBuild(this.matchSample(q));
  }

  askAI(): void {
    const query = this.searchQuery().trim();
    this.router.navigate(['/chat'], query ? { queryParams: { q: query } } : {});
  }

  openFullPlan(): void {
    const q = this.searchQuery().trim() || this.activeSample()?.brief || '';
    this.router.navigate(['/chat'], q ? { queryParams: { q } } : {});
  }
}
