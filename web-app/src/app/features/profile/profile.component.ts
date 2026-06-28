import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

type Tab = 'activity' | 'trips' | 'photos' | 'reviews' | 'forums' | 'map';

interface Achievement {
  icon: string;
  label: string;
  sublabel: string;
  locked: boolean;
  color: string;
}

const ACHIEVEMENTS: Achievement[] = [
  { icon: 'rate_review', label: 'Write your first review', sublabel: 'Unlock review milestones', locked: true, color: '#00856A' },
  { icon: 'photo_camera', label: 'Share a photo', sublabel: 'Become a top photographer', locked: true, color: '#E04A2F' },
  { icon: 'hotel', label: 'Review a hotel', sublabel: 'Help other travelers', locked: true, color: '#F5A623' },
  { icon: 'restaurant', label: 'Review a restaurant', sublabel: 'Share your dining experience', locked: true, color: '#9B59B6' },
];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-page">

      <!-- Hidden file inputs -->
      <input #coverInput type="file" accept="image/*" style="display:none" (change)="onCoverChange($event)">
      <input #avatarInput type="file" accept="image/*" style="display:none" (change)="onAvatarChange($event)">

      <!-- Toast -->
      @if (toastMsg()) {
        <div class="toast" role="status" aria-live="polite">
          <span class="ms" style="font-size:18px">check_circle</span>
          {{ toastMsg() }}
        </div>
      }

      <!-- Cover photo -->
      <div class="cover-photo"
           [style.background-image]="coverUrl() ? 'url(' + coverUrl() + ')' : null"
           [class.has-custom-cover]="!!coverUrl()">
        <div class="cover-gradient"></div>
        <button class="cover-edit-btn" (click)="coverInput.click()" type="button" aria-label="Edit cover photo">
          <span class="ms" style="font-size:18px">photo_camera</span>
          Edit cover photo
        </button>
      </div>

      <!-- Profile header -->
      <div class="profile-header-wrap">
        <div class="profile-header container">
          <div class="profile-identity">
            <div class="avatar-wrap">
              <div class="avatar-img">
                @if (avatarUrl()) {
                  <img [src]="avatarUrl()!" alt="Your avatar" class="avatar-photo">
                } @else {
                  <span class="ms avatar-icon">person</span>
                }
              </div>
              <button class="avatar-edit" (click)="avatarInput.click()" aria-label="Edit avatar" type="button">
                <span class="ms" style="font-size:14px">photo_camera</span>
              </button>
            </div>

            <div class="profile-info">
              <h1 class="profile-name">{{ displayName() }}</h1>
              <span class="profile-handle">&#64;{{ handle() }}</span>
              <div class="profile-stats-row">
                <div class="profile-stat">
                  <span class="stat-num">{{ contributions() }}</span>
                  <span class="stat-label">Contributions</span>
                </div>
                <div class="profile-stat">
                  <span class="stat-num">{{ trips() }}</span>
                  <span class="stat-label">Trips</span>
                </div>
                <div class="profile-stat">
                  <span class="stat-num">{{ followers() }}</span>
                  <span class="stat-label">Followers</span>
                </div>
              </div>
            </div>
          </div>

          <div class="profile-actions">
            <button class="btn-edit-profile" (click)="editProfile()" type="button">Edit profile</button>
            <button class="btn-settings" (click)="openSettings()" type="button" aria-label="Settings">
              <span class="ms" style="font-size:20px">settings</span>
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs-bar">
          <div class="container tabs-inner">
            @for (tab of tabs; track tab.id) {
              <button
                class="tab-btn"
                [class.active]="activeTab() === tab.id"
                (click)="setTab(tab.id)"
                type="button">
                {{ tab.label }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Body -->
      <div class="profile-body container">

        <!-- Left col -->
        <aside class="profile-sidebar">
          <div class="sidebar-card">
            <h2 class="sidebar-title">Your Achievements</h2>
            <p class="sidebar-sub">Start sharing to unlock</p>
            <div class="achievements-list">
              @for (ach of achievements; track ach.label) {
                <div class="achievement-item">
                  <div class="ach-icon-wrap" [class.locked]="ach.locked" [style.--ach-color]="ach.color">
                    <span class="ms ach-icon">{{ ach.locked ? 'lock' : ach.icon }}</span>
                  </div>
                  <div class="ach-info">
                    <span class="ach-label">{{ ach.label }}</span>
                    <span class="ach-sub">{{ ach.sublabel }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Profile strength -->
          <div class="sidebar-card">
            <h2 class="sidebar-title">Profile Strength</h2>
            <div class="strength-bar-wrap">
              <div class="strength-bar">
                <div class="strength-fill" [style.width]="strengthPct()"></div>
              </div>
              <span class="strength-label">{{ strengthPct() }} complete</span>
            </div>
            <div class="strength-items">
              @for (item of strengthItems(); track item.label) {
                <div class="strength-item" [class.done]="item.done">
                  <span class="ms strength-item-icon">{{ item.done ? 'check_circle' : 'radio_button_unchecked' }}</span>
                  <span class="strength-item-label">{{ item.label }}</span>
                </div>
              }
            </div>
          </div>
        </aside>

        <!-- Main content -->
        <main class="profile-main">

          @if (activeTab() === 'activity') {
            <div class="fill-profile-card">
              <div class="fill-icon-wrap">
                <span class="ms fill-icon">person_add</span>
              </div>
              <h2 class="fill-title">Fill Out Your Profile</h2>
              <p class="fill-sub">Add photos and info to your profile so people can find you easily and get to know you better!</p>
              <button class="btn-fill-profile" (click)="editProfile()" type="button">
                <span class="ms" style="font-size:18px">edit</span>
                Complete your profile
              </button>
            </div>

            <div class="activity-empty">
              <span class="ms activity-empty-icon">rss_feed</span>
              <h3 class="activity-empty-title">No activity yet</h3>
              <p class="activity-empty-sub">Start exploring, reviewing, and sharing to see your activity here.</p>
              <button class="btn-start-exploring" (click)="goExplore()" type="button">
                <span class="ms" style="font-size:18px">travel_explore</span>
                Start exploring
              </button>
            </div>
          }

          @if (activeTab() === 'trips') {
            <div class="tab-empty">
              <span class="ms tab-empty-icon">luggage</span>
              <h3>No trips saved yet</h3>
              <p>Plan your first trip with Travel AI and it will appear here.</p>
              <button class="btn-start-exploring" (click)="goPlanner()" type="button">
                <span class="ms" style="font-size:18px">auto_awesome</span>
                Plan a trip
              </button>
            </div>
          }

          @if (activeTab() === 'photos') {
            <div class="tab-empty">
              <span class="ms tab-empty-icon">photo_library</span>
              <h3>No photos yet</h3>
              <p>Share your travel photos to inspire others.</p>
            </div>
          }

          @if (activeTab() === 'reviews') {
            <div class="tab-empty">
              <span class="ms tab-empty-icon">star_border</span>
              <h3>No reviews yet</h3>
              <p>Review places you've visited to help other travelers.</p>
              <button class="btn-start-exploring" (click)="goExplore()" type="button">
                <span class="ms" style="font-size:18px">travel_explore</span>
                Find places to review
              </button>
            </div>
          }

          @if (activeTab() === 'forums') {
            <div class="tab-empty">
              <span class="ms tab-empty-icon">forum</span>
              <h3>No forum posts yet</h3>
              <p>Join travel discussions and share your knowledge.</p>
            </div>
          }

          @if (activeTab() === 'map') {
            <div class="travel-map-card">
              <div class="map-placeholder">
                <span class="ms map-icon">map</span>
                <h3>Your Travel Map</h3>
                <p>Places you've visited will appear here once you add reviews or trips.</p>
              </div>
            </div>
          }
        </main>

        <!-- Right col -->
        <aside class="profile-right">
          <div class="sidebar-card">
            <h2 class="sidebar-title">Recent Activity</h2>
            <div class="right-empty">
              <span class="ms" style="font-size:28px; color:#c8c8c8">timeline</span>
              <p style="margin:6px 0 0; font-size:13px; color:#8a8a8a; text-align:center">No recent activity</p>
            </div>
          </div>

          <div class="sidebar-card">
            <h2 class="sidebar-title">Helpful Votes</h2>
            <div class="votes-display">
              <span class="votes-num">0</span>
              <span class="votes-label">votes received</span>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    @if (showEditModal()) {
      <div class="modal-overlay" (click)="showEditModal.set(false)" role="dialog" aria-modal="true" aria-label="Edit profile">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">Edit profile</h2>
            <button class="modal-close" (click)="showEditModal.set(false)" aria-label="Close">
              <span class="ms">close</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-field">
                <label class="form-label" for="edit-first-name">First name</label>
                <input id="edit-first-name" class="form-input" type="text" [(ngModel)]="editFirstName" placeholder="First name">
              </div>
              <div class="form-field">
                <label class="form-label" for="edit-last-name">Last name</label>
                <input id="edit-last-name" class="form-input" type="text" [(ngModel)]="editLastName" placeholder="Last name">
              </div>
            </div>
            <div class="form-field">
              <label class="form-label" for="edit-bio">Bio</label>
              <textarea id="edit-bio" class="form-input form-textarea" [(ngModel)]="editBio" placeholder="Tell us about yourself" rows="3"></textarea>
            </div>
            <div class="form-field">
              <label class="form-label" for="edit-city">Home city</label>
              <input id="edit-city" class="form-input" type="text" [(ngModel)]="editCity" placeholder="Where are you based?">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" type="button" (click)="showEditModal.set(false)">Cancel</button>
            <button class="btn-save" type="button" (click)="saveProfile()">Save changes</button>
          </div>
        </div>
      </div>
    }

    <!-- Settings Modal -->
    @if (showSettingsModal()) {
      <div class="modal-overlay" (click)="showSettingsModal.set(false)" role="dialog" aria-modal="true" aria-label="Settings">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">Settings</h2>
            <button class="modal-close" (click)="showSettingsModal.set(false)" aria-label="Close">
              <span class="ms">close</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="settings-section">
              <h3 class="settings-section-title">Notifications</h3>
              <div class="settings-row">
                <div class="settings-row-info">
                  <span class="settings-row-label">Email notifications</span>
                  <span class="settings-row-sub">Receive trip updates and deals</span>
                </div>
                <button class="toggle-btn" type="button" [class.active]="notifEmail()"
                        (click)="notifEmail.set(!notifEmail())" [attr.aria-checked]="notifEmail()" role="switch">
                  <span class="toggle-knob"></span>
                </button>
              </div>
              <div class="settings-row">
                <div class="settings-row-info">
                  <span class="settings-row-label">Push notifications</span>
                  <span class="settings-row-sub">Reminders and real-time alerts</span>
                </div>
                <button class="toggle-btn" type="button" [class.active]="notifPush()"
                        (click)="notifPush.set(!notifPush())" [attr.aria-checked]="notifPush()" role="switch">
                  <span class="toggle-knob"></span>
                </button>
              </div>
            </div>
            <div class="settings-section">
              <h3 class="settings-section-title">Account</h3>
              <div class="settings-account-email">
                <span class="ms" style="font-size:18px;color:var(--text-tertiary)">mail</span>
                <span class="settings-email-text">{{ authService.currentUser()?.email }}</span>
              </div>
              <button class="settings-action-btn" type="button" (click)="signOut()">
                <span class="ms">logout</span>
                Sign out
              </button>
              <button class="settings-action-btn danger" type="button" (click)="deleteAccount()">
                <span class="ms">delete_forever</span>
                Delete account
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  activeTab = signal<Tab>('activity');

  readonly tabs = [
    { id: 'activity' as Tab, label: 'Activity feed' },
    { id: 'trips' as Tab,    label: 'Trips' },
    { id: 'photos' as Tab,   label: 'Photos' },
    { id: 'reviews' as Tab,  label: 'Reviews' },
    { id: 'forums' as Tab,   label: 'Forums' },
    { id: 'map' as Tab,      label: 'Travel map' },
  ];

  readonly achievements = ACHIEVEMENTS;

  // Photo uploads
  coverUrl = signal<string | null>(null);
  avatarUrl = signal<string | null>(null);

  // Modals
  showEditModal = signal(false);
  showSettingsModal = signal(false);

  // Edit profile form values
  editFirstName = '';
  editLastName = '';
  editBio = '';
  editCity = '';

  // Settings
  notifEmail = signal(true);
  notifPush = signal(true);

  // Toast
  toastMsg = signal<string | null>(null);

  displayName = computed(() => {
    const u = this.authService.currentUser();
    if (!u) return 'Traveler';
    return `${u.firstName} ${u.lastName}`.trim() || u.email.split('@')[0];
  });

  handle = computed(() => {
    const u = this.authService.currentUser();
    if (!u) return 'traveler2024';
    return (u.firstName + u.lastName).toLowerCase().replace(/\s+/g, '') + '2024';
  });

  contributions = signal(0);
  trips = signal(0);
  followers = signal(0);

  strengthItems = computed(() => {
    const u = this.authService.currentUser();
    return [
      { label: 'Add your name', done: !!(u?.firstName && u?.lastName) },
      { label: 'Verify email', done: u?.emailVerified ?? false },
      { label: 'Add a profile photo', done: !!this.avatarUrl() },
      { label: 'Write your first review', done: false },
      { label: 'Add your home city', done: !!this.editCity },
    ];
  });

  strengthPct = computed(() => {
    const done = this.strengthItems().filter(i => i.done).length;
    return `${Math.round((done / 5) * 100)}%`;
  });

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  setTab(tab: Tab): void { this.activeTab.set(tab); }

  onCoverChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.coverUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.avatarUrl.set(reader.result as string);
      this.toast('Avatar updated');
    };
    reader.readAsDataURL(file);
  }

  editProfile(): void {
    const u = this.authService.currentUser();
    this.editFirstName = u?.firstName ?? '';
    this.editLastName = u?.lastName ?? '';
    this.showEditModal.set(true);
  }

  saveProfile(): void {
    const u = this.authService.currentUser();
    if (u) {
      this.authService.currentUser.set({
        ...u,
        firstName: this.editFirstName.trim() || u.firstName,
        lastName: this.editLastName.trim() || u.lastName,
      });
    }
    this.showEditModal.set(false);
    this.toast('Profile updated');
  }

  openSettings(): void {
    this.showSettingsModal.set(true);
  }

  signOut(): void {
    this.showSettingsModal.set(false);
    this.authService.logout().subscribe({ complete: () => this.router.navigate(['/']) });
  }

  deleteAccount(): void {
    if (!confirm('Delete your account? This cannot be undone.')) return;
    this.authService.logout().subscribe({ complete: () => this.router.navigate(['/']) });
  }

  goExplore(): void { this.router.navigate(['/']); }
  goPlanner(): void { this.router.navigate(['/planner']); }

  private toast(msg: string): void {
    this.toastMsg.set(msg);
    setTimeout(() => this.toastMsg.set(null), 3000);
  }
}
