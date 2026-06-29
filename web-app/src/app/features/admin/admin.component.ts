import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../core/services/admin.service';
import type {
  AdminDashboard, AdminUser, AdminBooking, AdminReview, AdminAiLog,
} from '../../core/services/admin.service';
import { AdminEntityManagerComponent } from './entity-manager/admin-entity-manager.component';
import { ENTITY_CONFIGS, EntityConfig } from './entity-manager/entity-configs';

type Section =
  | 'overview' | 'users' | 'partners'
  | 'hotels' | 'flights' | 'cruises' | 'restaurants' | 'destinations' | 'stories'
  | 'bookings' | 'reviews' | 'logs';

const ROLES = ['TRAVELER', 'PARTNER', 'OPERATIONS', 'ADMIN'];

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, AdminEntityManagerComponent],
  styleUrls: ['./admin.component.scss'],
  template: `
    <div class="admin">
      <!-- Sidebar -->
      <aside class="admin-side">
        <div class="admin-brand">
          <span class="ms brand-mark">shield_person</span>
          <span class="brand-text">{{ 'admin.brand1' | transloco }}<span class="brand-accent">{{ 'admin.brand2' | transloco }}</span></span>
        </div>
        <nav class="admin-nav">
          @for (item of navItems; track item.id) {
            <button class="nav-item" [class.active]="section() === item.id" (click)="go(item.id)">
              <span class="ms">{{ item.icon }}</span> {{ item.key | transloco }}
            </button>
          }
        </nav>
        <button class="nav-exit" (click)="exit()"><span class="ms">logout</span> {{ 'admin.backToApp' | transloco }}</button>
      </aside>

      <!-- Content -->
      <main class="admin-main">
        <header class="admin-top">
          <div>
            <h1 class="admin-h1">{{ currentLabel() }}</h1>
            <p class="admin-crumb">{{ 'admin.crumb' | transloco }} · {{ adminName() }}</p>
          </div>
          <span class="admin-badge"><span class="ms" style="font-size:16px">verified_user</span> {{ 'admin.badge' | transloco }}</span>
        </header>

        @if (toast()) { <div class="admin-toast">{{ toast() }}</div> }

        <!-- OVERVIEW -->
        @if (section() === 'overview') {
          @if (dashboard(); as d) {
            <div class="stat-grid">
              <div class="stat-card"><span class="ms stat-ic" style="color:#5b8def">group</span><div><span class="stat-num">{{ d.totalUsers }}</span><span class="stat-lbl">{{ 'admin.statUsers' | transloco }}</span></div></div>
              <div class="stat-card"><span class="ms stat-ic" style="color:#e0a23a">store</span><div><span class="stat-num">{{ d.totalPartners }}</span><span class="stat-lbl">{{ 'admin.statPartners' | transloco }}</span></div></div>
              <div class="stat-card"><span class="ms stat-ic" style="color:#42b07a">confirmation_number</span><div><span class="stat-num">{{ d.totalBookings }}</span><span class="stat-lbl">{{ 'admin.statBookings' | transloco }}</span></div></div>
              <div class="stat-card"><span class="ms stat-ic" style="color:#e0573a">hourglass_top</span><div><span class="stat-num">{{ d.pendingPartners }}</span><span class="stat-lbl">{{ 'admin.statPending' | transloco }}</span></div></div>
              <div class="stat-card"><span class="ms stat-ic" style="color:#42b07a">rocket_launch</span><div><span class="stat-num">{{ d.activePartners }}</span><span class="stat-lbl">{{ 'admin.statLive' | transloco }}</span></div></div>
            </div>
            <div class="quick-actions">
              <button (click)="go('users')"><span class="ms">manage_accounts</span> {{ 'admin.manageUsers' | transloco }}</button>
              <button (click)="go('partners')"><span class="ms">handshake</span> {{ 'admin.reviewPartners' | transloco }}</button>
              <button (click)="go('reviews')"><span class="ms">reviews</span> {{ 'admin.moderateReviews' | transloco }}</button>
            </div>
          } @else {
            <div class="admin-loading">{{ 'admin.loading' | transloco }}</div>
          }
        }

        <!-- USERS -->
        @if (section() === 'users') {
          <div class="table-wrap">
            <table class="admin-table">
              <thead><tr><th>{{ 'admin.thUser' | transloco }}</th><th>{{ 'admin.thEmail' | transloco }}</th><th>{{ 'admin.thRole' | transloco }}</th><th>{{ 'admin.thStatus' | transloco }}</th><th>{{ 'admin.thActions' | transloco }}</th></tr></thead>
              <tbody>
                @for (u of users(); track u.id) {
                  <tr [class.row-banned]="!u.active">
                    <td><div class="cell-user"><span class="cell-avatar">{{ initials(u) }}</span><span>{{ u.firstName }} {{ u.lastName }}</span></div></td>
                    <td class="muted">{{ u.email }}</td>
                    <td>
                      <select class="role-select" [ngModel]="u.role" (ngModelChange)="changeRole(u, $event)">
                        @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
                      </select>
                    </td>
                    <td>
                      <span class="tag" [class.tag-ok]="u.active" [class.tag-off]="!u.active">{{ (u.active ? 'admin.active' : 'admin.banned') | transloco }}</span>
                    </td>
                    <td>
                      <button class="mini" [class.mini-danger]="u.active" (click)="toggleBan(u)">
                        {{ (u.active ? 'admin.ban' : 'admin.reinstate') | transloco }}
                      </button>
                    </td>
                  </tr>
                } @empty { <tr><td colspan="5" class="empty-row">{{ 'admin.noUsers' | transloco }}</td></tr> }
              </tbody>
            </table>
          </div>
          <div class="pager">
            <button [disabled]="page() === 0" (click)="prev()">{{ 'admin.prev' | transloco }}</button>
            <span>{{ 'admin.page' | transloco }} {{ page() + 1 }}</span>
            <button [disabled]="!hasMore()" (click)="next()">{{ 'admin.next' | transloco }}</button>
          </div>
        }

        <!-- PARTNERS + CATALOG + CONTENT (schema-driven manager) -->
        @if (managerConfig(); as cfg) {
          <app-admin-entity-manager [config]="cfg" />
        }

        <!-- BOOKINGS -->
        @if (section() === 'bookings') {
          <div class="table-wrap">
            <table class="admin-table">
              <thead><tr><th>{{ 'admin.thBookingId' | transloco }}</th><th>{{ 'admin.thUser' | transloco }}</th><th>{{ 'admin.thStatus' | transloco }}</th><th>{{ 'admin.thAmount' | transloco }}</th><th>{{ 'admin.thCreated' | transloco }}</th></tr></thead>
              <tbody>
                @for (b of bookings(); track b.id) {
                  <tr>
                    <td class="mono">{{ b.id.slice(0, 8) }}</td>
                    <td class="mono muted">{{ b.userId.slice(0, 8) }}</td>
                    <td><span class="tag tag-neutral">{{ b.status }}</span></td>
                    <td>{{ b.totalAmount != null ? (b.totalAmount | currency) : '—' }}</td>
                    <td class="muted">{{ b.createdAt ? (b.createdAt | date:'medium') : '—' }}</td>
                  </tr>
                } @empty { <tr><td colspan="5" class="empty-row">{{ 'admin.noBookings' | transloco }}</td></tr> }
              </tbody>
            </table>
          </div>
          <div class="pager">
            <button [disabled]="page() === 0" (click)="prev()">{{ 'admin.prev' | transloco }}</button>
            <span>{{ 'admin.page' | transloco }} {{ page() + 1 }}</span>
            <button [disabled]="!hasMore()" (click)="next()">{{ 'admin.next' | transloco }}</button>
          </div>
        }

        <!-- REVIEWS -->
        @if (section() === 'reviews') {
          <div class="review-list">
            @for (r of reviews(); track r.id) {
              <article class="review-card">
                <div class="review-main">
                  <div class="review-head">
                    <span class="stars">@for (s of [1,2,3,4,5]; track s) { <span class="ms" [class.lit]="s <= r.rating">star</span> }</span>
                    <span class="tag tag-neutral">{{ r.targetType }}</span>
                  </div>
                  <h4>{{ r.title || ('admin.untitledReview' | transloco) }}</h4>
                  <p class="review-body">{{ r.content }}</p>
                  <span class="muted">{{ 'admin.by' | transloco }} {{ r.authorName }} @if (r.authorEmail) { · {{ r.authorEmail }} } · {{ r.createdAt | date:'mediumDate' }}</span>
                </div>
                <button class="mini mini-danger" (click)="removeReview(r)"><span class="ms" style="font-size:15px">delete</span> {{ 'admin.delete' | transloco }}</button>
              </article>
            } @empty { <div class="admin-loading">{{ 'admin.noReviews' | transloco }}</div> }
          </div>
          <div class="pager">
            <button [disabled]="page() === 0" (click)="prev()">{{ 'admin.prev' | transloco }}</button>
            <span>{{ 'admin.page' | transloco }} {{ page() + 1 }}</span>
            <button [disabled]="!hasMore()" (click)="next()">{{ 'admin.next' | transloco }}</button>
          </div>
        }

        <!-- AI LOGS -->
        @if (section() === 'logs') {
          <div class="table-wrap">
            <table class="admin-table">
              <thead><tr><th>{{ 'admin.thAgent' | transloco }}</th><th>{{ 'admin.thModel' | transloco }}</th><th>{{ 'admin.thDuration' | transloco }}</th><th>{{ 'admin.thTokens' | transloco }}</th><th>{{ 'admin.thResult' | transloco }}</th><th>{{ 'admin.thWhen' | transloco }}</th></tr></thead>
              <tbody>
                @for (l of logs(); track l.id) {
                  <tr>
                    <td><b>{{ l.agent }}</b></td>
                    <td class="muted">{{ l.model || '—' }}</td>
                    <td>{{ l.durationMs != null ? l.durationMs + ' ms' : '—' }}</td>
                    <td>{{ l.tokensUsed ?? '—' }}</td>
                    <td><span class="tag" [class.tag-off]="l.error" [class.tag-ok]="!l.error">{{ (l.error ? 'admin.error' : 'admin.ok') | transloco }}</span></td>
                    <td class="muted">{{ l.createdAt ? (l.createdAt | date:'short') : '—' }}</td>
                  </tr>
                } @empty { <tr><td colspan="6" class="empty-row">{{ 'admin.noLogs' | transloco }}</td></tr> }
              </tbody>
            </table>
          </div>
          <div class="pager">
            <button [disabled]="page() === 0" (click)="prev()">{{ 'admin.prev' | transloco }}</button>
            <span>{{ 'admin.page' | transloco }} {{ page() + 1 }}</span>
            <button [disabled]="!hasMore()" (click)="next()">{{ 'admin.next' | transloco }}</button>
          </div>
        }
      </main>
    </div>
  `,
})
export class AdminComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  readonly roles = ROLES;
  readonly navItems: { id: Section; key: string; icon: string }[] = [
    { id: 'overview', key: 'admin.navOverview', icon: 'dashboard' },
    { id: 'users', key: 'admin.navUsers', icon: 'group' },
    { id: 'partners', key: 'admin.navPartners', icon: 'store' },
    { id: 'hotels', key: 'admin.navHotels', icon: 'hotel' },
    { id: 'flights', key: 'admin.navFlights', icon: 'flight' },
    { id: 'cruises', key: 'admin.navCruises', icon: 'directions_boat' },
    { id: 'restaurants', key: 'admin.navRestaurants', icon: 'restaurant' },
    { id: 'destinations', key: 'admin.navDestinations', icon: 'public' },
    { id: 'stories', key: 'admin.navStories', icon: 'movie' },
    { id: 'bookings', key: 'admin.navBookings', icon: 'confirmation_number' },
    { id: 'reviews', key: 'admin.navReviews', icon: 'reviews' },
    { id: 'logs', key: 'admin.navLogs', icon: 'monitoring' },
  ];

  /** Sections handled by the schema-driven entity manager. */
  managerConfig(): EntityConfig | null {
    return ENTITY_CONFIGS[this.section()] ?? null;
  }

  readonly section = signal<Section>('overview');
  readonly page = signal(0);
  readonly hasMore = signal(false);
  readonly toast = signal('');

  readonly dashboard = signal<AdminDashboard | null>(null);
  readonly users = signal<AdminUser[]>([]);
  readonly bookings = signal<AdminBooking[]>([]);
  readonly reviews = signal<AdminReview[]>([]);
  readonly logs = signal<AdminAiLog[]>([]);

  private readonly pageSize = 20;

  ngOnInit(): void { this.loadSection(); }

  currentLabel(): string {
    const key = this.navItems.find(n => n.id === this.section())?.key;
    return key ? this.transloco.translate(key) : '';
  }
  adminName(): string {
    const u = this.auth.currentUser();
    return u ? `${u.firstName} ${u.lastName}`.trim() || u.email : 'admin';
  }
  initials(u: AdminUser): string {
    return ((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase() || u.email[0].toUpperCase();
  }

  go(s: Section): void {
    if (s === this.section()) return;
    this.section.set(s);
    this.page.set(0);
    this.loadSection();
  }

  prev(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.loadSection(); } }
  next(): void { if (this.hasMore()) { this.page.update(p => p + 1); this.loadSection(); } }

  private loadSection(): void {
    const p = this.page();
    switch (this.section()) {
      case 'overview':
        this.admin.dashboard().pipe(catchError(() => of(null))).subscribe(d => this.dashboard.set(d));
        break;
      case 'users':
        this.admin.users(p, this.pageSize).pipe(catchError(() => of(null))).subscribe(res => {
          this.users.set(res?.content ?? []);
          this.hasMore.set(this.computeHasMore(res));
        });
        break;
      case 'bookings':
        this.admin.bookings(p, this.pageSize).pipe(catchError(() => of(null))).subscribe(res => {
          this.bookings.set(res?.content ?? []);
          this.hasMore.set(this.computeHasMore(res));
        });
        break;
      case 'reviews':
        this.admin.reviews(p, this.pageSize).pipe(catchError(() => of(null))).subscribe(res => {
          this.reviews.set(res?.content ?? []);
          this.hasMore.set(this.computeHasMore(res));
        });
        break;
      case 'logs':
        this.admin.aiLogs(p, this.pageSize).pipe(catchError(() => of(null))).subscribe(res => {
          this.logs.set(res?.content ?? []);
          this.hasMore.set(this.computeHasMore(res));
        });
        break;
    }
  }

  private computeHasMore(res: { totalElements: number } | null): boolean {
    if (!res) return false;
    return (this.page() + 1) * this.pageSize < res.totalElements;
  }

  changeRole(u: AdminUser, role: string): void {
    if (role === u.role) return;
    this.admin.setUserRole(u.id, role).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) { this.users.update(list => list.map(x => x.id === u.id ? updated : x)); this.flash(this.transloco.translate('admin.roleChanged', { email: u.email, role })); }
    });
  }

  toggleBan(u: AdminUser): void {
    this.admin.setUserActive(u.id, !u.active).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) { this.users.update(list => list.map(x => x.id === u.id ? updated : x)); this.flash(this.transloco.translate(updated.active ? 'admin.userReinstated' : 'admin.userBanned')); }
    });
  }

  removeReview(r: AdminReview): void {
    if (!confirm(this.transloco.translate('admin.deleteReviewConfirm'))) return;
    this.admin.deleteReview(r.id).pipe(catchError(() => of(null))).subscribe(() => {
      this.reviews.update(list => list.filter(x => x.id !== r.id));
      this.flash(this.transloco.translate('admin.reviewDeleted'));
    });
  }

  exit(): void { this.router.navigate(['/']); }

  private flash(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
