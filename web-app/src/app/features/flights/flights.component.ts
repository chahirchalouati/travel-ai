import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, forkJoin, of } from 'rxjs';
import { CatalogService, emptyPage } from '../../core/services/catalog.service';
import type { FlightSearchQuery } from '../../core/services/catalog.service';
import type { FlightSearchResult, FareCalendarDay } from '../../core/models/api.models';
import { InfiniteScrollDirective } from '../../shared/infinite-scroll/infinite-scroll.directive';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { TripContextService } from '../../core/services/trip-context.service';
import { UiSelectComponent, UiCheckboxComponent, UiAutocompleteComponent, UiDatepickerComponent } from '../../shared/ui';
import { SuggestService } from '../../core/services/suggest.service';
import { GUEST_COUNT_OPTIONS } from '../catalog/catalog-options';

const HEADER_IMG =
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80';

type TripType = 'oneway' | 'round' | 'multi';

/** A single leg of a multi-city itinerary. */
interface Leg {
  originIata: string;
  destIata: string;
  date: string;
}

/** Results for one multi-city leg. */
interface LegResult {
  readonly leg: Leg;
  readonly flights: readonly FlightSearchResult[];
}

/** Flights sharing the same destination city. */
interface CityGroup {
  readonly city: string;
  readonly flights: readonly FlightSearchResult[];
  readonly fromPrice: number;
}

/** Destination country with its cities, ordered for display. */
interface CountryGroup {
  readonly country: string;
  readonly countryCode: string | null;
  readonly flag: string;
  readonly count: number;
  readonly fromPrice: number;
  readonly cities: readonly CityGroup[];
}

const UNGROUPED_COUNTRY = '—';
const MAX_LEGS = 5;

