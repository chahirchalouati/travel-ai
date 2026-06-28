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
    <div class="chat-layout" [class.sidebar-open]="sidebarOpen()">
      <!-- Mobile overlay -->
      @if (sidebarOpen()) {
        <div class="sidebar-overlay" (click)="sidebarOpen.set(false)"></div>
      }

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo-row">
            <span class="ms logo-icon">travel_explore</span>
            <span class="logo-text">TravelAI</span>
            <span class="logo-badge">PRO</span>
          </div>
          <button class="sidebar-close" (click)="sidebarOpen.set(false)" aria-label="Close sidebar">
            <span class="ms">close</span>
          </button>
        </div>

        <button class="new-chat-btn" (click)="newChat()">
          <span class="ms">add_circle</span>
          New Conversation
        </button>

        @if (authService.isAuthenticated()) {
          <div class="conversations-section">
            <span class="section-label">Recent</span>
            <div class="conversations-list">
              @for (conv of conversations(); track conv.id) {
                <div
                  class="conv-item"
                  [class.active]="currentConversationId() === conv.id"
                  (click)="selectConversation(conv.id)"
                >
                  <span class="ms conv-icon">chat_bubble_outline</span>
                  <div class="conv-info">
                    <span class="conv-title">{{ conv.title }}</span>
                    <span class="conv-date">{{ formatDate(conv.updatedAt) }}</span>
                  </div>
                  <button
                    class="conv-delete"
                    (click)="deleteConversation(conv.id, $event)"
                    aria-label="Delete conversation"
                  >
                    <span class="ms">delete_outline</span>
                  </button>
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="sign-in-prompt">
            <span class="ms sign-in-icon">lock_open</span>
            <p>Sign in to save conversations and get personalized recommendations.</p>
          </div>
        }

        <div class="sidebar-footer">
          <div class="capabilities-hint">
            <span class="ms">auto_awesome</span>
            <span>Powered by RAG + LLM</span>
          </div>
        </div>
      </aside>

      <!-- Main Chat Area -->
      <main class="chat-main">
        <header class="chat-topbar">
          <button class="menu-toggle" (click)="sidebarOpen.set(true)" aria-label="Open sidebar">
            <span class="ms">menu</span>
          </button>
          <div class="topbar-center">
            <h2 class="topbar-title">{{ conversationTitle() }}</h2>
            @if (isTyping()) {
              <span class="topbar-status">Thinking...</span>
            }
          </div>
        </header>

        <div class="messages-area" #messagesContainer>
          @if (messages().length === 0 && !isTyping()) {
            <div class="welcome-container">
              <div class="welcome-hero">
                <div class="welcome-icon-ring">
                  <span class="ms welcome-icon">travel_explore</span>
                </div>
                <h3 class="welcome-heading">Your AI Travel Concierge</h3>
                <p class="welcome-text">
                  I know every destination, hotel, and restaurant in our database.
                  Ask me anything — I'll give you specific, data-backed answers.
                </p>
              </div>

              <div class="capabilities-row">
                <div class="capability">
                  <span class="ms">explore</span>
                  <span>Destinations</span>
                </div>
                <div class="capability">
                  <span class="ms">hotel</span>
                  <span>Hotels</span>
                </div>
                <div class="capability">
                  <span class="ms">restaurant</span>
                  <span>Restaurants</span>
                </div>
                <div class="capability">
                  <span class="ms">map</span>
                  <span>Itineraries</span>
                </div>
                <div class="capability">
                  <span class="ms">compare_arrows</span>
                  <span>Compare</span>
                </div>
                <div class="capability">
                  <span class="ms">savings</span>
                  <span>Budget</span>
                </div>
              </div>

              <div class="suggestion-grid">
                @for (s of suggestionCards; track s.text) {
                  <button class="suggestion-card" (click)="useSuggestion(s.text)">
                    <span class="ms suggestion-icon">{{ s.icon }}</span>
                    <div class="suggestion-content">
                      <span class="suggestion-label">{{ s.label }}</span>
                      <span class="suggestion-text">{{ s.text }}</span>
                    </div>
                    <span class="ms suggestion-arrow">arrow_forward</span>
                  </button>
                }
              </div>
            </div>
          }

          @for (msg of messages(); track $index; let i = $index) {
            <div class="message-row" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'">
              @if (msg.role === 'assistant') {
                <div class="bot-avatar">
                  <span class="ms">travel_explore</span>
                </div>
              }
              <div class="message-content-wrap">
                @if (msg.role === 'user') {
                  <div class="message-bubble user-bubble">{{ msg.content }}</div>
                } @else {
                  <div class="message-bubble bot-bubble markdown-body" [innerHTML]="msg.content | markdown"></div>
                  <div class="message-actions">
                    <button
                      class="action-btn"
                      (click)="copyMessage(i)"
                      [attr.aria-label]="msg.copied ? 'Copied' : 'Copy'"
                    >
                      <span class="ms">{{ msg.copied ? 'check' : 'content_copy' }}</span>
                      <span class="action-label">{{ msg.copied ? 'Copied' : 'Copy' }}</span>
                    </button>
                    <button class="action-btn" (click)="regenerate(i)" aria-label="Regenerate">
                      <span class="ms">refresh</span>
                      <span class="action-label">Retry</span>
                    </button>
                  </div>

                  @if (msg.attachments && msg.attachments.length > 0) {
                    <div class="entity-cards-row">
                      @for (att of msg.attachments; track att.id) {
                        <app-entity-card [entity]="att" />
                      }
                    </div>
                  }

                  @if (msg.mapPins && msg.mapPins.length > 0) {
                    <app-chat-map [pins]="msg.mapPins" />
                  }

                  @if (msg.followUps && msg.followUps.length > 0) {
                    <div class="follow-up-chips">
                      @for (fu of msg.followUps; track fu) {
                        <button class="follow-up-chip" (click)="useSuggestion(fu)">
                          <span class="ms">arrow_forward</span>
                          {{ fu }}
                        </button>
                      }
                    </div>
                  }
                }
              </div>
            </div>
          }

          @if (isTyping()) {
            <div class="message-row assistant">
              <div class="bot-avatar">
                <span class="ms">travel_explore</span>
              </div>
              <div class="message-content-wrap">
                <div class="message-bubble bot-bubble typing-bubble">
                  <div class="typing-indicator">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                  <span class="typing-label">Searching our travel database...</span>
                </div>
              </div>
            </div>
          }
        </div>

        <div class="input-area">
          <div class="input-row">
            <button class="attach-btn" aria-label="Attach" disabled>
              <span class="ms">attach_file</span>
            </button>
            <textarea
              class="chat-input"
              [ngModel]="inputText()"
              (ngModelChange)="inputText.set($event)"
              (keydown)="onKeydown($event)"
              placeholder="Ask about destinations, hotels, restaurants, itineraries..."
              rows="1"
            ></textarea>
            <button
              class="send-btn"
              (click)="send()"
              [disabled]="!inputText().trim() || isTyping()"
              aria-label="Send message"
            >
              <span class="ms">{{ isTyping() ? 'stop' : 'arrow_upward' }}</span>
            </button>
          </div>
          <p class="input-hint">
            TravelAI searches real data from our hotels, restaurants & destinations database
          </p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      font-family: 'Hanken Grotesk', sans-serif;
      color: var(--text-primary, #1a1a1a);
    }

    .chat-layout {
      display: flex;
      height: 100%;
      position: relative;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 300px;
      min-width: 300px;
      background: #fafafa;
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border, #e0e0e0);
      transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .sidebar-header {
      padding: 20px 20px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-icon {
      font-size: 26px;
      color: var(--brand, #E04A2F);
    }

    .logo-text {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text-primary, #1a1a1a);
    }

    .logo-badge {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #fff;
      background: var(--teal, #00856A);
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .sidebar-close {
      display: none;
      background: none;
      border: none;
      color: var(--text-tertiary, #8a8a8a);
      cursor: pointer;
      padding: 4px;
    }

    .new-chat-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 16px 20px;
      padding: 11px 18px;
      background: var(--brand, #E04A2F);
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 150ms ease, transform 100ms ease;
    }

    .new-chat-btn:hover { background: var(--brand-hover, #c93d25); }
    .new-chat-btn:active { transform: scale(0.98); }
    .new-chat-btn .ms { font-size: 18px; }

    /* ── Conversation List ── */
    .conversations-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .section-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-tertiary, #8a8a8a);
      padding: 0 20px 8px;
    }

    .conversations-list {
      flex: 1;
      overflow-y: auto;
      padding: 0 8px;
    }

    .conversations-list::-webkit-scrollbar { width: 4px; }
    .conversations-list::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

    .conv-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      margin-bottom: 2px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 150ms ease;
    }

    .conv-item:hover { background: #f0f0f0; }

    .conv-item.active {
      background: var(--brand-light, #FFF0ED);
    }

    .conv-icon {
      font-size: 16px;
      color: var(--text-tertiary, #8a8a8a);
      flex-shrink: 0;
    }

    .conv-item.active .conv-icon { color: var(--brand, #E04A2F); }

    .conv-info {
      display: flex;
      flex-direction: column;
      gap: 1px;
      overflow: hidden;
      min-width: 0;
      flex: 1;
    }

    .conv-title {
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .conv-date {
      font-size: 11px;
      color: var(--text-tertiary, #8a8a8a);
    }

    .conv-delete {
      opacity: 0;
      background: none;
      border: none;
      color: var(--text-tertiary, #8a8a8a);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      transition: opacity 150ms ease, color 150ms ease;
    }

    .conv-item:hover .conv-delete { opacity: 1; }
    .conv-delete:hover { color: var(--brand, #E04A2F); }
    .conv-delete .ms { font-size: 16px; }

    .sign-in-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 32px 24px;
      text-align: center;
    }

    .sign-in-icon { font-size: 36px; color: var(--text-tertiary, #8a8a8a); }

    .sign-in-prompt p {
      font-size: 13px;
      color: var(--text-secondary, #545454);
      line-height: 1.5;
      margin: 0;
    }

    .sidebar-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--border-light, #efefef);
    }

    .capabilities-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: var(--text-tertiary, #8a8a8a);
    }

    .capabilities-hint .ms {
      font-size: 14px;
      color: var(--teal, #00856A);
    }

    /* ── Mobile sidebar ── */
    .sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 90;
    }

    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 100;
        transform: translateX(-100%);
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
      }

      .sidebar-open .sidebar { transform: translateX(0); }
      .sidebar-open .sidebar-overlay { display: block; }
      .sidebar-close { display: flex; }
      .menu-toggle { display: flex; }
    }

    /* ── Main Chat ── */
    .chat-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      min-width: 0;
    }

    .chat-topbar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 24px;
      border-bottom: 1px solid var(--border, #e0e0e0);
      background: #ffffff;
    }

    .menu-toggle {
      display: none;
      background: none;
      border: none;
      color: var(--text-primary, #1a1a1a);
      cursor: pointer;
      padding: 4px;
    }

    .topbar-center {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .topbar-title {
      font-size: 15px;
      font-weight: 700;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .topbar-status {
      font-size: 12px;
      color: var(--teal, #00856A);
      font-weight: 500;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* ── Messages ── */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 24px 24px 8px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      background: #f9f9f9;
    }

    .messages-area::-webkit-scrollbar { width: 6px; }
    .messages-area::-webkit-scrollbar-thumb { background: #ddd; border-radius: 6px; }

    /* ── Welcome ── */
    .welcome-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      text-align: center;
      padding: 20px 24px 40px;
      max-width: 680px;
      margin: 0 auto;
      gap: 32px;
    }

    .welcome-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .welcome-icon-ring {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--brand-light, #FFF0ED), var(--teal-light, #E6F5F0));
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .welcome-icon {
      font-size: 36px;
      color: var(--brand, #E04A2F);
    }

    .welcome-heading {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0;
    }

    .welcome-text {
      font-size: 15px;
      line-height: 1.6;
      color: var(--text-secondary, #545454);
      margin: 0;
      max-width: 440px;
    }

    .capabilities-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }

    .capability {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 6px 14px;
      background: #ffffff;
      border: 1px solid var(--border, #e0e0e0);
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary, #545454);
    }

    .capability .ms {
      font-size: 15px;
      color: var(--brand, #E04A2F);
    }

    .suggestion-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      width: 100%;
    }

    .suggestion-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #ffffff;
      border: 1px solid var(--border, #e0e0e0);
      border-radius: 12px;
      font-family: inherit;
      cursor: pointer;
      text-align: left;
      transition: border-color 200ms ease, box-shadow 200ms ease;
    }

    .suggestion-card:hover {
      border-color: var(--brand, #E04A2F);
      box-shadow: 0 2px 12px rgba(224, 74, 47, 0.1);
    }

    .suggestion-icon {
      font-size: 22px;
      color: var(--brand, #E04A2F);
      flex-shrink: 0;
    }

    .suggestion-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .suggestion-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary, #8a8a8a);
    }

    .suggestion-text {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary, #1a1a1a);
      line-height: 1.35;
    }

    .suggestion-arrow {
      font-size: 16px;
      color: var(--text-tertiary, #8a8a8a);
      flex-shrink: 0;
      transition: transform 200ms ease, color 200ms ease;
    }

    .suggestion-card:hover .suggestion-arrow {
      transform: translateX(3px);
      color: var(--brand, #E04A2F);
    }

    @media (max-width: 600px) {
      .suggestion-grid { grid-template-columns: 1fr; }
    }

    /* ── Message Rows ── */
    .message-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .message-row.user { justify-content: flex-end; }
    .message-row.assistant { justify-content: flex-start; }

    .bot-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--teal, #00856A);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .bot-avatar .ms { font-size: 20px; color: #ffffff; }

    .message-content-wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-width: 72%;
      min-width: 0;
    }

    .message-row.user .message-content-wrap { align-items: flex-end; }

    .message-bubble {
      padding: 14px 20px;
      font-size: 14px;
      line-height: 1.65;
      word-break: break-word;
    }

    .user-bubble {
      background: var(--brand, #E04A2F);
      color: #ffffff;
      border-radius: 20px 20px 4px 20px;
    }

    .bot-bubble {
      background: #ffffff;
      color: var(--text-primary, #1a1a1a);
      border-radius: 4px 20px 20px 20px;
      border: 1px solid var(--border-light, #efefef);
    }

    /* ── Markdown inside bot bubbles ── */
    :host ::ng-deep .markdown-body {
      h1, h2, h3, h4 {
        font-family: 'Hanken Grotesk', sans-serif;
        margin: 16px 0 8px;
        line-height: 1.3;
      }

      h1:first-child, h2:first-child, h3:first-child { margin-top: 0; }

      h2 { font-size: 16px; font-weight: 700; }
      h3 { font-size: 14px; font-weight: 700; }

      p { margin: 6px 0; }
      p:first-child { margin-top: 0; }
      p:last-child { margin-bottom: 0; }

      ul, ol {
        padding-left: 20px;
        margin: 6px 0;
      }

      li { margin: 4px 0; }

      strong { font-weight: 700; }

      code {
        background: #f0f0f0;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 13px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 12px 0;
        font-size: 13px;
      }

      th, td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid var(--border-light, #efefef);
      }

      th {
        font-weight: 600;
        color: var(--text-secondary, #545454);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      hr {
        border: none;
        border-top: 1px solid var(--border-light, #efefef);
        margin: 14px 0;
      }

      a {
        color: var(--brand, #E04A2F);
        text-decoration: none;
      }

      a:hover { text-decoration: underline; }

      blockquote {
        margin: 8px 0;
        padding: 8px 14px;
        border-left: 3px solid var(--brand, #E04A2F);
        background: var(--brand-light, #FFF0ED);
        border-radius: 0 6px 6px 0;
        font-style: italic;
        color: var(--text-secondary, #545454);
      }
    }

    /* ── Message Actions ── */
    .message-actions {
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity 150ms ease;
    }

    .message-row:hover .message-actions { opacity: 1; }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: none;
      border: none;
      border-radius: 6px;
      font-family: inherit;
      font-size: 11px;
      color: var(--text-tertiary, #8a8a8a);
      cursor: pointer;
      transition: background 150ms ease, color 150ms ease;
    }

    .action-btn:hover {
      background: #f0f0f0;
      color: var(--text-primary, #1a1a1a);
    }

    .action-btn .ms { font-size: 14px; }
    .action-label { font-weight: 500; }

    /* ── Follow-up Chips ── */
    /* ── Entity Cards Row ── */
    .entity-cards-row {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding: 4px 0;
      scroll-snap-type: x mandatory;
    }

    .entity-cards-row::-webkit-scrollbar { height: 4px; }
    .entity-cards-row::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

    .entity-cards-row > * {
      scroll-snap-align: start;
    }

    /* ── Chat Map ── */
    app-chat-map {
      display: block;
      margin-top: 4px;
    }

    .follow-up-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }

    .follow-up-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 7px 14px;
      background: #ffffff;
      border: 1px solid var(--border, #e0e0e0);
      border-radius: 20px;
      font-family: inherit;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary, #545454);
      cursor: pointer;
      transition: border-color 200ms ease, color 200ms ease, background 200ms ease;
    }

    .follow-up-chip:hover {
      border-color: var(--brand, #E04A2F);
      color: var(--brand, #E04A2F);
      background: var(--brand-light, #FFF0ED);
    }

    .follow-up-chip .ms {
      font-size: 13px;
      color: var(--brand, #E04A2F);
    }

    /* ── Typing ── */
    .typing-bubble {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
    }

    .typing-indicator {
      display: flex;
      gap: 5px;
    }

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--text-tertiary, #8a8a8a);
      animation: bounce 1.4s ease-in-out infinite;
    }

    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40% { transform: translateY(-6px); opacity: 1; }
    }

    .typing-label {
      font-size: 12px;
      color: var(--text-tertiary, #8a8a8a);
      font-style: italic;
    }

    /* ── Input ── */
    .input-area {
      padding: 12px 24px 16px;
      background: #ffffff;
      border-top: 1px solid var(--border, #e0e0e0);
    }

    .input-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      background: #f9f9f9;
      border-radius: 14px;
      padding: 6px 6px 6px 6px;
      border: 1px solid var(--border, #e0e0e0);
      transition: border-color 200ms ease, box-shadow 200ms ease;
    }

    .input-row:focus-within {
      border-color: var(--brand, #E04A2F);
      box-shadow: 0 0 0 3px rgba(224, 74, 47, 0.08);
      background: #ffffff;
    }

    .attach-btn {
      background: none;
      border: none;
      color: var(--text-tertiary, #8a8a8a);
      padding: 8px;
      cursor: pointer;
      border-radius: 8px;
      display: flex;
      transition: color 150ms ease;
    }

    .attach-btn:hover:not(:disabled) { color: var(--text-primary, #1a1a1a); }
    .attach-btn:disabled { opacity: 0.3; cursor: default; }
    .attach-btn .ms { font-size: 20px; }

    .chat-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: inherit;
      font-size: 14px;
      color: var(--text-primary, #1a1a1a);
      resize: none;
      max-height: 140px;
      line-height: 1.5;
      padding: 8px 0;
    }

    .chat-input::placeholder { color: var(--text-tertiary, #8a8a8a); }

    .send-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: var(--brand, #E04A2F);
      color: #ffffff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 150ms ease, opacity 200ms ease, transform 100ms ease;
    }

    .send-btn:hover:not(:disabled) { background: var(--brand-hover, #c93d25); }
    .send-btn:active:not(:disabled) { transform: scale(0.94); }
    .send-btn:disabled { opacity: 0.25; cursor: default; }
    .send-btn .ms { font-size: 20px; }

    .input-hint {
      font-size: 11px;
      color: var(--text-tertiary, #8a8a8a);
      text-align: center;
      margin: 8px 0 0;
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .message-content-wrap { max-width: 88%; }
      .welcome-heading { font-size: 22px; }
      .messages-area { padding: 16px; }
      .input-area { padding: 10px 16px 14px; }
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
  sidebarOpen = signal(false);

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
    this.sidebarOpen.set(false);
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
    this.sidebarOpen.set(false);
  }

  send(): void {
    const text = this.inputText().trim();
    if (!text || this.isTyping()) return;

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
