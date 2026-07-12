import { Component, computed, signal, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap, forkJoin, of, catchError, timer, take, first } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TravelService } from '../../core/services/travel.service';
import { CatalogService } from '../../core/services/catalog.service';
import { BookingService } from '../../core/services/booking.service';
import { PaymentService } from '../../core/services/payment.service';
import { ChatService } from '../../core/services/chat.service';
import { DestinationService } from '../../core/services/destination.service';
import { PlannerMapComponent, PlannerPin } from './planner-map.component';
import { UiSentenceBriefComponent, UiInputComponent, UiRangeComponent, type TripBrief } from '../../shared/ui';

// ─── Types ───────────────────────────────────────────────────────────────────

type Lang = 'it' | 'en' | 'fr' | 'es';
type Stage = 'empty' | 'generating' | 'results' | 'detail';
type Overlay = null | 'booking' | 'payment' | 'confirmation' | 'concierge';
type Priority = 'food' | 'stay' | 'bal';
type DateMode = 'fixed' | 'flex';

interface Strings {
  restart: string;
  i_title: string; i_sub: string; i_budget: string; i_required: string; i_total: string;
  i_dates: string; i_fixed: string; i_flex: string; i_nights: string;
  i_people: string; i_adults: string; i_children: string; i_optional: string;
  i_priority: string; i_priority_sub: string; i_constraints: string;
  prio_food: string; prio_stay: string; prio_bal: string;
  c_sea: string; c_pets: string; c_access: string; c_family: string;
  dest_open_t: string; dest_open_s: string; dest_set_t: string; dest_set_s: string;
  gen: string; gen_again: string;
  e_title: string; e_sub: string;
  g_title: string; g_sub: string; g_foot: string;
  ag_orch: string; ag_orch_t: string; ag_hotel: string; ag_hotel_t: string;
  ag_rest: string; ag_rest_t: string; ag_flight: string; ag_flight_t: string;
  ag_rank: string; ag_rank_t: string;
  r_title: string; r_recommended: string; r_view: string; r_regen: string;
  fit_in: string; fit_over: string;
  notice_offline: string; notice_slow: string; notice_dismiss: string; r_empty: string;
  d_back: string; d_breakdown: string; d_vs_budget: string; d_ideal: string;
  d_elements: string; d_change: string; d_book: string;
  b_title: string; b_checking: string; b_traveler: string; b_summary: string;
  b_total: string; b_continue: string; b_wait: string; b_error: string;
  p_title: string; p_paying: string; p_how: string; p_full: string; p_full_sub: string;
  p_install: string; p_plan: string; p_now: string; p_platform: string;
  p_pay_full: string; p_pay_install: string;
  c_title: string; c_sub: string; c_concierge: string; c_concierge_sub: string;
  c_open: string; c_restart: string; concept: string;
  cc_title: string; cc_context: string; cc_suggestion: string; cc_placeholder: string;
  cc_error: string;
  st_plan: string; st_proposals: string; st_detail: string; st_book: string;
  sign_out: string; sign_in: string;
  pill_hotel: string; pill_restaurants: string; pill_flight: string;
  auth_sign_in: string; auth_register: string; auth_first_name: string; auth_last_name: string;
  auth_password_placeholder: string; auth_loading: string; auth_create: string;
  auth_email_required: string; auth_fields_required: string;
  auth_invalid: string; auth_register_error: string;
  auth_first_placeholder: string; auth_last_placeholder: string;
  check_restaurants: string; check_flight: string; check_available: string; check_checking: string;
  tr_adults: string; tr_children: string;
  rs_nights: string; rs_ppl: string;
  rs_prio_food: string; rs_prio_stay: string; rs_prio_bal: string;
  install_sub: string;
  conf_hotel: string; conf_restaurants: string; conf_flight: string;
  rest_recommended: string; flight_roundtrip: string; proposal_why_default: string;
  hotel_sea: string; local_cuisine: string; bag_included: string; carry_on: string; free_cancel: string;
  per_person: string; under_budget: string;
  split_stay: string; split_food: string; split_transport: string;
}

