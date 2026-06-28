import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DestinationService } from '../../core/services/destination.service';
import { ReviewService } from '../../core/services/review.service';
import type {
  DestinationResponse,
  DestinationGuide,
  ReviewResponse,
  ReviewSummary,
} from '../../core/models/api.models';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

@Component({
  selector: 'app-destination-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Back navigation -->
    <button
      (click)="goBack()"
      style="
        position: fixed; top: 24px; left: 24px; z-index: 50;
        display: inline-flex; align-items: center; gap: 6px;
        background: rgba(36, 28, 21, 0.65); backdrop-filter: blur(12px);
        color: #EFE8DC; border: none; border-radius: 40px;
        padding: 10px 20px 10px 14px; font-family: 'Hanken Grotesk', sans-serif;
        font-size: 14px; font-weight: 600; cursor: pointer;
        transition: background 300ms ease;
      "
      (mouseenter)="$any($event.currentTarget).style.background='rgba(36,28,21,0.85)'"
      (mouseleave)="$any($event.currentTarget).style.background='rgba(36,28,21,0.65)'"
    >
      <span class="ms" style="font-size: 18px;">arrow_back</span>
      Back
    </button>

    @if (destination(); as dest) {
      <!-- HERO BANNER -->
      <section
        style="
          position: relative; width: 100%; min-height: 400px;
          overflow: hidden; display: flex; align-items: flex-end;
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
        />
        <div
          style="
            position: absolute; inset: 0;
            background: linear-gradient(
              to top,
              rgba(36, 28, 21, 0.92) 0%,
              rgba(36, 28, 21, 0.45) 45%,
              rgba(36, 28, 21, 0.08) 100%
            );
          "
        ></div>

        <div
          style="
            position: relative; z-index: 2; width: 100%;
            max-width: 1200px; margin: 0 auto;
            padding: 64px 32px 40px;
          "
        >
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
            @for (tag of getTags(); track tag) {
              <span
                style="
                  background: rgba(217, 105, 76, 0.2); border: 1px solid rgba(217, 105, 76, 0.4);
                  color: #EFE8DC; padding: 4px 14px; border-radius: 100px;
                  font-family: 'Hanken Grotesk', sans-serif; font-size: 12px;
                  font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
                "
              >{{ tag }}</span>
            }
          </div>

          <h1
            style="
              font-family: 'Instrument Serif', serif; font-size: clamp(2.5rem, 1.5rem + 4vw, 4.5rem);
              color: #EFE8DC; margin: 0 0 6px; line-height: 1.05; font-weight: 400;
            "
          >{{ dest.name }}</h1>
          <p
            style="
              font-family: 'Hanken Grotesk', sans-serif; font-size: 18px;
              color: rgba(239, 232, 220, 0.7); margin: 0 0 28px; font-weight: 400;
            "
          >{{ dest.country }} &middot; {{ dest.continent }}</p>

          <!-- Quick stats row -->
          <div
            style="
              display: flex; flex-wrap: wrap; gap: 24px;
              padding: 18px 24px; border-radius: 14px;
              background: rgba(239, 232, 220, 0.08); backdrop-filter: blur(8px);
              border: 1px solid rgba(239, 232, 220, 0.1);
            "
          >
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="ms" style="font-size: 20px; color: #D9694C;">payments</span>
              <div>
                <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 11px; color: rgba(239,232,220,0.5); text-transform: uppercase; letter-spacing: 0.8px;">Avg Daily Cost</div>
                <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 16px; color: #EFE8DC; font-weight: 600;">{{ dest.avgDailyCost | currency:dest.currency:'symbol':'1.0-0' }}</div>
              </div>
            </div>
            <div style="width: 1px; background: rgba(239,232,220,0.15); align-self: stretch;"></div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="ms" style="font-size: 20px; color: #D9694C;">thermostat</span>
              <div>
                <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 11px; color: rgba(239,232,220,0.5); text-transform: uppercase; letter-spacing: 0.8px;">Climate</div>
                <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 16px; color: #EFE8DC; font-weight: 600;">{{ dest.climate }}</div>
              </div>
            </div>
            <div style="width: 1px; background: rgba(239,232,220,0.15); align-self: stretch;"></div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="ms" style="font-size: 20px; color: #D9694C;">translate</span>
              <div>
                <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 11px; color: rgba(239,232,220,0.5); text-transform: uppercase; letter-spacing: 0.8px;">Language</div>
                <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 16px; color: #EFE8DC; font-weight: 600;">{{ dest.language }}</div>
              </div>
            </div>
            <div style="width: 1px; background: rgba(239,232,220,0.15); align-self: stretch;"></div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="ms" style="font-size: 20px; color: #D9694C;">monetization_on</span>
              <div>
                <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 11px; color: rgba(239,232,220,0.5); text-transform: uppercase; letter-spacing: 0.8px;">Currency</div>
                <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 16px; color: #EFE8DC; font-weight: 600;">{{ dest.currency }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CONTENT GRID -->
      <div
        style="
          max-width: 1200px; margin: 0 auto; padding: 40px 32px 80px;
          display: grid; grid-template-columns: 2fr 1fr; gap: 28px;
          align-items: start;
        "
      >
        <!-- LEFT COLUMN -->
        <div style="display: flex; flex-direction: column; gap: 32px;">

          <!-- Overview -->
          <section
            style="
              background: #fff; border: 1px solid #EADFCD; border-radius: 18px;
              padding: 36px; overflow: hidden;
            "
          >
            <h2
              style="
                font-family: 'Instrument Serif', serif; font-size: 28px;
                color: #241C15; margin: 0 0 20px; font-weight: 400;
              "
            >Overview</h2>
            <p
              style="
                font-family: 'Hanken Grotesk', sans-serif; font-size: 16px;
                color: #4A3F35; line-height: 1.7; margin: 0 0 28px;
              "
            >{{ dest.description }}</p>

            <div
              style="
                background: #FAF6F0; border-radius: 14px; padding: 24px;
                border: 1px solid #EADFCD;
              "
            >
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                <span class="ms" style="font-size: 22px; color: #D9694C;">calendar_month</span>
                <h3
                  style="
                    font-family: 'Instrument Serif', serif; font-size: 20px;
                    color: #241C15; margin: 0; font-weight: 400;
                  "
                >Best Time to Visit</h3>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                @for (month of getMonthList(); track month) {
                  <span
                    style="
                      background: rgba(217, 105, 76, 0.12); color: #D9694C;
                      padding: 6px 16px; border-radius: 100px;
                      font-family: 'Hanken Grotesk', sans-serif; font-size: 13px;
                      font-weight: 600;
                    "
                  >{{ month }}</span>
                }
              </div>
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 16px;">
                <span class="ms" style="font-size: 18px; color: #8A7E72;">thermostat</span>
                <span
                  style="
                    font-family: 'Hanken Grotesk', sans-serif; font-size: 14px;
                    color: #8A7E72;
                  "
                >{{ dest.climate }} climate</span>
              </div>
            </div>
          </section>

          <!-- Reviews -->
          <section
            style="
              background: #fff; border: 1px solid #EADFCD; border-radius: 18px;
              padding: 36px; overflow: hidden;
            "
          >
            <h2
              style="
                font-family: 'Instrument Serif', serif; font-size: 28px;
                color: #241C15; margin: 0 0 24px; font-weight: 400;
              "
            >Reviews</h2>

            @if (reviewSummary(); as summary) {
              <div
                style="
                  display: flex; align-items: center; gap: 24px;
                  background: #FAF6F0; border-radius: 14px; padding: 24px;
                  border: 1px solid #EADFCD; margin-bottom: 28px;
                "
              >
                <div style="text-align: center; min-width: 80px;">
                  <div
                    style="
                      font-family: 'Instrument Serif', serif; font-size: 48px;
                      color: #241C15; line-height: 1;
                    "
                  >{{ summary.averageRating | number:'1.1-1' }}</div>
                  <div style="display: flex; justify-content: center; gap: 2px; margin: 6px 0;">
                    @for (star of getStars(summary.averageRating); track $index) {
                      <span style="font-size: 16px; color: {{ star ? '#D9694C' : '#E4D8C6' }};">&#9733;</span>
                    }
                  </div>
                  <div
                    style="
                      font-family: 'Hanken Grotesk', sans-serif; font-size: 13px;
                      color: #8A7E72;
                    "
                  >{{ summary.totalReviews }} reviews</div>
                </div>
                <div style="width: 1px; background: #EADFCD; align-self: stretch;"></div>
                <p
                  style="
                    font-family: 'Hanken Grotesk', sans-serif; font-size: 15px;
                    color: #4A3F35; line-height: 1.6; margin: 0; flex: 1;
                  "
                >{{ summary.aiSummary }}</p>
              </div>
            } @else {
              <div
                style="
                  background: #FAF6F0; border-radius: 14px; padding: 32px;
                  border: 1px solid #EADFCD; text-align: center; margin-bottom: 28px;
                "
              >
                <span class="ms" style="font-size: 36px; color: #E4D8C6; display: block; margin-bottom: 8px;">rate_review</span>
                <p
                  style="
                    font-family: 'Hanken Grotesk', sans-serif; font-size: 15px;
                    color: #8A7E72; margin: 0;
                  "
                >No reviews yet. Be the first to share your experience.</p>
              </div>
            }

            @if (reviews().length > 0) {
              <div style="display: flex; flex-direction: column; gap: 20px;">
                @for (review of reviews(); track review.id) {
                  <article
                    style="
                      border: 1px solid #EADFCD; border-radius: 14px; padding: 24px;
                      transition: box-shadow 300ms ease;
                    "
                  >
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                      <div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                          <div
                            style="
                              width: 36px; height: 36px; border-radius: 50%;
                              background: linear-gradient(135deg, #D9694C, #C45A3E);
                              display: flex; align-items: center; justify-content: center;
                              font-family: 'Hanken Grotesk', sans-serif; font-size: 14px;
                              color: #EFE8DC; font-weight: 700;
                            "
                          >{{ review.userFirstName.charAt(0) }}</div>
                          <div>
                            <div
                              style="
                                font-family: 'Hanken Grotesk', sans-serif; font-size: 15px;
                                color: #241C15; font-weight: 600;
                              "
                            >{{ review.userFirstName }}</div>
                            <div
                              style="
                                font-family: 'Hanken Grotesk', sans-serif; font-size: 12px;
                                color: #8A7E72;
                              "
                            >{{ review.createdAt | date:'mediumDate' }}</div>
                          </div>
                        </div>
                      </div>
                      <div style="display: flex; gap: 2px;">
                        @for (star of getStars(review.rating); track $index) {
                          <span style="font-size: 14px; color: {{ star ? '#D9694C' : '#E4D8C6' }};">&#9733;</span>
                        }
                      </div>
                    </div>
                    @if (review.title) {
                      <h4
                        style="
                          font-family: 'Hanken Grotesk', sans-serif; font-size: 16px;
                          color: #241C15; font-weight: 600; margin: 0 0 8px;
                        "
                      >{{ review.title }}</h4>
                    }
                    <p
                      style="
                        font-family: 'Hanken Grotesk', sans-serif; font-size: 14px;
                        color: #4A3F35; line-height: 1.65; margin: 0 0 14px;
                      "
                    >{{ review.content }}</p>
                    <button
                      (click)="markHelpful(review.id)"
                      style="
                        display: inline-flex; align-items: center; gap: 6px;
                        background: none; border: 1px solid #EADFCD; border-radius: 100px;
                        padding: 6px 14px; cursor: pointer;
                        font-family: 'Hanken Grotesk', sans-serif; font-size: 13px;
                        color: #8A7E72; transition: all 200ms ease;
                      "
                      (mouseenter)="$any($event.currentTarget).style.borderColor='#D9694C';$any($event.currentTarget).style.color='#D9694C'"
                      (mouseleave)="$any($event.currentTarget).style.borderColor='#EADFCD';$any($event.currentTarget).style.color='#8A7E72'"
                    >
                      <span class="ms" style="font-size: 16px;">thumb_up</span>
                      Helpful ({{ review.helpfulCount }})
                    </button>
                  </article>
                }
              </div>
            }
          </section>

          <!-- AI Travel Guide -->
          <section
            style="
              border-radius: 18px; padding: 36px; overflow: hidden;
              border: 1px solid #EADFCD;
            "
            [style.background]="guide() ? 'linear-gradient(145deg, #FAF6F0 0%, #F5EDE0 50%, #FCF8F3 100%)' : '#fff'"
          >
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
              <span
                class="ms"
                style="
                  font-size: 28px; color: #D9694C;
                  background: rgba(217, 105, 76, 0.1); border-radius: 12px;
                  padding: 8px;
                "
              >auto_awesome</span>
              <h2
                style="
                  font-family: 'Instrument Serif', serif; font-size: 28px;
                  color: #241C15; margin: 0; font-weight: 400;
                "
              >AI Travel Guide</h2>
            </div>

            @if (!guide() && !guideLoading()) {
              <p
                style="
                  font-family: 'Hanken Grotesk', sans-serif; font-size: 15px;
                  color: #8A7E72; line-height: 1.6; margin: 0 0 20px;
                "
              >Get a personalized AI-generated travel guide with top attractions, food recommendations, and insider travel tips.</p>
              <button
                (click)="generateGuide()"
                style="
                  display: inline-flex; align-items: center; gap: 8px;
                  background: linear-gradient(135deg, #D9694C, #C45A3E);
                  color: #EFE8DC; border: none; border-radius: 100px;
                  padding: 14px 28px; font-family: 'Hanken Grotesk', sans-serif;
                  font-size: 15px; font-weight: 600; cursor: pointer;
                  transition: opacity 200ms ease;
                "
                (mouseenter)="$any($event.currentTarget).style.opacity='0.88'"
                (mouseleave)="$any($event.currentTarget).style.opacity='1'"
              >
                <span class="ms" style="font-size: 20px;">auto_awesome</span>
                Generate AI Guide
              </button>
            }

            @if (guideLoading()) {
              <div
                style="
                  display: flex; flex-direction: column; align-items: center;
                  justify-content: center; padding: 48px 0; gap: 16px;
                "
              >
                <div
                  style="
                    width: 40px; height: 40px; border: 3px solid #EADFCD;
                    border-top-color: #D9694C; border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                  "
                ></div>
                <p
                  style="
                    font-family: 'Hanken Grotesk', sans-serif; font-size: 14px;
                    color: #8A7E72; margin: 0;
                  "
                >Crafting your personalized guide...</p>
              </div>
            }

            @if (guide(); as g) {
              <div style="display: flex; flex-direction: column; gap: 24px;">
                @if (g.guide) {
                  <p
                    style="
                      font-family: 'Hanken Grotesk', sans-serif; font-size: 15px;
                      color: #4A3F35; line-height: 1.7; margin: 0;
                    "
                  >{{ g.guide }}</p>
                }

                @if (g.topAttractions) {
                  <div
                    style="
                      background: #fff; border-radius: 14px; padding: 24px;
                      border: 1px solid #EADFCD;
                    "
                  >
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
                      <span class="ms" style="font-size: 22px; color: #D9694C;">attractions</span>
                      <h3
                        style="
                          font-family: 'Instrument Serif', serif; font-size: 20px;
                          color: #241C15; margin: 0; font-weight: 400;
                        "
                      >Top Attractions</h3>
                    </div>
                    <p
                      style="
                        font-family: 'Hanken Grotesk', sans-serif; font-size: 14px;
                        color: #4A3F35; line-height: 1.7; margin: 0;
                        white-space: pre-line;
                      "
                    >{{ g.topAttractions }}</p>
                  </div>
                }

                @if (g.foodRecommendations) {
                  <div
                    style="
                      background: #fff; border-radius: 14px; padding: 24px;
                      border: 1px solid #EADFCD;
                    "
                  >
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
                      <span class="ms" style="font-size: 22px; color: #D9694C;">restaurant</span>
                      <h3
                        style="
                          font-family: 'Instrument Serif', serif; font-size: 20px;
                          color: #241C15; margin: 0; font-weight: 400;
                        "
                      >Food Recommendations</h3>
                    </div>
                    <p
                      style="
                        font-family: 'Hanken Grotesk', sans-serif; font-size: 14px;
                        color: #4A3F35; line-height: 1.7; margin: 0;
                        white-space: pre-line;
                      "
                    >{{ g.foodRecommendations }}</p>
                  </div>
                }

                @if (g.travelTips) {
                  <div
                    style="
                      background: #fff; border-radius: 14px; padding: 24px;
                      border: 1px solid #EADFCD;
                    "
                  >
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
                      <span class="ms" style="font-size: 22px; color: #D9694C;">lightbulb</span>
                      <h3
                        style="
                          font-family: 'Instrument Serif', serif; font-size: 20px;
                          color: #241C15; margin: 0; font-weight: 400;
                        "
                      >Travel Tips</h3>
                    </div>
                    <p
                      style="
                        font-family: 'Hanken Grotesk', sans-serif; font-size: 14px;
                        color: #4A3F35; line-height: 1.7; margin: 0;
                        white-space: pre-line;
                      "
                    >{{ g.travelTips }}</p>
                  </div>
                }
              </div>
            }
          </section>
        </div>

        <!-- RIGHT COLUMN (sticky) -->
        <aside style="display: flex; flex-direction: column; gap: 20px; position: sticky; top: 80px;">

          <!-- Quick Info Card -->
          <div
            style="
              background: #fff; border: 1px solid #EADFCD; border-radius: 18px;
              padding: 28px; overflow: hidden;
            "
          >
            <h3
              style="
                font-family: 'Instrument Serif', serif; font-size: 22px;
                color: #241C15; margin: 0 0 22px; font-weight: 400;
              "
            >Quick Info</h3>

            <div style="display: flex; flex-direction: column; gap: 18px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span
                  class="ms"
                  style="
                    font-size: 20px; color: #D9694C;
                    background: rgba(217, 105, 76, 0.1); border-radius: 10px;
                    padding: 8px; line-height: 1;
                  "
                >payments</span>
                <div>
                  <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 11px; color: #8A7E72; text-transform: uppercase; letter-spacing: 0.8px;">Avg Daily Cost</div>
                  <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 16px; color: #241C15; font-weight: 600;">{{ dest.avgDailyCost | currency:dest.currency:'symbol':'1.0-0' }}</div>
                </div>
              </div>

              <div style="height: 1px; background: #EADFCD;"></div>

              <div style="display: flex; align-items: center; gap: 12px;">
                <span
                  class="ms"
                  style="
                    font-size: 20px; color: #D9694C;
                    background: rgba(217, 105, 76, 0.1); border-radius: 10px;
                    padding: 8px; line-height: 1;
                  "
                >thermostat</span>
                <div>
                  <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 11px; color: #8A7E72; text-transform: uppercase; letter-spacing: 0.8px;">Climate</div>
                  <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 16px; color: #241C15; font-weight: 600;">{{ dest.climate }}</div>
                </div>
              </div>

              <div style="height: 1px; background: #EADFCD;"></div>

              <div style="display: flex; align-items: center; gap: 12px;">
                <span
                  class="ms"
                  style="
                    font-size: 20px; color: #D9694C;
                    background: rgba(217, 105, 76, 0.1); border-radius: 10px;
                    padding: 8px; line-height: 1;
                  "
                >translate</span>
                <div>
                  <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 11px; color: #8A7E72; text-transform: uppercase; letter-spacing: 0.8px;">Language</div>
                  <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 16px; color: #241C15; font-weight: 600;">{{ dest.language }}</div>
                </div>
              </div>

              <div style="height: 1px; background: #EADFCD;"></div>

              <div style="display: flex; align-items: center; gap: 12px;">
                <span
                  class="ms"
                  style="
                    font-size: 20px; color: #D9694C;
                    background: rgba(217, 105, 76, 0.1); border-radius: 10px;
                    padding: 8px; line-height: 1;
                  "
                >monetization_on</span>
                <div>
                  <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 11px; color: #8A7E72; text-transform: uppercase; letter-spacing: 0.8px;">Currency</div>
                  <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 16px; color: #241C15; font-weight: 600;">{{ dest.currency }}</div>
                </div>
              </div>

              <div style="height: 1px; background: #EADFCD;"></div>

              <div style="display: flex; align-items: center; gap: 12px;">
                <span
                  class="ms"
                  style="
                    font-size: 20px; color: #D9694C;
                    background: rgba(217, 105, 76, 0.1); border-radius: 10px;
                    padding: 8px; line-height: 1;
                  "
                >calendar_month</span>
                <div>
                  <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 11px; color: #8A7E72; text-transform: uppercase; letter-spacing: 0.8px;">Best Months</div>
                  <div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 16px; color: #241C15; font-weight: 600;">{{ getMonthNames(dest.bestMonths) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Plan Trip CTA Card -->
          <div
            style="
              background: linear-gradient(145deg, #241C15, #332720);
              border: 1px solid rgba(217, 105, 76, 0.25); border-radius: 18px;
              padding: 28px; overflow: hidden;
            "
          >
            <h3
              style="
                font-family: 'Instrument Serif', serif; font-size: 22px;
                color: #EFE8DC; margin: 0 0 8px; font-weight: 400;
              "
            >Ready to explore?</h3>
            <p
              style="
                font-family: 'Hanken Grotesk', sans-serif; font-size: 14px;
                color: rgba(239, 232, 220, 0.6); margin: 0 0 22px; line-height: 1.5;
              "
            >Let AI craft the perfect itinerary for {{ dest.name }}.</p>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              <button
                (click)="goToPlanner()"
                style="
                  display: flex; align-items: center; justify-content: center; gap: 8px;
                  background: linear-gradient(135deg, #D9694C, #C45A3E);
                  color: #EFE8DC; border: none; border-radius: 100px;
                  padding: 14px 24px; font-family: 'Hanken Grotesk', sans-serif;
                  font-size: 15px; font-weight: 600; cursor: pointer;
                  transition: opacity 200ms ease; width: 100%;
                "
                (mouseenter)="$any($event.currentTarget).style.opacity='0.88'"
                (mouseleave)="$any($event.currentTarget).style.opacity='1'"
              >
                <span class="ms" style="font-size: 20px;">travel_explore</span>
                Plan a trip to {{ dest.name }}
              </button>
              <button
                (click)="goToChat()"
                style="
                  display: flex; align-items: center; justify-content: center; gap: 8px;
                  background: transparent; color: #EFE8DC;
                  border: 1px solid rgba(239, 232, 220, 0.2); border-radius: 100px;
                  padding: 14px 24px; font-family: 'Hanken Grotesk', sans-serif;
                  font-size: 15px; font-weight: 600; cursor: pointer;
                  transition: all 200ms ease; width: 100%;
                "
                (mouseenter)="$any($event.currentTarget).style.borderColor='rgba(239,232,220,0.5)'"
                (mouseleave)="$any($event.currentTarget).style.borderColor='rgba(239,232,220,0.2)'"
              >
                <span class="ms" style="font-size: 20px;">chat</span>
                Chat about {{ dest.name }}
              </button>
            </div>
          </div>
        </aside>
      </div>
    } @else {
      <!-- Loading skeleton -->
      <div style="min-height: 100vh; background: #EFE8DC;">
        <div
          style="
            width: 100%; min-height: 400px;
            background: linear-gradient(135deg, #E4D8C6, #EADFCD);
            animation: pulse 1.5s ease-in-out infinite;
          "
        ></div>
        <div style="max-width: 1200px; margin: 40px auto; padding: 0 32px; display: grid; grid-template-columns: 2fr 1fr; gap: 28px;">
          <div style="display: flex; flex-direction: column; gap: 32px;">
            <div style="background: #fff; border-radius: 18px; height: 300px; animation: pulse 1.5s ease-in-out infinite;"></div>
            <div style="background: #fff; border-radius: 18px; height: 200px; animation: pulse 1.5s ease-in-out infinite;"></div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <div style="background: #fff; border-radius: 18px; height: 350px; animation: pulse 1.5s ease-in-out infinite;"></div>
            <div style="background: #fff; border-radius: 18px; height: 200px; animation: pulse 1.5s ease-in-out infinite;"></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      background: #EFE8DC;
      min-height: 100vh;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
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

  readonly destination = signal<DestinationResponse | null>(null);
  readonly reviews = signal<ReviewResponse[]>([]);
  readonly reviewSummary = signal<ReviewSummary | null>(null);
  readonly guide = signal<DestinationGuide | null>(null);
  readonly guideLoading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    this.destinationService.getById(id).subscribe({
      next: (dest) => this.destination.set(dest),
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
    this.destinationService.getGuide(id).subscribe({
      next: (guide) => {
        this.guide.set(guide);
        this.guideLoading.set(false);
      },
      error: () => this.guideLoading.set(false),
    });
  }

  markHelpful(reviewId: string): void {
    this.reviewService.markHelpful(reviewId).subscribe(() => {
      this.reviews.update((rs) =>
        rs.map((r) =>
          r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
        )
      );
    });
  }

  getStars(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => (i < Math.round(rating) ? 1 : 0));
  }

  getMonthNames(bestMonths: string): string {
    return (
      bestMonths
        ?.split(',')
        .map((m) => MONTH_NAMES[parseInt(m.trim(), 10) - 1])
        .filter(Boolean)
        .join(', ') ?? ''
    );
  }

  getMonthList(): string[] {
    const dest = this.destination();
    if (!dest?.bestMonths) return [];
    return dest.bestMonths
      .split(',')
      .map((m) => MONTH_NAMES[parseInt(m.trim(), 10) - 1])
      .filter((m): m is (typeof MONTH_NAMES)[number] => Boolean(m));
  }

  getTags(): string[] {
    return (
      this.destination()
        ?.tags?.split(',')
        .map((t) => t.trim())
        .filter(Boolean) ?? []
    );
  }

  goToPlanner(): void {
    this.router.navigate(['/planner']);
  }

  goToChat(): void {
    this.router.navigate(['/chat']);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
