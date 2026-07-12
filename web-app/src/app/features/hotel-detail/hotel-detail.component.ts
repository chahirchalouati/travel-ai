import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { ReviewService } from '../../core/services/review.service';
import { AuthService } from '../../core/services/auth.service';
import { FavoritesService } from '../../core/services/favorites.service';
import type {
  HotelSearchResult,
  ReviewResponse,
  ReviewSummary,
  CreateReviewRequest,
} from '../../core/models/api.models';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { UiInputComponent } from '../../shared/ui/ui-input.component';
import { UiTextareaComponent } from '../../shared/ui/ui-textarea.component';
import { UiSkeletonComponent } from '../../shared/ui/ui-skeleton.component';

const TARGET_TYPE = 'HOTEL';

@Component({
  selector: 'app-hotel-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule, TranslocoModule, RevealDirective, UiInputComponent, UiTextareaComponent, UiSkeletonComponent],
  template: `
    @if (loading()) {
      <div style="max-width:1100px; margin:0 auto; padding:24px 32px 80px;">
        <app-ui-skeleton width="100%" height="440px" radius="var(--radius-xl)" />
        <div style="margin-top:20px; display:flex; flex-direction:column; gap:12px; max-width:520px;">
          <app-ui-skeleton width="60%" height="34px" radius="3px" />
          <app-ui-skeleton width="40%" height="16px" />
          <app-ui-skeleton width="80%" height="14px" />
          <div style="display:flex; gap:10px; margin-top:6px;">
            <app-ui-skeleton width="90px" height="26px" radius="2px" />
            <app-ui-skeleton width="90px" height="26px" radius="2px" />
            <app-ui-skeleton width="90px" height="26px" radius="2px" />
          </div>
        </div>
        <div class="detail-grid" style="margin-top:24px;">
          <div style="display:flex; flex-direction:column; gap:20px;">
            <section class="info-card" style="display:flex; flex-direction:column; gap:12px;">
              <app-ui-skeleton width="35%" height="20px" radius="3px" />
              <app-ui-skeleton width="100%" height="14px" />
              <app-ui-skeleton width="95%" height="14px" />
              <app-ui-skeleton width="70%" height="14px" />
            </section>
            <section class="info-card" style="display:flex; flex-direction:column; gap:12px;">
              <app-ui-skeleton width="35%" height="20px" radius="3px" />
              <app-ui-skeleton width="100%" height="14px" />
              <app-ui-skeleton width="88%" height="14px" />
            </section>
          </div>
          <aside>
            <div class="booking-card" style="display:flex; flex-direction:column; gap:16px;">
              <app-ui-skeleton width="50%" height="30px" radius="3px" />
              <app-ui-skeleton width="100%" height="14px" />
              <app-ui-skeleton width="100%" height="14px" />
              <app-ui-skeleton width="100%" height="44px" radius="2px" />
              <app-ui-skeleton width="100%" height="44px" radius="2px" />
            </div>
          </aside>
        </div>
      </div>
    } @else {
      @if (hotel(); as h) {
      <nav style="padding: 16px 32px; max-width: 1100px; margin: 0 auto; display:flex; align-items:center; justify-content:space-between;">
        <button (click)="goBack()" class="back-link">
          <span class="ms" style="font-size:18px">arrow_back</span>
          {{ 'hotel.back' | transloco }}
        </button>
        <button class="fav-toggle" [class.fav-toggle--on]="isFav()" (click)="toggleFav(h)"
                [attr.aria-label]="'favorites.save' | transloco">
          <span class="ms">{{ isFav() ? 'favorite' : 'favorite_border' }}</span>
          {{ (isFav() ? 'favorites.saved' : 'favorites.save') | transloco }}
        </button>
      </nav>

      <div style="max-width: 1100px; margin: 0 auto; padding: 0 32px 80px;">
        <div class="hero-card">
          @if (h.imageUrl) {
            <img [src]="h.imageUrl" [alt]="h.name" class="hero-card__img" width="1200" height="440" loading="eager" fetchpriority="high" />
          } @else {
            <div class="hero-card__img-placeholder"><span class="ms" style="font-size:72px; color:rgba(255,255,255,.6)">hotel</span></div>
          }
          <div class="hero-card__scrim"></div>

          <div class="hero-card__content">
            <div class="hero-card__badges">
              @if (h.stars) { <span class="badge badge--stars">{{ stars(h.stars) }}</span> }
              @if (summary(); as s) {
                @if (s.totalReviews > 0) {
                  <span class="badge badge--rating">
                    <span class="ms" style="font-size:15px; vertical-align:middle">star</span>
                    {{ s.averageRating | number:'1.1-1' }} · {{ s.totalReviews }} {{ 'hotel.reviewsLabel' | transloco }}
                  </span>
                }
              }
              <span class="badge badge--price">{{ h.pricePerNight | currency:'EUR':'symbol':'1.0-0' }} / {{ 'catalog.perNight' | transloco }}</span>
            </div>
            <h1 class="hero-card__name display">{{ h.name }}</h1>
            <p class="hero-card__city">
              <span class="ms" style="font-size:18px; vertical-align:middle">location_on</span>
              {{ h.city }}
            </p>
            <div class="hero-card__features">
              @if (h.seaProximity) { <span class="feature-chip"><span class="ms" style="font-size:16px">waves</span> {{ 'catalog.amenities.sea' | transloco }}</span> }
              @if (h.familyFriendly) { <span class="feature-chip"><span class="ms" style="font-size:16px">family_restroom</span> {{ 'catalog.amenities.family' | transloco }}</span> }
              @if (h.petFriendly) { <span class="feature-chip"><span class="ms" style="font-size:16px">pets</span> {{ 'catalog.amenities.pet' | transloco }}</span> }
              @if (h.accessible) { <span class="feature-chip"><span class="ms" style="font-size:16px">accessible</span> {{ 'catalog.amenities.accessible' | transloco }}</span> }
            </div>
          </div>
        </div>

        <div class="detail-grid">
          <div style="display:flex; flex-direction:column; gap:20px;">
            @if (h.description) {
              <section class="info-card" appReveal>
                <h2 class="card-heading"><span class="ms" style="font-size:22px; color:var(--teal)">info</span>{{ 'hotel.about' | transloco }}</h2>
                <p style="font-size:15px; color:var(--text-secondary); line-height:1.75; margin:0;">{{ h.description }}</p>
              </section>
            }
            <section class="info-card" appReveal>
              <h2 class="card-heading"><span class="ms" style="font-size:22px; color:var(--teal)">checklist</span>{{ 'hotel.amenities' | transloco }}</h2>
              <div class="feature-list">
                <div class="feature-item" [class.feature-item--yes]="h.seaProximity" [class.feature-item--no]="!h.seaProximity">
                  <span class="ms" style="font-size:20px">{{ h.seaProximity ? 'check_circle' : 'cancel' }}</span>{{ 'catalog.amenities.sea' | transloco }}
                </div>
                <div class="feature-item" [class.feature-item--yes]="h.familyFriendly" [class.feature-item--no]="!h.familyFriendly">
                  <span class="ms" style="font-size:20px">{{ h.familyFriendly ? 'check_circle' : 'cancel' }}</span>{{ 'catalog.amenities.family' | transloco }}
                </div>
                <div class="feature-item" [class.feature-item--yes]="h.petFriendly" [class.feature-item--no]="!h.petFriendly">
                  <span class="ms" style="font-size:20px">{{ h.petFriendly ? 'check_circle' : 'cancel' }}</span>{{ 'catalog.amenities.pet' | transloco }}
                </div>
                <div class="feature-item" [class.feature-item--yes]="h.accessible" [class.feature-item--no]="!h.accessible">
                  <span class="ms" style="font-size:20px">{{ h.accessible ? 'check_circle' : 'cancel' }}</span>{{ 'catalog.amenities.accessible' | transloco }}
                </div>
              </div>
            </section>

            <!-- AI review summary -->
            @if (summary(); as s) {
              @if (s.aiSummary) {
                <section class="info-card ai-card" appReveal>
                  <div class="ai-badge"><span class="ms">auto_awesome</span> {{ 'destDetail.aiSummary' | transloco }}</div>
                  <p style="font-size:15px; color:var(--text-secondary); line-height:1.75; margin:0;">{{ s.aiSummary }}</p>
                </section>
              }
            }

            <!-- Sub-rating breakdown -->
            @if (summary(); as s) {
              @if (s.totalReviews > 0) {
                <section class="info-card" appReveal>
                  <h2 class="card-heading"><span class="ms" style="font-size:22px; color:var(--teal)">bar_chart</span>{{ 'hotel.ratingBreakdown' | transloco }}</h2>
                  <div class="rating-grid">
                    @if (s.averageCleanliness) {
                      <div class="rating-row">
                        <span class="rating-label">{{ 'hotel.cleanliness' | transloco }}</span>
                        <div class="rating-bar"><div class="rating-bar__fill" [style.width.%]="s.averageCleanliness * 20"></div></div>
                        <span class="rating-score">{{ s.averageCleanliness | number:'1.1-1' }}</span>
                      </div>
                    }
                    @if (s.averageService) {
                      <div class="rating-row">
                        <span class="rating-label">{{ 'hotel.service' | transloco }}</span>
                        <div class="rating-bar"><div class="rating-bar__fill" [style.width.%]="s.averageService * 20"></div></div>
                        <span class="rating-score">{{ s.averageService | number:'1.1-1' }}</span>
                      </div>
                    }
                    @if (s.averageValue) {
                      <div class="rating-row">
                        <span class="rating-label">{{ 'hotel.value' | transloco }}</span>
                        <div class="rating-bar"><div class="rating-bar__fill" [style.width.%]="s.averageValue * 20"></div></div>
                        <span class="rating-score">{{ s.averageValue | number:'1.1-1' }}</span>
                      </div>
                    }
                    @if (s.averageLocation) {
                      <div class="rating-row">
                        <span class="rating-label">{{ 'hotel.location' | transloco }}</span>
                        <div class="rating-bar"><div class="rating-bar__fill" [style.width.%]="s.averageLocation * 20"></div></div>
                        <span class="rating-score">{{ s.averageLocation | number:'1.1-1' }}</span>
                      </div>
                    }
                  </div>
                </section>
              }
            }

            <!-- Reviews section -->
            <section class="info-card" appReveal>
              <div class="reviews-head">
                <h2 class="card-heading" style="margin:0">
                  <span class="ms" style="font-size:22px; color:var(--teal)">rate_review</span>
                  {{ 'destDetail.reviews' | transloco }}
                  @if (summary(); as s) {
                    @if (s.totalReviews > 0) {
                      <span class="review-count-badge">{{ s.totalReviews }}</span>
                    }
                  }
                </h2>
                <button class="btn-write-review" (click)="toggleForm()">
                  <span class="ms" style="font-size:16px">edit</span>
                  {{ isAuthenticated() ? ('hotel.writeReview' | transloco) : ('attractions.signInToReview' | transloco) }}
                </button>
              </div>

              @if (showForm()) {
                <form class="review-form" (ngSubmit)="submitReview()">
                  <div class="form-row">
                    <div class="form-group">
                      <label>{{ 'hotel.overallRating' | transloco }}</label>
                      <div class="star-pick">
                        @for (n of [1,2,3,4,5]; track n) {
                          <button type="button" class="ms star-btn" [class.is-on]="formRating >= n" (click)="formRating = n">star</button>
                        }
                      </div>
                    </div>
                  </div>

                  <div class="form-row form-row--4">
                    <div class="form-group">
                      <label>{{ 'hotel.cleanliness' | transloco }}</label>
                      <div class="star-pick star-pick--sm">
                        @for (n of [1,2,3,4,5]; track n) {
                          <button type="button" class="ms star-btn" [class.is-on]="formCleanliness >= n" (click)="formCleanliness = n">star</button>
                        }
                      </div>
                    </div>
                    <div class="form-group">
                      <label>{{ 'hotel.service' | transloco }}</label>
                      <div class="star-pick star-pick--sm">
                        @for (n of [1,2,3,4,5]; track n) {
                          <button type="button" class="ms star-btn" [class.is-on]="formService >= n" (click)="formService = n">star</button>
                        }
                      </div>
                    </div>
                    <div class="form-group">
                      <label>{{ 'hotel.value' | transloco }}</label>
                      <div class="star-pick star-pick--sm">
                        @for (n of [1,2,3,4,5]; track n) {
                          <button type="button" class="ms star-btn" [class.is-on]="formValue >= n" (click)="formValue = n">star</button>
                        }
                      </div>
                    </div>
                    <div class="form-group">
                      <label>{{ 'hotel.location' | transloco }}</label>
                      <div class="star-pick star-pick--sm">
                        @for (n of [1,2,3,4,5]; track n) {
                          <button type="button" class="ms star-btn" [class.is-on]="formLocation >= n" (click)="formLocation = n">star</button>
                        }
                      </div>
                    </div>
                  </div>

                  <app-ui-input name="title" [(ngModel)]="formTitle" [maxlength]="120"
                                [placeholder]="'attractions.reviewTitlePlaceholder' | transloco" />
                  <app-ui-textarea name="content" [rows]="4" [(ngModel)]="formContent"
                                   [placeholder]="'attractions.reviewBodyPlaceholder' | transloco"
                                   [invalid]="formError() === 'content'" />
                  @if (formError() === 'submit') {
                    <p class="form-error">{{ 'attractions.reviewError' | transloco }}</p>
                  }
                  <div class="form-actions">
                    <button type="button" class="btn-cancel" (click)="toggleForm()">{{ 'attractions.cancel' | transloco }}</button>
                    <button type="submit" class="btn-submit" [disabled]="submitting()">
                      <span class="ms" style="font-size:16px">send</span>
                      {{ submitting() ? ('attractions.submitting' | transloco) : ('attractions.submitReview' | transloco) }}
                    </button>
                  </div>
                </form>
              }

              @if (reviews().length > 0) {
                <ul class="review-list">
                  @for (r of reviews(); track r.id) {
                    <li class="review-item">
                      <div class="review-head">
                        <div class="review-avatar">
                          @if (r.userAvatarUrl) {
                            <img #img class="review-avatar__img" [src]="r.userAvatarUrl" [alt]="r.userFirstName"
                                 (error)="img.hidden = true; ini.hidden = false" />
                            <span #ini hidden>{{ r.userFirstName.charAt(0) }}</span>
                          } @else {
                            {{ r.userFirstName.charAt(0) }}
                          }
                        </div>
                        <div class="review-meta">
                          <span class="review-name">
                            {{ r.userFirstName }}
                            @if (r.verified) {
                              <span class="verified-badge"><span class="ms">verified</span>{{ 'destDetail.verifiedStay' | transloco }}</span>
                            }
                          </span>
                          <span class="review-date">{{ r.createdAt | date:'mediumDate' }}</span>
                        </div>
                        <div class="review-stars">
                          @for (st of starArray(r.rating); track $index) { <span class="ms review-star">star</span> }
                        </div>
                      </div>
                      @if (r.title) { <h4 class="review-title">{{ r.title }}</h4> }
                      <p class="review-body">{{ r.content }}</p>
                      <button class="helpful-btn" [class.is-on]="r.helpfulByMe" (click)="markHelpful(r)">
                        <span class="ms">thumb_up</span>
                        {{ 'destDetail.helpful' | transloco }}
                        @if (r.helpfulCount > 0) { ({{ r.helpfulCount }}) }
                      </button>
                    </li>
                  }
                </ul>
              } @else {
                <div class="no-reviews">
                  <span class="ms">rate_review</span>
                  <p>{{ 'destDetail.noReviews' | transloco }}</p>
                </div>
              }
            </section>
          </div>

          <aside style="position:sticky; top:80px;">
            <div class="booking-card">
              <div style="display:flex; align-items:baseline; gap:6px; margin-bottom:16px;">
                <span style="font-size:30px; font-weight:800; color: var(--color-red-ink);">{{ h.pricePerNight | currency:'EUR':'symbol':'1.0-0' }}</span>
                <span style="font-size:13px; color:var(--text-tertiary);">/ {{ 'catalog.perNight' | transloco }}</span>
              </div>
              <div class="meta-list">
                <div class="meta-item">
                  <span class="ms" style="font-size:20px; color:var(--text-tertiary)">location_on</span>
                  <div><span class="meta-label">{{ 'hotel.city' | transloco }}</span><span class="meta-value">{{ h.city }}</span></div>
                </div>
                <div class="meta-item">
                  <span class="ms" style="font-size:20px; color:var(--text-tertiary)">event_available</span>
                  <div><span class="meta-label">{{ 'hotel.availability' | transloco }}</span>
                    <span class="meta-value" [style.color]="h.available ? 'var(--teal)' : 'var(--brand)'">
                      {{ h.available ? ('hotel.availableNow' | transloco) : ('hotel.notAvailable' | transloco) }}
                    </span>
                  </div>
                </div>
                @if (summary(); as s) {
                  @if (s.totalReviews > 0) {
                    <div class="meta-item">
                      <span class="ms" style="font-size:20px; color:var(--gold)">star</span>
                      <div>
                        <span class="meta-label">{{ 'hotel.guestRating' | transloco }}</span>
                        <span class="meta-value">{{ s.averageRating | number:'1.1-1' }} / 5 · {{ s.totalReviews }} {{ 'hotel.reviewsLabel' | transloco }}</span>
                      </div>
                    </div>
                  }
                }
              </div>
              <div style="height:1px; background:var(--border-light); margin:20px 0;"></div>
              <button class="btn-book" (click)="goToPlanner()"><span class="ms" style="font-size:20px">travel_explore</span>{{ 'hotel.book' | transloco }}</button>
              <button class="btn-chat" (click)="goToChat()"><span class="ms" style="font-size:20px">chat</span>{{ 'hotel.askAi' | transloco }}</button>
            </div>
          </aside>
        </div>
      </div>
      } @else {
      <div style="max-width:1100px; margin:0 auto; padding:80px 32px; text-align:center; color:var(--text-tertiary); display:flex; flex-direction:column; align-items:center; gap:14px;">
        <span class="ms" style="font-size:44px;">hotel</span>
        <button (click)="goBack()" class="back-link">
          <span class="ms" style="font-size:18px">arrow_back</span>
          {{ 'hotel.back' | transloco }}
        </button>
      </div>
      }
    }
  `,
  styles: [`
    :host { display: block; background: var(--bg-primary); min-height: 100vh; font-family: var(--font-body); color: var(--text-primary); }
    .back-link { display: inline-flex; align-items: center; gap: 4px; background: none; border: none; color: var(--text-secondary); font-family: inherit; font-size: 14px; font-weight: 500; cursor: pointer; padding: 0; transition: color 150ms ease; }
    .back-link:hover { color: var(--color-red-ink); }
    .fav-toggle { display: inline-flex; align-items: center; gap: 6px; background: none; border: 1px solid var(--border); border-radius: 2px; padding: 7px 14px; font-family: inherit; font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all 150ms ease; }
    .fav-toggle:hover { border-color: var(--color-red-ink); color: var(--color-red-ink); }
    .fav-toggle--on { border-color: var(--color-red-ink); color: var(--color-red-ink); background: var(--brand-light); }
    .fav-toggle .ms { font-size: 18px; }

    .hero-card { position: relative; border-radius: var(--radius-xl); overflow: hidden; margin-bottom: 24px; box-shadow: var(--shadow-lg); min-height: 440px; display: block; }
    .hero-card__img, .hero-card__img-placeholder { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .hero-card__img-placeholder { background: var(--color-deep-ocean); display: flex; align-items: center; justify-content: center; }
    .hero-card__scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15,23,42,0) 32%, rgba(15,23,42,.55) 68%, rgba(15,23,42,.88) 100%); }
    .hero-card__content { position: absolute; left: 0; right: 0; bottom: 0; padding: clamp(24px, 3vw, 40px); display: flex; flex-direction: column; gap: 12px; z-index: 2; }
    .hero-card__badges { display: flex; gap: 8px; flex-wrap: wrap; }
    .badge { display: inline-flex; align-items: center; gap: 4px; border-radius: 2px; padding: 5px 13px; font-size: 12.5px; font-weight: 700; }
    .badge--stars { background: rgba(255,255,255,.16); color: #FBBF24; letter-spacing: 2px; border: 1px solid rgba(255,255,255,.22); backdrop-filter: blur(8px); }
    .badge--rating { background: rgba(255,255,255,.94); color: #B26A00; }
    .badge--rating .ms { color: var(--color-rating); }
    .badge--price { background: var(--brand); color: #fff; box-shadow: 0 6px 16px rgba(229,53,43,.4); }
    .hero-card__name { font-size: clamp(2rem, 1.4rem + 2.4vw, 3rem); font-weight: 800; margin: 0; line-height: 1.05; color: #fff; text-shadow: 0 2px 20px rgba(0,0,0,.3); }
    .hero-card__city { font-size: 15px; color: rgba(255,255,255,.9); margin: 0; font-weight: 500; display: flex; align-items: center; gap: 5px; }
    .hero-card__features { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
    .feature-chip { display: inline-flex; align-items: center; gap: 5px; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.28); border-radius: 2px; padding: 6px 13px; font-size: 12.5px; font-weight: 600; color: #fff; backdrop-filter: blur(8px); }

    .detail-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; align-items: start; }
    .info-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 26px; box-shadow: var(--shadow-sm); }
    .card-heading { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 700; margin: 0 0 20px; color: var(--text-primary); }
    .feature-list { display: flex; flex-direction: column; gap: 12px; }
    .feature-item { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 500; }
    .feature-item--yes { color: var(--text-primary); } .feature-item--yes .ms { color: var(--teal); }
    .feature-item--no { color: var(--text-tertiary); } .feature-item--no .ms { color: var(--border); }

    .ai-card { background: linear-gradient(135deg, var(--color-ocean-tint), #FDECEA); border: 1px solid rgba(229,53,43,0.18); }
    .ai-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #A81F18; background: rgba(229,53,43,0.1); padding: 5px 11px; border-radius: 2px; margin-bottom: 12px; }
    .ai-badge .ms { font-size: 15px; color: var(--color-red-ink); }

    .rating-grid { display: flex; flex-direction: column; gap: 12px; }
    .rating-row { display: flex; align-items: center; gap: 12px; }
    .rating-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); width: 100px; flex-shrink: 0; }
    .rating-bar { flex: 1; height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden; }
    .rating-bar__fill { height: 100%; background: var(--color-red); border-radius: 3px; transition: width 600ms ease; }
    .rating-score { font-size: 13px; font-weight: 700; color: var(--text-primary); width: 30px; text-align: right; }

    .reviews-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .review-count-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; border-radius: 2px; background: var(--brand); color: #fff; font-size: 11px; font-weight: 700; padding: 0 6px; margin-left: 4px; }
    .btn-write-review { display: inline-flex; align-items: center; gap: 6px; background: var(--brand); color: #fff; border: none; border-radius: 8px; padding: 9px 16px; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 150ms ease; }
    .btn-write-review:hover { background: var(--brand-hover); }

    .review-form { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 2px; padding: 20px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 14px; }
    .form-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .form-row--4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: var(--text-tertiary); }
    .star-pick { display: flex; gap: 2px; }
    .star-pick--sm .star-btn { font-size: 18px; }
    .star-btn { background: none; border: none; cursor: pointer; font-size: 24px; color: var(--border); padding: 0; transition: color 150ms ease, transform 100ms ease; }
    .star-btn.is-on { color: var(--gold); }
    .star-btn:hover { transform: scale(1.1); color: var(--gold); }
    .form-input { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; font-family: inherit; font-size: 14px; color: var(--text-primary); width: 100%; box-sizing: border-box; }
    .form-input:focus { outline: none; border-color: var(--color-red-ink); }
    .form-input.is-error { border-color: var(--color-red-ink); }
    .form-textarea { resize: vertical; min-height: 90px; }
    .form-error { font-size: 12px; color: var(--color-red-ink); margin: 0; }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .btn-cancel { background: none; border: 1px solid var(--border); border-radius: 8px; padding: 9px 16px; font-family: inherit; font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; }
    .btn-submit { display: inline-flex; align-items: center; gap: 6px; background: var(--brand); color: #fff; border: none; border-radius: 8px; padding: 9px 16px; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity 150ms ease; }
    .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

    .review-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 20px; }
    .review-item { border-bottom: 1px solid var(--border-light); padding-bottom: 20px; }
    .review-item:last-child { border-bottom: none; padding-bottom: 0; }
    .review-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .review-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--color-red); color: #fff; font-size: 16px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
    .review-avatar__img { width: 100%; height: 100%; object-fit: cover; }
    .review-meta { flex: 1; min-width: 0; }
    .review-name { display: block; font-size: 14px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px; }
    .review-date { display: block; font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }
    .verified-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; color: var(--teal); }
    .verified-badge .ms { font-size: 13px; }
    .review-stars { display: flex; gap: 2px; }
    .review-star { font-size: 15px; color: var(--gold); }
    .review-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px; }
    .review-body { font-size: 14px; color: var(--text-secondary); line-height: 1.65; margin: 0 0 10px; }
    .helpful-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: 1px solid var(--border); border-radius: 2px; padding: 5px 12px; font-family: inherit; font-size: 12px; font-weight: 600; color: var(--text-tertiary); cursor: pointer; transition: all 150ms ease; }
    .helpful-btn.is-on { border-color: var(--teal); color: var(--teal); background: var(--teal-light); }
    .helpful-btn .ms { font-size: 14px; }
    .no-reviews { text-align: center; padding: 32px 16px; color: var(--text-tertiary); display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .no-reviews .ms { font-size: 36px; }
    .no-reviews p { margin: 0; font-size: 14px; }

    .booking-card { background: var(--surface); border-radius: var(--radius-lg); padding: 26px; box-shadow: var(--shadow-md); border: 1px solid var(--border); }
    .meta-list { display: flex; flex-direction: column; gap: 14px; }
    .meta-item { display: flex; align-items: center; gap: 12px; }
    .meta-label { display: block; font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; }
    .meta-value { display: block; font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .btn-book { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--brand); color: #fff; border: none; border-radius: 2px; padding: 14px; font-family: inherit; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 150ms ease; margin-bottom: 10px; }
    .btn-book:hover { background: var(--brand-hover); }
    .btn-chat { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--surface); color: var(--color-red-ink); border: 1.5px solid var(--brand); border-radius: 2px; padding: 13px; font-family: inherit; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 150ms ease; }
    .btn-chat:hover { background: var(--brand-light); }

    @media (max-width: 900px) { .form-row--4 { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) {
      .detail-grid { grid-template-columns: 1fr; }
      .hero-card { min-height: 340px; }
      .form-row--4 { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class HotelDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly reviewService = inject(ReviewService);
  private readonly auth = inject(AuthService);
  private readonly favorites = inject(FavoritesService);

  readonly hotel = signal<HotelSearchResult | null>(null);
  readonly reviews = signal<ReviewResponse[]>([]);
  readonly summary = signal<ReviewSummary | null>(null);
  readonly loading = signal(true);

  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly showForm = signal(false);
  readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);

  readonly isFav = computed(() => {
    const h = this.hotel();
    return h ? this.favorites.has('hotel', h.id) : false;
  });

  // Review form model
  formRating = 5;
  formCleanliness = 5;
  formService = 5;
  formValue = 5;
  formLocation = 5;
  formTitle = '';
  formContent = '';

  private id = '';

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.id) {
      this.router.navigate(['/hotels']);
      return;
    }
    this.catalogService.getHotel(this.id).subscribe({
      next: h => {
        this.hotel.set(h);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/hotels']);
      },
    });
    this.loadReviews();
  }

  private loadReviews(): void {
    this.reviewService.getSummary(TARGET_TYPE, this.id)
      .pipe(catchError(() => of(null)))
      .subscribe(s => this.summary.set(s));
    this.reviewService.getForTarget(TARGET_TYPE, this.id)
      .pipe(catchError(() => of([] as ReviewResponse[])))
      .subscribe(list => this.reviews.set(list));
  }

  toggleFav(h: HotelSearchResult): void {
    this.favorites.toggle({
      type: 'hotel',
      id: h.id,
      title: h.name,
      subtitle: h.city,
      imageUrl: h.imageUrl,
      route: `/hotels/${h.id}`,
    });
  }

  toggleForm(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/hotels', this.id], { queryParams: { auth: 'login' } });
      return;
    }
    this.showForm.update(v => !v);
  }

  submitReview(): void {
    if (!this.formContent.trim()) {
      this.formError.set('content');
      return;
    }
    this.submitting.set(true);
    this.formError.set(null);
    const payload: CreateReviewRequest = {
      targetType: TARGET_TYPE,
      targetId: this.id,
      rating: this.formRating,
      ratingCleanliness: this.formCleanliness,
      ratingService: this.formService,
      ratingValue: this.formValue,
      ratingLocation: this.formLocation,
      title: this.formTitle.trim(),
      content: this.formContent.trim(),
    };
    this.reviewService.create(payload)
      .pipe(catchError(() => of(null)))
      .subscribe(created => {
        this.submitting.set(false);
        if (created) {
          this.showForm.set(false);
          this.formTitle = '';
          this.formContent = '';
          this.formRating = 5;
          this.formCleanliness = 5;
          this.formService = 5;
          this.formValue = 5;
          this.formLocation = 5;
          this.loadReviews();
        } else {
          this.formError.set('submit');
        }
      });
  }

  markHelpful(review: ReviewResponse): void {
    if (!this.isAuthenticated()) return;
    this.reviewService.markHelpful(review.id)
      .pipe(catchError(() => of(null)))
      .subscribe(updated => {
        if (updated) {
          this.reviews.update(list => list.map(r => r.id === updated.id ? updated : r));
        }
      });
  }

  stars(n: number): string {
    return '★'.repeat(Math.max(0, Math.min(5, n)));
  }

  starArray(n: number): number[] {
    return Array.from({ length: Math.max(0, Math.min(5, Math.round(n))) });
  }

  goBack(): void { this.router.navigate(['/hotels']); }
  goToPlanner(): void { this.router.navigate(['/planner']); }

  goToChat(): void {
    const h = this.hotel();
    const q = h ? `Tell me about ${h.name}${h.city ? ' hotel in ' + h.city : ''}${h.stars ? '. It has ' + h.stars + ' stars.' : ''}` : undefined;
    this.router.navigate(['/chat'], q ? { queryParams: { q } } : {});
  }
}
