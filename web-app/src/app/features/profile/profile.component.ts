import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import type { ProfileOverview, GalleryPhoto, TravelPlace } from '../../core/services/profile.service';
import { MediaService } from '../../core/services/media.service';
import { DEFAULT_AVATAR, DEFAULT_COVER } from './profile.data';
import type { ReviewResponse } from '../../core/models/api.models';
import { catchError, of } from 'rxjs';

type Tab = 'activity' | 'trips' | 'photos' | 'reviews' | 'forums' | 'map';

const REVIEW_TYPE_LABELS: Record<string, string> = {
  HOTEL: 'Hotel',
  RESTAURANT: 'Restaurant',
  FLIGHT: 'Flight',
  CRUISE: 'Cruise',
  DESTINATION: 'Destination',
};

const REVIEW_FALLBACK_COVERS: Record<string, string> = {
  HOTEL: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
  RESTAURANT: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
  FLIGHT: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80',
  CRUISE: 'https://images.unsplash.com/photo-1599640842225-85d111c60e6b?w=400&q=80',
  DESTINATION: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80',
};

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
      <div class="cover-photo has-custom-cover"
           [style.background-image]="'url(' + (coverUrl() || defaultCover) + ')'">
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
                <img [src]="avatarUrl() || defaultAvatar" alt="Your avatar" class="avatar-photo">
              </div>
              <button class="avatar-edit" (click)="avatarInput.click()" aria-label="Edit avatar" type="button">
                <span class="ms" style="font-size:14px">photo_camera</span>
              </button>
            </div>

            <div class="profile-info">
              <h1 class="profile-name">
                {{ displayName() }}
                <span class="verified-badge" title="Verified traveler">
                  <span class="ms" style="font-size:18px">verified</span>
                </span>
              </h1>
              <span class="profile-handle">&#64;{{ handle() }}</span>
              <div class="profile-meta">
                @if (homePlace()) {
                  <span class="meta-chip"><span class="ms" style="font-size:15px">location_on</span> {{ homePlace() }}</span>
                }
                <span class="meta-chip"><span class="ms" style="font-size:15px">flight_takeoff</span> {{ placesCount() }} {{ placesCount() === 1 ? 'place' : 'places' }}</span>
                <span class="meta-chip"><span class="ms" style="font-size:15px">calendar_today</span> Since {{ memberSince() }}</span>
              </div>
              <div class="profile-stats-row">
                <div class="profile-stat">
                  <span class="stat-num">{{ contributions() }}</span>
                  <span class="stat-label">Reviews</span>
                </div>
                <div class="profile-stat">
                  <span class="stat-num">{{ trips() }}</span>
                  <span class="stat-label">Trips</span>
                </div>
                <div class="profile-stat">
                  <span class="stat-num">{{ photoCount() }}</span>
                  <span class="stat-label">Photos</span>
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
            <p class="sidebar-sub">{{ unlockedCount() }} of {{ achievements().length }} unlocked &middot; keep going!</p>
            <div class="achievements-list">
              @for (ach of achievements(); track ach.label) {
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
            <!-- Highlight banner -->
            <div class="highlight-banner">
              <div class="highlight-text">
                <span class="highlight-eyebrow">Your journey so far</span>
                <h2 class="highlight-title">{{ contributions() }} {{ contributions() === 1 ? 'review' : 'reviews' }} across <b>{{ placesCount() }}</b> {{ placesCount() === 1 ? 'place' : 'places' }}</h2>
                <p class="highlight-sub">Every review helps another traveler. Where to next?</p>
                <button class="btn-start-exploring" (click)="goPlanner()" type="button">
                  <span class="ms" style="font-size:18px">auto_awesome</span>
                  Plan your next trip
                </button>
              </div>
              <div class="highlight-stats">
                <div class="hl-stat"><span class="hl-num">{{ contributions() }}</span><span class="hl-lbl">Reviews</span></div>
                <div class="hl-stat"><span class="hl-num">{{ photoCount() }}</span><span class="hl-lbl">Photos</span></div>
                <div class="hl-stat"><span class="hl-num">{{ helpfulVotes() }}</span><span class="hl-lbl">Helpful votes</span></div>
              </div>
            </div>

            <h3 class="feed-heading">Recent activity</h3>
            <div class="activity-feed">
              @for (a of activity(); track $index) {
                <div class="feed-item">
                  <span class="feed-icon" [style.background]="a.color + '1a'" [style.color]="a.color">
                    <span class="ms" style="font-size:18px">{{ a.icon }}</span>
                  </span>
                  <div class="feed-body">
                    <p class="feed-text" [innerHTML]="a.text"></p>
                    <span class="feed-time">{{ a.time }}</span>
                  </div>
                </div>
              } @empty {
                <div class="tab-empty">
                  <span class="ms tab-empty-icon">rss_feed</span>
                  <h3>No activity yet</h3>
                  <p>Review places you've visited and your activity will appear here.</p>
                  <button class="btn-start-exploring" (click)="goExplore()" type="button">
                    <span class="ms" style="font-size:18px">travel_explore</span>
                    Start exploring
                  </button>
                </div>
              }
            </div>
          }

          @if (activeTab() === 'trips') {
            <div class="content-head">
              <h3 class="feed-heading" style="margin:0">Your trips</h3>
              <button class="btn-add-inline" (click)="goPlanner()" type="button">
                <span class="ms" style="font-size:18px">add</span> New trip
              </button>
            </div>
            <div class="trips-grid">
              @for (t of trips_list(); track $index) {
                <article class="trip-card">
                  <div class="trip-img-wrap trip-img-wrap--placeholder">
                    <span class="ms trip-placeholder-icon">luggage</span>
                    <span class="trip-status" [class]="'trip-status--' + t.status">{{ t.status }}</span>
                  </div>
                  <div class="trip-body">
                    <h4 class="trip-title">{{ t.title }}</h4>
                    <p class="trip-loc"><span class="ms" style="font-size:14px">location_on</span> {{ t.location }}</p>
                    <div class="trip-meta">
                      <span>{{ t.dates || 'Dates TBD' }}</span>
                    </div>
                  </div>
                </article>
              } @empty {
                <div class="tab-empty" style="grid-column:1/-1">
                  <span class="ms tab-empty-icon">luggage</span>
                  <h3>No trips yet</h3>
                  <p>Plan your first trip with Travel AI and it will appear here.</p>
                  <button class="btn-start-exploring" (click)="goPlanner()" type="button">
                    <span class="ms" style="font-size:18px">auto_awesome</span>
                    Plan a trip
                  </button>
                </div>
              }
            </div>
          }

          @if (activeTab() === 'photos') {
            <input #galleryInput type="file" accept="image/*" style="display:none" (change)="onGalleryAdd($event)">
            <div class="content-head">
              <h3 class="feed-heading" style="margin:0">Photo gallery</h3>
              <button class="add-btn" type="button" (click)="galleryInput.click()" [disabled]="uploadingPhoto()">
                <span class="ms" style="font-size:18px">{{ uploadingPhoto() ? 'hourglass_top' : 'add_photo_alternate' }}</span>
                {{ uploadingPhoto() ? 'Uploading…' : 'Add photo' }}
              </button>
            </div>
            <div class="photo-grid">
              <button class="photo-add-tile" type="button" (click)="galleryInput.click()" [disabled]="uploadingPhoto()">
                <span class="ms" style="font-size:30px">add_a_photo</span>
                <span>Upload</span>
              </button>
              @for (p of gallery(); track p.id) {
                <figure class="photo-tile">
                  <img [src]="p.url" [alt]="p.caption || 'Travel photo'" class="photo-img" loading="lazy">
                  <button class="photo-del" type="button" (click)="deleteGalleryPhoto(p)" aria-label="Delete photo">
                    <span class="ms" style="font-size:16px">delete</span>
                  </button>
                </figure>
              }
              @for (p of photos(); track p) {
                <figure class="photo-tile">
                  <img [src]="p" alt="Review photo" class="photo-img" loading="lazy">
                </figure>
              }
            </div>
            @if (gallery().length === 0 && photos().length === 0) {
              <div class="tab-empty">
                <span class="ms tab-empty-icon">photo_library</span>
                <h3>No photos yet</h3>
                <p>Upload your travel photos — they'll appear in your gallery.</p>
              </div>
            }
          }

          @if (activeTab() === 'reviews') {
            <div class="content-head">
              <h3 class="feed-heading" style="margin:0">Reviews</h3>
              <span class="content-count">{{ contributions() }} {{ contributions() === 1 ? 'review' : 'reviews' }}</span>
            </div>
            <div class="reviews-list">
              @for (r of reviews(); track r.id) {
                <article class="review-card">
                  <img [src]="reviewCover(r)" [alt]="reviewType(r)" class="review-cover" loading="lazy">
                  <div class="review-content">
                    <div class="review-top">
                      <div>
                        <h4 class="review-place">{{ r.title }}</h4>
                        <span class="review-type">{{ reviewType(r) }} review</span>
                      </div>
                      <span class="review-date">{{ r.createdAt | date:'MMM y' }}</span>
                    </div>
                    <div class="review-stars" [attr.aria-label]="r.rating + ' out of 5'">
                      @for (s of [1,2,3,4,5]; track s) {
                        <span class="ms review-star" [class.filled]="s <= r.rating">star</span>
                      }
                    </div>
                    <p class="review-body">{{ r.content }}</p>
                    @if (reviewExtraPhotos(r).length) {
                      <div class="review-photos">
                        @for (ph of reviewExtraPhotos(r); track ph) {
                          <img [src]="ph" alt="" class="review-photo" loading="lazy">
                        }
                      </div>
                    }
                    <div class="review-foot">
                      <button class="review-helpful" type="button">
                        <span class="ms" style="font-size:16px">thumb_up</span>
                        Helpful ({{ r.helpfulCount }})
                      </button>
                      @if (r.verified) {
                        <span class="review-verified"><span class="ms" style="font-size:15px">verified</span> Verified</span>
                      }
                    </div>
                  </div>
                </article>
              } @empty {
                <div class="tab-empty">
                  <span class="ms tab-empty-icon">rate_review</span>
                  <h3>No reviews yet</h3>
                  <p>Review places you've visited to help other travelers.</p>
                  <button class="btn-start-exploring" (click)="goExplore()" type="button">
                    <span class="ms" style="font-size:18px">travel_explore</span>
                    Find places to review
                  </button>
                </div>
              }
            </div>
          }

          @if (activeTab() === 'map') {
            <div class="map-hero">
              <div class="map-hero-overlay"></div>
              <div class="map-hero-content">
                <span class="map-hero-eyebrow">Travel passport</span>
                <h3 class="map-hero-title">{{ totalPlaces() }} {{ totalPlaces() === 1 ? 'place' : 'places' }} explored</h3>
                <p class="map-hero-sub">Pin the places you've been and build your travel map.</p>
              </div>
            </div>

            <div class="content-head">
              <h3 class="feed-heading" style="margin:0">Places visited</h3>
              <button class="add-btn" type="button" (click)="toggleAddPlace()">
                <span class="ms" style="font-size:18px">{{ showAddPlace() ? 'close' : 'add_location_alt' }}</span>
                {{ showAddPlace() ? 'Cancel' : 'Add place' }}
              </button>
            </div>

            @if (showAddPlace()) {
              <div class="add-place-form">
                <input class="ap-input" [(ngModel)]="newPlaceName" placeholder="Place (e.g. Lisbon)" maxlength="160">
                <input class="ap-input" [(ngModel)]="newPlaceCountry" placeholder="Country" maxlength="120">
                <input class="ap-input ap-note" [(ngModel)]="newPlaceNote" placeholder="A note (optional)" maxlength="500">
                <button class="ap-save" type="button" [disabled]="!newPlaceName.trim()" (click)="addPlace()">Add</button>
              </div>
            }

            <div class="stamps-grid">
              @for (place of placesList(); track place.id) {
                <div class="stamp stamp--owned">
                  <span class="ms stamp-pin">location_on</span>
                  <span class="stamp-country">{{ place.name }}</span>
                  @if (place.country) { <span class="stamp-sub">{{ place.country }}</span> }
                  <button class="stamp-del" type="button" (click)="deletePlace(place)" aria-label="Remove place">
                    <span class="ms" style="font-size:14px">close</span>
                  </button>
                </div>
              }
              @for (place of places(); track place) {
                <div class="stamp">
                  <span class="ms stamp-pin">location_on</span>
                  <span class="stamp-country">{{ place }}</span>
                </div>
              }
              @if (placesList().length === 0 && places().length === 0) {
                <div class="tab-empty" style="grid-column:1/-1">
                  <span class="ms tab-empty-icon">map</span>
                  <h3>No places yet</h3>
                  <p>Add the places you've been to start your travel map.</p>
                </div>
              }
            </div>
          }
        </main>

        <!-- Right col -->
        <aside class="profile-right">
          <div class="sidebar-card">
            <h2 class="sidebar-title">Helpful Votes</h2>
            <div class="votes-display">
              <span class="votes-num">{{ helpfulVotes() }}</span>
              <span class="votes-label">votes received</span>
            </div>
            <p class="votes-hint">Votes other travelers gave your reviews.</p>
          </div>

          <div class="sidebar-card">
            <h2 class="sidebar-title">Snapshot</h2>
            <div class="snapshot-list">
              <div class="snapshot-row"><span class="ms" style="color:var(--teal)">rate_review</span> {{ contributions() }} reviews</div>
              <div class="snapshot-row"><span class="ms" style="color:var(--brand)">photo_camera</span> {{ photoCount() }} photos</div>
              <div class="snapshot-row"><span class="ms" style="color:var(--gold)">place</span> {{ placesCount() }} places</div>
              <div class="snapshot-row"><span class="ms" style="color:var(--text-tertiary)">luggage</span> {{ trips() }} trips</div>
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
  private readonly profileService = inject(ProfileService);
  private readonly mediaService = inject(MediaService);
  private readonly router = inject(Router);

  activeTab = signal<Tab>('activity');

  readonly tabs = [
    { id: 'activity' as Tab, label: 'Activity feed' },
    { id: 'trips' as Tab,    label: 'Trips' },
    { id: 'photos' as Tab,   label: 'Photos' },
    { id: 'reviews' as Tab,  label: 'Reviews' },
    { id: 'map' as Tab,      label: 'Travel map' },
  ];

  readonly defaultCover = DEFAULT_COVER;
  readonly defaultAvatar = DEFAULT_AVATAR;

  /** Full profile snapshot fetched from the backend (/users/me/overview). */
  readonly overview = signal<ProfileOverview | null>(null);

  readonly achievements = computed(() => this.overview()?.achievements ?? []);
  readonly trips_list = computed(() => this.overview()?.trips ?? []);
  readonly photos = computed(() => this.overview()?.photos ?? []);
  readonly reviews = computed(() => this.overview()?.reviews ?? []);
  readonly activity = computed(() => this.overview()?.activity ?? []);
  readonly places = computed(() => this.overview()?.places ?? []);

  readonly contributions = computed(() => this.overview()?.stats.reviewCount ?? 0);
  readonly trips = computed(() => this.overview()?.stats.tripCount ?? 0);
  readonly photoCount = computed(() => this.overview()?.stats.photoCount ?? 0);
  readonly placesCount = computed(() => this.overview()?.stats.placesCount ?? 0);
  readonly helpfulVotes = computed(() => this.overview()?.stats.helpfulVotes ?? 0);
  readonly memberSince = computed(() => this.overview()?.memberSinceYear ?? new Date().getFullYear());
  readonly homePlace = computed(() => this.places()[0] ?? null);
  readonly unlockedCount = computed(() => this.achievements().filter(a => !a.locked).length);

  // Photo uploads
  coverUrl = signal<string | null>(null);
  avatarUrl = signal<string | null>(null);
  uploadingAvatar = signal(false);
  uploadingCover = signal(false);

  // Real user-authored content (persisted)
  readonly gallery = signal<GalleryPhoto[]>([]);
  readonly placesList = signal<TravelPlace[]>([]);
  uploadingPhoto = signal(false);

  // Add-place form
  showAddPlace = signal(false);
  newPlaceName = '';
  newPlaceCountry = '';
  newPlaceNote = '';

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
    const o = this.overview();
    if (o?.displayName) return o.displayName;
    const u = this.authService.currentUser();
    if (!u) return 'Traveler';
    return `${u.firstName} ${u.lastName}`.trim() || u.email.split('@')[0];
  });

  handle = computed(() => {
    const o = this.overview();
    if (o?.handle) return o.handle;
    const u = this.authService.currentUser();
    if (!u) return 'traveler';
    return (u.firstName + u.lastName).toLowerCase().replace(/\s+/g, '');
  });

  strengthItems = computed(() => {
    const u = this.authService.currentUser();
    const o = this.overview();
    return [
      { label: 'Add your name', done: u ? !!(u.firstName && u.lastName) : false },
      { label: 'Verify email', done: u?.emailVerified ?? false },
      { label: 'Add a profile photo', done: !!this.avatarUrl() },
      { label: 'Write a review', done: (o?.stats.reviewCount ?? 0) > 0 },
      { label: 'Share a photo', done: (o?.stats.photoCount ?? 0) > 0 },
    ];
  });

  strengthPct = computed(() => {
    const done = this.strengthItems().filter(i => i.done).length;
    return `${Math.round((done / 5) * 100)}%`;
  });

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }
    // Seed avatar/cover from the persisted profile.
    const u = this.authService.currentUser();
    if (u?.avatarUrl) this.avatarUrl.set(u.avatarUrl);
    if (u?.coverUrl) this.coverUrl.set(u.coverUrl);

    this.profileService.getOverview().pipe(catchError(() => of(null)))
      .subscribe(overview => this.overview.set(overview));
    this.profileService.listPhotos().pipe(catchError(() => of([] as GalleryPhoto[])))
      .subscribe(photos => this.gallery.set(photos));
    this.profileService.listPlaces().pipe(catchError(() => of([] as TravelPlace[])))
      .subscribe(places => this.placesList.set(places));
  }

  // ─── Review card helpers (map ReviewResponse → card fields) ──────────
  reviewPhotos(r: ReviewResponse): string[] {
    if (!r.photoUrls) return [];
    return r.photoUrls.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  reviewCover(r: ReviewResponse): string {
    return this.reviewPhotos(r)[0] ?? REVIEW_FALLBACK_COVERS[r.targetType] ?? REVIEW_FALLBACK_COVERS['DESTINATION'];
  }

  reviewExtraPhotos(r: ReviewResponse): string[] {
    return this.reviewPhotos(r).slice(1);
  }

  reviewType(r: ReviewResponse): string {
    return REVIEW_TYPE_LABELS[r.targetType] ?? r.targetType;
  }

  setTab(tab: Tab): void { this.activeTab.set(tab); }

  onCoverChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingCover.set(true);
    this.mediaService.upload(file, 'covers').pipe(catchError(() => of(null))).subscribe(res => {
      this.uploadingCover.set(false);
      if (!res) { this.toast('Upload failed — try again'); return; }
      this.coverUrl.set(res.url);
      this.persistMedia({ coverUrl: res.url }, 'Cover photo updated');
    });
  }

  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingAvatar.set(true);
    this.mediaService.upload(file, 'avatars').pipe(catchError(() => of(null))).subscribe(res => {
      this.uploadingAvatar.set(false);
      if (!res) { this.toast('Upload failed — try again'); return; }
      this.avatarUrl.set(res.url);
      this.persistMedia({ avatarUrl: res.url }, 'Avatar updated');
    });
  }

  /** Persists a presentation field and syncs the cached user signal. */
  private persistMedia(update: { avatarUrl?: string; coverUrl?: string; bio?: string; location?: string }, msg: string): void {
    this.profileService.updateMedia(update).pipe(catchError(() => of(null))).subscribe(() => {
      const u = this.authService.currentUser();
      if (u) this.authService.currentUser.set({ ...u, ...update });
      this.toast(msg);
    });
  }

  // ─── Photo gallery (persisted) ───────────────────────────────────────
  onGalleryAdd(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    (event.target as HTMLInputElement).value = '';
    this.uploadingPhoto.set(true);
    this.mediaService.upload(file, 'gallery').pipe(catchError(() => of(null))).subscribe(res => {
      if (!res) { this.uploadingPhoto.set(false); this.toast('Upload failed — try again'); return; }
      this.profileService.addPhoto({ url: res.url }).pipe(catchError(() => of(null))).subscribe(photo => {
        this.uploadingPhoto.set(false);
        if (photo) { this.gallery.update(list => [photo, ...list]); this.toast('Photo added'); }
      });
    });
  }

  deleteGalleryPhoto(photo: GalleryPhoto): void {
    this.profileService.deletePhoto(photo.id).pipe(catchError(() => of(null))).subscribe(() => {
      this.gallery.update(list => list.filter(p => p.id !== photo.id));
      this.toast('Photo removed');
    });
  }

  // ─── Travel-map places (persisted) ───────────────────────────────────
  toggleAddPlace(): void { this.showAddPlace.update(v => !v); }

  addPlace(): void {
    const name = this.newPlaceName.trim();
    if (!name) return;
    this.profileService.addPlace({
      name,
      country: this.newPlaceCountry.trim() || null,
      note: this.newPlaceNote.trim() || null,
      visitedOn: new Date().toISOString().slice(0, 10),
    }).pipe(catchError(() => of(null))).subscribe(place => {
      if (place) {
        this.placesList.update(list => [place, ...list]);
        this.newPlaceName = ''; this.newPlaceCountry = ''; this.newPlaceNote = '';
        this.showAddPlace.set(false);
        this.toast('Place added to your map');
      } else {
        this.toast('Could not add place');
      }
    });
  }

  deletePlace(place: TravelPlace): void {
    this.profileService.deletePlace(place.id).pipe(catchError(() => of(null))).subscribe(() => {
      this.placesList.update(list => list.filter(p => p.id !== place.id));
      this.toast('Place removed');
    });
  }

  readonly totalPlaces = computed(() => this.placesList().length || this.placesCount());
  readonly totalPhotos = computed(() => this.gallery().length + this.photoCount());

  editProfile(): void {
    const u = this.authService.currentUser();
    this.editFirstName = u?.firstName ?? '';
    this.editLastName = u?.lastName ?? '';
    this.editBio = u?.bio ?? '';
    this.editCity = u?.location ?? '';
    this.showEditModal.set(true);
  }

  saveProfile(): void {
    const firstName = this.editFirstName.trim();
    const lastName = this.editLastName.trim();
    const bio = this.editBio.trim();
    const location = this.editCity.trim();

    this.authService.updateProfile({ firstName, lastName }).pipe(catchError(() => of(null))).subscribe(() => {
      this.profileService.updateMedia({ bio, location }).pipe(catchError(() => of(null))).subscribe(() => {
        const u = this.authService.currentUser();
        if (u) this.authService.currentUser.set({ ...u, bio, location });
        this.toast('Profile updated');
      });
    });
    this.showEditModal.set(false);
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