@Component({
  selector: 'app-flights',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, TranslocoModule, InfiniteScrollDirective, RevealDirective, UiSelectComponent, UiCheckboxComponent, UiAutocompleteComponent, UiDatepickerComponent],
  templateUrl: './flights.component.html',
  styleUrls: ['../catalog/catalog-shared.scss', './flights.component.scss'],
})
export class FlightsComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tripContext = inject(TripContextService);
  private readonly suggest = inject(SuggestService);

  /** Airport suggestions ("City (IATA)") for origin/destination fields. */
  readonly airportSuggest = (q: string) => this.suggest.airports(q);

  readonly headerImg = HEADER_IMG;
  readonly GUEST_OPTIONS = GUEST_COUNT_OPTIONS;

  /** Matching active-trip destination for a flight, or null. */
  tripFit(f: FlightSearchResult): string | null {
    return this.tripContext.match(f.destCity ?? f.destIata);
  }

  // Trip type
  readonly tripType = signal<TripType>('oneway');

  // One-way / round-trip results
  readonly results = signal<FlightSearchResult[]>([]);
  readonly inbound = signal<FlightSearchResult[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly hasMore = computed(() => this.results().length < this.total());

  // Multi-city
  readonly legs = signal<Leg[]>([
    { originIata: '', destIata: '', date: new Date().toISOString().slice(0, 10) },
    { originIata: '', destIata: '', date: new Date().toISOString().slice(0, 10) },
  ]);
  readonly legResults = signal<LegResult[]>([]);

  // Fare calendar
  readonly fareCalendar = signal<FareCalendarDay[]>([]);
  readonly cheapestFare = computed(() =>
    this.fareCalendar().reduce((min, d) => (d.minPrice < min ? d.minPrice : min), Infinity));

  // Filters (client-side, applied to loaded results)
  readonly airlineFilter = signal<Set<string>>(new Set());
  readonly maxDurationHours = signal<number>(0); // 0 = no limit

  /** Distinct airlines present across the currently loaded outbound results. */
  readonly availableAirlines = computed(() => {
    const set = new Set<string>();
    for (const f of this.results()) {
      set.add(f.airline);
    }
    return [...set].sort();
  });

  readonly filteredOutbound = computed(() => this.applyFilters(this.results()));
  private readonly filteredInbound = computed(() => this.applyFilters(this.inbound()));

  readonly grouped = computed<CountryGroup[]>(() => this.groupByCountryCity(this.filteredOutbound()));
  readonly groupedInbound = computed<CountryGroup[]>(() => this.groupByCountryCity(this.filteredInbound()));
  readonly countryCount = computed(() => this.grouped().length);
  readonly destinationCount = computed(() =>
    this.grouped().reduce((sum, c) => sum + c.cities.length, 0));

  private page = 0;

  originIata = '';
  destIata = '';
  departureDate = '';
  returnDate = '';
  passengers = 1;
  maxPrice?: number;
  sort = '';

  ngOnInit(): void {
    const dest = this.route.snapshot.queryParamMap.get('to');
    if (dest) {
      this.destIata = dest.toUpperCase();
    }
    this.tripContext.ensureLoaded();
    if (!this.departureDate) {
      this.departureDate = new Date().toISOString().slice(0, 10);
    }
    if (!this.returnDate) {
      this.returnDate = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    }
    this.runSearch();
  }

  setTripType(type: TripType): void {
    this.tripType.set(type);
    this.runSearch();
  }

  runSearch(): void {
    if (this.tripType() === 'multi') {
      this.runMultiSearch();
      return;
    }
    this.page = 0;
    this.loading.set(true);
    this.inbound.set([]);

    this.catalog
      .searchFlights(this.buildQuery(this.originIata, this.destIata, this.departureDate), 0)
      .pipe(catchError(() => of(emptyPage<FlightSearchResult>())))
      .subscribe(res => {
        this.results.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      });

    if (this.tripType() === 'round') {
      this.catalog
        .searchFlights(this.buildQuery(this.destIata, this.originIata, this.returnDate), 0)
        .pipe(catchError(() => of(emptyPage<FlightSearchResult>())))
        .subscribe(res => this.inbound.set(res.items));
    }

    this.loadFareCalendar();
  }

  private runMultiSearch(): void {
    this.loading.set(true);
    const validLegs = this.legs().filter(l => l.originIata.trim() && l.destIata.trim());
    if (validLegs.length === 0) {
      this.legResults.set([]);
      this.loading.set(false);
      return;
    }
    forkJoin(
      validLegs.map(leg =>
        this.catalog
          .searchFlights(this.buildQuery(leg.originIata, leg.destIata, leg.date), 0)
          .pipe(catchError(() => of(emptyPage<FlightSearchResult>()))),
      ),
    ).subscribe(pages => {
      this.legResults.set(
        validLegs.map((leg, i) => ({ leg, flights: pages[i].items })),
      );
      this.loading.set(false);
    });
  }

  loadMore(): void {
    if (this.loadingMore() || !this.hasMore() || this.tripType() === 'multi') {
      return;
    }
    this.loadingMore.set(true);
    this.catalog
      .searchFlights(this.buildQuery(this.originIata, this.destIata, this.departureDate), this.page + 1)
      .pipe(catchError(() => of(emptyPage<FlightSearchResult>(this.page, this.total()))))
      .subscribe(res => {
        this.page = res.page;
        this.total.set(res.total);
        this.results.update(current => [...current, ...res.items]);
        this.loadingMore.set(false);
      });
  }

  // --- fare calendar ---

  private loadFareCalendar(): void {
    const o = this.originIata.trim().toUpperCase();
    const d = this.destIata.trim().toUpperCase();
    if (!o || !d) {
      this.fareCalendar.set([]);
      return;
    }
    this.catalog
      .fareCalendar(o, d, this.departureDate || new Date().toISOString().slice(0, 10), 30)
      .pipe(catchError(() => of([] as FareCalendarDay[])))
      .subscribe(days => this.fareCalendar.set(days));
  }

  pickFareDay(date: string): void {
    this.departureDate = date;
    this.runSearch();
  }

  // --- filters ---

  toggleAirline(airline: string): void {
    this.airlineFilter.update(current => {
      const next = new Set(current);
      if (next.has(airline)) {
        next.delete(airline);
      } else {
        next.add(airline);
      }
      return next;
    });
  }

  setMaxDuration(hours: number): void {
    this.maxDurationHours.set(hours);
  }

  clearFilters(): void {
    this.airlineFilter.set(new Set());
    this.maxDurationHours.set(0);
  }

  readonly hasActiveFilters = computed(() =>
    this.airlineFilter().size > 0 || this.maxDurationHours() > 0);

  private applyFilters(flights: readonly FlightSearchResult[]): FlightSearchResult[] {
    const airlines = this.airlineFilter();
    const maxH = this.maxDurationHours();
    return flights.filter(f => {
      if (airlines.size > 0 && !airlines.has(f.airline)) {
        return false;
      }
      if (maxH > 0 && this.durationHours(f) > maxH) {
        return false;
      }
      return true;
    });
  }

  durationHours(f: FlightSearchResult): number {
    return (new Date(f.arrivalAt).getTime() - new Date(f.departureAt).getTime()) / 3_600_000;
  }

  durationLabel(f: FlightSearchResult): string {
    const total = this.durationHours(f);
    const h = Math.floor(total);
    const m = Math.round((total - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  // --- multi-city leg editing ---

  addLeg(): void {
    if (this.legs().length >= MAX_LEGS) {
      return;
    }
    const last = this.legs()[this.legs().length - 1];
    this.legs.update(ls => [...ls, {
      originIata: last?.destIata ?? '',
      destIata: '',
      date: last?.date ?? new Date().toISOString().slice(0, 10),
    }]);
  }

  removeLeg(index: number): void {
    if (this.legs().length <= 1) {
      return;
    }
    this.legs.update(ls => ls.filter((_, i) => i !== index));
  }

  updateLeg(index: number, patch: Partial<Leg>): void {
    this.legs.update(ls => ls.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  private buildQuery(origin: string, dest: string, date: string): FlightSearchQuery {
    return {
      originIata: origin.trim().toUpperCase() || undefined,
      destIata: dest.trim().toUpperCase() || undefined,
      departureDate: date || new Date().toISOString().slice(0, 10),
      passengers: this.passengers || 1,
      maxPrice: this.maxPrice,
      sort: this.sort || undefined,
    };
  }

  // --- grouping helpers ---

  private groupByCountryCity(flights: readonly FlightSearchResult[]): CountryGroup[] {
    const byCountry = new Map<string, FlightSearchResult[]>();
    for (const f of flights) {
      const key = f.destCountry?.trim() || UNGROUPED_COUNTRY;
      const bucket = byCountry.get(key);
      if (bucket) {
        bucket.push(f);
      } else {
        byCountry.set(key, [f]);
      }
    }

    return [...byCountry.entries()]
      .map(([country, countryFlights]) => this.toCountryGroup(country, countryFlights))
      .sort((a, b) => this.compareGroupNames(a.country, b.country));
  }

  private toCountryGroup(country: string, flights: FlightSearchResult[]): CountryGroup {
    const byCity = new Map<string, FlightSearchResult[]>();
    for (const f of flights) {
      const key = f.destCity?.trim() || f.destIata;
      const bucket = byCity.get(key);
      if (bucket) {
        bucket.push(f);
      } else {
        byCity.set(key, [f]);
      }
    }

    const cities: CityGroup[] = [...byCity.entries()]
      .map(([city, cityFlights]) => ({
        city,
        flights: cityFlights,
        fromPrice: this.minPrice(cityFlights),
      }))
      .sort((a, b) => this.compareGroupNames(a.city, b.city));

    const code = flights.find(f => f.destCountryCode)?.destCountryCode ?? null;
    return {
      country,
      countryCode: code,
      flag: this.flagEmoji(code),
      count: flights.length,
      fromPrice: this.minPrice(flights),
      cities,
    };
  }

  private minPrice(flights: readonly FlightSearchResult[]): number {
    return flights.reduce((min, f) => (f.price < min ? f.price : min), Infinity);
  }

  private compareGroupNames(a: string, b: string): number {
    if (a === UNGROUPED_COUNTRY) {
      return 1;
    }
    if (b === UNGROUPED_COUNTRY) {
      return -1;
    }
    return a.localeCompare(b);
  }

  private flagEmoji(code: string | null): string {
    if (!code || code.length !== 2) {
      return '🌍';
    }
    const base = 0x1f1e6;
    const upper = code.toUpperCase();
    return String.fromCodePoint(
      base + upper.charCodeAt(0) - 65,
      base + upper.charCodeAt(1) - 65,
    );
  }

  open(id: string): void {
    this.router.navigate(['/flights', id]);
  }
}
