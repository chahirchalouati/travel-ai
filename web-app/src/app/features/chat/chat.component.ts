import {
  Component, OnInit, AfterViewChecked, ViewChild,
  ElementRef, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { TripPlannerService } from '../../core/services/trip-planner.service';
import { ItineraryCartService } from '../../core/services/itinerary-cart.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MarkdownPipe } from '../../shared/pipes/markdown.pipe';
import { ChatMapComponent, MapPin } from './chat-map.component';
import { EntityCardComponent, EntityAttachment } from './entity-card.component';
import type {
  ConversationResponse, ChatEntityAttachment,
  ItineraryPlanRequest, ItineraryPlanResponse,
} from '../../core/models/api.models';

interface ChatMsg {
  role: string;
  content: string;
  followUps?: string[];
  attachments?: EntityAttachment[];
  mapPins?: MapPin[];
  itinerary?: ItineraryPlanResponse;
  copied?: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, MarkdownPipe, ChatMapComponent, EntityCardComponent],
  template: `
    <div class="stage">
      <!-- Atmospheric backdrop -->
      <div class="aurora" aria-hidden="true">
        <span class="blob blob--teal"></span>
        <span class="blob blob--coral"></span>
        <span class="blob blob--violet"></span>
        <div class="grid-veil"></div>
      </div>

      <!-- Floating top actions -->
      <header class="topbar">
        <div class="topbar-actions">
          <button class="pill-btn" (click)="newChat()" aria-label="New conversation">
            <span class="ms">edit_square</span>
            <span class="pill-btn__label">{{ 'chat.new' | transloco }}</span>
          </button>
          <button class="pill-btn" (click)="historyOpen.set(true)" aria-label="Conversation history">
            <span class="ms">history</span>
            <span class="pill-btn__label">{{ 'chat.history' | transloco }}</span>
          </button>
        </div>
      </header>

      <!-- History drawer -->
      @if (historyOpen()) {
        <div class="drawer-scrim" (click)="historyOpen.set(false)"></div>
        <aside class="drawer glass" role="dialog" aria-label="Conversation history">
          <div class="drawer-head">
            <h2>{{ 'chat.conversations' | transloco }}</h2>
            <button class="icon-btn" (click)="historyOpen.set(false)" aria-label="Close"><span class="ms">close</span></button>
          </div>

          <button class="drawer-new" (click)="newChat(); historyOpen.set(false)">
            <span class="ms">add</span> {{ 'chat.startNew' | transloco }}
          </button>

          @if (authService.isAuthenticated()) {
            <div class="drawer-list">
              @for (conv of conversations(); track conv.id) {
                <button
                  class="convo-item"
                  [class.active]="currentConversationId() === conv.id"
                  (click)="selectConversation(conv.id); historyOpen.set(false)"
                >
                  <span class="ms convo-item__icon">forum</span>
                  <span class="convo-item__body">
                    <span class="convo-item__title">{{ conv.title }}</span>
                    <span class="convo-item__date">{{ formatDate(conv.updatedAt) }}</span>
                  </span>
                  <span class="ms convo-item__del" (click)="deleteConversation(conv.id, $event)" aria-label="Delete">delete</span>
                </button>
              } @empty {
                <p class="drawer-empty">{{ 'chat.empty' | transloco }}</p>
              }
            </div>
          } @else {
            <div class="drawer-locked">
              <span class="ms">lock_open</span>
              <p>{{ 'chat.lockedMsg' | transloco }}</p>
              <button class="solid-btn" (click)="showAuthModal.set(true); historyOpen.set(false)">{{ 'chat.signIn' | transloco }}</button>
            </div>
          }
        </aside>
      }

      <!-- Conversation column -->
      <main class="column" #messagesContainer>
        <div class="thread">
          @if (messages().length === 0 && !isTyping()) {
            <div class="welcome">
              <div class="welcome-orb"><span class="ms">explore</span></div>
              <h1 class="welcome-title">{{ 'chat.welcomeTitle' | transloco }}</h1>
              <p class="welcome-sub">{{ 'chat.welcomeSub' | transloco }}</p>

              <div class="chips">
                @for (c of capabilities; track c.key) {
                  <span class="chip"><span class="ms">{{ c.icon }}</span>{{ c.key | transloco }}</span>
                }
              </div>

              <div class="suggest-grid">
                @for (s of suggestionCards; track s.textKey) {
                  <button class="suggest glass" (click)="useSuggestionKey(s.textKey)">
                    <span class="suggest-icon"><span class="ms">{{ s.icon }}</span></span>
                    <span class="suggest-body">
                      <span class="suggest-kicker">{{ s.labelKey | transloco }}</span>
                      <span class="suggest-text">{{ s.textKey | transloco }}</span>
                    </span>
                    <span class="ms suggest-go">arrow_outward</span>
                  </button>
                }
              </div>
            </div>
          }

          @for (msg of messages(); track $index; let i = $index) {
            <div class="row" [class.row--user]="msg.role === 'user'">
              @if (msg.role === 'assistant') {
                <div class="avatar"><span class="ms">travel_explore</span></div>
              }
              <div class="bubble-wrap">
                @if (msg.role === 'user') {
                  <div class="bubble bubble--user">{{ msg.content }}</div>
                } @else {
                  <div class="bubble bubble--bot glass markdown-body" [innerHTML]="msg.content | markdown"></div>

                  @if (msg.attachments && msg.attachments.length > 0) {
                    <div class="cards-rail">
                      @for (att of msg.attachments; track att.id) {
                        <app-entity-card [entity]="att" />
                      }
                    </div>
                  }

                  @if (msg.itinerary; as it) {
                    <div class="itinerary-card glass">
                      <div class="itinerary-card__head">
                        <strong>{{ it.destination }} · {{ it.days }} {{ 'tripPlanner.result.daysLabel' | transloco }}</strong>
                        <span class="itinerary-card__total">{{ it.estimatedTotal | currency:it.currency:'symbol':'1.0-0' }}</span>
                      </div>
                      <ul class="itinerary-card__lines">
                        @if (it.hotel) { <li><span class="ms">hotel</span>{{ it.hotel.name }}</li> }
                        @if (it.flight) { <li><span class="ms">flight</span>{{ it.flight.airline }} · {{ it.flight.origin }} → {{ it.flight.destination }}</li> }
                        <li><span class="ms">event</span>{{ it.plan.length }} {{ 'tripPlanner.result.daysLabel' | transloco }}</li>
                      </ul>
                      <button class="itinerary-card__cta" (click)="addItinerary(it)">
                        <span class="ms">add_shopping_cart</span>{{ 'tripPlanner.result.addAll' | transloco }}
                      </button>
                    </div>
                  }

                  @if (msg.mapPins && msg.mapPins.length > 0) {
                    <div class="map-frame glass"><app-chat-map [pins]="msg.mapPins" /></div>
                  }

                  @if (msg.followUps && msg.followUps.length > 0) {
                    <div class="followups">
                      @for (fu of msg.followUps; track fu) {
                        <button class="followup" (click)="useSuggestion(fu)">
                          {{ fu }}<span class="ms">arrow_forward</span>
                        </button>
                      }
                    </div>
                  }

                  <div class="actions">
                    <button class="ghost-btn" (click)="copyMessage(i)">
                      <span class="ms">{{ msg.copied ? 'check' : 'content_copy' }}</span>
                      {{ (msg.copied ? 'chat.copied' : 'chat.copy') | transloco }}
                    </button>
                    <button class="ghost-btn" (click)="regenerate(i)">
                      <span class="ms">refresh</span> {{ 'chat.retry' | transloco }}
                    </button>
                  </div>
                }
              </div>
            </div>
          }

          @if (isTyping()) {
            <div class="row">
              <div class="avatar"><span class="ms">travel_explore</span></div>
              <div class="bubble-wrap">
                <div class="bubble bubble--bot glass typing">
                  <span class="dots"><i></i><i></i><i></i></span>
                  <span class="typing-label">{{ 'chat.searching' | transloco }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      </main>

      <!-- Floating composer -->
      <div class="composer-zone">
        @if (!authService.isAuthenticated()) {
          <button class="auth-cta glass" (click)="showAuthModal.set(true)">
            <span class="ms">lock</span>
            <span>{{ 'chat.authCta' | transloco }}</span>
            <span class="ms">arrow_forward</span>
          </button>
        } @else {
          <div class="composer glass">
            <textarea
              class="composer-input"
              [ngModel]="inputText()"
              (ngModelChange)="inputText.set($event)"
              (keydown)="onKeydown($event)"
              [placeholder]="'chat.placeholder' | transloco"
              rows="1"
            ></textarea>
            <button
              class="send"
              (click)="send()"
              [disabled]="!inputText().trim() || isTyping()"
              aria-label="Send message"
            >
              <span class="ms">{{ isTyping() ? 'stop' : 'arrow_upward' }}</span>
            </button>
          </div>
          <p class="composer-hint">{{ 'chat.hint' | transloco }}</p>
        }
      </div>
    </div>

    <!-- Auth Modal -->
    @if (showAuthModal()) {
      <div class="auth-backdrop" role="dialog" aria-modal="true">
        <div class="auth-card glass">
          <button class="ms auth-close" (click)="closeAuthModal()" type="button">close</button>

          <div class="auth-logo">
            <div class="auth-logo-icon"><span class="ms">travel_explore</span></div>
            <span class="auth-logo-name">TravelAI</span>
          </div>

          <div class="auth-tabs">
            <button class="auth-tab" [class.active]="authMode() === 'login'" (click)="authMode.set('login')" type="button">{{ 'auth.signIn' | transloco }}</button>
            <button class="auth-tab" [class.active]="authMode() === 'register'" (click)="authMode.set('register')" type="button">{{ 'auth.register' | transloco }}</button>
          </div>

          @if (authErrorMsg) {
            <div class="auth-error" role="alert">{{ authErrorMsg }}</div>
          }

          @if (authMode() === 'register') {
            <div class="auth-names">
              <div class="auth-field">
                <label>{{ 'auth.firstName' | transloco }}</label>
                <input [(ngModel)]="authFirstNameVal" placeholder="John">
              </div>
              <div class="auth-field">
                <label>{{ 'auth.lastName' | transloco }}</label>
                <input [(ngModel)]="authLastNameVal" placeholder="Doe">
              </div>
            </div>
          }

          <div class="auth-field">
            <label>{{ 'auth.email' | transloco }}</label>
            <input [(ngModel)]="authEmailVal" type="email" placeholder="email@example.com">
          </div>

          <div class="auth-field auth-field--last">
            <label>{{ 'auth.password' | transloco }}</label>
            <input [(ngModel)]="authPasswordVal" type="password" placeholder="••••••••">
          </div>

          <button class="auth-submit" (click)="authMode() === 'login' ? loginAuth() : registerAuth()" [disabled]="authLoadingState" type="button">
            @if (authLoadingState) {
              {{ 'auth.loading' | transloco }}
            } @else {
              {{ (authMode() === 'login' ? 'auth.signIn' : 'auth.create') | transloco }}
            }
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Host: use global design-system tokens throughout ─────────────────── */
    :host {
      display: block;
      height: calc(100dvh - 64px);
      font-family: var(--font-body);
      color: var(--text-primary);
    }

    .stage {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--bg-primary);
    }

    /* Remove old aurora/blob backdrop */
    .aurora, .blob, .grid-veil { display: none; }

    /* .glass is a legacy class on several elements; reset it to a neutral card */
    .glass {
      background: var(--surface);
      border: 1px solid var(--border);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }

    /* ── Top bar ──────────────────────────────────────────────────────────── */
    .topbar {
      position: relative; z-index: 20; flex-shrink: 0;
      margin: 14px clamp(12px, 4vw, 28px) 0;
      height: 54px; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: flex-end;
      gap: 10px; padding: 0 14px;
      background: var(--surface); border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
    }
    .topbar-actions { display: flex; gap: 8px; }
    .pill-btn {
      display: inline-flex; align-items: center; gap: 7px;
      height: 36px; padding: 0 14px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--bg-secondary);
      color: var(--text-primary); font-family: var(--font-body); font-size: 13px; font-weight: 700;
      cursor: pointer; transition: background var(--duration-fast), box-shadow var(--duration-fast);
    }
    .pill-btn .ms { font-size: 17px; }
    .pill-btn:hover { background: var(--bg-tertiary); box-shadow: var(--shadow-sm); }

    /* ── Scroll column ────────────────────────────────────────────────────── */
    .column {
      flex: 1; overflow-y: auto; overflow-x: hidden;
      scroll-behavior: smooth; scrollbar-width: thin;
      scrollbar-color: var(--border) transparent;
    }
    .column::-webkit-scrollbar { width: 7px; }
    .column::-webkit-scrollbar-thumb { background: var(--border); border-radius: 7px; }

    .thread {
      width: 100%; max-width: 840px; margin: 0 auto;
      padding: 26px clamp(14px, 4vw, 24px) 200px;
      display: flex; flex-direction: column; gap: 22px;
    }

    /* ── Welcome state ────────────────────────────────────────────────────── */
    .welcome { text-align: center; padding: 5vh 0 1vh; }
    .welcome-orb {
      width: 84px; height: 84px; margin: 0 auto 22px;
      border-radius: var(--radius-lg); display: grid; place-items: center;
      background: var(--brand-light); border: 1px solid var(--border);
      box-shadow: var(--shadow-md);
    }
    .welcome-orb .ms { font-size: 40px; color: var(--color-red-ink); }
    .welcome-title {
      font-family: var(--font-display);
      font-size: clamp(28px, 5vw, 44px); font-weight: 600; letter-spacing: -0.015em;
      color: var(--text-primary); margin: 0 0 12px;
    }
    .welcome-sub {
      font-size: 15px; line-height: 1.65; color: var(--text-secondary);
      max-width: 480px; margin: 0 auto 26px;
    }

    .chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 26px; }
    .chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 13px; border-radius: var(--radius-sm);
      background: var(--surface); border: 1px solid var(--border);
      color: var(--text-secondary); font-size: 12.5px; font-weight: 600;
      box-shadow: var(--shadow-sm);
    }
    .chip .ms { font-size: 15px; color: var(--teal); }

    .suggest-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
      max-width: 680px; margin: 0 auto;
    }
    .suggest {
      display: flex; align-items: center; gap: 13px; text-align: left;
      padding: 15px 16px; border-radius: var(--radius-md); cursor: pointer;
      background: var(--surface); border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      transition: transform var(--duration-normal) var(--ease-out-expo),
                  box-shadow var(--duration-normal) var(--ease-out-expo),
                  border-color var(--duration-normal);
    }
    .suggest:hover { border-color: var(--color-ink); box-shadow: var(--shadow-lg); }
    .suggest-icon {
      width: 42px; height: 42px; flex-shrink: 0; border-radius: var(--radius-sm);
      background: var(--brand-light); display: grid; place-items: center;
    }
    .suggest-icon .ms { font-size: 21px; color: var(--color-red-ink); }
    .suggest-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .suggest-kicker { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-tertiary); }
    .suggest-text { font-size: 13.5px; font-weight: 700; color: var(--text-primary); line-height: 1.35; }
    .suggest-go { font-size: 18px; color: var(--text-tertiary); transition: transform var(--duration-fast), color var(--duration-fast); }
    .suggest:hover .suggest-go { color: var(--color-red-ink); transform: translate(2px,-2px); }

    /* ── Messages ─────────────────────────────────────────────────────────── */
    .row { display: flex; gap: 12px; align-items: flex-start; animation: rise var(--duration-normal) var(--ease-out-expo); }
    .row--user { flex-direction: row-reverse; }

    .avatar {
      width: 36px; height: 36px; flex-shrink: 0; border-radius: var(--radius-sm);
      background: var(--color-red);
      display: grid; place-items: center; margin-top: 2px;
      box-shadow: var(--shadow-sm);
    }
    .avatar .ms { font-size: 18px; color: #fff; }

    .bubble-wrap { display: flex; flex-direction: column; gap: 9px; max-width: 80%; min-width: 0; }
    .row--user .bubble-wrap { align-items: flex-end; }

    .bubble { padding: 13px 17px; font-size: 14.5px; line-height: 1.62; word-break: break-word; border-radius: var(--radius-md); }
    .bubble--user {
      background: var(--color-red);
      color: #fff; border-radius: var(--radius-md) var(--radius-md) 6px var(--radius-md);
      box-shadow: var(--shadow-md);
    }
    .bubble--bot {
      background: var(--surface); border: 1px solid var(--border);
      color: var(--text-primary); border-radius: 6px var(--radius-md) var(--radius-md) var(--radius-md);
      box-shadow: var(--shadow-sm);
    }

    .typing { display: inline-flex; align-items: center; gap: 11px; }
    .dots { display: inline-flex; gap: 5px; }
    .dots i { width: 7px; height: 7px; border-radius: 50%; background: var(--brand); animation: bounce 1.2s ease-in-out infinite; }
    .dots i:nth-child(2) { animation-delay: 0.15s; }
    .dots i:nth-child(3) { animation-delay: 0.3s; }
    .typing-label { font-size: 12.5px; color: var(--text-secondary); font-weight: 600; }

    .actions { display: flex; gap: 7px; opacity: 0; transition: opacity var(--duration-fast); }
    .row:hover .actions { opacity: 1; }
    .ghost-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 11px; border-radius: var(--radius-sm);
      background: var(--bg-secondary); border: 1px solid var(--border);
      color: var(--text-secondary); font-family: var(--font-body); font-size: 11.5px; font-weight: 700; cursor: pointer;
      transition: color var(--duration-fast), background var(--duration-fast), border-color var(--duration-fast);
    }
    .ghost-btn .ms { font-size: 14px; }
    .ghost-btn:hover { color: var(--color-red-ink); background: var(--brand-light); border-color: var(--brand-light); }

    .followups { display: flex; flex-wrap: wrap; gap: 8px; }
    .followup {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: var(--radius-sm);
      background: var(--surface); border: 1px solid var(--border);
      color: var(--color-red-ink); font-family: var(--font-body); font-size: 12.5px; font-weight: 700; cursor: pointer;
      box-shadow: var(--shadow-sm);
      transition: transform var(--duration-fast), background var(--duration-fast), box-shadow var(--duration-fast);
    }
    .followup .ms { font-size: 14px; }
    .followup:hover { background: var(--brand-light); border-color: var(--brand-light); transform: translateY(-1px); box-shadow: var(--shadow-md); }

    .cards-rail { display: flex; gap: 12px; overflow-x: auto; padding: 2px 2px 8px; scrollbar-width: none; }
    .cards-rail::-webkit-scrollbar { display: none; }

    .itinerary-card { margin-top: 12px; padding: 14px 16px; border-radius: 6px; }
    .itinerary-card__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
    .itinerary-card__head strong { font-size: 15px; }
    .itinerary-card__total { font-weight: 700; color: var(--color-red); }
    .itinerary-card__lines { list-style: none; margin: 0 0 12px; padding: 0; display: flex; flex-direction: column; gap: 6px; }
    .itinerary-card__lines li { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-secondary); }
    .itinerary-card__lines .ms { font-size: 16px; color: var(--color-red); }
    .itinerary-card__cta {
      display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
      background: var(--color-ink, #111); color: var(--color-text-on-dark);
      border: none; padding: 9px 14px; border-radius: 4px;
      font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase;
    }
    .itinerary-card__cta:hover { background: #000; }
    .itinerary-card__cta .ms { font-size: 16px; }

    .map-frame {
      padding: 6px; border-radius: var(--radius-md);
      background: var(--surface); border: 1px solid var(--border);
    }
    .map-frame ::ng-deep .map-container { border: none; border-radius: 3px; height: 240px; }

    /* ── Composer ─────────────────────────────────────────────────────────── */
    .composer-zone {
      position: absolute; left: 0; right: 0; bottom: 0; z-index: 20;
      padding: 0 clamp(14px, 4vw, 24px) 22px;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      background: linear-gradient(to top, var(--bg-primary) 55%, transparent);
      pointer-events: none;
    }
    .composer-zone > * { pointer-events: auto; }
    .composer {
      width: 100%; max-width: 840px;
      display: flex; align-items: flex-end; gap: 10px;
      padding: 9px 9px 9px 18px; border-radius: var(--radius-lg);
      background: var(--surface); border: 1px solid var(--border);
      box-shadow: var(--shadow-md);
    }
    .composer-input {
      flex: 1; border: none; background: transparent; resize: none;
      font-family: var(--font-body); font-size: 14.5px; color: var(--text-primary);
      outline: none; padding: 8px 0; line-height: 1.5; max-height: 150px;
    }
    .composer-input::placeholder { color: var(--text-tertiary); }
    .send {
      width: 42px; height: 42px; flex-shrink: 0; border-radius: var(--radius-sm); border: none;
      background: var(--color-red);
      color: #fff; cursor: pointer; display: grid; place-items: center;
      box-shadow: var(--shadow-sm);
      transition: transform var(--duration-fast), opacity var(--duration-fast), box-shadow var(--duration-fast);
    }
    .send .ms { font-size: 20px; }
    .send:hover:not(:disabled) { transform: scale(1.07); box-shadow: var(--shadow-md); }
    .send:disabled { opacity: 0.4; cursor: default; }
    .composer-hint { font-size: 11.5px; color: var(--text-tertiary); margin: 0; text-align: center; }

    .auth-cta {
      display: inline-flex; align-items: center; gap: 11px;
      padding: 14px 22px; border-radius: var(--radius-sm);
      background: var(--surface); border: 1px solid var(--border);
      font-size: 14px; font-weight: 700; color: var(--text-primary); cursor: pointer;
      box-shadow: var(--shadow-md);
      transition: box-shadow var(--duration-fast), transform var(--duration-fast);
    }
    .auth-cta:hover { transform: translateY(-1px); box-shadow: var(--shadow-lg); }
    .auth-cta .ms { font-size: 18px; color: var(--color-red-ink); }

    /* ── History drawer ───────────────────────────────────────────────────── */
    .drawer-scrim {
      position: fixed; inset: 0; z-index: 40;
      background: rgba(33,27,20,0.45); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
      animation: fade var(--duration-fast) ease;
    }
    .drawer {
      position: fixed; top: 0; right: 0; bottom: 0; z-index: 41;
      width: min(360px, 88vw); border-radius: var(--radius-lg) 0 0 var(--radius-lg);
      padding: 22px; display: flex; flex-direction: column; gap: 16px;
      background: var(--surface); border-left: 1px solid var(--border);
      box-shadow: var(--shadow-lg);
      animation: slide-in var(--duration-normal) var(--ease-out-expo);
    }
    .drawer-head { display: flex; align-items: center; justify-content: space-between; }
    .drawer-head h2 { font-size: 18px; font-weight: 800; margin: 0; letter-spacing: -0.02em; color: var(--text-primary); }
    .icon-btn {
      width: 34px; height: 34px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); cursor: pointer;
      background: var(--bg-secondary); display: grid; place-items: center; color: var(--text-secondary);
      transition: background var(--duration-fast);
    }
    .icon-btn:hover { background: var(--bg-tertiary); }
    .icon-btn .ms { font-size: 19px; }
    .drawer-new {
      display: flex; align-items: center; gap: 8px; justify-content: center;
      padding: 12px; border-radius: var(--radius-sm); cursor: pointer;
      border: 1.5px dashed var(--border); background: var(--bg-secondary);
      color: var(--text-primary); font-family: var(--font-body); font-size: 13.5px; font-weight: 700;
      transition: background var(--duration-fast);
    }
    .drawer-new:hover { background: var(--bg-tertiary); }
    .drawer-new .ms { font-size: 18px; color: var(--color-red-ink); }
    .drawer-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
    .convo-item {
      display: flex; align-items: center; gap: 11px; text-align: left;
      padding: 11px 12px; border-radius: var(--radius-sm); border: 1px solid transparent;
      background: transparent; cursor: pointer; font-family: var(--font-body);
      transition: background var(--duration-fast);
    }
    .convo-item:hover { background: var(--bg-secondary); }
    .convo-item.active { background: var(--brand-light); border-color: rgba(190,67,41,0.2); }
    .convo-item__icon { font-size: 18px; color: var(--text-tertiary); }
    .convo-item.active .convo-item__icon { color: var(--color-red-ink); }
    .convo-item__body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .convo-item__title { font-size: 13.5px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .convo-item__date { font-size: 11.5px; color: var(--text-tertiary); margin-top: 1px; }
    .convo-item__del { font-size: 17px; color: var(--text-tertiary); opacity: 0; transition: opacity var(--duration-fast), color var(--duration-fast); }
    .convo-item:hover .convo-item__del { opacity: 1; }
    .convo-item__del:hover { color: var(--color-red-ink); }
    .drawer-empty { font-size: 13px; color: var(--text-secondary); text-align: center; padding: 24px 8px; line-height: 1.5; }
    .drawer-locked { text-align: center; padding: 28px 10px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .drawer-locked .ms { font-size: 32px; color: var(--text-tertiary); }
    .drawer-locked p { font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.5; }
    .solid-btn {
      padding: 10px 22px; border-radius: var(--radius-sm); border: none; cursor: pointer;
      background: var(--brand); color: #fff; font-family: var(--font-body); font-size: 13.5px; font-weight: 800;
      transition: background var(--duration-fast), box-shadow var(--duration-fast);
    }
    .solid-btn:hover { background: var(--brand-hover); box-shadow: var(--shadow-sm); }

    /* ── Auth modal ───────────────────────────────────────────────────────── */
    .auth-backdrop {
      position: fixed; inset: 0; z-index: 500; display: grid; place-items: center; padding: 20px;
      background: rgba(33,27,20,0.5); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      animation: fade var(--duration-fast) ease;
    }
    .auth-card {
      position: relative; width: 100%; max-width: 410px;
      border-radius: var(--radius-lg); padding: 32px 28px;
      box-sizing: border-box; overflow: hidden;
      background: var(--surface); border: 1px solid var(--border);
      box-shadow: var(--shadow-lg); animation: pop var(--duration-normal) var(--ease-out-expo);
    }
    .auth-close {
      position: absolute; top: 16px; right: 16px;
      width: 32px; height: 32px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--bg-secondary);
      cursor: pointer; color: var(--text-secondary); font-size: 19px;
      display: grid; place-items: center; transition: background var(--duration-fast);
    }
    .auth-close:hover { background: var(--bg-tertiary); }
    .auth-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
    .auth-logo-icon {
      width: 40px; height: 40px; border-radius: var(--radius-sm); display: grid; place-items: center;
      background: var(--color-red); box-shadow: var(--shadow-sm);
    }
    .auth-logo-icon .ms { font-size: 21px; color: #fff; }
    .auth-logo-name { font-size: 17px; font-weight: 800; color: var(--text-primary); }
    .auth-tabs {
      display: flex; gap: 3px; padding: 4px; margin-bottom: 20px;
      background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-sm);
    }
    .auth-tab {
      flex: 1; padding: 9px; border-radius: 8px; border: none; background: transparent; cursor: pointer;
      font-family: var(--font-body); font-size: 13.5px; font-weight: 700;
      color: var(--text-secondary); transition: all var(--duration-fast);
    }
    .auth-tab.active {
      background: var(--surface); color: var(--text-primary);
      border: 1px solid var(--border); box-shadow: var(--shadow-sm);
    }
    .auth-names { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; min-width: 0; }
    .auth-names .auth-field { min-width: 0; }
    .auth-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 13px; }
    .auth-field--last { margin-bottom: 20px; }
    .auth-field label { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .auth-field input {
      width: 100%; box-sizing: border-box;
      padding: 11px 14px; border-radius: var(--radius-sm); border: 1.5px solid var(--border);
      background: var(--bg-secondary); font-family: var(--font-body); font-size: 14px; color: var(--text-primary); outline: none;
      transition: border-color var(--duration-fast), background var(--duration-fast);
    }
    .auth-field input:focus { border-color: var(--color-red-ink); background: var(--surface); }
    .auth-error {
      font-size: 12.5px; color: #C9322B; margin-bottom: 14px; padding: 9px 12px; border-radius: var(--radius-sm);
      background: rgba(201,50,43,0.06); border: 1px solid rgba(201,50,43,0.2);
    }
    .auth-submit {
      width: 100%; padding: 14px; border-radius: var(--radius-sm); border: none; cursor: pointer;
      background: var(--brand); color: #fff;
      font-family: var(--font-body); font-size: 14.5px; font-weight: 800;
      box-shadow: var(--shadow-sm);
      transition: transform var(--duration-fast), background var(--duration-fast), opacity var(--duration-fast), box-shadow var(--duration-fast);
    }
    .auth-submit:hover:not(:disabled) { background: var(--brand-hover); transform: translateY(-1px); box-shadow: var(--shadow-md); }
    .auth-submit:disabled { opacity: 0.55; cursor: default; }

    /* ── Markdown ─────────────────────────────────────────────────────────── */
    :host ::ng-deep .markdown-body h1,
    :host ::ng-deep .markdown-body h2,
    :host ::ng-deep .markdown-body h3,
    :host ::ng-deep .markdown-body h4 { margin: 16px 0 8px; color: var(--text-primary); line-height: 1.3; }
    :host ::ng-deep .markdown-body h1:first-child,
    :host ::ng-deep .markdown-body h2:first-child,
    :host ::ng-deep .markdown-body h3:first-child { margin-top: 0; }
    :host ::ng-deep .markdown-body h2 { font-size: 16.5px; font-weight: 800; }
    :host ::ng-deep .markdown-body h3 { font-size: 14.5px; font-weight: 800; }
    :host ::ng-deep .markdown-body p { margin: 6px 0; }
    :host ::ng-deep .markdown-body p:first-child { margin-top: 0; }
    :host ::ng-deep .markdown-body p:last-child { margin-bottom: 0; }
    :host ::ng-deep .markdown-body ul,
    :host ::ng-deep .markdown-body ol { padding-left: 20px; margin: 6px 0; }
    :host ::ng-deep .markdown-body li { margin: 4px 0; }
    :host ::ng-deep .markdown-body strong { font-weight: 800; }
    :host ::ng-deep .markdown-body code {
      background: var(--bg-secondary); padding: 2px 6px; border-radius: 6px; font-size: 13px; color: var(--text-primary);
    }
    :host ::ng-deep .markdown-body table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    :host ::ng-deep .markdown-body th,
    :host ::ng-deep .markdown-body td { padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--border); }
    :host ::ng-deep .markdown-body th { font-weight: 800; color: var(--text-secondary); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    :host ::ng-deep .markdown-body a { color: var(--color-red-ink); text-decoration: none; font-weight: 700; }
    :host ::ng-deep .markdown-body a:hover { text-decoration: underline; }
    :host ::ng-deep .markdown-body blockquote {
      margin: 8px 0; padding: 8px 14px; border-left: 3px solid var(--brand);
      background: var(--brand-light); border-radius: 0 8px 8px 0; color: var(--text-secondary);
    }

    /* ── Animations ───────────────────────────────────────────────────────── */
    @keyframes bounce { 0%,80%,100% { transform: translateY(0); opacity: 0.6; } 40% { transform: translateY(-7px); opacity: 1; } }
    @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    @keyframes pop { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: none; } }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slide-in { from { transform: translateX(100%); } to { transform: none; } }

    @media (prefers-reduced-motion: reduce) {
      .dots i { animation: none !important; }
      .row, .auth-card, .drawer { animation: none !important; }
    }

    /* ── Responsive ───────────────────────────────────────────────────────── */
    @media (max-width: 720px) {
      .pill-btn__label { display: none; }
      .pill-btn { padding: 0 11px; }
      .suggest-grid { grid-template-columns: 1fr; }
      .bubble-wrap { max-width: 88%; }
      .thread { padding-bottom: 180px; }
    }
  `]
})
export class ChatComponent implements OnInit, AfterViewChecked {
  private readonly chatService = inject(ChatService);
  readonly authService = inject(AuthService);
  private readonly transloco = inject(TranslocoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tripPlanner = inject(TripPlannerService);
  private readonly itineraryCart = inject(ItineraryCartService);

  conversations = signal<ConversationResponse[]>([]);
  currentConversationId = signal<string | null>(null);
  messages = signal<ChatMsg[]>([]);
  inputText = signal('');
  isTyping = signal(false);
  conversationTitle = signal('New Conversation');
  historyOpen = signal(false);

  // Auth modal state
  showAuthModal = signal(false);
  authMode = signal<'login' | 'register'>('login');
  authEmailVal = '';
  authPasswordVal = '';
  authFirstNameVal = '';
  authLastNameVal = '';
  authErrorMsg = '';
  authLoadingState = false;

  readonly capabilities = [
    { icon: 'explore', key: 'chat.caps.destinations' },
    { icon: 'hotel', key: 'chat.caps.hotels' },
    { icon: 'restaurant', key: 'chat.caps.restaurants' },
    { icon: 'map', key: 'chat.caps.itineraries' },
    { icon: 'compare_arrows', key: 'chat.caps.compare' },
    { icon: 'savings', key: 'chat.caps.budget' },
  ];

  readonly suggestionCards = [
    { icon: 'luggage', labelKey: 'chat.suggest.planLabel', textKey: 'chat.suggest.planText' },
    { icon: 'restaurant', labelKey: 'chat.suggest.diningLabel', textKey: 'chat.suggest.diningText' },
    { icon: 'beach_access', labelKey: 'chat.suggest.discoverLabel', textKey: 'chat.suggest.discoverText' },
    { icon: 'compare_arrows', labelKey: 'chat.suggest.compareLabel', textKey: 'chat.suggest.compareText' },
    { icon: 'hotel', labelKey: 'chat.suggest.hotelsLabel', textKey: 'chat.suggest.hotelsText' },
    { icon: 'savings', labelKey: 'chat.suggest.budgetLabel', textKey: 'chat.suggest.budgetText' },
  ];

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.loadConversations();
    }

