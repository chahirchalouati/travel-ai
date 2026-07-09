import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { DestinationService } from '../../core/services/destination.service';
import { ReviewService } from '../../core/services/review.service';
import { AttractionService } from '../../core/services/attraction.service';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import type {
  DestinationResponse,
  DestinationGuide,
  ReviewResponse,
  ReviewSummary,
  AttractionResponse,
} from '../../core/models/api.models';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

@Component({
  selector: 'app-destination-detail',
  standalone: true,
  imports: [CommonModule, TranslocoModule, RevealDirective],
  template: `
    @if (destination(); as dest) {
      <!-- Back navigation -->
      <nav
        style="
          padding: 16px 32px; max-width: 1200px; margin: 0 auto;
        "
      >
        <button
          (click)="goBack()"
          class="back-link"
        >
          <span class="ms" style="font-size: 18px;">arrow_back</span>
          {{ 'destDetail.back' | transloco }}
        </button>
      </nav>

      <!-- HERO BANNER -->
      <section
        style="
          position: relative; width: 100%; max-height: 400px; height: 400px;
          overflow: hidden;
        "
      >
        <img
          [src]="dest.imageUrl"
          [alt]="dest.name"
          style="
            position: absolute; inset: 0; width: 100%; height: 100%;
            object-fit: cover; object-position: center 40%;
          "
          loading="eager"
          fetchpriority="high"
          width="1200"
          height="400"
        />
        <div
          style="
            position: absolute; inset: 0;
            background: linear-gradient(
              to top,
              #ffffff 0%,
              rgba(255, 255, 255, 0.6) 30%,
              rgba(255, 255, 255, 0) 60%
            );
          "
        ></div>
        <div
          style="
            position: absolute; bottom: 0; left: 0; right: 0; z-index: 2;
            max-width: 1200px; margin: 0 auto; padding: 0 32px 32px;
          "
        >
          <h1
            style="
              font-family: var(--font-body);
              font-size: clamp(2rem, 1.2rem + 3.5vw, 3.5rem);
              color: var(--text-primary); margin: 0; line-height: 1.1; font-weight: 800;
            "
          >{{ dest.name }}</h1>
          <p
            style="
              font-family: var(--font-body); font-size: 16px;
              color: var(--text-secondary); margin: 6px 0 0; font-weight: 500;
            "
          >{{ dest.country }} &middot; {{ dest.continent }}</p>
        </div>
      </section>

      <!-- Quick Stats Bar -->
      <section
        style="
          background: var(--bg-secondary); border-top: 1px solid var(--border-light); border-bottom: 1px solid var(--border-light);
        "
      >
        <div
          style="
            max-width: 1200px; margin: 0 auto; padding: 16px 32px;
            display: flex; flex-wrap: wrap; gap: 32px; align-items: center;
          "
        >
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="ms" style="font-size: 20px; color: var(--teal);">payments</span>
            <span style="font-family: var(--font-body); font-size: 14px; color: var(--text-primary); font-weight: 600;">{{ dest.avgDailyCost | currency:dest.currency:'symbol':'1.0-0' }}/day avg</span>
          </div>
          <div style="width: 1px; height: 20px; background: var(--border);"></div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="ms" style="font-size: 20px; color: var(--teal);">thermostat</span>
            <span style="font-family: var(--font-body); font-size: 14px; color: var(--text-primary); font-weight: 600;">{{ dest.climate }} climate</span>
          </div>
          <div style="width: 1px; height: 20px; background: var(--border);"></div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="ms" style="font-size: 20px; color: var(--teal);">translate</span>
            <span style="font-family: var(--font-body); font-size: 14px; color: var(--text-primary); font-weight: 600;">{{ dest.language }}</span>
          </div>
          <div style="width: 1px; height: 20px; background: var(--border);"></div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="ms" style="font-size: 20px; color: var(--teal);">monetization_on</span>
            <span style="font-family: var(--font-body); font-size: 14px; color: var(--text-primary); font-weight: 600;">{{ dest.currency }}</span>
          </div>
        </div>
      </section>

      <!-- CONTENT GRID -->
      <div
        style="
          max-width: 1200px; margin: 0 auto; padding: 32px 32px 80px;
          display: grid; grid-template-columns: 65fr 35fr; gap: 32px;
          align-items: start;
        "
      >
        <!-- LEFT COLUMN -->
        <div style="display: flex; flex-direction: column; gap: 24px;">

          <!-- Overview -->
          <section class="content-card" appReveal>
            <h2 class="section-heading">{{ 'destDetail.overview' | transloco }}</h2>
            <p
              style="
                font-size: 15px; color: var(--text-secondary); line-height: 1.75; margin: 0 0 24px;
              "
            >{{ dest.description }}</p>

            <div
              style="
                background: var(--bg-secondary); border-radius: 2px; padding: 20px;
              "
            >
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span class="ms" style="font-size: 20px; color: var(--brand);">calendar_month</span>
                <h3
                  style="
                    font-family: var(--font-body); font-size: 15px;
                    color: var(--text-primary); margin: 0; font-weight: 700;
                  "
                >{{ 'destDetail.bestTime' | transloco }}</h3>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                @for (month of getMonthList(); track month) {
                  <span
                    style="
                      background: var(--brand-light); color: var(--brand);
                      padding: 5px 14px; border-radius: 2px;
                      font-family: var(--font-body); font-size: 13px;
                      font-weight: 600;
                    "
                  >{{ month }}</span>
                }
              </div>
            </div>
          </section>

          <!-- Things to do -->
          @if (attractions().length > 0) {
            <section class="content-card" appReveal>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                <h2 class="section-heading" style="margin-bottom: 0;">{{ 'destDetail.thingsToDo' | transloco }}</h2>
                <button
                  style="background: none; border: none; color: var(--brand); font-weight: 700; font-size: 14px; cursor: pointer;"
                  (click)="seeAllAttractions()"
                >{{ 'destDetail.seeAllThings' | transloco }} →</button>
              </div>
              <div style="display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px; scroll-snap-type: x mandatory;">
                @for (a of attractions(); track a.id) {
                  <article
                    style="flex: 0 0 230px; scroll-snap-align: start; cursor: pointer; border-radius: 3px; overflow: hidden; background: var(--surface); border: 1px solid var(--border);"
                    (click)="openAttraction(a.id)"
                    tabindex="0"
                    (keydown.enter)="openAttraction(a.id)"
                  >
                    <div style="height: 140px; background-size: cover; background-position: center; position: relative;"
                         [style.background-image]="'url(' + a.imageUrl + ')'">
                      <span style="position: absolute; top: 8px; left: 8px; background: rgba(15,118,110,0.92); color: #fff; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 4px;">
                        {{ 'attractions.categories.' + a.category | transloco }}
                      </span>
                    </div>
                    <div style="padding: 12px 14px;">
                      <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: var(--text-primary);">{{ a.name }}</h4>
                      <p style="margin: 0; font-size: 13px; color: var(--text-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">{{ a.description }}</p>
                    </div>
                  </article>
                }
              </div>
            </section>
          }

          <!-- Reviews -->
          <section class="content-card" appReveal>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
              <h2 class="section-heading" style="margin-bottom: 0;">{{ 'destDetail.reviews' | transloco }}</h2>
              @if (reviewSummary(); as summary) {
                <span style="font-size: 14px; color: var(--text-tertiary);">{{ summary.totalReviews }} {{ 'destDetail.reviewsCount' | transloco }}</span>
              }
            </div>

            @if (reviewSummary(); as summary) {
              <div
                style="
                  display: flex; align-items: flex-start; gap: 20px;
                  background: var(--teal-light); border-radius: 2px; padding: 20px;
                  border-left: 4px solid var(--teal); margin-bottom: 24px;
                "
              >
                <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                  <span class="ms" style="font-size: 22px; color: var(--teal);">auto_awesome</span>
                </div>
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <span style="font-family: var(--font-body); font-size: 12px; color: var(--teal); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">{{ 'destDetail.aiSummary' | transloco }}</span>
                    <span style="font-family: var(--font-body); font-size: 22px; color: var(--text-primary); font-weight: 800;">{{ summary.averageRating | number:'1.1-1' }}</span>
                    <div style="display: flex; gap: 1px;">
                      @for (star of getStars(summary.averageRating); track $index) {
                        <span style="font-size: 14px; color: {{ star ? 'var(--gold)' : 'var(--border)' }};">&#9733;</span>
                      }
                    </div>
                    @if (summary.ranking; as rank) {
                      <span
                        style="
                          display: inline-flex; align-items: center; gap: 4px; margin-left: auto;
                          background: var(--teal); color: #fff; border-radius: 2px;
                          padding: 4px 12px; font-size: 12px; font-weight: 700;
                          font-family: var(--font-body); letter-spacing: 0.3px;
                        "
                      >
                        <span class="ms" style="font-size: 14px;">emoji_events</span>
                        #{{ rank.rank }} {{ 'destDetail.rankOf' | transloco }} {{ rank.rankTotal }}
                      </span>
                    }
                  </div>
                  <p
                    style="
                      font-size: 14px; color: var(--text-secondary); line-height: 1.65; margin: 0 0 12px;
                    "
                  >{{ summary.aiSummary }}</p>
                  @if (summary.averageService || summary.averageValue || summary.averageCleanliness || summary.averageLocation) {
                    <div style="display: flex; flex-wrap: wrap; gap: 14px;">
                      @for (aspect of aspectAverages(summary); track aspect.key) {
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">{{ aspect.label | transloco }}</span>
                          <span style="font-size: 13px; color: var(--text-primary); font-weight: 800;">{{ aspect.value | number:'1.1-1' }}</span>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            } @else {
              <div
                style="
                  background: var(--bg-secondary); border-radius: 2px; padding: 32px;
                  text-align: center; margin-bottom: 24px;
                "
              >
                <span class="ms" style="font-size: 36px; color: var(--border); display: block; margin-bottom: 8px;">rate_review</span>
                <p
                  style="
                    font-size: 15px; color: var(--text-tertiary); margin: 0;
                  "
                >{{ 'destDetail.noReviews' | transloco }}</p>
              </div>
            }

            @if (reviews().length > 0) {
              <div style="display: flex; flex-direction: column; gap: 16px;">
                @for (review of reviews(); track review.id) {
                  <article
                    style="
                      background: var(--surface);
                      border: 1px solid var(--border); border-radius: 2px; padding: 20px;
                    "
                  >
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <div
                          style="
                            width: 36px; height: 36px; border-radius: 50%;
                            background: var(--bg-secondary);
                            display: flex; align-items: center; justify-content: center;
                            font-family: var(--font-body); font-size: 14px;
                            color: var(--brand); font-weight: 700;
                          "
                        >{{ review.userFirstName.charAt(0) }}</div>
                        <div>
                          <div
                            style="
                              font-size: 14px; color: var(--text-primary); font-weight: 600;
                            "
                          >
                            {{ review.userFirstName }}
                            @if (review.verified) {
                              <span
                                title="{{ 'destDetail.verifiedStay' | transloco }}"
                                style="
                                  display: inline-flex; align-items: center; gap: 3px; margin-left: 6px;
                                  color: var(--teal); font-size: 11px; font-weight: 700;
                                  text-transform: uppercase; letter-spacing: 0.4px; vertical-align: middle;
                                "
                              >
                                <span class="ms" style="font-size: 14px;">verified</span>
                                {{ 'destDetail.verifiedStay' | transloco }}
                              </span>
                            }
                          </div>
                          <div
                            style="
                              font-size: 12px; color: var(--text-tertiary);
                            "
                          >{{ review.createdAt | date:'mediumDate' }}</div>
                        </div>
                      </div>
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="display: flex; gap: 1px;">
                          @for (star of getStars(review.rating); track $index) {
                            <span style="font-size: 14px; color: {{ star ? 'var(--gold)' : 'var(--border)' }};">&#9733;</span>
                          }
                        </div>
                        <span style="font-size: 14px; color: var(--text-primary); font-weight: 700;">{{ review.rating }}.0</span>
                      </div>
                    </div>
                    @if (review.title) {
                      <h4
                        style="
                          font-size: 15px; color: var(--text-primary); font-weight: 700; margin: 0 0 6px;
                        "
                      >{{ review.title }}</h4>
                    }
                    <p
                      style="
                        font-size: 14px; color: var(--text-secondary); line-height: 1.65; margin: 0 0 12px;
                      "
                    >{{ review.content }}</p>
                    <button
                      (click)="markHelpful(review.id)"
                      class="helpful-btn"
                      [class.helpful-btn--active]="review.helpfulByMe"
                    >
                      <span class="ms" style="font-size: 15px;">thumb_up</span>
                      {{ 'destDetail.helpful' | transloco }} ({{ review.helpfulCount }})
                    </button>
                  </article>
                }
              </div>
            }
          </section>

          <!-- AI Travel Guide -->
          <section class="content-card" appReveal>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 18px;">
              <span
                class="ms"
                style="
                  font-size: 24px; color: var(--brand);
                "
              >auto_awesome</span>
              <h2 class="section-heading" style="margin-bottom: 0;">{{ 'destDetail.aiGuide' | transloco }}</h2>
            </div>

            @if (!guide() && !guideLoading()) {
              <p
                style="
                  font-size: 15px; color: var(--text-secondary); line-height: 1.65; margin: 0 0 20px;
                "
              >{{ 'destDetail.guideIntro' | transloco }}</p>
              @if (guideError()) {
                <p style="font-size: 14px; color: var(--brand); margin: 0 0 16px; display: flex; align-items: center; gap: 6px;">
                  <span class="ms" style="font-size: 16px;">error_outline</span>
                  {{ guideError() }}
                </p>
              }
              <button
                (click)="generateGuide()"
                class="btn-primary"
              >
                <span class="ms" style="font-size: 20px;">auto_awesome</span>
                {{ (guideError() ? 'destDetail.retry' : 'destDetail.generateGuide') | transloco }}
              </button>
            }

            @if (guideLoading()) {
              <div style="display: flex; flex-direction: column; gap: 16px; padding: 8px 0;">
                <div class="shimmer-card" style="height: 80px; border-radius: 2px;"></div>
                <div class="shimmer-card" style="height: 120px; border-radius: 2px;"></div>
                <div class="shimmer-card" style="height: 100px; border-radius: 2px;"></div>
              </div>
            }

            @if (guide(); as g) {
              <div style="display: flex; flex-direction: column; gap: 16px;">
                @if (g.guide) {
                  <p
                    style="
                      font-size: 15px; color: var(--text-secondary); line-height: 1.75; margin: 0;
                    "
                  >{{ g.guide }}</p>
                }

                @if (g.topAttractions) {
                  <div class="guide-section-card">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                      <span class="ms" style="font-size: 22px; color: var(--brand);">attractions</span>
                      <h3 class="guide-section-title">{{ 'destDetail.topAttractions' | transloco }}</h3>
                    </div>
                    <p class="guide-section-text">{{ g.topAttractions }}</p>
                  </div>
                }

                @if (g.foodRecommendations) {
                  <div class="guide-section-card">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                      <span class="ms" style="font-size: 22px; color: var(--brand);">restaurant</span>
                      <h3 class="guide-section-title">{{ 'destDetail.foodRec' | transloco }}</h3>
                    </div>
                    <p class="guide-section-text">{{ g.foodRecommendations }}</p>
                  </div>
                }

                @if (g.travelTips) {
                  <div class="guide-section-card">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                      <span class="ms" style="font-size: 22px; color: var(--brand);">lightbulb</span>
                      <h3 class="guide-section-title">{{ 'destDetail.travelTips' | transloco }}</h3>
                    </div>
                    <p class="guide-section-text">{{ g.travelTips }}</p>
                  </div>
                }
              </div>
            }
          </section>
        </div>

        <!-- RIGHT COLUMN (sticky) -->
        <aside style="display: flex; flex-direction: column; gap: 20px; position: sticky; top: 80px;">

          <!-- Quick Info Card -->
          <div class="sidebar-card">
            <h3
              style="
                font-family: var(--font-body); font-size: 18px;
                color: var(--text-primary); margin: 0 0 18px; font-weight: 700;
              "
            >{{ 'destDetail.quickInfo' | transloco }}</h3>

            <div style="display: flex; flex-direction: column; gap: 14px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span class="ms" style="font-size: 20px; color: var(--teal);">payments</span>
                <div>
                  <div style="font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">{{ 'destDetail.avgDailyCost' | transloco }}</div>
                  <div style="font-size: 15px; color: var(--text-primary); font-weight: 700;">{{ dest.avgDailyCost | currency:dest.currency:'symbol':'1.0-0' }}</div>
                </div>
              </div>

              <div style="height: 1px; background: var(--border-light);"></div>

              <div style="display: flex; align-items: center; gap: 12px;">
                <span class="ms" style="font-size: 20px; color: var(--teal);">thermostat</span>
                <div>
                  <div style="font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">{{ 'destDetail.climate' | transloco }}</div>
                  <div style="font-size: 15px; color: var(--text-primary); font-weight: 700;">{{ dest.climate }}</div>
                </div>
              </div>

              <div style="height: 1px; background: var(--border-light);"></div>

              <div style="display: flex; align-items: center; gap: 12px;">
                <span class="ms" style="font-size: 20px; color: var(--teal);">translate</span>
                <div>
                  <div style="font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">{{ 'destDetail.language' | transloco }}</div>
                  <div style="font-size: 15px; color: var(--text-primary); font-weight: 700;">{{ dest.language }}</div>
                </div>
              </div>

              <div style="height: 1px; background: var(--border-light);"></div>

              <div style="display: flex; align-items: center; gap: 12px;">
                <span class="ms" style="font-size: 20px; color: var(--teal);">monetization_on</span>
                <div>
                  <div style="font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">{{ 'destDetail.currency' | transloco }}</div>
                  <div style="font-size: 15px; color: var(--text-primary); font-weight: 700;">{{ dest.currency }}</div>
                </div>
              </div>

              <div style="height: 1px; background: var(--border-light);"></div>

              <div style="display: flex; align-items: center; gap: 12px;">
                <span class="ms" style="font-size: 20px; color: var(--teal);">calendar_month</span>
                <div>
                  <div style="font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">{{ 'destDetail.bestMonths' | transloco }}</div>
                  <div style="font-size: 15px; color: var(--text-primary); font-weight: 700;">{{ getMonthNames(dest.bestMonths) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Plan Trip CTA Card -->
          <div class="sidebar-card">
            <h3
              style="
                font-family: var(--font-body); font-size: 18px;
                color: var(--text-primary); margin: 0 0 6px; font-weight: 700;
              "
            >{{ 'destDetail.readyToExplore' | transloco }}</h3>
            <p
              style="
                font-size: 14px; color: var(--text-secondary); margin: 0 0 18px; line-height: 1.5;
              "
            >{{ 'destDetail.craftItinerary' | transloco:{ name: dest.name } }}</p>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              <button
                (click)="goToPlanner()"
                class="btn-primary"
                style="width: 100%; justify-content: center;"
              >
                <span class="ms" style="font-size: 20px;">travel_explore</span>
                {{ 'common.planTrip' | transloco }}
              </button>
              <button
                (click)="goToChat()"
                class="btn-outline"
                style="width: 100%; justify-content: center;"
              >
                <span class="ms" style="font-size: 20px;">chat</span>
                {{ 'destDetail.chatAbout' | transloco:{ name: dest.name } }}
              </button>
            </div>
          </div>
        </aside>
      </div>
    } @else {
      <!-- Loading skeleton -->
      <div style="min-height: 100vh; background: var(--bg-primary);">
        <div
          class="shimmer-card"
          style="
            width: 100%; height: 400px;
          "
        ></div>
        <div style="max-width: 1200px; margin: 32px auto; padding: 0 32px; display: grid; grid-template-columns: 65fr 35fr; gap: 32px;">
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <div class="shimmer-card" style="border-radius: 2px; height: 300px;"></div>
            <div class="shimmer-card" style="border-radius: 2px; height: 200px;"></div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <div class="shimmer-card" style="border-radius: 2px; height: 350px;"></div>
            <div class="shimmer-card" style="border-radius: 2px; height: 200px;"></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      background: var(--bg-primary);
      min-height: 100vh;
      color: var(--text-primary);
      font-family: var(--font-body);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      color: var(--text-secondary);
      font-family: var(--font-body);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      padding: 0;
      transition: color 150ms ease;
    }

    .back-link:hover {
      color: var(--brand);
    }

    .content-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 28px;
    }

    .sidebar-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .section-heading {
      font-family: var(--font-body);
      font-size: 20px;
      color: var(--text-primary);
      margin: 0 0 16px;
      font-weight: 700;
    }

    .guide-section-card {
      background: var(--bg-secondary);
      border-radius: 2px;
      padding: 20px;
    }

    .guide-section-title {
      font-family: var(--font-body);
      font-size: 16px;
      color: var(--text-primary);
      margin: 0;
      font-weight: 700;
    }

    .guide-section-text {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.7;
      margin: 0;
      white-space: pre-line;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--brand);
      color: #fff;
      border: none;
      border-radius: 2px;
      padding: 13px 24px;
      font-family: var(--font-body);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 150ms ease;
    }

    .btn-primary:hover {
      background: var(--brand-hover);
    }

    .btn-outline {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--surface);
      color: var(--brand);
      border: 1.5px solid var(--brand);
      border-radius: 2px;
      padding: 12px 24px;
      font-family: var(--font-body);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 150ms ease;
    }

    .btn-outline:hover {
      background: var(--brand-light);
    }

    .helpful-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 2px;
      padding: 5px 14px;
      cursor: pointer;
      font-family: var(--font-body);
      font-size: 13px;
      color: var(--text-secondary);
      transition: border-color 150ms ease, color 150ms ease;
    }

    .helpful-btn:hover {
      border-color: var(--brand);
      color: var(--brand);
    }

    .helpful-btn--active {
      background: var(--brand-light);
      border-color: var(--brand);
      color: var(--brand);
      font-weight: 700;
    }

    @keyframes shimmer {
      0% { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }

    .shimmer-card {
      background: linear-gradient(
        90deg,
        var(--bg-secondary) 25%,
        var(--bg-tertiary) 50%,
        var(--bg-secondary) 75%
      );
      background-size: 800px 100%;
      animation: shimmer 1.8s ease-in-out infinite;
    }

    @media (max-width: 768px) {
      :host ::ng-deep .content-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `],
})
export class DestinationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destinationService = inject(DestinationService);
  private readonly reviewService = inject(ReviewService);
  private readonly attractionService = inject(AttractionService);
  private readonly transloco = inject(TranslocoService);

  /** Localized 3-letter month abbreviations from the active language. */
  private monthNames(): string[] {
    const list = this.transloco.translate<string[]>('destDetail.months');
    return Array.isArray(list) && list.length === 12 ? list : [...MONTH_NAMES];
  }

  readonly destination = signal<DestinationResponse | null>(null);
  readonly reviews = signal<ReviewResponse[]>([]);
  readonly reviewSummary = signal<ReviewSummary | null>(null);
  readonly guide = signal<DestinationGuide | null>(null);
  readonly guideLoading = signal(false);
  readonly guideError = signal<string | null>(null);
  readonly attractions = signal<AttractionResponse[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    this.destinationService.getById(id).subscribe({
      next: (dest) => {
        this.destination.set(dest);
        this.loadAttractions(dest.name);
      },
      error: () => this.router.navigate(['/']),
    });

    this.reviewService.getForTarget('DESTINATION', id).subscribe({
      next: (reviews) => this.reviews.set(reviews),
      error: () => {},
    });

    this.reviewService.getSummary('DESTINATION', id).subscribe({
      next: (summary) => this.reviewSummary.set(summary),
      error: () => {},
    });
  }

  generateGuide(): void {
    const id = this.destination()?.id;
    if (!id) return;
    this.guideLoading.set(true);
    this.guideError.set(null);
    this.destinationService.getGuide(id).subscribe({
      next: (guide) => {
        this.guide.set(guide);
        this.guideLoading.set(false);
      },
      error: () => {
        this.guideLoading.set(false);
        this.guideError.set(this.transloco.translate('destDetail.guideError'));
      },
    });
  }

  markHelpful(reviewId: string): void {
    this.reviewService.markHelpful(reviewId).subscribe((updated) => {
      this.reviews.update((rs) =>
        rs.map((r) =>
          r.id === reviewId
            ? { ...r, helpfulCount: updated.helpfulCount, helpfulByMe: updated.helpfulByMe }
            : r
        )
      );
    });
  }

  aspectAverages(summary: ReviewSummary): { key: string; label: string; value: number }[] {
    return [
      { key: 'service', label: 'destDetail.aspectService', value: summary.averageService },
      { key: 'value', label: 'destDetail.aspectValue', value: summary.averageValue },
      { key: 'cleanliness', label: 'destDetail.aspectCleanliness', value: summary.averageCleanliness },
      { key: 'location', label: 'destDetail.aspectLocation', value: summary.averageLocation },
    ].filter((a): a is { key: string; label: string; value: number } => a.value != null);
  }

  getStars(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => (i < Math.round(rating) ? 1 : 0));
  }

  getMonthNames(bestMonths: string): string {
    const names = this.monthNames();
    return (
      bestMonths
        ?.split(',')
        .map((m) => names[parseInt(m.trim(), 10) - 1])
        .filter(Boolean)
        .join(', ') ?? ''
    );
  }

  getMonthList(): string[] {
    const dest = this.destination();
    if (!dest?.bestMonths) return [];
    const names = this.monthNames();
    return dest.bestMonths
      .split(',')
      .map((m) => names[parseInt(m.trim(), 10) - 1])
      .filter((m): m is string => Boolean(m));
  }

  getTags(): string[] {
    return (
      this.destination()
        ?.tags?.split(',')
        .map((t) => t.trim())
        .filter(Boolean) ?? []
    );
  }

  private loadAttractions(city: string): void {
    this.attractionService.search({ city }, 0, 8).subscribe({
      next: (page) => this.attractions.set(page.items),
      error: () => {},
    });
  }

  openAttraction(id: string): void {
    this.router.navigate(['/attractions', id]);
  }

  seeAllAttractions(): void {
    const city = this.destination()?.name;
    this.router.navigate(['/attractions'], city ? { queryParams: { city } } : {});
  }

  goToPlanner(): void {
    this.router.navigate(['/planner']);
  }

  goToChat(): void {
    const d = this.destination();
    const q = d ? `Tell me about ${d.name}${d.country ? ' in ' + d.country : ''} as a travel destination. What are the best things to do and see there?` : undefined;
    this.router.navigate(['/chat'], q ? { queryParams: { q } } : {});
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
