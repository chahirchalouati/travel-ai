import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { StoryService } from '../../core/services/story.service';
import type { TravelStory } from '../../core/services/story.service';

@Component({
  selector: 'app-trip-stories',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  template: `
    <section class="stories" aria-labelledby="stories-heading">
      <div class="stories-head">
        <div>
          <span class="stories-eyebrow">
            <span class="ms" style="font-size:16px">play_circle</span>
            {{ 'explore.stories.eyebrow' | transloco }}
          </span>
          <h2 class="stories-title" id="stories-heading">{{ 'explore.stories.title' | transloco }}</h2>
          <p class="stories-sub">{{ 'explore.stories.subtitle' | transloco }}</p>
        </div>
        <button class="stories-cta" (click)="goShare()" type="button">
          <span class="ms" style="font-size:18px">videocam</span>
          {{ 'explore.stories.cta' | transloco }}
        </button>
      </div>

      <div class="stories-grid">
        @for (s of stories(); track s.id) {
          <article class="story-card" [class.story-card--featured]="s.featured" (click)="goExplore()">
            <div class="story-media">
              <img [src]="s.posterUrl" [alt]="s.place" class="story-poster" loading="lazy" />
              @if (s.videoUrl) {
                <video
                  class="story-video"
                  [poster]="s.posterUrl"
                  [src]="s.videoUrl"
                  muted
                  loop
                  autoplay
                  playsinline
                  preload="metadata"
                  (canplay)="onCanPlay($event)"
                ></video>
              }
              <div class="story-overlay"></div>
              <span class="story-tag">{{ s.tag }}</span>
              <span class="story-duration">
                <span class="ms" style="font-size:14px">schedule</span>
                {{ s.minutes }} {{ 'explore.stories.duration' | transloco }}
              </span>
              <span class="story-play" aria-hidden="true">
                <span class="ms">play_arrow</span>
              </span>
            </div>
            <div class="story-info">
              <h3 class="story-place">{{ s.place }}</h3>
              <span class="story-country">
                <span class="ms" style="font-size:14px">location_on</span>
                {{ s.country }}
              </span>
            </div>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    :host {
      --ease: var(--ease-out-expo);
      --duration: var(--duration-normal);
      display: block;
      font-family: var(--font-body);
    }

    .stories {
      max-width: 1280px;
      margin: 0 auto;
      padding: clamp(3rem, 2rem + 3vw, 5rem) clamp(1rem, 0.5rem + 3vw, 4rem);
    }

    .stories-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .stories-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      color: var(--color-ink);
      font-family: var(--font-mono);
      font-size: 0.7rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .stories-eyebrow .ms { color: var(--color-red); }

    .stories-title {
      font-size: clamp(1.5rem, 1rem + 1.6vw, 2.1rem);
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      margin: 0.5rem 0 0.3rem;
      line-height: 1.1;
    }

    .stories-sub {
      font-size: 0.98rem;
      color: var(--text-secondary);
      margin: 0;
      max-width: 440px;
      line-height: 1.5;
    }

    .stories-cta {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      flex-shrink: 0;
      background: var(--text-primary);
      color: #fff;
      border: none;
      border-radius: 3px;
      padding: 11px 22px;
      font-family: inherit;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: background var(--duration) var(--ease), transform var(--duration) var(--ease);
    }

    .stories-cta:hover {
      background: var(--brand);
      transform: translateY(-2px);
    }

    /* Bento layout: featured spans 2 cols + 2 rows */
    .stories-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-auto-rows: 200px;
      gap: 16px;
    }

    .story-card {
      position: relative;
      grid-column: span 2;
      border-radius: 3px;
      overflow: hidden;
      cursor: pointer;
      background: #111;
      box-shadow: none;
      transition: transform var(--duration) var(--ease), box-shadow var(--duration) var(--ease);
    }

    .story-card--featured {
      grid-column: span 2;
      grid-row: span 2;
    }

    .story-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .story-media {
      position: absolute;
      inset: 0;
    }

    .story-poster,
    .story-video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .story-poster {
      animation: storyKenBurns 16s ease-in-out infinite alternate;
    }

    @keyframes storyKenBurns {
      from { transform: scale(1.05); }
      to   { transform: scale(1.16); }
    }

    /* Video fades in over the poster once it can play */
    .story-video {
      opacity: 0;
      transition: opacity 600ms var(--ease);
    }

    .story-video.is-ready {
      opacity: 1;
    }

    .story-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to top,
        rgba(0,0,0,0.72) 0%,
        rgba(0,0,0,0.15) 45%,
        rgba(0,0,0,0.05) 100%
      );
    }

    .story-tag {
      position: absolute;
      top: 14px;
      left: 14px;
      padding: 5px 12px;
      border-radius: 6px;
      background: rgba(255,255,255,0.18);
      border: 1px solid rgba(255,255,255,0.3);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #fff;
      font-size: 0.72rem;
      font-weight: 600;
    }

    .story-duration {
      position: absolute;
      top: 14px;
      right: 14px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 10px;
      border-radius: 6px;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #fff;
      font-size: 0.72rem;
      font-weight: 600;
    }

    .story-play {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(255,255,255,0.92);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--brand);
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
      opacity: 0;
      transition: opacity var(--duration) var(--ease), transform var(--duration) var(--ease);
    }

    .story-play .ms { font-size: 30px; }

    .story-card:hover .story-play {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }

    .story-card--featured .story-play {
      width: 68px;
      height: 68px;
    }

    .story-info {
      position: absolute;
      left: 18px;
      bottom: 16px;
      right: 18px;
      z-index: 1;
    }

    .story-place {
      font-size: 1.1rem;
      font-weight: 800;
      color: #fff;
      margin: 0;
      letter-spacing: -0.01em;
      text-shadow: 0 2px 12px rgba(0,0,0,0.4);
    }

    .story-card--featured .story-place {
      font-size: 1.6rem;
    }

    .story-country {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.8rem;
      font-weight: 500;
      color: rgba(255,255,255,0.85);
      margin-top: 2px;
    }

    @media (max-width: 880px) {
      .stories-grid {
        grid-template-columns: repeat(2, 1fr);
        grid-auto-rows: 180px;
      }
      .story-card,
      .story-card--featured {
        grid-column: span 1;
        grid-row: span 1;
      }
      .story-card--featured .story-place { font-size: 1.2rem; }
    }

    @media (max-width: 560px) {
      .stories-head { flex-direction: column; align-items: flex-start; }
      .stories-grid { grid-template-columns: 1fr; grid-auto-rows: 200px; }
    }
  `]
})
export class TripStoriesComponent implements OnInit {
  private readonly storyService = inject(StoryService);
  private readonly router = inject(Router);

  readonly stories = signal<TravelStory[]>([]);

  ngOnInit(): void {
    this.storyService.getStories().pipe(
      catchError(() => of([]))
    ).subscribe(stories => this.stories.set(stories.slice(0, 6)));
  }

  onCanPlay(event: Event): void {
    (event.target as HTMLVideoElement).classList.add('is-ready');
  }

  goShare(): void {
    this.router.navigate(['/trips']);
  }

  goExplore(): void {
    this.router.navigate(['/explore']);
  }
}