// Maps each flat `Strings` key to its dotted Transloco key under the
// `planner` i18n namespace (assets/i18n/{en,es,fr,it}.json). The component
// keeps the flat `Strings` shape internally (used pervasively by the
// template) but now sources every value from Transloco instead of an
// inline per-language dictionary.
const STRING_KEYS: Record<keyof Strings, string> = {
  restart: 'planner.restart',
  i_title: 'planner.intake.title',
  i_sub: 'planner.intake.sub',
  i_budget: 'planner.intake.budget',
  i_required: 'planner.intake.required',
  i_total: 'planner.intake.total',
  i_dates: 'planner.intake.dates',
  i_fixed: 'planner.intake.fixed',
  i_flex: 'planner.intake.flex',
  i_nights: 'planner.intake.nights',
  i_people: 'planner.intake.people',
  i_adults: 'planner.intake.adults',
  i_children: 'planner.intake.children',
  i_optional: 'planner.intake.optional',
  i_priority: 'planner.intake.priority',
  i_priority_sub: 'planner.intake.prioritySub',
  i_constraints: 'planner.intake.constraints',
  prio_food: 'planner.priority.food',
  prio_stay: 'planner.priority.stay',
  prio_bal: 'planner.priority.balanced',
  c_sea: 'planner.constraints.sea',
  c_pets: 'planner.constraints.pets',
  c_access: 'planner.constraints.accessible',
  c_family: 'planner.constraints.family',
  dest_open_t: 'planner.destination.openTitle',
  dest_open_s: 'planner.destination.openSub',
  dest_set_t: 'planner.destination.setTitle',
  dest_set_s: 'planner.destination.setSub',
  gen: 'planner.generate.label',
  gen_again: 'planner.generate.again',
  e_title: 'planner.empty.title',
  e_sub: 'planner.empty.sub',
  g_title: 'planner.generating.title',
  g_sub: 'planner.generating.sub',
  g_foot: 'planner.generating.footer',
  ag_orch: 'planner.agents.orchestrator.name',
  ag_orch_t: 'planner.agents.orchestrator.task',
  ag_hotel: 'planner.agents.hotel.name',
  ag_hotel_t: 'planner.agents.hotel.task',
  ag_rest: 'planner.agents.restaurant.name',
  ag_rest_t: 'planner.agents.restaurant.task',
  ag_flight: 'planner.agents.flight.name',
  ag_flight_t: 'planner.agents.flight.task',
  ag_rank: 'planner.agents.ranking.name',
  ag_rank_t: 'planner.agents.ranking.task',
  r_title: 'planner.results.title',
  r_recommended: 'planner.results.recommended',
  r_view: 'planner.results.view',
  r_regen: 'planner.results.regenerate',
  fit_in: 'planner.results.fitIn',
  fit_over: 'planner.results.fitOver',
  r_empty: 'planner.results.empty',
  notice_offline: 'planner.notice.offline',
  notice_slow: 'planner.notice.slow',
  notice_dismiss: 'planner.notice.dismiss',
  d_back: 'planner.detail.back',
  d_breakdown: 'planner.detail.breakdown',
  d_vs_budget: 'planner.detail.vsBudget',
  d_ideal: 'planner.detail.ideal',
  d_elements: 'planner.detail.elements',
  d_change: 'planner.detail.change',
  d_book: 'planner.detail.book',
  b_title: 'planner.booking.title',
  b_checking: 'planner.booking.checking',
  b_traveler: 'planner.booking.traveler',
  b_summary: 'planner.booking.summary',
  b_total: 'planner.booking.total',
  b_continue: 'planner.booking.continue',
  b_wait: 'planner.booking.waiting',
  b_error: 'planner.booking.error',
  p_title: 'planner.payment.title',
  p_paying: 'planner.payment.paying',
  p_how: 'planner.payment.how',
  p_full: 'planner.payment.full',
  p_full_sub: 'planner.payment.fullSub',
  p_install: 'planner.payment.install',
  p_plan: 'planner.payment.plan',
  p_now: 'planner.payment.now',
  p_platform: 'planner.payment.platform',
  p_pay_full: 'planner.payment.payFull',
  p_pay_install: 'planner.payment.payInstall',
  c_title: 'planner.confirmation.title',
  c_sub: 'planner.confirmation.sub',
  c_concierge: 'planner.confirmation.concierge',
  c_concierge_sub: 'planner.confirmation.conciergeSub',
  c_open: 'planner.confirmation.open',
  c_restart: 'planner.confirmation.restart',
  concept: 'planner.confirmation.concept',
  cc_title: 'planner.concierge.title',
  cc_context: 'planner.concierge.context',
  cc_suggestion: 'planner.concierge.suggestion',
  cc_placeholder: 'planner.concierge.placeholder',
  cc_error: 'planner.concierge.error',
  st_plan: 'planner.steps.plan',
  st_proposals: 'planner.steps.proposals',
  st_detail: 'planner.steps.detail',
  st_book: 'planner.steps.book',
  sign_out: 'planner.session.signOut',
  sign_in: 'planner.session.signIn',
  pill_hotel: 'planner.pill.hotel',
  pill_restaurants: 'planner.pill.restaurants',
  pill_flight: 'planner.pill.flight',
  auth_sign_in: 'planner.auth.signIn',
  auth_register: 'planner.auth.register',
  auth_first_name: 'planner.auth.firstName',
  auth_last_name: 'planner.auth.lastName',
  auth_password_placeholder: 'planner.auth.passwordPlaceholder',
  auth_loading: 'planner.auth.loading',
  auth_create: 'planner.auth.create',
  auth_email_required: 'planner.auth.emailRequired',
  auth_fields_required: 'planner.auth.fieldsRequired',
  auth_invalid: 'planner.auth.invalid',
  auth_register_error: 'planner.auth.registerError',
  auth_first_placeholder: 'planner.auth.firstPlaceholder',
  auth_last_placeholder: 'planner.auth.lastPlaceholder',
  check_restaurants: 'planner.check.restaurants',
  check_flight: 'planner.check.flight',
  check_available: 'planner.check.available',
  check_checking: 'planner.check.checking',
  tr_adults: 'planner.traveler.adults',
  tr_children: 'planner.traveler.children',
  rs_nights: 'planner.summary.nights',
  rs_ppl: 'planner.summary.people',
  rs_prio_food: 'planner.summary.prioFood',
  rs_prio_stay: 'planner.summary.prioStay',
  rs_prio_bal: 'planner.summary.prioBalanced',
  install_sub: 'planner.installment.sub',
  conf_hotel: 'planner.confirmed.hotel',
  conf_restaurants: 'planner.confirmed.restaurants',
  conf_flight: 'planner.confirmed.flight',
  rest_recommended: 'planner.proposal.restaurantsRecommended',
  flight_roundtrip: 'planner.proposal.flightRoundtrip',
  proposal_why_default: 'planner.proposal.whyDefault',
  hotel_sea: 'planner.proposal.hotelSea',
  local_cuisine: 'planner.proposal.localCuisine',
  bag_included: 'planner.proposal.bagIncluded',
  carry_on: 'planner.proposal.carryOn',
  free_cancel: 'planner.proposal.freeCancel',
  per_person: 'planner.proposal.perPerson',
  under_budget: 'planner.proposal.underBudget',
  split_stay: 'planner.split.stay',
  split_food: 'planner.split.food',
  split_transport: 'planner.split.transport',
};

