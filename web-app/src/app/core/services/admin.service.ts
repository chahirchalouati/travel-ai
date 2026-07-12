import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, PageWrapper } from '../models/api.models';

/** Optional server-side list refinement: free-text search, sort and per-field filters. */
export interface AdminListQuery {
  search?: string;
  sortKey?: string | null;
  sortDir?: 'asc' | 'desc';
  filters?: Record<string, string>;
}

/** Serializes pagination + an {@link AdminListQuery} into a URL query string. */
export function listQueryString(page: number, size: number, q?: AdminListQuery): string {
  const parts = [`page=${page}`, `size=${size}`];
  if (q?.sortKey) parts.push(`sort=${encodeURIComponent(q.sortKey)},${q.sortDir ?? 'asc'}`);
  if (q?.search?.trim()) parts.push(`search=${encodeURIComponent(q.search.trim())}`);
  if (q?.filters) {
    for (const [k, v] of Object.entries(q.filters)) {
      if (v !== null && v !== undefined && `${v}`.trim() !== '') parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
  }
  return parts.join('&');
}

export interface AdminDashboard {
  totalUsers: number;
  totalPartners: number;
  totalBookings: number;
  totalRevenue: number;
  revenueGrowth: number;
  activePartners: number;
  pendingPartners: number;
  totalHotels: number;
  totalFlights: number;
  totalCruises: number;
  totalRestaurants: number;
  totalDestinations: number;
  totalStories: number;
}

export interface ImpersonationResult {
  accessToken: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AdminAlert {
  code: string;
  severity: 'warning' | 'info';
  count: number;
}

export interface AdminUserUpsert {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  emailVerified?: boolean;
  active?: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: string;
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export interface AdminPartner {
  id: string;
  name: string;
  type: string | null;
  city: string | null;
  status: string | null;
  contactEmail: string | null;
  active: boolean;
  createdAt: string;
}

export interface AdminBooking {
  id: string;
  userId: string;
  userEmail: string | null;
  destination: string | null;
  bookingReference: string | null;
  status: string;
  totalAmount: number | null;
  createdAt: string | null;
}

export interface AdminReview {
  id: string;
  authorName: string;
  authorEmail: string | null;
  authorAvatarUrl: string | null;
  targetType: string;
  targetId: string;
  rating: number;
  title: string;
  content: string;
  verified: boolean;
  createdAt: string;
}

export interface AdminAiLog {
  id: string;
  requestId: string | null;
  agent: string;
  durationMs: number | null;
  tokensUsed: number | null;
  model: string | null;
  error: boolean;
  createdAt: string | null;
}

export interface AdminAuditLog {
  id: string;
  actor: string;
  method: string;
  path: string;
  action: string;
  targetId: string | null;
  statusCode: number;
  ip: string | null;
  createdAt: string;
}

export interface AdminPayment {
  id: string;
  bookingId: string;
  userEmail: string | null;
  status: string;
  type: string | null;
  gateway: string | null;
  amount: number;
  currency: string;
  gatewayReference: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface AdminBookingDetail {
  id: string;
  bookingReference: string | null;
  status: string | null;
  destination: string | null;
  checkIn: string | null;
  checkOut: string | null;
  partySize: number | null;
  totalAmount: number | null;
  hotelAmount: number | null;
  flightAmount: number | null;
  restaurantAmount: number | null;
  cruiseAmount: number | null;
  serviceFeeAmount: number | null;
  commissionAmount: number | null;
  createdAt: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string | null;
    active: boolean;
    createdAt: string | null;
  } | null;
  payments: {
    id: string;
    status: string | null;
    type: string | null;
    gateway: string | null;
    amount: number | null;
    currency: string | null;
    paidAt: string | null;
    refundedAt: string | null;
    failureReason: string | null;
    createdAt: string | null;
  }[];
  userReviews: {
    id: string;
    targetType: string;
    rating: number;
    title: string | null;
    createdAt: string | null;
  }[];
  userTotalBookings: number;
}

export interface AdminSearchHit {
  id: string;
  primary: string;
  secondary: string | null;
}

export interface AdminSearchResult {
  users: AdminSearchHit[];
  bookings: AdminSearchHit[];
  partners: AdminSearchHit[];
}

export interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  description: string | null;
  rolloutPercentage: number;
  targetRoles: string | null;
  groupName: string | null;
  updatedAt: string;
}

export interface FeatureFlagUpsert {
  key: string;
  enabled: boolean;
  description?: string | null;
  rolloutPercentage?: number;
  targetRoles?: string | null;
  groupName?: string | null;
}

export interface AdminSubscription {
  id: string;
  userEmail: string | null;
  planCode: string;
  planName: string | null;
  status: string;
  pricePaid: number;
  currency: string;
  startedAt: string | null;
  renewsAt: string | null;
  cancelledAt: string | null;
  createdAt: string | null;
}

export interface RevenueSummary {
  confirmedBookings: number;
  grossBookingValue: number;
  serviceFeeRevenue: number;
  commissionRevenue: number;
  ancillaryRevenue: number;
  activeSubscriptions: number;
  subscriptionRevenue: number;
  totalPlatformRevenue: number;
}

export interface RagStatus {
  totalDocuments: number;
  byType: Record<string, number>;
  populated: boolean;
}

export interface RagIngestResult {
  documentsIngested: number;
  status: string;
}

/** Admin platform-management API (all endpoints require the ADMIN role). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  dashboard(): Observable<AdminDashboard> {
    return this.http.get<ApiWrapper<AdminDashboard>>(`${this.base}/dashboard`).pipe(map(r => r.data));
  }

  alerts(): Observable<AdminAlert[]> {
    return this.http.get<ApiWrapper<AdminAlert[]>>(`${this.base}/alerts`).pipe(map(r => r.data));
  }

  users(page = 0, size = 20, query?: AdminListQuery): Observable<PageWrapper<AdminUser>> {
    return this.http
      .get<ApiWrapper<PageWrapper<AdminUser>>>(`${this.base}/users?${listQueryString(page, size, query)}`)
      .pipe(map(r => r.data));
  }

  setUserRole(id: string, role: string): Observable<AdminUser> {
    return this.http
      .patch<ApiWrapper<AdminUser>>(`${this.base}/users/${id}/role`, { role })
      .pipe(map(r => r.data));
  }

  setUserActive(id: string, active: boolean): Observable<AdminUser> {
    return this.http
      .patch<ApiWrapper<AdminUser>>(`${this.base}/users/${id}/status`, { active })
      .pipe(map(r => r.data));
  }

  partners(page = 0, size = 20): Observable<PageWrapper<AdminPartner>> {
    return this.http
      .get<ApiWrapper<PageWrapper<AdminPartner>>>(`${this.base}/partners?page=${page}&size=${size}`)
      .pipe(map(r => r.data));
  }

  activatePartner(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/partners/${id}/activate`, {});
  }

  suspendPartner(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/partners/${id}/suspend`, {});
  }

  bookings(page = 0, size = 20): Observable<PageWrapper<AdminBooking>> {
    return this.http
      .get<ApiWrapper<PageWrapper<AdminBooking>>>(`${this.base}/bookings?page=${page}&size=${size}`)
      .pipe(map(r => r.data));
  }

  setBookingStatus(id: string, status: string): Observable<AdminBooking> {
    return this.http
      .patch<ApiWrapper<AdminBooking>>(`${this.base}/bookings/${id}/status`, { status })
      .pipe(map(r => r.data));
  }

  bookingDetail(id: string): Observable<AdminBookingDetail> {
    return this.http
      .get<ApiWrapper<AdminBookingDetail>>(`${this.base}/bookings/${id}/detail`)
      .pipe(map(r => r.data));
  }

  search(query: string): Observable<AdminSearchResult> {
    return this.http
      .get<ApiWrapper<AdminSearchResult>>(`${this.base}/search?q=${encodeURIComponent(query)}`)
      .pipe(map(r => r.data));
  }

  createUser(body: AdminUserUpsert): Observable<AdminUser> {
    return this.http.post<ApiWrapper<AdminUser>>(`${this.base}/users`, body).pipe(map(r => r.data));
  }

  exportUserData(id: string): Observable<Record<string, unknown>> {
    return this.http.get<ApiWrapper<Record<string, unknown>>>(`${this.base}/users/${id}/export`).pipe(map(r => r.data));
  }

  anonymizeUser(id: string): Observable<unknown> {
    return this.http.post<unknown>(`${this.base}/users/${id}/anonymize`, {});
  }

  impersonate(id: string): Observable<ImpersonationResult> {
    return this.http
      .post<ApiWrapper<ImpersonationResult>>(`${this.base}/users/${id}/impersonate`, {})
      .pipe(map(r => r.data));
  }

  updateUser(id: string, body: AdminUserUpsert): Observable<AdminUser> {
    return this.http.put<ApiWrapper<AdminUser>>(`${this.base}/users/${id}`, body).pipe(map(r => r.data));
  }

  reviews(page = 0, size = 20): Observable<PageWrapper<AdminReview>> {
    return this.http
      .get<ApiWrapper<PageWrapper<AdminReview>>>(`${this.base}/reviews?page=${page}&size=${size}`)
      .pipe(map(r => r.data));
  }

  deleteReview(id: string): Observable<unknown> {
    return this.http.delete<ApiWrapper<unknown>>(`${this.base}/reviews/${id}`).pipe(map(r => r.data));
  }

  aiLogs(page = 0, size = 20): Observable<PageWrapper<AdminAiLog>> {
    return this.http
      .get<ApiWrapper<PageWrapper<AdminAiLog>>>(`${this.base}/ai-logs?page=${page}&size=${size}`)
      .pipe(map(r => r.data));
  }

  broadcast(subject: string, body: string, role = ''): Observable<{ recipients: number }> {
    return this.http
      .post<ApiWrapper<{ recipients: number }>>(`${this.base}/notifications/broadcast`, { subject, body, role: role || null })
      .pipe(map(r => r.data));
  }

  payments(page = 0, size = 20, status = ''): Observable<PageWrapper<AdminPayment>> {
    let params = `page=${page}&size=${size}`;
    if (status) params += `&status=${encodeURIComponent(status)}`;
    return this.http
      .get<ApiWrapper<PageWrapper<AdminPayment>>>(`${this.base}/payments?${params}`)
      .pipe(map(r => r.data));
  }

  refundPayment(id: string): Observable<AdminPayment> {
    return this.http
      .post<ApiWrapper<AdminPayment>>(`${this.base}/payments/${id}/refund`, {})
      .pipe(map(r => r.data));
  }

  featureFlags(): Observable<FeatureFlag[]> {
    return this.http.get<ApiWrapper<FeatureFlag[]>>(`${this.base}/feature-flags`).pipe(map(r => r.data));
  }

  upsertFlag(payload: FeatureFlagUpsert): Observable<FeatureFlag> {
    return this.http
      .post<ApiWrapper<FeatureFlag>>(`${this.base}/feature-flags`, payload)
      .pipe(map(r => r.data));
  }

  toggleFlag(id: string, enabled: boolean): Observable<FeatureFlag> {
    return this.http
      .patch<ApiWrapper<FeatureFlag>>(`${this.base}/feature-flags/${id}/toggle`, { enabled })
      .pipe(map(r => r.data));
  }

  deleteFlag(id: string): Observable<unknown> {
    return this.http.delete<ApiWrapper<unknown>>(`${this.base}/feature-flags/${id}`).pipe(map(r => r.data));
  }

  subscriptions(page = 0, size = 20, status = ''): Observable<PageWrapper<AdminSubscription>> {
    let params = `page=${page}&size=${size}`;
    if (status) params += `&status=${encodeURIComponent(status)}`;
    return this.http
      .get<ApiWrapper<PageWrapper<AdminSubscription>>>(`${this.base}/subscriptions?${params}`)
      .pipe(map(r => r.data));
  }

  revenueSummary(): Observable<RevenueSummary> {
    return this.http.get<ApiWrapper<RevenueSummary>>(`${this.base}/revenue/summary`).pipe(map(r => r.data));
  }

  ragStatus(): Observable<RagStatus> {
    return this.http.get<ApiWrapper<RagStatus>>(`${this.base}/rag/status`).pipe(map(r => r.data));
  }

  ragReingest(): Observable<RagIngestResult> {
    return this.http.post<ApiWrapper<RagIngestResult>>(`${this.base}/rag/ingest`, {}).pipe(map(r => r.data));
  }

  auditLogs(page = 0, size = 20, actor = '', action = ''): Observable<PageWrapper<AdminAuditLog>> {
    let params = `page=${page}&size=${size}`;
    if (actor) params += `&actor=${encodeURIComponent(actor)}`;
    if (action) params += `&action=${encodeURIComponent(action)}`;
    return this.http
      .get<ApiWrapper<PageWrapper<AdminAuditLog>>>(`${this.base}/audit?${params}`)
      .pipe(map(r => r.data));
  }
}