    // The hero search navigates here with `?q=...`; pre-fill and auto-send it
    // so the conversation actually starts instead of opening an empty chat.
    const initialQuery = this.route.snapshot.queryParamMap.get('q')?.trim();
    if (initialQuery) {
      this.inputText.set(initialQuery);
      this.send();
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  loadConversations(): void {
    this.chatService.getConversations().subscribe(convos => {
      this.conversations.set(convos);
    });
  }

  selectConversation(id: string): void {
    this.currentConversationId.set(id);
    this.historyOpen.set(false);
    this.chatService.getConversation(id).subscribe(detail => {
      this.conversationTitle.set(detail.title);
      this.messages.set(
        detail.messages.map(m => ({
          role: m.role,
          content: m.content,
          followUps: m.role === 'assistant' ? this.extractFollowUps(m.content) : undefined,
        }))
      );
    });
  }

  newChat(): void {
    this.currentConversationId.set(null);
    this.messages.set([]);
    this.conversationTitle.set('New Conversation');
    this.historyOpen.set(false);
  }

  send(): void {
    const text = this.inputText().trim();
    if (!text || this.isTyping()) return;

    if (!this.authService.isAuthenticated()) {
      this.showAuthModal.set(true);
      return;
    }

    this.messages.update(msgs => [...msgs, { role: 'user', content: text }]);
    this.inputText.set('');
    this.isTyping.set(true);

    // Conversational planning: if the message reads like "plan a trip to X",
    // build a real itinerary inline instead of a plain chat reply.
    const brief = this.detectPlanBrief(text);
    if (brief) {
      this.planTrip(brief);
      return;
    }

    this.chatService.chat({
      conversationId: this.currentConversationId(),
      message: text
    }).subscribe({
      next: response => {
        this.isTyping.set(false);
        const followUps = this.extractFollowUps(response.reply);
        const attachments = this.mapAttachments(response.attachments);
        const mapPins = this.buildMapPins(response.attachments);
        this.messages.update(msgs => [
          ...msgs,
          { role: 'assistant', content: response.reply, followUps, attachments, mapPins }
        ]);
        this.currentConversationId.set(response.conversationId);
        this.conversationTitle.set(response.title);
        this.loadConversations();
      },
      error: () => {
        this.isTyping.set(false);
        this.messages.update(msgs => [
          ...msgs,
          { role: 'assistant', content: this.transloco.translate('common.error') }
        ]);
      }
    });
  }

  useSuggestion(text: string): void {
    this.inputText.set(text);
    this.send();
  }

  /**
   * Detects a trip-planning intent and extracts a brief. Conservative: needs both
   * a planning keyword and a plausible destination, so ordinary questions still go
   * to normal chat.
   */
  private detectPlanBrief(text: string): ItineraryPlanRequest | null {
    const lower = text.toLowerCase();
    const isPlan = /\b(plan|itinerary|itinerar|pianific|itinerario|planea|planifi|organi[zs])/.test(lower)
      || /(trip to|viaggio a|days in|giorni a|d[ií]as en|jours à)/.test(lower);
    if (!isPlan) {
      return null;
    }
    const destination = this.extractDestination(text);
    if (!destination) {
      return null;
    }
    return { destination, days: this.extractDays(lower) ?? undefined };
  }

  private extractDestination(text: string): string | null {
    const after = text.match(/(?:\bto|\bin|\ba|\bà|\ben|\bfor)\s+([A-ZÀ-Ý][\p{L}'\- ]{1,28})/u);
    const candidate = after?.[1] ?? text.match(/\b([A-ZÀ-Ý][\p{L}'\-]{2,})\b/u)?.[1];
    if (!candidate) {
      return null;
    }
    // Trim trailing connective words a greedy capture may pull in.
    return candidate.trim()
      .replace(/\s+(for|per|con|with|and|e|y|et|the|a|un|una)$/i, '')
      .trim() || null;
  }

  private extractDays(lower: string): number | null {
    const m = lower.match(/(\d{1,2})\s*(?:day|days|giorn|d[ií]as?|jours?)/);
    if (!m) {
      return null;
    }
    const n = parseInt(m[1], 10);
    return n >= 1 && n <= 14 ? n : null;
  }

  /** Calls the planner and appends the itinerary as an assistant message. */
  private planTrip(brief: ItineraryPlanRequest): void {
    this.tripPlanner.plan(brief).subscribe({
      next: itinerary => {
        this.isTyping.set(false);
        this.messages.update(msgs => [
          ...msgs,
          {
            role: 'assistant',
            content: itinerary.summary || this.transloco.translate('chat.plan.intro'),
            itinerary,
          },
        ]);
      },
      error: () => {
        this.isTyping.set(false);
        this.messages.update(msgs => [
          ...msgs,
          { role: 'assistant', content: this.transloco.translate('tripPlanner.error') },
        ]);
      },
    });
  }

  /** Adds the itinerary shown in a chat card to the trip cart and opens checkout. */
  addItinerary(itinerary: ItineraryPlanResponse): void {
    this.itineraryCart.addAll(itinerary);
    this.router.navigate(['/trip-cart']);
  }

  useSuggestionKey(key: string): void {
    this.useSuggestion(this.transloco.translate(key));
  }

  copyMessage(index: number): void {
    const msg = this.messages()[index];
    if (!msg) return;
    navigator.clipboard.writeText(msg.content);
    this.messages.update(msgs =>
      msgs.map((m, i) => i === index ? { ...m, copied: true } : m)
    );
    setTimeout(() => {
      this.messages.update(msgs =>
        msgs.map((m, i) => i === index ? { ...m, copied: false } : m)
      );
    }, 2000);
  }

  regenerate(index: number): void {
    const userMsgIndex = index - 1;
    const userMsg = this.messages()[userMsgIndex];
    if (!userMsg || userMsg.role !== 'user') return;

    this.messages.update(msgs => msgs.slice(0, index));
    this.isTyping.set(true);

    this.chatService.chat({
      conversationId: this.currentConversationId(),
      message: userMsg.content
    }).subscribe({
      next: response => {
        this.isTyping.set(false);
        const followUps = this.extractFollowUps(response.reply);
        const attachments = this.mapAttachments(response.attachments);
        const mapPins = this.buildMapPins(response.attachments);
        this.messages.update(msgs => [
          ...msgs,
          { role: 'assistant', content: response.reply, followUps, attachments, mapPins }
        ]);
      },
      error: () => {
        this.isTyping.set(false);
        this.messages.update(msgs => [
          ...msgs,
          { role: 'assistant', content: this.transloco.translate('common.error') }
        ]);
      }
    });
  }

  deleteConversation(id: string, event: Event): void {
    event.stopPropagation();
    this.chatService.deleteConversation(id).subscribe(() => {
      this.conversations.update(cs => cs.filter(c => c.id !== id));
      if (this.currentConversationId() === id) {
        this.newChat();
      }
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  loginAuth(): void {
    if (!this.authEmailVal || !this.authPasswordVal) {
      this.authErrorMsg = this.transloco.translate('auth.errRequired');
      return;
    }
    this.authLoadingState = true;
    this.authErrorMsg = '';
    this.authService.login({ email: this.authEmailVal, password: this.authPasswordVal }).subscribe({
      next: () => {
        this.authLoadingState = false;
        this.showAuthModal.set(false);
        this.authEmailVal = '';
        this.authPasswordVal = '';
        this.loadConversations();
        // Auto-send any query the user typed (or arrived with via ?q=) before login.
        if (this.inputText().trim()) this.send();
      },
      error: () => {
        this.authLoadingState = false;
        this.authErrorMsg = this.transloco.translate('auth.errLogin');
      }
    });
  }

  registerAuth(): void {
    if (!this.authFirstNameVal || !this.authLastNameVal || !this.authEmailVal || !this.authPasswordVal) {
      this.authErrorMsg = this.transloco.translate('auth.errRequired');
      return;
    }
    this.authLoadingState = true;
    this.authErrorMsg = '';
    this.authService.register({
      email: this.authEmailVal,
      password: this.authPasswordVal,
      firstName: this.authFirstNameVal,
      lastName: this.authLastNameVal,
    }).subscribe({
      next: () => {
        this.authLoadingState = false;
        this.showAuthModal.set(false);
        this.authEmailVal = '';
        this.authPasswordVal = '';
        this.authFirstNameVal = '';
        this.authLastNameVal = '';
        this.loadConversations();
        // Auto-send any query the user typed (or arrived with via ?q=) before registering.
        if (this.inputText().trim()) this.send();
      },
      error: (err: any) => {
        this.authLoadingState = false;
        this.authErrorMsg = err?.error?.error ?? this.transloco.translate('auth.errRegister');
      }
    });
  }

  closeAuthModal(): void {
    this.showAuthModal.set(false);
    this.authErrorMsg = '';
  }

  private mapAttachments(raw: ChatEntityAttachment[] | null | undefined): EntityAttachment[] {
    if (!raw || raw.length === 0) return [];
    return raw.map(a => ({
      id: a.id,
      type: a.type,
      name: a.name,
      subtitle: a.subtitle ?? '',
      description: a.description ?? '',
      imageUrl: a.imageUrl,
      price: a.price,
      priceLabel: a.priceLabel,
      rating: a.rating,
      latitude: a.latitude,
      longitude: a.longitude,
      tags: a.tags ?? [],
    }));
  }

  private buildMapPins(raw: ChatEntityAttachment[] | null | undefined): MapPin[] {
    if (!raw || raw.length === 0) return [];
    return raw
      .filter(a => a.latitude != null && a.longitude != null)
      .map(a => ({
        lat: a.latitude!,
        lng: a.longitude!,
        label: a.name,
        type: a.type,
      }));
  }

  private extractFollowUps(content: string): string[] {
    // Follow-ups are emitted as a trailing block after a '---' separator, one
    // '- question?' per line. The header label is localized by the model
    // (Italian, English, …), so we key off the separator and the question
    // lines themselves rather than a fixed English marker. Falls back to the
    // legacy English marker for messages produced before this change.
    const sections = content.split(/\n-{3,}\s*\n/);
    let tail = sections.length > 1 ? sections[sections.length - 1] : '';

    if (!tail) {
      const marker = '**You might also want to ask:**';
      const idx = content.indexOf(marker);
      if (idx === -1) return [];
      tail = content.substring(idx + marker.length);
    }

    return tail
      .split('\n')
      .map(line => line.replace(/^[\s>*-]+/, '').replace(/\*+/g, '').trim())
      .filter(line => line.length > 0 && line.endsWith('?'))
      .slice(0, 3);
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