// Neutral image placeholder (a CSS gradient — UI styling, not real-world data)
// used only when a backend record has no image of its own.
const PLACEHOLDER_IMG =
  'linear-gradient(135deg, #e9edf0 0%, #d7dee3 100%) center/cover no-repeat';

function fmt(n: number, lang: Lang): string {
  const sep = lang === 'en' ? ',' : '.';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

// ─── Live-planning timing ──────────────────────────────────────────────────────
// Proposal generation is LLM-bound (the backend writes an AI motivation per
// package), so it can take ~8–20s+ and is variable. The poll window must be
// generous enough that live results reliably land before we fall back to demo.
const PLANNER_POLL_INTERVAL_MS = 2000;
const PLANNER_POLL_MAX_ATTEMPTS = 30; // 30 × 2s = 60s live-generation window
const PLANNER_GENERATION_TIMEOUT_MS =
  PLANNER_POLL_INTERVAL_MS * PLANNER_POLL_MAX_ATTEMPTS;

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, PlannerMapComponent, UiSentenceBriefComponent, UiInputComponent, UiRangeComponent],
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.scss'
})
export class PlannerComponent implements OnDestroy {
  // ── State signals ─────────────────────────────────────────────────────────
  lang     = signal<Lang>('it');
  stage    = signal<Stage>('empty');
  overlay  = signal<Overlay>(null);
  budget   = signal(1200);
  dateMode = signal<DateMode>('flex');
  nights   = signal(4);
  adults   = signal(2);
  children = signal(0);
  destOpen = signal(true);
  priority = signal<Priority>('food');
  constraints = signal<string[]>(['sea']);
  selId    = signal('');
  agentStep   = signal(0);
  checkStep   = signal(0);
  payMode     = signal<'full' | 'install'>('full');
  messages    = signal<{ kind: string; from?: string; text?: string }[]>([]);
  conciergeTyping = signal(false);
  suggestionUsed  = signal(false);
  // Why the results are demo data instead of live AI output (null = live/real).
  plannerNotice   = signal<'offline' | 'slow' | null>(null);
  // Real AI concierge (backend /api/chat) state
  conciergeConvId = signal<string | null>(null);
  conciergeInput  = '';

  private _timers: ReturnType<typeof setTimeout>[] = [];

  // ── Services ──────────────────────────────────────────────────────────────
  readonly authService = inject(AuthService);
  private readonly travelService = inject(TravelService);
  private readonly catalogService = inject(CatalogService);
  private readonly bookingService = inject(BookingService);
  private readonly paymentService = inject(PaymentService);
  private readonly chatService = inject(ChatService);
  private readonly destinationService = inject(DestinationService);
  private readonly transloco = inject(TranslocoService);
  private readonly route = inject(ActivatedRoute);
  private langSub?: Subscription;

  constructor() {
    const apply = (l: string) => {
      if (l === 'it' || l === 'en' || l === 'fr' || l === 'es') this.lang.set(l);
    };
    apply(this.transloco.getActiveLang());
    this.langSub = this.transloco.langChanges$.subscribe(apply);

    // Seed the plan from a sentence handed over by the hero search / quick-picks
    // (e.g. "10 quiet days in Japan with great food" → 10 nights, food priority).
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) this.seedFromQuery(q);

