import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../core/services/admin.service';
import type {
  AdminDashboard, AdminUser, AdminBooking, AdminReview, AdminAiLog, AdminAuditLog, AdminUserUpsert,
  AdminPayment, RagStatus, FeatureFlag, FeatureFlagUpsert, AdminAlert, AdminBookingDetail, AdminSearchResult,
} from '../../core/services/admin.service';
import { AdminEntityManagerComponent } from './entity-manager/admin-entity-manager.component';
import { ENTITY_CONFIGS, EntityConfig } from './entity-manager/entity-configs';

type Section =
  | 'overview' | 'users' | 'partners'
  | 'hotels' | 'flights' | 'cruises' | 'restaurants' | 'destinations' | 'attractions' | 'stories'
  | 'bookings' | 'reviews' | 'logs' | 'audit' | 'promos' | 'rag' | 'payments' | 'broadcast' | 'flags';

const ROLES = ['TRAVELER', 'PARTNER', 'OPERATIONS', 'ADMIN'];
const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

function emptyUserForm(): AdminUserUpsert {
  return { email: '', password: '', firstName: '', lastName: '', phone: '', role: 'TRAVELER', emailVerified: false, active: true };
}

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
          <div class="admin-top-right">
            <div class="gsearch" (click)="$event.stopPropagation()">
              <span class="ms">search</span>
              <input type="search" [ngModel]="globalQuery()" (ngModelChange)="onGlobalSearch($event)"
                     (focus)="searchOpen.set(!!globalResults())"
                     [placeholder]="'admin.globalSearchPlaceholder' | transloco" />
              @if (searchOpen() && globalResults(); as gr) {
                <div class="gsearch-panel">
                  @if (!gr.users.length && !gr.bookings.length && !gr.partners.length) {
                    <div class="gsearch-empty">{{ 'admin.gsNoResults' | transloco }}</div>
                  }
                  @if (gr.users.length) {
                    <div class="gsearch-group">{{ 'admin.navUsers' | transloco }}</div>
                    @for (h of gr.users; track h.id) {
                      <button class="gsearch-hit" (click)="pickUser()">
                        <span class="ms">person</span>
                        <span class="gh-main">{{ h.primary || h.secondary }}</span><span class="gh-sub">{{ h.secondary }}</span>
                      </button>
                    }
                  }
                  @if (gr.bookings.length) {
                    <div class="gsearch-group">{{ 'admin.navBookings' | transloco }}</div>
                    @for (h of gr.bookings; track h.id) {
                      <button class="gsearch-hit" (click)="pickBooking(h.id)">
                        <span class="ms">confirmation_number</span>
                        <span class="gh-main">{{ h.primary }}</span><span class="gh-sub">{{ h.secondary }}</span>
                      </button>
                    }
                  }
                  @if (gr.partners.length) {
                    <div class="gsearch-group">{{ 'admin.navPartners' | transloco }}</div>
                    @for (h of gr.partners; track h.id) {
                      <button class="gsearch-hit" (click)="pickPartner()">
                        <span class="ms">store</span>
                        <span class="gh-main">{{ h.primary }}</span><span class="gh-sub">{{ h.secondary }}</span>
                      </button>
                    }
                  }
                </div>
              }
            </div>
            <span class="admin-badge"><span class="ms" style="font-size:16px">verified_user</span> {{ 'admin.badge' | transloco }}</span>
          </div>
        </header>

        @if (toast()) { <div class="admin-toast">{{ toast() }}</div> }

        <!-- OVERVIEW -->
        @if (section() === 'overview') {
          @if (alerts().length) {
            <div class="alert-stack">
              @for (a of alerts(); track a.code) {
                <div class="alert-row" [class.alert-warning]="a.severity === 'warning'" [class.alert-info]="a.severity === 'info'">
                  <span class="ms">{{ a.severity === 'warning' ? 'warning' : 'info' }}</span>
                  <span class="alert-text">{{ 'admin.alert_' + a.code | transloco:{ count: a.count } }}</span>
                  @if (a.code === 'failedPayments') { <button class="alert-cta" (click)="filterPayments('FAILED'); go('payments')">{{ 'admin.alertView' | transloco }}</button> }
                  @if (a.code === 'pendingPartners') { <button class="alert-cta" (click)="go('partners')">{{ 'admin.alertView' | transloco }}</button> }
                  @if (a.code === 'ragEmpty') { <button class="alert-cta" (click)="go('rag')">{{ 'admin.alertView' | transloco }}</button> }
                </div>
              }
            </div>
          }
          @if (dashboard(); as d) {
            <div class="stat-grid">
              <div class="stat-card"><span class="ms stat-ic">group</span><div><span class="stat-num">{{ d.totalUsers }}</span><span class="stat-lbl">{{ 'admin.statUsers' | transloco }}</span></div></div>
              <div class="stat-card"><span class="ms stat-ic">store</span><div><span class="stat-num">{{ d.totalPartners }}</span><span class="stat-lbl">{{ 'admin.statPartners' | transloco }}</span></div></div>
              <div class="stat-card"><span class="ms stat-ic">confirmation_number</span><div><span class="stat-num">{{ d.totalBookings }}</span><span class="stat-lbl">{{ 'admin.statBookings' | transloco }}</span></div></div>
              <div class="stat-card"><span class="ms stat-ic">hourglass_top</span><div><span class="stat-num">{{ d.pendingPartners }}</span><span class="stat-lbl">{{ 'admin.statPending' | transloco }}</span></div></div>
              <div class="stat-card"><span class="ms stat-ic">rocket_launch</span><div><span class="stat-num">{{ d.activePartners }}</span><span class="stat-lbl">{{ 'admin.statLive' | transloco }}</span></div></div>
            </div>
            <h2 class="admin-sub">{{ 'admin.catalogContent' | transloco }}</h2>
            <div class="stat-grid">
              <div class="stat-card stat-link" (click)="go('hotels')"><span class="ms stat-ic">hotel</span><div><span class="stat-num">{{ d.totalHotels }}</span><span class="stat-lbl">{{ 'admin.navHotels' | transloco }}</span></div></div>
              <div class="stat-card stat-link" (click)="go('flights')"><span class="ms stat-ic">flight</span><div><span class="stat-num">{{ d.totalFlights }}</span><span class="stat-lbl">{{ 'admin.navFlights' | transloco }}</span></div></div>
              <div class="stat-card stat-link" (click)="go('cruises')"><span class="ms stat-ic">directions_boat</span><div><span class="stat-num">{{ d.totalCruises }}</span><span class="stat-lbl">{{ 'admin.navCruises' | transloco }}</span></div></div>
              <div class="stat-card stat-link" (click)="go('restaurants')"><span class="ms stat-ic">restaurant</span><div><span class="stat-num">{{ d.totalRestaurants }}</span><span class="stat-lbl">{{ 'admin.navRestaurants' | transloco }}</span></div></div>
              <div class="stat-card stat-link" (click)="go('destinations')"><span class="ms stat-ic">public</span><div><span class="stat-num">{{ d.totalDestinations }}</span><span class="stat-lbl">{{ 'admin.navDestinations' | transloco }}</span></div></div>
              <div class="stat-card stat-link" (click)="go('stories')"><span class="ms stat-ic">movie</span><div><span class="stat-num">{{ d.totalStories }}</span><span class="stat-lbl">{{ 'admin.navStories' | transloco }}</span></div></div>
            </div>
            <div class="quick-actions">
              <button (click)="go('users')"><span class="ms">manage_accounts</span> {{ 'admin.manageUsers' | transloco }}</button>
              <button (click)="go('partners')"><span class="ms">handshake</span> {{ 'admin.reviewPartners' | transloco }}</button>
              <button (click)="go('hotels')"><span class="ms">hotel</span> {{ 'admin.manageCatalog' | transloco }}</button>
              <button (click)="go('reviews')"><span class="ms">reviews</span> {{ 'admin.moderateReviews' | transloco }}</button>
            </div>
          } @else {
            <div class="admin-loading">{{ 'admin.loading' | transloco }}</div>
          }
        }

        <!-- USERS -->
        @if (section() === 'users') {
          <div class="user-bar">
            <button class="em-new-btn" (click)="openCreateUser()"><span class="ms">person_add</span> {{ 'admin.newUser' | transloco }}</button>
          </div>
          <div class="table-wrap">
            <table class="admin-table">
              <thead><tr><th>{{ 'admin.thUser' | transloco }}</th><th>{{ 'admin.thEmail' | transloco }}</th><th>{{ 'admin.thRole' | transloco }}</th><th>{{ 'admin.thStatus' | transloco }}</th><th>{{ 'admin.thActions' | transloco }}</th></tr></thead>
              <tbody>
                @for (u of users(); track u.id) {
                  <tr [class.row-banned]="!u.active">
                    <td><div class="cell-user"><span class="cell-avatar">@if (u.avatarUrl) { <img #img class="cell-avatar__img" [src]="u.avatarUrl" [alt]="u.firstName" (error)="img.hidden = true; ini.hidden = false" /><span #ini hidden>{{ initials(u) }}</span> } @else { {{ initials(u) }} }</span><span>{{ u.firstName }} {{ u.lastName }}</span></div></td>
                    <td class="muted">{{ u.email }}</td>
                    <td>
                      <select class="role-select" [ngModel]="u.role" (ngModelChange)="changeRole(u, $event)">
                        @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
                      </select>
                    </td>
                    <td>
                      <span class="tag" [class.tag-ok]="u.active" [class.tag-off]="!u.active">{{ (u.active ? 'admin.active' : 'admin.banned') | transloco }}</span>
                    </td>
                    <td class="user-actions">
                      <button class="mini" (click)="openEditUser(u)">{{ 'admin.edit' | transloco }}</button>
                      <button class="mini" [class.mini-danger]="u.active" (click)="toggleBan(u)">
                        {{ (u.active ? 'admin.ban' : 'admin.reinstate') | transloco }}
                      </button>
                      @if (u.active && u.role !== 'ADMIN') {
                        <button class="mini" (click)="impersonate(u)" [title]="'admin.impersonateHint' | transloco">{{ 'admin.impersonate' | transloco }}</button>
                      }
                      <button class="mini" (click)="exportUser(u)" [title]="'admin.gdprExportHint' | transloco">{{ 'admin.gdprExport' | transloco }}</button>
                      <button class="mini mini-danger" (click)="anonymizeUser(u)" [title]="'admin.gdprEraseHint' | transloco">{{ 'admin.gdprErase' | transloco }}</button>
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
              <thead><tr><th>{{ 'admin.thBookingRef' | transloco }}</th><th>{{ 'admin.thUser' | transloco }}</th><th>{{ 'admin.thDestination' | transloco }}</th><th>{{ 'admin.thAmount' | transloco }}</th><th>{{ 'admin.thCreated' | transloco }}</th><th>{{ 'admin.thStatus' | transloco }}</th></tr></thead>
              <tbody>
                @for (b of bookings(); track b.id) {
                  <tr class="row-click" (click)="openBookingDetail(b.id)">
                    <td class="mono">{{ b.bookingReference || b.id.slice(0, 8) }}</td>
                    <td class="muted">{{ b.userEmail || b.userId.slice(0, 8) }}</td>
                    <td>{{ b.destination || '—' }}</td>
                    <td>{{ b.totalAmount != null ? (b.totalAmount | currency) : '—' }}</td>
                    <td class="muted">{{ b.createdAt ? (b.createdAt | date:'medium') : '—' }}</td>
                    <td (click)="$event.stopPropagation()">
                      <select class="role-select" [ngModel]="b.status" (ngModelChange)="changeBookingStatus(b, $event)">
                        @for (s of bookingStatuses; track s) { <option [value]="s">{{ s }}</option> }
                      </select>
                    </td>
                  </tr>
                } @empty { <tr><td colspan="6" class="empty-row">{{ 'admin.noBookings' | transloco }}</td></tr> }
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

        <!-- AUDIT LOG -->
        @if (section() === 'audit') {
          <div class="user-bar">
            <input class="audit-search" type="search" [ngModel]="auditActor()" (ngModelChange)="filterAudit($event)"
                   [placeholder]="'admin.auditFilterActor' | transloco" />
          </div>
          <div class="table-wrap">
            <table class="admin-table">
              <thead><tr><th>{{ 'admin.thWhen' | transloco }}</th><th>{{ 'admin.thActor' | transloco }}</th><th>{{ 'admin.thAction' | transloco }}</th><th>{{ 'admin.thMethod' | transloco }}</th><th>{{ 'admin.thTarget' | transloco }}</th><th>{{ 'admin.thResult' | transloco }}</th><th>{{ 'admin.thIp' | transloco }}</th></tr></thead>
              <tbody>
                @for (a of audit(); track a.id) {
                  <tr>
                    <td class="muted">{{ a.createdAt | date:'short' }}</td>
                    <td><b>{{ a.actor }}</b></td>
                    <td><span class="tag tag-neutral">{{ a.action }}</span></td>
                    <td class="mono">{{ a.method }}</td>
                    <td class="mono muted">{{ a.targetId ? a.targetId.slice(0, 8) : '—' }}</td>
                    <td><span class="tag" [class.tag-ok]="a.statusCode < 400" [class.tag-off]="a.statusCode >= 400">{{ a.statusCode }}</span></td>
                    <td class="muted">{{ a.ip || '—' }}</td>
                  </tr>
                } @empty { <tr><td colspan="7" class="empty-row">{{ 'admin.noAudit' | transloco }}</td></tr> }
              </tbody>
            </table>
          </div>
          <div class="pager">
            <button [disabled]="page() === 0" (click)="prev()">{{ 'admin.prev' | transloco }}</button>
            <span>{{ 'admin.page' | transloco }} {{ page() + 1 }}</span>
            <button [disabled]="!hasMore()" (click)="next()">{{ 'admin.next' | transloco }}</button>
          </div>
        }

        <!-- RAG CONSOLE -->
        @if (section() === 'rag') {
          @if (ragStatus(); as s) {
            <div class="stat-grid">
              <div class="stat-card"><span class="ms stat-ic">database</span><div><span class="stat-num">{{ s.totalDocuments }}</span><span class="stat-lbl">{{ 'admin.ragDocuments' | transloco }}</span></div></div>
              <div class="stat-card"><span class="ms stat-ic" [style.color]="s.populated ? '#42b07a' : '#e0573a'">{{ s.populated ? 'check_circle' : 'error' }}</span><div><span class="stat-num">{{ (s.populated ? 'admin.ragReady' : 'admin.ragEmpty') | transloco }}</span><span class="stat-lbl">{{ 'admin.ragStatus' | transloco }}</span></div></div>
            </div>
            <h2 class="admin-sub">{{ 'admin.ragByType' | transloco }}</h2>
            <div class="table-wrap">
              <table class="admin-table">
                <thead><tr><th>{{ 'admin.ragType' | transloco }}</th><th>{{ 'admin.ragCount' | transloco }}</th></tr></thead>
                <tbody>
                  @for (t of ragTypes(); track t.type) {
                    <tr><td><span class="tag tag-neutral">{{ t.type }}</span></td><td>{{ t.count }}</td></tr>
                  } @empty { <tr><td colspan="2" class="empty-row">{{ 'admin.ragEmpty' | transloco }}</td></tr> }
                </tbody>
              </table>
            </div>
            <div class="quick-actions">
              <button (click)="rebuildRag()" [disabled]="ragBusy()">
                <span class="ms">{{ ragBusy() ? 'hourglass_top' : 'refresh' }}</span>
                {{ (ragBusy() ? 'admin.ragRebuilding' : 'admin.ragRebuild') | transloco }}
              </button>
            </div>
            <p class="admin-crumb">{{ 'admin.ragHint' | transloco }}</p>
          } @else {
            <div class="admin-loading">{{ 'admin.loading' | transloco }}</div>
          }
        }

        <!-- PAYMENTS / REFUNDS -->
        @if (section() === 'payments') {
          <div class="user-bar">
            <select class="audit-search" [ngModel]="paymentStatus()" (ngModelChange)="filterPayments($event)">
              @for (s of paymentStatuses; track s) { <option [value]="s">{{ s || ('admin.payAllStatuses' | transloco) }}</option> }
            </select>
          </div>
          <div class="table-wrap">
            <table class="admin-table">
              <thead><tr><th>{{ 'admin.thCreated' | transloco }}</th><th>{{ 'admin.thUser' | transloco }}</th><th>{{ 'admin.thBookingRef' | transloco }}</th><th>{{ 'admin.thAmount' | transloco }}</th><th>{{ 'admin.payGateway' | transloco }}</th><th>{{ 'admin.thStatus' | transloco }}</th><th>{{ 'admin.thActions' | transloco }}</th></tr></thead>
              <tbody>
                @for (pm of payments(); track pm.id) {
                  <tr>
                    <td class="muted">{{ pm.createdAt | date:'short' }}</td>
                    <td class="muted">{{ pm.userEmail || '—' }}</td>
                    <td class="mono">{{ pm.bookingId.slice(0, 8) }}</td>
                    <td>{{ pm.amount | currency:pm.currency }}</td>
                    <td class="muted">{{ pm.gateway || '—' }}</td>
                    <td>
                      <span class="tag"
                            [class.tag-ok]="pm.status === 'COMPLETED'"
                            [class.tag-off]="pm.status === 'FAILED' || pm.status === 'REFUNDED'"
                            [class.tag-neutral]="pm.status !== 'COMPLETED' && pm.status !== 'FAILED' && pm.status !== 'REFUNDED'">{{ pm.status }}</span>
                    </td>
                    <td>
                      @if (pm.status === 'COMPLETED') {
                        <button class="mini mini-danger" (click)="refundPayment(pm)"><span class="ms" style="font-size:15px">undo</span> {{ 'admin.refund' | transloco }}</button>
                      } @else if (pm.status === 'REFUNDED') {
                        <span class="muted">{{ 'admin.refunded' | transloco }} {{ pm.refundedAt ? (pm.refundedAt | date:'shortDate') : '' }}</span>
                      } @else { <span class="muted">—</span> }
                    </td>
                  </tr>
                } @empty { <tr><td colspan="7" class="empty-row">{{ 'admin.noPayments' | transloco }}</td></tr> }
              </tbody>
            </table>
          </div>
          <div class="pager">
            <button [disabled]="page() === 0" (click)="prev()">{{ 'admin.prev' | transloco }}</button>
            <span>{{ 'admin.page' | transloco }} {{ page() + 1 }}</span>
            <button [disabled]="!hasMore()" (click)="next()">{{ 'admin.next' | transloco }}</button>
          </div>
        }

        <!-- BROADCAST -->
        @if (section() === 'broadcast') {
          <div class="broadcast-card">
            <p class="admin-crumb">{{ 'admin.broadcastHint' | transloco }}</p>
            <label class="u-field u-full"><span class="u-lbl">{{ 'admin.broadcastAudience' | transloco }}</span>
              <select [(ngModel)]="broadcastForm.role">
                @for (r of broadcastRoles; track r) { <option [value]="r">{{ r || ('admin.broadcastEveryone' | transloco) }}</option> }
              </select>
            </label>
            <label class="u-field u-full"><span class="u-lbl">{{ 'admin.broadcastSubject' | transloco }} <span class="req">*</span></span>
              <input type="text" [(ngModel)]="broadcastForm.subject" maxlength="140" /></label>
            <label class="u-field u-full"><span class="u-lbl">{{ 'admin.broadcastMessage' | transloco }} <span class="req">*</span></span>
              <textarea rows="5" [(ngModel)]="broadcastForm.body"></textarea></label>
            <div class="quick-actions">
              <button (click)="sendBroadcast()" [disabled]="broadcastSending()">
                <span class="ms">{{ broadcastSending() ? 'hourglass_top' : 'send' }}</span>
                {{ (broadcastSending() ? 'admin.broadcastSending' : 'admin.broadcastSend') | transloco }}
              </button>
            </div>
          </div>
        }

        <!-- FEATURE FLAGS -->
        @if (section() === 'flags') {
          <div class="broadcast-card">
            <span class="u-lbl">{{ 'admin.flagNew' | transloco }}</span>
            <div class="flag-new-grid">
              <input type="text" [(ngModel)]="flagForm.key" [placeholder]="'admin.flagKeyPlaceholder' | transloco" />
              <input type="text" [(ngModel)]="flagForm.description" [placeholder]="'admin.fDescription' | transloco" />
              <input type="text" [(ngModel)]="flagForm.groupName" [placeholder]="'admin.flagGroup' | transloco" />
              <label class="flag-rollout">
                <span>{{ 'admin.flagRollout' | transloco }}</span>
                <input type="number" min="0" max="100" [(ngModel)]="flagForm.rolloutPercentage" /> %
              </label>
            </div>
            <div class="flag-roles">
              <span class="u-lbl">{{ 'admin.flagRoles' | transloco }}</span>
              @for (r of flagRoles; track r) {
                <label class="flag-role-chip" [class.on]="flagForm.roles[r]">
                  <input type="checkbox" [(ngModel)]="flagForm.roles[r]" /> {{ r }}
                </label>
              }
              <button class="em-new-btn" (click)="createFlag()"><span class="ms">add</span> {{ 'admin.flagAdd' | transloco }}</button>
            </div>
          </div>
          <div class="table-wrap">
            <table class="admin-table">
              <thead><tr><th>{{ 'admin.flagKey' | transloco }}</th><th>{{ 'admin.flagGroup' | transloco }}</th><th>{{ 'admin.flagRollout' | transloco }}</th><th>{{ 'admin.flagRoles' | transloco }}</th><th>{{ 'admin.thStatus' | transloco }}</th><th>{{ 'admin.thActions' | transloco }}</th></tr></thead>
              <tbody>
                @for (flag of flags(); track flag.id) {
                  <tr>
                    <td class="mono"><b>{{ flag.key }}</b>@if (flag.description) { <span class="flag-desc">{{ flag.description }}</span> }</td>
                    <td>@if (flag.groupName) { <span class="tag tag-neutral">{{ flag.groupName }}</span> } @else { <span class="muted">—</span> }</td>
                    <td>
                      <span class="rollout-badge" [class.rollout-full]="flag.rolloutPercentage >= 100" [class.rollout-off]="flag.rolloutPercentage <= 0">{{ flag.rolloutPercentage }}%</span>
                    </td>
                    <td>
                      @if (flag.targetRoles) {
                        @for (r of flag.targetRoles.split(','); track r) { <span class="tag tag-neutral role-tag">{{ r }}</span> }
                      } @else { <span class="muted">{{ 'admin.flagAllRoles' | transloco }}</span> }
                    </td>
                    <td><span class="tag" [class.tag-ok]="flag.enabled" [class.tag-off]="!flag.enabled">{{ (flag.enabled ? 'admin.flagOn' : 'admin.flagOff') | transloco }}</span></td>
                    <td class="user-actions">
                      <button class="mini" (click)="openFlagEdit(flag)">{{ 'admin.edit' | transloco }}</button>
                      <button class="mini" [class.mini-ok]="!flag.enabled" [class.mini-danger]="flag.enabled" (click)="toggleFlag(flag)">
                        {{ (flag.enabled ? 'admin.flagTurnOff' : 'admin.flagTurnOn') | transloco }}
                      </button>
                      <button class="mini mini-danger" (click)="removeFlag(flag)">{{ 'admin.delete' | transloco }}</button>
                    </td>
                  </tr>
                } @empty { <tr><td colspan="6" class="empty-row">{{ 'admin.noFlags' | transloco }}</td></tr> }
              </tbody>
            </table>
          </div>
        }
      </main>

      <!-- USER CREATE / EDIT MODAL -->
      @if (userFormOpen()) {
        <div class="u-overlay" (click)="closeUserForm()">
          <div class="u-modal" (click)="$event.stopPropagation()">
            <header class="u-head">
              <h3>{{ (editingUserId() ? 'admin.editUser' : 'admin.newUser') | transloco }}</h3>
              <button class="u-close" (click)="closeUserForm()"><span class="ms">close</span></button>
            </header>
            <div class="u-grid">
              <label class="u-field u-full"><span class="u-lbl">{{ 'admin.fEmail' | transloco }} <span class="req">*</span></span>
                <input type="email" [(ngModel)]="userForm.email" [disabled]="!!editingUserId()" /></label>
              <label class="u-field u-full"><span class="u-lbl">{{ (editingUserId() ? 'admin.fPasswordKeep' : 'admin.fPassword') | transloco }} @if (!editingUserId()) { <span class="req">*</span> }</span>
                <input type="text" [(ngModel)]="userForm.password" autocomplete="off" /></label>
              <label class="u-field"><span class="u-lbl">{{ 'admin.fFirstName' | transloco }} <span class="req">*</span></span>
                <input type="text" [(ngModel)]="userForm.firstName" /></label>
              <label class="u-field"><span class="u-lbl">{{ 'admin.fLastName' | transloco }} <span class="req">*</span></span>
                <input type="text" [(ngModel)]="userForm.lastName" /></label>
              <label class="u-field"><span class="u-lbl">{{ 'admin.fPhone' | transloco }}</span>
                <input type="text" [(ngModel)]="userForm.phone" /></label>
              <label class="u-field"><span class="u-lbl">{{ 'admin.thRole' | transloco }}</span>
                <select [(ngModel)]="userForm.role">@for (r of roles; track r) { <option [value]="r">{{ r }}</option> }</select></label>
              <label class="u-field"><span class="u-lbl">{{ 'admin.fEmailVerified' | transloco }}</span>
                <span class="u-check"><input type="checkbox" [(ngModel)]="userForm.emailVerified" /></span></label>
              <label class="u-field"><span class="u-lbl">{{ 'admin.fActive' | transloco }}</span>
                <span class="u-check"><input type="checkbox" [(ngModel)]="userForm.active" /></span></label>
            </div>
            @if (userFormError()) { <p class="u-error">{{ userFormError() }}</p> }
            <footer class="u-foot">
              <button class="u-ghost" (click)="closeUserForm()">{{ 'admin.cancel' | transloco }}</button>
              <button class="u-primary" [disabled]="userSaving()" (click)="saveUser()">{{ (userSaving() ? 'admin.saving' : 'admin.save') | transloco }}</button>
            </footer>
          </div>
        </div>
      }

      <!-- BOOKING DETAIL DRAWER -->
      @if (bookingDetailOpen()) {
        <div class="u-overlay" (click)="closeBookingDetail()">
          <div class="bd-drawer" (click)="$event.stopPropagation()">
            @if (bookingDetail(); as d) {
              <header class="u-head">
                <div>
                  <h3 class="mono">{{ d.bookingReference || d.id.slice(0, 8) }}</h3>
                  <span class="tag" [class.tag-ok]="d.status === 'CONFIRMED' || d.status === 'COMPLETED'"
                        [class.tag-off]="d.status === 'CANCELLED'"
                        [class.tag-neutral]="d.status === 'PENDING'">{{ d.status }}</span>
                </div>
                <button class="u-close" (click)="closeBookingDetail()"><span class="ms">close</span></button>
              </header>

              <div class="bd-body">
                <!-- Customer -->
                @if (d.user; as u) {
                  <section class="bd-card">
                    <h4 class="bd-h4"><span class="ms">person</span> {{ 'admin.bdCustomer' | transloco }}</h4>
                    <div class="bd-kv"><span>{{ u.firstName }} {{ u.lastName }}</span><span class="muted">{{ u.email }}</span></div>
                    <div class="bd-tags">
                      <span class="tag tag-neutral">{{ u.role }}</span>
                      <span class="tag" [class.tag-ok]="u.active" [class.tag-off]="!u.active">{{ (u.active ? 'admin.active' : 'admin.banned') | transloco }}</span>
                      <span class="tag tag-neutral">{{ 'admin.bdTotalBookings' | transloco:{ count: d.userTotalBookings } }}</span>
                    </div>
                    <p class="admin-crumb">{{ 'admin.bdMemberSince' | transloco }} {{ u.createdAt ? (u.createdAt | date:'mediumDate') : '—' }}</p>
                  </section>
                }

                <!-- Trip -->
                <section class="bd-card">
                  <h4 class="bd-h4"><span class="ms">luggage</span> {{ 'admin.bdTrip' | transloco }}</h4>
                  <div class="bd-grid">
                    <div><span class="bd-lbl">{{ 'admin.thDestination' | transloco }}</span><span>{{ d.destination || '—' }}</span></div>
                    <div><span class="bd-lbl">{{ 'admin.bdParty' | transloco }}</span><span>{{ d.partySize ?? '—' }}</span></div>
                    <div><span class="bd-lbl">{{ 'admin.bdCheckIn' | transloco }}</span><span>{{ d.checkIn ? (d.checkIn | date:'mediumDate') : '—' }}</span></div>
                    <div><span class="bd-lbl">{{ 'admin.bdCheckOut' | transloco }}</span><span>{{ d.checkOut ? (d.checkOut | date:'mediumDate') : '—' }}</span></div>
                  </div>
                </section>

                <!-- Amounts -->
                <section class="bd-card">
                  <h4 class="bd-h4"><span class="ms">payments</span> {{ 'admin.bdAmounts' | transloco }}</h4>
                  <div class="bd-amounts">
                    @if (d.hotelAmount) { <div class="bd-amt"><span>{{ 'admin.navHotels' | transloco }}</span><span>{{ d.hotelAmount | currency }}</span></div> }
                    @if (d.flightAmount) { <div class="bd-amt"><span>{{ 'admin.navFlights' | transloco }}</span><span>{{ d.flightAmount | currency }}</span></div> }
                    @if (d.restaurantAmount) { <div class="bd-amt"><span>{{ 'admin.navRestaurants' | transloco }}</span><span>{{ d.restaurantAmount | currency }}</span></div> }
                    @if (d.cruiseAmount) { <div class="bd-amt"><span>{{ 'admin.navCruises' | transloco }}</span><span>{{ d.cruiseAmount | currency }}</span></div> }
                    @if (d.serviceFeeAmount) { <div class="bd-amt"><span>{{ 'admin.bdServiceFee' | transloco }}</span><span>{{ d.serviceFeeAmount | currency }}</span></div> }
                    @if (d.commissionAmount) { <div class="bd-amt muted"><span>{{ 'admin.bdCommission' | transloco }}</span><span>{{ d.commissionAmount | currency }}</span></div> }
                    <div class="bd-amt bd-amt-total"><span>{{ 'admin.thAmount' | transloco }}</span><span>{{ d.totalAmount != null ? (d.totalAmount | currency) : '—' }}</span></div>
                  </div>
                </section>

                <!-- Payments -->
                <section class="bd-card">
                  <h4 class="bd-h4"><span class="ms">receipt_long</span> {{ 'admin.bdPayments' | transloco }} ({{ d.payments.length }})</h4>
                  @for (p of d.payments; track p.id) {
                    <div class="bd-pay">
                      <span class="tag" [class.tag-ok]="p.status === 'COMPLETED'" [class.tag-off]="p.status === 'FAILED' || p.status === 'REFUNDED'"
                            [class.tag-neutral]="p.status !== 'COMPLETED' && p.status !== 'FAILED' && p.status !== 'REFUNDED'">{{ p.status }}</span>
                      <span>{{ p.amount != null ? (p.amount | currency:(p.currency || 'EUR')) : '—' }}</span>
                      <span class="muted">{{ p.gateway || '—' }}</span>
                      <span class="muted">{{ p.createdAt ? (p.createdAt | date:'short') : '—' }}</span>
                    </div>
                  } @empty { <p class="admin-crumb">{{ 'admin.bdNoPayments' | transloco }}</p> }
                </section>

                <!-- Reviews by customer -->
                <section class="bd-card">
                  <h4 class="bd-h4"><span class="ms">reviews</span> {{ 'admin.bdReviews' | transloco }} ({{ d.userReviews.length }})</h4>
                  @for (r of d.userReviews; track r.id) {
                    <div class="bd-review">
                      <span class="stars-mini">@for (s of [1,2,3,4,5]; track s) { <span class="ms" [class.lit]="s <= r.rating">star</span> }</span>
                      <span class="gh-main">{{ r.title || ('admin.untitledReview' | transloco) }}</span>
                      <span class="tag tag-neutral">{{ r.targetType }}</span>
                    </div>
                  } @empty { <p class="admin-crumb">{{ 'admin.bdNoReviews' | transloco }}</p> }
                </section>
              </div>
            } @else {
              <div class="admin-loading">{{ 'admin.loading' | transloco }}</div>
            }
          </div>
        </div>
      }

      <!-- FEATURE FLAG TARGETING MODAL -->
      @if (flagEditOpen()) {
        <div class="u-overlay" (click)="closeFlagEdit()">
          <div class="u-modal" (click)="$event.stopPropagation()">
            <header class="u-head">
              <h3>{{ 'admin.flagConfigure' | transloco }} · <span class="mono">{{ flagEditKey() }}</span></h3>
              <button class="u-close" (click)="closeFlagEdit()"><span class="ms">close</span></button>
            </header>
            <div class="u-grid">
              <label class="u-field u-full"><span class="u-lbl">{{ 'admin.fDescription' | transloco }}</span>
                <input type="text" [(ngModel)]="flagEdit.description" /></label>
              <label class="u-field"><span class="u-lbl">{{ 'admin.flagGroup' | transloco }}</span>
                <input type="text" [(ngModel)]="flagEdit.groupName" /></label>
              <label class="u-field"><span class="u-lbl">{{ 'admin.flagRollout' | transloco }} (%)</span>
                <input type="number" min="0" max="100" [(ngModel)]="flagEdit.rolloutPercentage" /></label>
              <div class="u-field u-full">
                <span class="u-lbl">{{ 'admin.flagRoles' | transloco }}</span>
                <div class="flag-roles">
                  @for (r of flagRoles; track r) {
                    <label class="flag-role-chip" [class.on]="flagEdit.roles[r]">
                      <input type="checkbox" [(ngModel)]="flagEdit.roles[r]" /> {{ r }}
                    </label>
                  }
                </div>
                <p class="admin-crumb">{{ 'admin.flagRolesHint' | transloco }}</p>
              </div>
            </div>
            <footer class="u-foot">
              <button class="u-ghost" (click)="closeFlagEdit()">{{ 'admin.cancel' | transloco }}</button>
              <button class="u-primary" (click)="saveFlagEdit()">{{ 'admin.save' | transloco }}</button>
            </footer>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  readonly roles = ROLES;
  readonly bookingStatuses = BOOKING_STATUSES;
  readonly navItems: { id: Section; key: string; icon: string }[] = [
    { id: 'overview', key: 'admin.navOverview', icon: 'dashboard' },
    { id: 'users', key: 'admin.navUsers', icon: 'group' },
    { id: 'partners', key: 'admin.navPartners', icon: 'store' },
    { id: 'hotels', key: 'admin.navHotels', icon: 'hotel' },
    { id: 'flights', key: 'admin.navFlights', icon: 'flight' },
    { id: 'cruises', key: 'admin.navCruises', icon: 'directions_boat' },
    { id: 'restaurants', key: 'admin.navRestaurants', icon: 'restaurant' },
    { id: 'destinations', key: 'admin.navDestinations', icon: 'public' },
    { id: 'attractions', key: 'admin.navAttractions', icon: 'attractions' },
    { id: 'stories', key: 'admin.navStories', icon: 'movie' },
    { id: 'bookings', key: 'admin.navBookings', icon: 'confirmation_number' },
    { id: 'payments', key: 'admin.navPayments', icon: 'payments' },
    { id: 'reviews', key: 'admin.navReviews', icon: 'reviews' },
    { id: 'promos', key: 'admin.navPromos', icon: 'sell' },
    { id: 'logs', key: 'admin.navLogs', icon: 'monitoring' },
    { id: 'audit', key: 'admin.navAudit', icon: 'history' },
    { id: 'broadcast', key: 'admin.navBroadcast', icon: 'campaign' },
    { id: 'flags', key: 'admin.navFlags', icon: 'toggle_on' },
    { id: 'rag', key: 'admin.navRag', icon: 'network_intelligence' },
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
  readonly alerts = signal<AdminAlert[]>([]);
  readonly users = signal<AdminUser[]>([]);
  readonly bookings = signal<AdminBooking[]>([]);
  readonly reviews = signal<AdminReview[]>([]);
  readonly logs = signal<AdminAiLog[]>([]);
  readonly audit = signal<AdminAuditLog[]>([]);
  readonly auditActor = signal('');
  readonly ragStatus = signal<RagStatus | null>(null);
  readonly ragBusy = signal(false);
  readonly payments = signal<AdminPayment[]>([]);
  readonly paymentStatus = signal('');

  readonly paymentStatuses = ['', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];

  readonly broadcastForm = { subject: '', body: '', role: '' };
  readonly broadcastRoles = ['', 'TRAVELER', 'PARTNER', 'OPERATIONS', 'ADMIN'];
  readonly broadcastSending = signal(false);
  readonly flags = signal<FeatureFlag[]>([]);
  readonly flagRoles = ['TRAVELER', 'PARTNER', 'OPERATIONS', 'ADMIN'];
  flagForm: { key: string; description: string; groupName: string; rolloutPercentage: number; roles: Record<string, boolean> } =
    { key: '', description: '', groupName: '', rolloutPercentage: 100, roles: {} };
  // Flag targeting edit modal
  readonly flagEditOpen = signal(false);
  readonly flagEditKey = signal('');
  readonly flagEditEnabled = signal(true);
  flagEdit: { description: string; groupName: string; rolloutPercentage: number; roles: Record<string, boolean> } =
    { description: '', groupName: '', rolloutPercentage: 100, roles: {} };

  // Booking drill-down + global search
  readonly bookingDetail = signal<AdminBookingDetail | null>(null);
  readonly bookingDetailOpen = signal(false);
  readonly globalQuery = signal('');
  readonly globalResults = signal<AdminSearchResult | null>(null);
  readonly searchOpen = signal(false);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

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
        this.admin.alerts().pipe(catchError(() => of([]))).subscribe(a => this.alerts.set(a));
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
      case 'audit':
        this.admin.auditLogs(p, this.pageSize, this.auditActor()).pipe(catchError(() => of(null))).subscribe(res => {
          this.audit.set(res?.content ?? []);
          this.hasMore.set(this.computeHasMore(res));
        });
        break;
      case 'rag':
        this.admin.ragStatus().pipe(catchError(() => of(null))).subscribe(s => this.ragStatus.set(s));
        break;
      case 'payments':
        this.admin.payments(p, this.pageSize, this.paymentStatus()).pipe(catchError(() => of(null))).subscribe(res => {
          this.payments.set(res?.content ?? []);
          this.hasMore.set(this.computeHasMore(res));
        });
        break;
      case 'flags':
        this.admin.featureFlags().pipe(catchError(() => of([]))).subscribe(f => this.flags.set(f));
        break;
    }
  }

  toggleFlag(flag: FeatureFlag): void {
    this.admin.toggleFlag(flag.id, !flag.enabled).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) {
        this.flags.update(list => list.map(x => x.id === flag.id ? updated : x));
        this.flash(this.transloco.translate(updated.enabled ? 'admin.flagEnabled' : 'admin.flagDisabled', { key: updated.key }));
      }
    });
  }

  private rolesToString(roles: Record<string, boolean>): string | null {
    const picked = this.flagRoles.filter(r => roles[r]);
    return picked.length ? picked.join(',') : null;
  }

  private reloadFlags(): void {
    this.admin.featureFlags().pipe(catchError(() => of([]))).subscribe(f => this.flags.set(f));
  }

  createFlag(): void {
    const key = this.flagForm.key.trim().toLowerCase();
    if (!/^[a-z0-9._-]{2,80}$/.test(key)) {
      this.flash(this.transloco.translate('admin.flagKeyInvalid'));
      return;
    }
    const payload: FeatureFlagUpsert = {
      key,
      enabled: false,
      description: this.flagForm.description || null,
      rolloutPercentage: this.clampPct(this.flagForm.rolloutPercentage),
      targetRoles: this.rolesToString(this.flagForm.roles),
      groupName: this.flagForm.groupName || null,
    };
    this.admin.upsertFlag(payload).pipe(catchError(() => of(null))).subscribe(created => {
      if (created) {
        this.flagForm = { key: '', description: '', groupName: '', rolloutPercentage: 100, roles: {} };
        this.flash(this.transloco.translate('admin.flagCreated'));
        this.reloadFlags();
      } else {
        this.flash(this.transloco.translate('admin.saveFailed'));
      }
    });
  }

  openFlagEdit(flag: FeatureFlag): void {
    this.flagEditKey.set(flag.key);
    this.flagEditEnabled.set(flag.enabled);
    const roles: Record<string, boolean> = {};
    (flag.targetRoles ? flag.targetRoles.split(',') : []).forEach(r => { roles[r.trim()] = true; });
    this.flagEdit = {
      description: flag.description ?? '',
      groupName: flag.groupName ?? '',
      rolloutPercentage: flag.rolloutPercentage,
      roles,
    };
    this.flagEditOpen.set(true);
  }

  closeFlagEdit(): void { this.flagEditOpen.set(false); }

  saveFlagEdit(): void {
    const payload: FeatureFlagUpsert = {
      key: this.flagEditKey(),
      enabled: this.flagEditEnabled(),
      description: this.flagEdit.description || null,
      rolloutPercentage: this.clampPct(this.flagEdit.rolloutPercentage),
      targetRoles: this.rolesToString(this.flagEdit.roles),
      groupName: this.flagEdit.groupName || null,
    };
    this.admin.upsertFlag(payload).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) {
        this.flagEditOpen.set(false);
        this.flash(this.transloco.translate('admin.flagUpdated'));
        this.reloadFlags();
      } else {
        this.flash(this.transloco.translate('admin.saveFailed'));
      }
    });
  }

  private clampPct(v: number): number {
    const n = Number(v);
    if (Number.isNaN(n)) return 100;
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  removeFlag(flag: FeatureFlag): void {
    if (!confirm(this.transloco.translate('admin.flagDeleteConfirm', { key: flag.key }))) return;
    this.admin.deleteFlag(flag.id).pipe(catchError(() => of(null))).subscribe(() => {
      this.flags.update(list => list.filter(x => x.id !== flag.id));
      this.flash(this.transloco.translate('admin.flagDeleted'));
    });
  }

  filterPayments(status: string): void {
    this.paymentStatus.set(status);
    this.page.set(0);
    this.loadSection();
  }

  sendBroadcast(): void {
    const f = this.broadcastForm;
    if (!f.subject.trim() || !f.body.trim()) {
      this.flash(this.transloco.translate('admin.broadcastIncomplete'));
      return;
    }
    if (!confirm(this.transloco.translate('admin.broadcastConfirm'))) return;
    this.broadcastSending.set(true);
    this.admin.broadcast(f.subject, f.body, f.role).pipe(catchError(() => of(null))).subscribe(res => {
      this.broadcastSending.set(false);
      if (res) {
        this.flash(this.transloco.translate('admin.broadcastSent', { count: res.recipients }));
        this.broadcastForm.subject = '';
        this.broadcastForm.body = '';
      } else {
        this.flash(this.transloco.translate('admin.broadcastFailed'));
      }
    });
  }

  refundPayment(pm: AdminPayment): void {
    if (pm.status !== 'COMPLETED') return;
    if (!confirm(this.transloco.translate('admin.refundConfirm'))) return;
    this.admin.refundPayment(pm.id).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) {
        this.payments.update(list => list.map(x => x.id === pm.id ? updated : x));
        this.flash(this.transloco.translate('admin.refundDone'));
      } else {
        this.flash(this.transloco.translate('admin.refundFailed'));
      }
    });
  }

  ragTypes(): { type: string; count: number }[] {
    const byType = this.ragStatus()?.byType ?? {};
    return Object.entries(byType).map(([type, count]) => ({ type, count }));
  }

  rebuildRag(): void {
    if (this.ragBusy()) return;
    if (!confirm(this.transloco.translate('admin.ragRebuildConfirm'))) return;
    this.ragBusy.set(true);
    this.admin.ragReingest().pipe(catchError(() => of(null))).subscribe(res => {
      this.ragBusy.set(false);
      if (res) {
        this.flash(this.transloco.translate('admin.ragRebuilt', { count: res.documentsIngested }));
        this.admin.ragStatus().pipe(catchError(() => of(null))).subscribe(s => this.ragStatus.set(s));
      } else {
        this.flash(this.transloco.translate('admin.ragRebuildFailed'));
      }
    });
  }

  filterAudit(actor: string): void {
    this.auditActor.set(actor);
    this.page.set(0);
    this.loadSection();
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

  impersonate(u: AdminUser): void {
    if (!confirm(this.transloco.translate('admin.impersonateConfirm', { email: u.email }))) return;
    this.admin.impersonate(u.id).pipe(catchError(() => of(null))).subscribe(res => {
      if (!res) { this.flash(this.transloco.translate('admin.impersonateFailed')); return; }
      // Back up the admin session, swap in the impersonation token, reload as that user.
      const adminToken = localStorage.getItem('ai_access_token');
      if (adminToken) localStorage.setItem('ai_admin_token', adminToken);
      localStorage.setItem('ai_impersonating', `${res.firstName} ${res.lastName} (${res.email})`);
      localStorage.setItem('ai_access_token', res.accessToken);
      window.location.href = '/';
    });
  }

  exportUser(u: AdminUser): void {
    this.admin.exportUserData(u.id).pipe(catchError(() => of(null))).subscribe(data => {
      if (!data) { this.flash(this.transloco.translate('admin.gdprExportFailed')); return; }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-${u.id}-data.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.flash(this.transloco.translate('admin.gdprExported'));
    });
  }

  anonymizeUser(u: AdminUser): void {
    if (!confirm(this.transloco.translate('admin.gdprEraseConfirm', { email: u.email }))) return;
    this.admin.anonymizeUser(u.id).subscribe({
      next: () => {
        this.flash(this.transloco.translate('admin.gdprErased'));
        this.loadCurrentUsers();
      },
      error: () => this.flash(this.transloco.translate('admin.gdprEraseFailed')),
    });
  }

  toggleBan(u: AdminUser): void {
    this.admin.setUserActive(u.id, !u.active).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) { this.users.update(list => list.map(x => x.id === u.id ? updated : x)); this.flash(this.transloco.translate(updated.active ? 'admin.userReinstated' : 'admin.userBanned')); }
    });
  }

  changeBookingStatus(b: AdminBooking, status: string): void {
    if (status === b.status) return;
    this.admin.setBookingStatus(b.id, status).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) { this.bookings.update(list => list.map(x => x.id === b.id ? updated : x)); this.flash(this.transloco.translate('admin.bookingUpdated')); }
    });
  }

  // ── User create / edit ─────────────────────────────────────────────────

  readonly userFormOpen = signal(false);
  readonly editingUserId = signal<string | null>(null);
  readonly userSaving = signal(false);
  readonly userFormError = signal('');
  userForm: AdminUserUpsert = emptyUserForm();

  openCreateUser(): void {
    this.editingUserId.set(null);
    this.userFormError.set('');
    this.userForm = emptyUserForm();
    this.userFormOpen.set(true);
  }

  openEditUser(u: AdminUser): void {
    this.editingUserId.set(u.id);
    this.userFormError.set('');
    this.userForm = {
      email: u.email, password: '', firstName: u.firstName, lastName: u.lastName,
      phone: '', role: u.role, emailVerified: u.emailVerified, active: u.active,
    };
    this.userFormOpen.set(true);
  }

  closeUserForm(): void { this.userFormOpen.set(false); }

  saveUser(): void {
    const f = this.userForm;
    if (!f.email || !f.firstName || !f.lastName || (!this.editingUserId() && !f.password)) {
      this.userFormError.set(this.transloco.translate('admin.userFormIncomplete'));
      return;
    }
    this.userSaving.set(true);
    this.userFormError.set('');
    const id = this.editingUserId();
    const req$ = id ? this.admin.updateUser(id, f) : this.admin.createUser(f);
    req$.pipe(catchError(() => { this.userFormError.set(this.transloco.translate('admin.saveFailed')); return of(null); }))
      .subscribe(result => {
        this.userSaving.set(false);
        if (!result) return;
        this.userFormOpen.set(false);
        this.flash(this.transloco.translate(id ? 'admin.itemUpdated' : 'admin.itemCreated'));
        this.loadCurrentUsers();
      });
  }

  private loadCurrentUsers(): void {
    this.admin.users(this.page(), this.pageSize).pipe(catchError(() => of(null))).subscribe(res => {
      this.users.set(res?.content ?? []);
      this.hasMore.set(this.computeHasMore(res));
    });
  }

  removeReview(r: AdminReview): void {
    if (!confirm(this.transloco.translate('admin.deleteReviewConfirm'))) return;
    this.admin.deleteReview(r.id).pipe(catchError(() => of(null))).subscribe(() => {
      this.reviews.update(list => list.filter(x => x.id !== r.id));
      this.flash(this.transloco.translate('admin.reviewDeleted'));
    });
  }

  // ── Booking drill-down ──────────────────────────────────────────────────

  openBookingDetail(id: string): void {
    this.bookingDetail.set(null);
    this.bookingDetailOpen.set(true);
    this.admin.bookingDetail(id).pipe(catchError(() => of(null))).subscribe(d => {
      if (d) this.bookingDetail.set(d);
      else { this.bookingDetailOpen.set(false); this.flash(this.transloco.translate('admin.loadFailed')); }
    });
  }

  closeBookingDetail(): void { this.bookingDetailOpen.set(false); }

  // ── Global search ───────────────────────────────────────────────────────

  onGlobalSearch(q: string): void {
    this.globalQuery.set(q);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (!q.trim()) { this.globalResults.set(null); this.searchOpen.set(false); return; }
    this.searchTimer = setTimeout(() => {
      this.admin.search(q).pipe(catchError(() => of(null))).subscribe(r => {
        this.globalResults.set(r);
        this.searchOpen.set(true);
      });
    }, 300);
  }

  pickUser(): void { this.closeSearch(); this.go('users'); }
  pickPartner(): void { this.closeSearch(); this.go('partners'); }
  pickBooking(id: string): void { this.closeSearch(); this.openBookingDetail(id); }

  private closeSearch(): void {
    this.searchOpen.set(false);
    this.globalQuery.set('');
    this.globalResults.set(null);
  }

  @HostListener('document:click')
  onDocumentClick(): void { if (this.searchOpen()) this.searchOpen.set(false); }

  exit(): void { this.router.navigate(['/']); }

  private flash(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
