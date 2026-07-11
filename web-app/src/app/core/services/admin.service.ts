import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, PageWrapper } from '../models/api.models';

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

/** Admin platform-management API (all endpoints require the ADMIN role). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  dashboard(): Observable<AdminDashboard> {
    return this.http.get<ApiWrapper<AdminDashboard>>(`${this.base}/dashboard`).pipe(map(r => r.data));
  }

  users(page = 0, size = 20): Observable<PageWrapper<AdminUser>> {
    return this.http
      .get<ApiWrapper<PageWrapper<AdminUser>>>(`${this.base}/users?page=${page}&size=${size}`)
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

  createUser(body: AdminUserUpsert): Observable<AdminUser> {
    return this.http.post<ApiWrapper<AdminUser>>(`${this.base}/users`, body).pipe(map(r => r.data));
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
}