    // Populate the brief's destination quick-picks from real trending destinations.
    this.destinationService.getTrending(6)
      .pipe(catchError(() => of([])))
      .subscribe(dests => this.briefPlaces.set(dests.map(d => d.name)));
  }

  /** Best-effort mapping of a free-text trip brief onto the planner's own fields. */
  private seedFromQuery(raw: string): void {
    const q = raw.toLowerCase();
    // Take the number closest to a duration word ("10 quiet days" → 10), so an
    // adjective between the count and the unit doesn't defeat the match.
    const unit = q.match(/\b(?:nights?|days?|giorni|notti|nuits?|noches|d[ií]as?)\b/);
    if (unit) {
      const near = q.slice(0, unit.index).match(/(\d{1,2})(?!.*\d)/);
      const n = near ? parseInt(near[1], 10) : NaN;
      if (n >= 1 && n <= 30) this.nights.set(n);
    }
    if (/\b(food|eat|cuisine|dining|restaurant|foodie|cibo|mangiare|gastronom|comida|gastronomie)\b/.test(q)) {
      this.priority.set('food');
    }
  }

  // ── Auth modal state ──────────────────────────────────────────────────────
  showAuthModal = signal(false);
  authMode = signal<'login' | 'register'>('login');
  authEmailVal = '';
  authPasswordVal = '';
  authFirstNameVal = '';
  authLastNameVal = '';
  authErrorMsg = '';
  authLoadingState = false;

  // ── Backend integration state ─────────────────────────────────────────────
  private rawBackendData = signal<any[]>([]);
  useBackendProposals = signal(false);
  currentRequestId = signal<string | null>(null);
  currentBookingId = signal<string | null>(null);
  currentBookingRef = signal<string | null>(null);
  bookingError = signal(false);
  private departureDateStr = '';
  private returnDateStr = '';

  // ── Derived ───────────────────────────────────────────────────────────────
  t = computed(() => {
    const lang = this.lang();
    const strings = {} as Strings;
    (Object.keys(STRING_KEYS) as (keyof Strings)[]).forEach(key => {
      strings[key] = this.transloco.translate(STRING_KEYS[key], {}, lang);
    });
    return strings;
  });

  budgetStr = computed(() => fmt(this.budget(), this.lang()));

  budgetPct = computed(() => {
    const pct = Math.round((this.budget() - 400) / (4000 - 400) * 100);
    return `${pct}%`;
  });

  steps = computed(() => {
    const t = this.t();
    const stage = this.stage();
    const overlay = this.overlay();
    let active = 'plan';
    if (stage === 'generating' || stage === 'results') active = 'proposals';
    else if (stage === 'detail') active = 'detail';
    if (overlay) active = 'book';
    const order = ['plan','proposals','detail','book'];
    const ai = order.indexOf(active);
    const defs: [string, string, keyof Strings][] = [
      ['plan','tune','st_plan'],['proposals','dashboard','st_proposals'],
      ['detail','description','st_detail'],['book','shopping_cart_checkout','st_book']
    ];
    return defs.map((s, i) => {
      const on = i <= ai;
      return { label: t[s[2]] as string, icon: s[1], arrow: i < defs.length - 1, on };
    });
  });

  proposals = computed(() => {
    const lang = this.lang();
    const t = this.t();
    const n = this.nights(); const ppl = this.adults() + this.children();
    const nightsTxt = `${n} ${t.rs_nights}`;
    const per = (tot: number) => { const v = Math.round(tot / Math.max(1, ppl)); return `€${fmt(v, lang)} ${t.per_person}`; };
    const budget = this.budget();

    const mk = (o: {
      id: string; dest: string; title: string; img: string; caption: string;
      recommended: boolean; total: number; hotel: string; hp: number;
      rest: string; rp: number; flight: string; fp: number; why: string;
      hotelMeta: string; restMeta: string; flightMeta: string; cancel: string;
      splits: [string, number][];
    }) => {
      const diff = o.total - budget;
      const over = diff > 0;
      const ratio = o.total / budget;
      return {
        ...o,
        nights: nightsTxt, perPerson: per(o.total),
        totalStr: fmt(o.total, lang), hotelPrice: fmt(o.hp, lang),
        restPrice: fmt(o.rp, lang), flightPrice: fmt(o.fp, lang),
        delta: over ? `+€${fmt(diff, lang)}` : t.under_budget + `€${fmt(Math.abs(diff), lang)}`,
        deltaFg: over ? 'var(--brand)' : 'var(--teal)',
        deltaBg: over ? 'var(--brand-light)' : 'var(--teal-light)',
        deltaIcon: over ? 'trending_up' : 'trending_down',
        cardBd: o.recommended ? '#E9C07E' : 'var(--border)',
        fitPct: Math.round(ratio * 100) + '%',
        fitBar: Math.min(100, Math.round(ratio * 100)) + '%',
        fitLabel: over ? t.fit_over : t.fit_in,
        fitFg: over ? 'var(--brand)' : 'var(--teal)',
        fitColor: over ? 'var(--brand)' : 'var(--color-red)',
      };
    };

    // All proposals come from the backend. There is no demo/mock fallback: if
    // the backend returned nothing, this list is empty and the UI shows an
    // explicit error/empty state rather than fabricated trips.
    return this.rawBackendData().map(o => mk(o));
  });


  selectedProposal = computed(() => {
    return this.proposals().find(p => p.id === this.selId()) ?? this.proposals()[0];
  });

  mapPins = computed<PlannerPin[]>(() =>
    this.proposals().map(p => ({
      id: p.id,
      dest: p.dest,
      total: p.totalStr,
      recommended: p.recommended,
      // Real coords from the DB when the proposal came from the backend; demo
      // proposals carry none and are geocoded from `dest` by the map.
      lat: (p as { lat?: number | null }).lat ?? null,
      lng: (p as { lng?: number | null }).lng ?? null,
    }))
  );

  selectMapPin(id: string): void {
    this.selId.set(id);
    if (this.stage() === 'results' || this.stage() === 'detail') {
      this.stage.set('detail');
    }
  }

  selSplits = computed(() => {
    const p = this.selectedProposal();
    const lang = this.lang(); const t = this.t();
    const meta: Record<string, { label: string; icon: string; color: string; ideal: number }> = {
      stay:      { label: t.split_stay,      icon:'hotel',          color:'#B07B4E', ideal: 35 },
      food:      { label: t.split_food,      icon:'restaurant',     color:'#C0894B', ideal: 40 },
      transport: { label: t.split_transport, icon:'flight_takeoff', color:'#5E8C9E', ideal: 25 },
    };
    return p.splits.map(([k, amt]: [string, number]) => ({
      label: meta[k].label, icon: meta[k].icon, color: meta[k].color,
      amount: fmt(amt, lang),
      pct: Math.round(amt / p.total * 100) + '%',
      ideal: meta[k].ideal + '%',
    }));
  });

  agents = computed(() => {
    const t = this.t(); const step = this.agentStep();
    const A = [
      { key:'orch',   icon:'dashboard_customize', iconBg:'var(--brand-light)', iconFg:'var(--brand)' },
      { key:'hotel',  icon:'hotel',               iconBg:'#FDECEA', iconFg:'#E5352B' },
      { key:'rest',   icon:'restaurant',           iconBg:'#FEF3C7', iconFg:'#D97706' },
      { key:'flight', icon:'flight_takeoff',       iconBg:'#FDECEA', iconFg:'#E5352B' },
      { key:'rank',   icon:'stacked_bar_chart',    iconBg:'#FDECEA', iconFg:'#E5352B' },
    ];
    return A.map((a, i) => ({
      name: (t as unknown as Record<string, string>)['ag_' + a.key],
      task: (t as unknown as Record<string, string>)['ag_' + a.key + '_t'],
      icon: a.icon, iconBg: a.iconBg, iconFg: a.iconFg,
      opacity: step >= i + 1 ? 1 : 0.4,
      done: step > i + 1,
      active: step === i + 1,
      pending: step < i + 1,
    }));
  });

  checks = computed(() => {
    const t = this.t();
    const sel = this.selectedProposal();
    const step = this.checkStep();
    const labels = [
      `Hotel · ${sel.hotel}`,
      t.check_restaurants,
      t.check_flight,
    ];
    return labels.map((label, i) => {
      const done = step > i; const active = step === i;
      return {
        label,
        done, active, pending: !done && !active,
        status: done ? t.check_available : active ? t.check_checking : '—',
        fg: done ? 'var(--teal)' : active ? '#B49A7C' : '#C9BBA6',
      };
    });
  });

  allChecked = computed(() => this.checkStep() >= 3);

  prioOptions = computed(() => {
    const t = this.t(); const p = this.priority();
    return [
      { key: 'food', label: t.prio_food, icon: 'restaurant' },
      { key: 'stay', label: t.prio_stay, icon: 'hotel' },
      { key: 'bal',  label: t.prio_bal,  icon: 'balance' },
    ].map(o => ({
      ...o,
      on: p === o.key,
      bg: p === o.key ? 'var(--brand-light)' : 'var(--bg-primary)',
      bd: p === o.key ? '#F3B0AB' : 'var(--border)',
      fg: p === o.key ? 'var(--brand)' : 'var(--text-tertiary)',
    }));
  });

  constraintChips = computed(() => {
    const t = this.t(); const cs = this.constraints();
    return [
      { key:'sea',    label: t.c_sea,    icon:'beach_access' },
      { key:'family', label: t.c_family, icon:'family_restroom' },
      { key:'pets',   label: t.c_pets,   icon:'pets' },
      { key:'access', label: t.c_access, icon:'accessible' },
    ].map(c => ({
      ...c,
      on: cs.includes(c.key),
      bg: cs.includes(c.key) ? 'var(--brand)' : 'var(--surface)',
      fg: cs.includes(c.key) ? '#fff' : 'var(--text-secondary)',
      bd: cs.includes(c.key) ? 'var(--brand)' : 'var(--border)',
    }));
  });

  chatMessages = computed(() => {
    return this.messages().map(m => {
      const me = m.from === 'user';
      return { justify: me ? 'flex-end' : 'flex-start',
        text: m.text, bg: me ? '#E5352B' : '#fff', fg: me ? '#fff' : '#0F172A',
        radius: me ? '18px 18px 4px 18px' : '18px 18px 18px 4px' };
    });
  });

  travelerCount = computed(() => {
    const t = this.t();
    const a = this.adults(); const c = this.children();
    return `${a} ${t.tr_adults}${c ? ` · ${c} ${t.tr_children}` : ''}`;
  });

  resultSummary = computed(() => {
    const t = this.t();
    const p = this.priority();
    const prioLabel = p === 'food' ? t.rs_prio_food : p === 'stay' ? t.rs_prio_stay : t.rs_prio_bal;
    return `€${this.budgetStr()} · ${this.nights()} ${t.rs_nights} · ${this.adults()+this.children()} ${t.rs_ppl} · ${prioLabel}`;
  });

  noticeText = computed(() => {
    const t = this.t();
    const n = this.plannerNotice();
    return n === 'offline' ? t.notice_offline : n === 'slow' ? t.notice_slow : '';
  });

  dismissNotice(): void { this.plannerNotice.set(null); }

  rateStr = computed(() => fmt(Math.round(this.selectedProposal().total / 3), this.lang()));

  payBtnLabel = computed(() => {
    const t = this.t(); const sel = this.selectedProposal();
    return this.payMode() === 'full'
      ? t.p_pay_full + sel.totalStr
      : t.p_pay_install + this.rateStr();
  });

  installSub = computed(() => `${this.t().install_sub}${this.rateStr()}`);

  generateLabel = computed(() => {
    const t = this.t(); const s = this.stage();
    return s === 'results' || s === 'detail' ? t.gen_again : t.gen;
  });

  installLabels = computed(() => {
    const t = this.t();
    return [t.p_now, '+30g', '+60g'];
  });

  confirmItems = computed(() => {
    const t = this.t();
    // Real booking reference from the backend booking (one booking covers the
    // hotel, restaurants and flight); '—' only if the booking call did not run.
    const ref = this.currentBookingRef();
    const display = ref ? `#${ref}` : '—';
    return [
      { label: t.conf_hotel, ref: display },
      { label: t.conf_restaurants, ref: display },
      { label: t.conf_flight, ref: display },
    ];
  });

  // ── Actions ───────────────────────────────────────────────────────────────
  toggleLang(): void {
    const order: Lang[] = ['en', 'it', 'fr', 'es'];
    const i = order.indexOf(this.lang());
    this.lang.set(order[(i + 1) % order.length]);
  }

  restart(): void {
    this._clearTimers();
    this.stage.set('empty'); this.overlay.set(null);
    this.budget.set(1200); this.dateMode.set('flex'); this.nights.set(4);
    this.adults.set(2); this.children.set(0); this.destOpen.set(true);
    this.priority.set('food'); this.constraints.set(['sea']); this.selId.set('');
    this.agentStep.set(0); this.checkStep.set(0); this.payMode.set('full');
    this.messages.set([]); this.conciergeTyping.set(false);
    this.suggestionUsed.set(false);
    this.useBackendProposals.set(false);
    this.rawBackendData.set([]);
    this.currentRequestId.set(null);
    this.currentBookingId.set(null);
    this.currentBookingRef.set(null);
    this.bookingError.set(false);
    this.conciergeConvId.set(null);
    this.conciergeInput = '';
    this.plannerNotice.set(null);
  }

  // ── Auth methods ──────────────────────────────────────────────────────────
  login(): void {
    if (!this.authEmailVal || !this.authPasswordVal) {
      this.authErrorMsg = this.t().auth_email_required;
      return;
    }
    this.authLoadingState = true;
    this.authErrorMsg = '';
    this.authService.login({ email: this.authEmailVal, password: this.authPasswordVal }).subscribe({
      next: () => {
        this.authLoadingState = false;
        this.showAuthModal.set(false);
        this.authEmailVal = '';
        this.authPasswordVal = '';
      },
      error: () => {
        this.authLoadingState = false;
        this.authErrorMsg = this.t().auth_invalid;
      }
    });
  }

  register(): void {
    if (!this.authFirstNameVal || !this.authLastNameVal || !this.authEmailVal || !this.authPasswordVal) {
      this.authErrorMsg = this.t().auth_fields_required;
      return;
    }
    this.authLoadingState = true;
    this.authErrorMsg = '';
    this.authService.register({
      email: this.authEmailVal,
      password: this.authPasswordVal,
      firstName: this.authFirstNameVal,
      lastName: this.authLastNameVal,
    }).subscribe({
      next: () => {
        this.authLoadingState = false;
        this.showAuthModal.set(false);
        this.authEmailVal = '';
        this.authPasswordVal = '';
        this.authFirstNameVal = '';
        this.authLastNameVal = '';
      },
      error: (err: any) => {
        this.authLoadingState = false;
        this.authErrorMsg = err?.error?.error ?? this.t().auth_register_error;
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe();
    this.useBackendProposals.set(false);
    this.rawBackendData.set([]);
    this.currentBookingId.set(null);
    this.currentRequestId.set(null);
  }

  closeAuthModal(): void {
    this.showAuthModal.set(false);
    this.authErrorMsg = '';
  }

  /** Destination quick-picks for the sentence brief — real trending destinations
   *  from the backend catalogue (empty until loaded / if the call fails). */
  readonly briefPlaces = signal<string[]>([]);

  /** Sync a sentence brief into the planner's parameter signals. */
  applyBrief(b: TripBrief): void {
    this.nights.set(Math.max(1, Math.min(30, Math.round(b.nights))));
    this.adults.set(Math.max(1, Math.round(b.travellers)));
    this.children.set(0);
    this.budget.set(Math.max(400, Math.min(4000, Math.round(b.budget))));
    this.priority.set(b.focus.includes('food') ? 'food' : 'bal');
    this.destOpen.set(false);
  }

  /** Apply the brief, then kick off generation. */
  composeBrief(b: TripBrief): void {
    this.applyBrief(b);
    this.generate();
  }

  generate(): void {
    if (!this.authService.isAuthenticated()) {
      this.showAuthModal.set(true);
      return;
    }

    this._clearTimers();
    this.stage.set('generating');
    this.overlay.set(null);
    this.agentStep.set(0);
    this.useBackendProposals.set(false);
    this.rawBackendData.set([]);
    this.plannerNotice.set(null);

    // Drive the orchestrator animation; the final "ranking" agent holds active
    // while we wait for the live backend result. We deliberately do NOT auto-jump
    // to the demo list — that swap only happens once live data lands (or we time out).
    [600, 1150, 1700, 2250, 2750].forEach((ms, i) => {
      this._timers.push(setTimeout(() => this.agentStep.set(i + 1), ms));
    });
    // Safety net: never leave the user stuck on the generating animation if the
    // request itself stalls. Falls back to demo proposals just past the poll window.
    this._timers.push(setTimeout(() => {
      if (this.stage() === 'generating') {
        this.plannerNotice.set('slow');
        this.stage.set('results');
      }
    }, PLANNER_GENERATION_TIMEOUT_MS + 5000));

    // Compute trip dates
    const dep = new Date();
    dep.setDate(dep.getDate() + 30);
    const ret = new Date(dep);
    ret.setDate(ret.getDate() + this.nights());
    this.departureDateStr = dep.toISOString().split('T')[0];
    this.returnDateStr = ret.toISOString().split('T')[0];

    const priorityMap: Record<string, string> = { food: 'FOOD', stay: 'STAY', bal: 'BALANCED' };

    this.travelService.createRequest({
      departureDate: this.departureDateStr,
      returnDate: this.returnDateStr,
      dateMode: this.dateMode() === 'fixed' ? 'FIXED' : 'FLEXIBLE',
      adultsCount: this.adults(),
      childrenCount: this.children() || undefined,
      budget: this.budget(),
      spendingPriority: priorityMap[this.priority()] as 'FOOD' | 'STAY' | 'BALANCED',
      constraints: this.constraints().length ? this.constraints() : undefined,
    }).pipe(
      switchMap(req => {
        this.currentRequestId.set(req.id);
        // Poll until the backend has generated at least one proposal, up to the
        // full live-generation window (LLM-bound, so this can take ~8–20s+).
        return timer(PLANNER_POLL_INTERVAL_MS, PLANNER_POLL_INTERVAL_MS).pipe(
          take(PLANNER_POLL_MAX_ATTEMPTS),
          switchMap(() => this.travelService.getProposals(req.id)),
          first(proposals => proposals.length > 0, [])
        );
      }),
      switchMap(proposals => forkJoin(proposals.map(p =>
        forkJoin({
          proposal: of(p),
          hotel: this.catalogService.getHotel(p.hotelId).pipe(catchError(() => of(null))),
          flight: p.flightId ? this.catalogService.getFlight(p.flightId).pipe(catchError(() => of(null))) : of(null),
        })
      )))
    ).subscribe({
      next: results => {
        const t = this.t();

        this.rawBackendData.set(results.map((r, idx) => {
          const p = r.proposal;
          const hotel = r.hotel;
          const flight = r.flight;
          return {
            id: p.id,
            dest: p.destination,
            title: p.destination,
            img: hotel?.imageUrl ? `url(${hotel.imageUrl}) center/cover no-repeat` : PLACEHOLDER_IMG,
            caption: p.destination,
            recommended: idx === 0,
            total: Number(p.totalCost),
            hotel: hotel?.name ?? 'Hotel',
            hp: Number(p.hotelCost),
            rest: t.rest_recommended,
            rp: Number(p.restaurantCost),
            flight: flight ? `${flight.airline} · ${flight.flightNumber}` : t.flight_roundtrip,
            fp: Number(p.flightCost),
            why: p.aiMotivation ?? t.proposal_why_default,
            hotelMeta: hotel
              ? `${hotel.city} · ${this.nights()} ${t.rs_nights}${hotel.seaProximity ? t.hotel_sea : ''}`
              : '',
            restMeta: t.local_cuisine,
            flightMeta: flight?.baggageIncluded ? t.bag_included : t.carry_on,
            cancel: t.free_cancel,
            splits: [
              ['stay', Number(p.hotelCost)],
              ['food', Number(p.restaurantCost)],
              ['transport', Number(p.flightCost)],
            ] as [string, number][],
            // Authoritative map coordinates from the DB (never hardcoded)
            lat: hotel?.latitude ?? null,
            lng: hotel?.longitude ?? null,
            // Backend IDs needed for booking
            proposalId: p.id,
            hotelId: p.hotelId,
            restaurantId: p.restaurantId,
            flightId: p.flightId,
          };
        }));

        if (results.length) {
          this.useBackendProposals.set(true);
          this.selId.set(results[0].proposal.id);
          this.plannerNotice.set(null); // live AI data — no fallback notice
        } else {
          // Poll window elapsed with no proposals → demo fallback, tell the user why.
          this.plannerNotice.set('slow');
        }
        // Live data is ready (or the poll window elapsed → demo fallback): reveal results.
        this.stage.set('results');
      },
      error: err => {
        if (err.status === 401) {
          this.authService.clearAuth();
          this.showAuthModal.set(true);
          this.stage.set('empty');
        } else {
          // Backend unreachable/failed → fall back to demo proposals, surfaced as a notice.
          this.plannerNotice.set('offline');
          this.stage.set('results');
        }
      }
    });
  }

  onBudget(v: number): void {
    this.budget.set(v);
  }

  nightsUp():    void { this.nights.update(n => Math.min(21, n + 1)); }
  nightsDown():  void { this.nights.update(n => Math.max(1, n - 1)); }
  adultsUp():    void { this.adults.update(n => Math.min(9, n + 1)); }
  adultsDown():  void { this.adults.update(n => Math.max(1, n - 1)); }
  childrenUp():  void { this.children.update(n => Math.min(6, n + 1)); }
  childrenDown():void { this.children.update(n => Math.max(0, n - 1)); }

  setPriority(k: Priority): void { this.priority.set(k); }
  setPriorityStr(k: string): void { this.priority.set(k as Priority); }
  toggleConstraint(k: string): void {
    this.constraints.update(cs => cs.includes(k) ? cs.filter(x => x !== k) : [...cs, k]);
  }
  toggleDest(): void { this.destOpen.update(v => !v); }

  openDetail(id: string): void { this.selId.set(id); this.stage.set('detail'); }
  backToResults(): void { this.stage.set('results'); }

  goBooking(): void {
    this.overlay.set('booking');
    this.checkStep.set(0);
    this.bookingError.set(false);
    // Reveal the first check rows while the real booking is created; the final
    // "all available" step only completes once the backend confirms it.
    [600, 1200].forEach((ms, i) => {
      this._timers.push(setTimeout(() => {
        if (this.checkStep() < i + 1) this.checkStep.set(i + 1);
      }, ms));
    });

    const sel = this.selectedProposal() as any;
    if (!sel) { this.bookingError.set(true); return; }
    this.bookingService.create({
      proposalId: sel.proposalId ?? sel.id,
      hotelId: sel.hotelId,
      restaurantId: sel.restaurantId,
      flightId: sel.flightId,
      destination: sel.dest,
      checkIn: this.departureDateStr,
      checkOut: this.returnDateStr,
      totalAmount: sel.total,
      hotelAmount: sel.hp,
      restaurantAmount: sel.rp,
      flightAmount: sel.fp,
      travelers: [{
        firstName: this.authService.currentUser()?.firstName ?? 'Traveler',
        lastName: this.authService.currentUser()?.lastName ?? '',
        primary: true,
      }],
    }).subscribe({
      next: booking => {
        this.currentBookingId.set(booking.id);
        this.currentBookingRef.set(booking.bookingReference);
        this.checkStep.set(3); // real backend confirmation → unlock payment
      },
      error: () => { this.bookingError.set(true); } // payment stays locked
    });
  }

  goPayment(): void { if (this.allChecked()) this.overlay.set('payment'); }
  backToBooking(): void { this.overlay.set('booking'); }

  confirmPay(): void {
    const bookingId = this.currentBookingId();
    if (bookingId) {
      const gateway = this.payMode() === 'install' ? 'KLARNA' : 'STRIPE';
      this.paymentService.initiate({
        bookingId,
        amount: this.selectedProposal().total,
        gateway: gateway as 'STRIPE' | 'KLARNA',
        type: 'CARD',
        currency: 'EUR',
      }).pipe(
        switchMap(payment => this.paymentService.confirm(payment.id))
      ).subscribe({
        next: () => this.overlay.set('confirmation'),
        error: () => this.overlay.set('confirmation'),
      });
    } else {
      this.overlay.set('confirmation');
    }
  }
  closeOverlay(): void { this.overlay.set(null); }

  openConcierge(): void {
    this.overlay.set('concierge');
    this.conciergeConvId.set(null);
    this.conciergeInput = '';
    this.suggestionUsed.set(false);
    this.messages.set([]);
    // Ask the real AI concierge (backend /api/chat) for a welcome grounded in
    // the just-booked trip. The prompt is hidden; only the AI reply is shown.
    const dest = (this.selectedProposal() as { dest?: string } | undefined)?.dest;
    const intro = dest
      ? `I just booked a trip to ${dest}. Welcome me briefly as my travel concierge and offer help with restaurant tables, transfers and local activities during my stay.`
      : 'Welcome me briefly as my travel concierge and offer help during my stay.';
    this.postConcierge(intro, true);
  }

  /** Send the built-in quick suggestion as a real message to the AI concierge. */
  sendSuggestion(): void {
    if (this.conciergeTyping()) return;
    this.suggestionUsed.set(true);
    this.postConcierge(this.t().cc_suggestion);
  }

  /** Send whatever the traveller typed to the AI concierge. */
  sendConcierge(): void {
    const text = this.conciergeInput.trim();
    if (!text || this.conciergeTyping()) return;
    this.conciergeInput = '';
    this.suggestionUsed.set(true);
    this.postConcierge(text);
  }

  /** POST a message to the backend AI chat and append the grounded reply. */
  private postConcierge(message: string, hideUserMessage = false): void {
    if (!hideUserMessage) {
      this.messages.update(ms => [...ms, { kind: 'text', from: 'user', text: message }]);
    }
    this.conciergeTyping.set(true);
    this.chatService.chat({ conversationId: this.conciergeConvId(), message })
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        this.conciergeTyping.set(false);
        if (!res) {
          this.messages.update(ms => [...ms, { kind: 'text', from: 'ai', text: this.t().cc_error }]);
          return;
        }
        this.conciergeConvId.set(res.conversationId);
        this.messages.update(ms => [...ms, { kind: 'text', from: 'ai', text: res.reply }]);
      });
  }

  /**
   * "Change" returns to the proposal list, where a different complete package
   * (hotel + restaurants + flight) can be chosen. There is no fabricated
   * single-component swap — the backend composes whole packages.
   */
  changeElement(_type: 'hotel' | 'restaurant' | 'flight'): void {
    this.backToResults();
  }

  private _clearTimers(): void {
    this._timers.forEach(clearTimeout);
    this._timers = [];
  }

  ngOnDestroy(): void { this._clearTimers(); this.langSub?.unsubscribe(); }
}
