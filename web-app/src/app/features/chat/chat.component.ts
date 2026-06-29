import {
  Component, OnInit, AfterViewChecked, ViewChild,
  ElementRef, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { MarkdownPipe } from '../../shared/pipes/markdown.pipe';
import { ChatMapComponent, MapPin } from './chat-map.component';
import { EntityCardComponent, EntityAttachment } from './entity-card.component';
import type { ConversationResponse, ChatEntityAttachment } from '../../core/models/api.models';

interface ChatMsg {
  role: string;
  content: string;
  followUps?: string[];
  attachments?: EntityAttachment[];
  mapPins?: MapPin[];
  copied?: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe, ChatMapComponent, EntityCardComponent],
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
            <span class="pill-btn__label">New</span>
          </button>
          <button class="pill-btn" (click)="historyOpen.set(true)" aria-label="Conversation history">
            <span class="ms">history</span>
            <span class="pill-btn__label">History</span>
          </button>
        </div>
      </header>

      <!-- History drawer -->
      @if (historyOpen()) {
        <div class="drawer-scrim" (click)="historyOpen.set(false)"></div>
        <aside class="drawer glass" role="dialog" aria-label="Conversation history">
          <div class="drawer-head">
            <h2>Conversations</h2>
            <button class="icon-btn" (click)="historyOpen.set(false)" aria-label="Close"><span class="ms">close</span></button>
          </div>

          <button class="drawer-new" (click)="newChat(); historyOpen.set(false)">
            <span class="ms">add</span> Start a new conversation
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
                <p class="drawer-empty">No conversations yet. Ask me anything to begin.</p>
              }
            </div>
          } @else {
            <div class="drawer-locked">
              <span class="ms">lock_open</span>
              <p>Sign in to save and revisit your conversations.</p>
              <button class="solid-btn" (click)="showAuthModal.set(true); historyOpen.set(false)">Sign in</button>
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
              <h1 class="welcome-title">Where to next?</h1>
              <p class="welcome-sub">
                I know every destination, hotel and restaurant in our database — ask me anything
                and I'll answer with specific, data-backed picks.
              </p>

              <div class="chips">
                @for (c of capabilities; track c.label) {
                  <span class="chip"><span class="ms">{{ c.icon }}</span>{{ c.label }}</span>
                }
              </div>

              <div class="suggest-grid">
                @for (s of suggestionCards; track s.text) {
                  <button class="suggest glass" (click)="useSuggestion(s.text)">
                    <span class="suggest-icon"><span class="ms">{{ s.icon }}</span></span>
                    <span class="suggest-body">
                      <span class="suggest-kicker">{{ s.label }}</span>
                      <span class="suggest-text">{{ s.text }}</span>
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
                      {{ msg.copied ? 'Copied' : 'Copy' }}
                    </button>
                    <button class="ghost-btn" (click)="regenerate(i)">
                      <span class="ms">refresh</span> Retry
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
                  <span class="typing-label">Searching the travel database…</span>
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
            <span>Sign in to chat with your AI travel concierge</span>
            <span class="ms">arrow_forward</span>
          </button>
        } @else {
          <div class="composer glass">
            <textarea
              class="composer-input"
              [ngModel]="inputText()"
              (ngModelChange)="inputText.set($event)"
              (keydown)="onKeydown($event)"
              placeholder="Ask about destinations, hotels, restaurants, itineraries…"
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
          <p class="composer-hint">Answers come from real hotels, restaurants &amp; destinations in our database</p>
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
            <button class="auth-tab" [class.active]="authMode() === 'login'" (click)="authMode.set('login')" type="button">Sign in</button>
            <button class="auth-tab" [class.active]="authMode() === 'register'" (click)="authMode.set('register')" type="button">Register</button>
          </div>

          @if (authErrorMsg) {
            <div class="auth-error" role="alert">{{ authErrorMsg }}</div>
          }

          @if (authMode() === 'register') {
            <div class="auth-names">
              <div class="auth-field">
                <label>First name</label>
                <input [(ngModel)]="authFirstNameVal" placeholder="John">
              </div>
              <div class="auth-field">
                <label>Last name</label>
                <input [(ngModel)]="authLastNameVal" placeholder="Doe">
              </div>
            </div>
          }

          <div class="auth-field">
            <label>Email</label>
            <input [(ngModel)]="authEmailVal" type="email" placeholder="email@example.com">
          </div>

          <div class="auth-field auth-field--last">
            <label>Password</label>
            <input [(ngModel)]="authPasswordVal" type="password" placeholder="At least 8 characters">
          </div>

          <button class="auth-submit" (click)="authMode() === 'login' ? loginAuth() : registerAuth()" [disabled]="authLoadingState" type="button">
            @if (authLoadingState) {
              Loading…
            } @else {
              {{ authMode() === 'login' ? 'Sign in' : 'Create account' }}
            }
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Tokens ──────────────────────────────────────────────────────────────── */
    :host {
      --ink:        #14242E;
      --ink-2:      #46606C;
      --ink-3:      #7B939E;
      --coral:      #E15023;
      --coral-h:    #C8411B;
      --coral-glow: rgba(225,80,35,0.40);
      --teal:       #00A88A;
      --glass:      rgba(255,255,255,0.74);
      --glass-2:    rgba(255,255,255,0.58);
      --glass-bd:   rgba(255,255,255,0.60);
      --glass-bd-2: rgba(255,255,255,0.30);
      --blur:       saturate(160%) blur(22px);
      --r-md: 14px;
      --r-lg: 20px;
      --r-xl: 28px;
      --r-pill: 999px;
      --ease: cubic-bezier(0.16,1,0.3,1);
      --fast: 150ms;
      --normal: 320ms;
      --sh-glass: 0 10px 40px rgba(8,28,38,0.18), inset 0 1px 0 rgba(255,255,255,0.55);
      --sh-float: 0 18px 60px rgba(8,28,38,0.28), inset 0 1px 0 rgba(255,255,255,0.5);
      display: block;
      height: calc(100dvh - 64px);
      font-family: 'Hanken Grotesk', -apple-system, sans-serif;
      color: var(--ink);
    }

    .stage {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      isolation: isolate;
    }

    /* ── Atmospheric backdrop ───────────────────────────────────────────────── */
    .aurora {
      position: absolute;
      inset: 0;
      z-index: -2;
      background:
        radial-gradient(120% 90% at 80% -10%, #123445 0%, transparent 55%),
        linear-gradient(165deg, #0C2230 0%, #103A45 48%, #0B2A36 100%);
      overflow: hidden;
    }
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(70px);
      opacity: 0.55;
      will-change: transform;
    }
    .blob--teal   { width: 46vw; height: 46vw; left: -8vw; top: 8vh;  background: radial-gradient(circle, #16C5A4, transparent 65%); animation: drift1 26s var(--ease) infinite alternate; }
    .blob--coral  { width: 40vw; height: 40vw; right: -6vw; top: -6vh; background: radial-gradient(circle, #FF6B3D, transparent 62%); opacity: 0.42; animation: drift2 30s var(--ease) infinite alternate; }
    .blob--violet { width: 38vw; height: 38vw; left: 38vw; bottom: -14vh; background: radial-gradient(circle, #6E7BF2, transparent 64%); opacity: 0.36; animation: drift3 34s var(--ease) infinite alternate; }
    .grid-veil {
      position: absolute; inset: 0;
      background-image: radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1.4px);
      background-size: 26px 26px;
      mask-image: radial-gradient(120% 100% at 50% 0%, #000 30%, transparent 85%);
    }

    @keyframes drift1 { to { transform: translate3d(6vw, 5vh, 0) scale(1.12); } }
    @keyframes drift2 { to { transform: translate3d(-5vw, 7vh, 0) scale(1.08); } }
    @keyframes drift3 { to { transform: translate3d(4vw, -6vh, 0) scale(1.15); } }

    /* ── Glass primitive ────────────────────────────────────────────────────── */
    .glass {
      background: var(--glass);
      -webkit-backdrop-filter: var(--blur);
      backdrop-filter: var(--blur);
      border: 1px solid var(--glass-bd);
      box-shadow: var(--sh-glass);
    }

    /* ── Top bar ────────────────────────────────────────────────────────────── */
    .topbar {
      position: relative;
      z-index: 20;
      flex-shrink: 0;
      margin: 14px clamp(12px, 4vw, 28px) 0;
      height: 58px;
      border-radius: var(--r-pill);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 0 10px;
      background: transparent;
    }
    .brand { display: flex; align-items: center; gap: 9px; text-decoration: none; color: var(--ink); }
    .brand-mark {
      width: 34px; height: 34px; border-radius: 11px;
      background: linear-gradient(135deg, var(--coral), #F6873F);
      display: grid; place-items: center;
      box-shadow: 0 6px 16px var(--coral-glow);
    }
    .brand-mark .ms { font-size: 20px; color: #fff; }
    .brand-name { font-size: 16px; font-weight: 800; letter-spacing: -0.02em; }
    .brand-tag {
      font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--teal); background: rgba(0,168,138,0.12);
      padding: 3px 8px; border-radius: var(--r-pill);
    }
    .topbar-mid { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; justify-content: center; }
    .convo-name {
      font-size: 13.5px; font-weight: 700; color: var(--ink-2);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 40vw;
    }
    .convo-live {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 11.5px; font-weight: 700; color: var(--coral);
    }
    .live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--coral); animation: pulse-dot 1.1s ease-in-out infinite; }

    .topbar-actions { display: flex; gap: 8px; }
    .pill-btn {
      display: inline-flex; align-items: center; gap: 7px;
      height: 38px; padding: 0 15px;
      border-radius: var(--r-pill);
      border: 1px solid rgba(20,36,46,0.08);
      background: #fff;
      color: var(--ink); font-family: inherit; font-size: 13px; font-weight: 700;
      cursor: pointer; transition: transform var(--fast), background var(--fast);
      box-shadow: 0 8px 22px rgba(8,28,38,0.22);
    }
    .pill-btn .ms { font-size: 18px; }
    .pill-btn:hover { background: #fff; transform: translateY(-1px); box-shadow: 0 10px 26px rgba(8,28,38,0.28); }

    /* ── Column / thread ────────────────────────────────────────────────────── */
    .column {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      scroll-behavior: smooth;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.4) transparent;
    }
    .column::-webkit-scrollbar { width: 7px; }
    .column::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.35); border-radius: 7px; }

    .thread {
      width: 100%;
      max-width: 840px;
      margin: 0 auto;
      padding: 26px clamp(14px, 4vw, 24px) 200px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    /* ── Welcome ────────────────────────────────────────────────────────────── */
    .welcome { text-align: center; padding: 5vh 0 1vh; }
    .welcome-orb {
      width: 84px; height: 84px; margin: 0 auto 22px;
      border-radius: 26px; display: grid; place-items: center;
      background: linear-gradient(150deg, rgba(255,255,255,0.85), rgba(255,255,255,0.5));
      border: 1px solid rgba(255,255,255,0.7);
      box-shadow: 0 18px 50px rgba(225,80,35,0.28), inset 0 1px 0 rgba(255,255,255,0.8);
    }
    .welcome-orb .ms { font-size: 40px; color: var(--coral); }
    .welcome-title {
      font-size: clamp(30px, 5vw, 46px); font-weight: 900; letter-spacing: -0.035em;
      color: #fff; margin: 0 0 12px; text-shadow: 0 2px 30px rgba(0,0,0,0.25);
    }
    .welcome-sub {
      font-size: 15px; line-height: 1.65; color: rgba(255,255,255,0.82);
      max-width: 480px; margin: 0 auto 26px;
    }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 26px; }
    .chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: var(--r-pill);
      background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.22);
      color: #fff; font-size: 12.5px; font-weight: 700;
      -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
    }
    .chip .ms { font-size: 15px; color: #7FE9D3; }

    .suggest-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
      max-width: 680px; margin: 0 auto;
    }
    .suggest {
      display: flex; align-items: center; gap: 13px; text-align: left;
      padding: 15px 16px; border-radius: var(--r-lg); cursor: pointer;
      transition: transform var(--normal) var(--ease), box-shadow var(--normal) var(--ease);
    }
    .suggest:hover { transform: translateY(-3px); box-shadow: var(--sh-float); }
    .suggest-icon {
      width: 42px; height: 42px; flex-shrink: 0; border-radius: 13px;
      background: linear-gradient(140deg, rgba(225,80,35,0.16), rgba(246,135,63,0.1));
      display: grid; place-items: center;
    }
    .suggest-icon .ms { font-size: 21px; color: var(--coral); }
    .suggest-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .suggest-kicker { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-3); }
    .suggest-text { font-size: 13.5px; font-weight: 700; color: var(--ink); line-height: 1.35; }
    .suggest-go { font-size: 18px; color: var(--ink-3); transition: transform var(--fast), color var(--fast); }
    .suggest:hover .suggest-go { color: var(--coral); transform: translate(2px,-2px); }

    /* ── Messages ───────────────────────────────────────────────────────────── */
    .row { display: flex; gap: 12px; align-items: flex-start; animation: rise var(--normal) var(--ease); }
    .row--user { flex-direction: row-reverse; }
    .avatar {
      width: 36px; height: 36px; flex-shrink: 0; border-radius: 12px;
      background: linear-gradient(135deg, #0E2C38, #14424E);
      border: 1px solid rgba(255,255,255,0.18);
      display: grid; place-items: center; margin-top: 2px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.25);
    }
    .avatar .ms { font-size: 18px; color: #7FE9D3; }

    .bubble-wrap { display: flex; flex-direction: column; gap: 9px; max-width: 80%; min-width: 0; }
    .row--user .bubble-wrap { align-items: flex-end; }

    .bubble { padding: 13px 17px; font-size: 14.5px; line-height: 1.62; word-break: break-word; }
    .bubble--user {
      background: linear-gradient(140deg, var(--coral), #C8411B);
      color: #fff; border-radius: var(--r-lg) var(--r-lg) 6px var(--r-lg);
      box-shadow: 0 10px 26px var(--coral-glow);
    }
    .bubble--bot {
      color: var(--ink);
      border-radius: 6px var(--r-lg) var(--r-lg) var(--r-lg);
    }

    .typing { display: inline-flex; align-items: center; gap: 11px; }
    .dots { display: inline-flex; gap: 5px; }
    .dots i { width: 7px; height: 7px; border-radius: 50%; background: var(--coral); animation: bounce 1.2s ease-in-out infinite; }
    .dots i:nth-child(2) { animation-delay: 0.15s; }
    .dots i:nth-child(3) { animation-delay: 0.3s; }
    .typing-label { font-size: 12.5px; color: var(--ink-2); font-weight: 600; }

    .actions { display: flex; gap: 7px; opacity: 0; transition: opacity var(--fast); }
    .row:hover .actions { opacity: 1; }
    .ghost-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 11px; border-radius: var(--r-pill);
      background: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.55);
      color: var(--ink-2); font-family: inherit; font-size: 11.5px; font-weight: 700; cursor: pointer;
      -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
      transition: color var(--fast), background var(--fast);
    }
    .ghost-btn .ms { font-size: 14px; }
    .ghost-btn:hover { color: var(--coral); background: #fff; }

    .followups { display: flex; flex-wrap: wrap; gap: 8px; }
    .followup {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: var(--r-pill);
      background: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.6);
      color: var(--coral); font-family: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer;
      -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
      transition: transform var(--fast), background var(--fast);
    }
    .followup .ms { font-size: 14px; }
    .followup:hover { background: #fff; transform: translateY(-1px); }

    .cards-rail {
      display: flex; gap: 12px; overflow-x: auto; padding: 2px 2px 8px;
      scrollbar-width: none;
    }
    .cards-rail::-webkit-scrollbar { display: none; }

    .map-frame { padding: 6px; border-radius: var(--r-lg); }
    .map-frame ::ng-deep .map-container { border: none; border-radius: 15px; height: 240px; }

    /* ── Composer ───────────────────────────────────────────────────────────── */
    .composer-zone {
      position: absolute; left: 0; right: 0; bottom: 0; z-index: 20;
      padding: 0 clamp(14px, 4vw, 24px) 22px;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      background: linear-gradient(to top, rgba(11,34,44,0.85) 30%, transparent);
      pointer-events: none;
    }
    .composer-zone > * { pointer-events: auto; }
    .composer {
      width: 100%; max-width: 840px;
      display: flex; align-items: flex-end; gap: 10px;
      padding: 9px 9px 9px 18px; border-radius: var(--r-xl);
      box-shadow: var(--sh-float);
    }
    .composer-input {
      flex: 1; border: none; background: transparent; resize: none;
      font-family: inherit; font-size: 14.5px; color: var(--ink);
      outline: none; padding: 8px 0; line-height: 1.5; max-height: 150px;
    }
    .composer-input::placeholder { color: var(--ink-3); }
    .send {
      width: 42px; height: 42px; flex-shrink: 0; border-radius: 15px; border: none;
      background: linear-gradient(140deg, var(--coral), #C8411B); color: #fff; cursor: pointer;
      display: grid; place-items: center;
      box-shadow: 0 8px 20px var(--coral-glow);
      transition: transform var(--fast), opacity var(--fast);
    }
    .send .ms { font-size: 20px; }
    .send:hover:not(:disabled) { transform: scale(1.07); }
    .send:disabled { opacity: 0.4; cursor: default; }
    .composer-hint { font-size: 11.5px; color: rgba(255,255,255,0.62); margin: 0; text-align: center; }

    .auth-cta {
      display: inline-flex; align-items: center; gap: 11px;
      padding: 14px 22px; border-radius: var(--r-pill);
      font-size: 14px; font-weight: 700; color: var(--ink); cursor: pointer;
      box-shadow: var(--sh-float);
    }
    .auth-cta .ms { font-size: 18px; color: var(--coral); }

    /* ── History drawer ─────────────────────────────────────────────────────── */
    .drawer-scrim {
      position: fixed; inset: 0; z-index: 40;
      background: rgba(6,20,28,0.5); -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px);
      animation: fade var(--fast) ease;
    }
    .drawer {
      position: fixed; top: 0; right: 0; bottom: 0; z-index: 41;
      width: min(360px, 88vw);
      border-radius: var(--r-xl) 0 0 var(--r-xl);
      padding: 22px; display: flex; flex-direction: column; gap: 16px;
      animation: slide-in var(--normal) var(--ease);
    }
    .drawer-head { display: flex; align-items: center; justify-content: space-between; }
    .drawer-head h2 { font-size: 18px; font-weight: 800; margin: 0; letter-spacing: -0.02em; }
    .icon-btn {
      width: 34px; height: 34px; border-radius: 11px; border: none; cursor: pointer;
      background: rgba(255,255,255,0.5); display: grid; place-items: center; color: var(--ink-2);
    }
    .icon-btn .ms { font-size: 19px; }
    .drawer-new {
      display: flex; align-items: center; gap: 8px; justify-content: center;
      padding: 12px; border-radius: var(--r-md); cursor: pointer;
      border: 1px dashed rgba(20,36,46,0.25); background: rgba(255,255,255,0.4);
      color: var(--ink); font-family: inherit; font-size: 13.5px; font-weight: 700;
    }
    .drawer-new .ms { font-size: 18px; color: var(--coral); }
    .drawer-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
    .convo-item {
      display: flex; align-items: center; gap: 11px; text-align: left;
      padding: 11px 12px; border-radius: var(--r-md); border: 1px solid transparent;
      background: transparent; cursor: pointer; font-family: inherit;
      transition: background var(--fast);
    }
    .convo-item:hover { background: rgba(255,255,255,0.55); }
    .convo-item.active { background: #fff; border-color: rgba(225,80,35,0.3); }
    .convo-item__icon { font-size: 18px; color: var(--ink-3); }
    .convo-item.active .convo-item__icon { color: var(--coral); }
    .convo-item__body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .convo-item__title { font-size: 13.5px; font-weight: 700; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .convo-item__date { font-size: 11.5px; color: var(--ink-3); margin-top: 1px; }
    .convo-item__del { font-size: 17px; color: var(--ink-3); opacity: 0; transition: opacity var(--fast), color var(--fast); }
    .convo-item:hover .convo-item__del { opacity: 1; }
    .convo-item__del:hover { color: #E0473A; }
    .drawer-empty { font-size: 13px; color: var(--ink-2); text-align: center; padding: 24px 8px; line-height: 1.5; }
    .drawer-locked { text-align: center; padding: 28px 10px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .drawer-locked .ms { font-size: 32px; color: var(--ink-3); }
    .drawer-locked p { font-size: 13px; color: var(--ink-2); margin: 0; line-height: 1.5; }
    .solid-btn {
      padding: 10px 22px; border-radius: var(--r-pill); border: none; cursor: pointer;
      background: var(--coral); color: #fff; font-family: inherit; font-size: 13.5px; font-weight: 800;
    }

    /* ── Auth modal ─────────────────────────────────────────────────────────── */
    .auth-backdrop {
      position: fixed; inset: 0; z-index: 500; display: grid; place-items: center; padding: 20px;
      background: rgba(6,20,28,0.55); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
      animation: fade var(--fast) ease;
    }
    .auth-card {
      position: relative; width: 100%; max-width: 410px; border-radius: var(--r-xl); padding: 32px 28px;
      box-shadow: var(--sh-float); animation: pop var(--normal) var(--ease);
    }
    .auth-close {
      position: absolute; top: 16px; right: 16px; border: none; background: rgba(255,255,255,0.4);
      width: 32px; height: 32px; border-radius: 10px; cursor: pointer; color: var(--ink-2); font-size: 19px;
    }
    .auth-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
    .auth-logo-icon {
      width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center;
      background: linear-gradient(135deg, var(--coral), #F6873F); box-shadow: 0 6px 16px var(--coral-glow);
    }
    .auth-logo-icon .ms { font-size: 21px; color: #fff; }
    .auth-logo-name { font-size: 17px; font-weight: 800; }
    .auth-tabs { display: flex; gap: 3px; background: rgba(20,36,46,0.07); border-radius: 13px; padding: 4px; margin-bottom: 20px; }
    .auth-tab {
      flex: 1; padding: 9px; border-radius: 9px; border: none; background: transparent; cursor: pointer;
      font-family: inherit; font-size: 13.5px; font-weight: 700; color: var(--ink-2); transition: all var(--fast);
    }
    .auth-tab.active { background: #fff; color: var(--ink); box-shadow: 0 2px 8px rgba(8,28,38,0.12); }
    .auth-names { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .auth-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 13px; }
    .auth-field--last { margin-bottom: 20px; }
    .auth-field label { font-size: 11.5px; font-weight: 700; color: var(--ink-2); }
    .auth-field input {
      padding: 11px 14px; border-radius: 12px; border: 1px solid rgba(20,36,46,0.16);
      background: rgba(255,255,255,0.7); font-family: inherit; font-size: 14px; color: var(--ink); outline: none;
      transition: border-color var(--fast), box-shadow var(--fast);
    }
    .auth-field input:focus { border-color: var(--coral); box-shadow: 0 0 0 3px var(--coral-glow); }
    .auth-error {
      font-size: 12.5px; color: #C9322B; margin-bottom: 14px; padding: 9px 12px; border-radius: 10px;
      background: rgba(201,50,43,0.08); border: 1px solid rgba(201,50,43,0.2);
    }
    .auth-submit {
      width: 100%; padding: 14px; border-radius: var(--r-md); border: none; cursor: pointer;
      background: linear-gradient(135deg, var(--coral), #C0391A); color: #fff;
      font-family: inherit; font-size: 14.5px; font-weight: 800; box-shadow: 0 8px 22px var(--coral-glow);
      transition: transform var(--fast), opacity var(--fast);
    }
    .auth-submit:hover:not(:disabled) { transform: translateY(-1px); }
    .auth-submit:disabled { opacity: 0.55; cursor: default; }

    /* ── Markdown ───────────────────────────────────────────────────────────── */
    :host ::ng-deep .markdown-body h1,
    :host ::ng-deep .markdown-body h2,
    :host ::ng-deep .markdown-body h3,
    :host ::ng-deep .markdown-body h4 { margin: 16px 0 8px; color: var(--ink); line-height: 1.3; }
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
      background: rgba(20,36,46,0.08); padding: 2px 6px; border-radius: 6px; font-size: 13px; color: var(--ink);
    }
    :host ::ng-deep .markdown-body table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    :host ::ng-deep .markdown-body th,
    :host ::ng-deep .markdown-body td { padding: 8px 12px; text-align: left; border-bottom: 1px solid rgba(20,36,46,0.12); }
    :host ::ng-deep .markdown-body th { font-weight: 800; color: var(--ink-2); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    :host ::ng-deep .markdown-body a { color: var(--coral); text-decoration: none; font-weight: 700; }
    :host ::ng-deep .markdown-body a:hover { text-decoration: underline; }
    :host ::ng-deep .markdown-body blockquote {
      margin: 8px 0; padding: 8px 14px; border-left: 3px solid var(--coral);
      background: rgba(225,80,35,0.07); border-radius: 0 8px 8px 0; color: var(--ink-2);
    }

    /* ── Animations ─────────────────────────────────────────────────────────── */
    @keyframes bounce { 0%,80%,100% { transform: translateY(0); opacity: 0.6; } 40% { transform: translateY(-7px); opacity: 1; } }
    @keyframes pulse-dot { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
    @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    @keyframes pop { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: none; } }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slide-in { from { transform: translateX(100%); } to { transform: none; } }

    @media (prefers-reduced-motion: reduce) {
      .blob, .dots i, .live-dot { animation: none !important; }
      .row, .auth-card, .drawer { animation: none !important; }
    }

    /* ── Responsive ─────────────────────────────────────────────────────────── */
    @media (max-width: 720px) {
      .pill-btn__label { display: none; }
      .pill-btn { padding: 0 11px; }
      .brand-tag { display: none; }
      .convo-name { max-width: 30vw; }
      .suggest-grid { grid-template-columns: 1fr; }
      .bubble-wrap { max-width: 88%; }
      .thread { padding-bottom: 180px; }
    }
  `]
})
export class ChatComponent implements OnInit, AfterViewChecked {
  private readonly chatService = inject(ChatService);
  readonly authService = inject(AuthService);

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
    { icon: 'explore', label: 'Destinations' },
    { icon: 'hotel', label: 'Hotels' },
    { icon: 'restaurant', label: 'Restaurants' },
    { icon: 'map', label: 'Itineraries' },
    { icon: 'compare_arrows', label: 'Compare' },
    { icon: 'savings', label: 'Budget' },
  ];

  readonly suggestionCards = [
    { icon: 'luggage', label: 'Plan a trip', text: 'Plan a week in Bali under $2000' },
    { icon: 'restaurant', label: 'Find dining', text: 'Best restaurants in Rome for authentic Italian food' },
    { icon: 'beach_access', label: 'Discover', text: 'Family-friendly beach destinations in Europe' },
    { icon: 'compare_arrows', label: 'Compare', text: 'Compare Tokyo and Seoul for first-time visitors' },
    { icon: 'hotel', label: 'Hotels', text: 'Pet-friendly hotels in Amalfi Coast under €200/night' },
    { icon: 'savings', label: 'Budget', text: 'Cheapest destinations in Southeast Asia this summer' },
  ];

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.loadConversations();
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
          { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
        ]);
      }
    });
  }

  useSuggestion(text: string): void {
    this.inputText.set(text);
    this.send();
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
          { role: 'assistant', content: 'Sorry, regeneration failed. Please try again.' }
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
      this.authErrorMsg = 'Enter your email and password.';
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
      },
      error: () => {
        this.authLoadingState = false;
        this.authErrorMsg = 'Invalid credentials.';
      }
    });
  }

  registerAuth(): void {
    if (!this.authFirstNameVal || !this.authLastNameVal || !this.authEmailVal || !this.authPasswordVal) {
      this.authErrorMsg = 'Please fill in all fields.';
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
      },
      error: (err: any) => {
        this.authLoadingState = false;
        this.authErrorMsg = err?.error?.error ?? 'Registration failed.';
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
    const marker = '**You might also want to ask:**';
    const idx = content.indexOf(marker);
    if (idx === -1) return [];

    const section = content.substring(idx + marker.length);
    return section
      .split('\n')
      .map(line => line.replace(/^[\s-*]+/, '').trim())
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
