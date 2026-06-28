import {
  Component, OnInit, AfterViewChecked, ViewChild,
  ElementRef, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import type { ConversationResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo-row">
            <span class="ms logo-icon">travel_explore</span>
            <span class="logo-text">TravelAI Chat</span>
          </div>
        </div>

        <button class="new-chat-btn" (click)="newChat()">
          <span class="ms">add</span>
          New Chat
        </button>

        @if (authService.isAuthenticated()) {
          <div class="conversations-list">
            @for (conv of conversations(); track conv.id) {
              <div
                class="conv-item"
                [class.active]="currentConversationId() === conv.id"
                (click)="selectConversation(conv.id)"
              >
                <div class="conv-info">
                  <span class="conv-title">{{ conv.title }}</span>
                  <span class="conv-date">{{ formatDate(conv.updatedAt) }}</span>
                </div>
                <button
                  class="conv-delete"
                  (click)="deleteConversation(conv.id, $event)"
                  aria-label="Delete conversation"
                >
                  <span class="ms">close</span>
                </button>
              </div>
            }
          </div>
        } @else {
          <div class="sign-in-prompt">
            <span class="ms sign-in-icon">account_circle</span>
            <p>Sign in to save your chats and access them across devices.</p>
          </div>
        }
      </aside>

      <!-- Main Chat Area -->
      <main class="chat-main">
        <header class="chat-topbar">
          <span class="ms topbar-icon">forum</span>
          <h2 class="topbar-title">{{ conversationTitle() }}</h2>
        </header>

        <div class="messages-area" #messagesContainer>
          @if (messages().length === 0 && !isTyping()) {
            <div class="welcome-container">
              <div class="welcome-avatar">
                <span class="ms">smart_toy</span>
              </div>
              <h3 class="welcome-heading">Your personal travel concierge</h3>
              <p class="welcome-text">
                Hi! I'm TravelAI, your personal travel concierge.
                Ask me anything about destinations, hotels, restaurants,
                or let me plan your perfect trip!
              </p>

              <div class="suggestion-chips">
                @for (chip of suggestions; track chip) {
                  <button class="chip" (click)="useSuggestion(chip)">
                    {{ chip }}
                  </button>
                }
              </div>
            </div>
          }

          @for (msg of messages(); track $index) {
            <div class="message-row" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'">
              @if (msg.role === 'assistant') {
                <div class="bot-avatar">
                  <span class="ms">smart_toy</span>
                </div>
              }
              <div class="message-bubble" [class.user-bubble]="msg.role === 'user'" [class.bot-bubble]="msg.role === 'assistant'">
                {{ msg.content }}
              </div>
            </div>
          }

          @if (isTyping()) {
            <div class="message-row assistant">
              <div class="bot-avatar">
                <span class="ms">smart_toy</span>
              </div>
              <div class="message-bubble bot-bubble typing-bubble">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
          }
        </div>

        <div class="input-area">
          @if (messages().length === 0 && !isTyping()) {
            <!-- Chips shown inline above input only for new conversations -->
          }
          <div class="input-row">
            <textarea
              class="chat-input"
              [ngModel]="inputText()"
              (ngModelChange)="inputText.set($event)"
              (keydown)="onKeydown($event)"
              placeholder="Ask me about travel..."
              rows="1"
            ></textarea>
            <button
              class="send-btn"
              (click)="send()"
              [disabled]="!inputText().trim()"
              aria-label="Send message"
            >
              <span class="ms">send</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: calc(100vh - 62px);
      font-family: 'Hanken Grotesk', sans-serif;
      color: #241C15;
    }

    .chat-layout {
      display: flex;
      height: 100%;
    }

    /* ---- Sidebar ---- */
    .sidebar {
      width: 280px;
      min-width: 280px;
      background: #2A2018;
      color: #EFE8DC;
      display: flex;
      flex-direction: column;
      border-right: 1px solid rgba(239, 232, 220, 0.08);
    }

    .sidebar-header {
      padding: 20px 20px 12px;
    }

    .logo-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-icon {
      font-size: 26px;
      color: #D9694C;
    }

    .logo-text {
      font-family: 'Instrument Serif', serif;
      font-size: 22px;
      letter-spacing: -0.02em;
    }

    .new-chat-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 16px 16px;
      padding: 10px 16px;
      background: #D9694C;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-family: 'Hanken Grotesk', sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 200ms ease, transform 150ms ease;
    }

    .new-chat-btn:hover {
      background: #c45a3e;
      transform: translateY(-1px);
    }

    .new-chat-btn:active {
      transform: translateY(0);
    }

    .new-chat-btn .ms {
      font-size: 18px;
    }

    /* ---- Conversation List ---- */
    .conversations-list {
      flex: 1;
      overflow-y: auto;
      padding: 0 8px;
    }

    .conversations-list::-webkit-scrollbar {
      width: 4px;
    }

    .conversations-list::-webkit-scrollbar-thumb {
      background: rgba(239, 232, 220, 0.15);
      border-radius: 4px;
    }

    .conv-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      margin-bottom: 2px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 150ms ease;
    }

    .conv-item:hover {
      background: rgba(239, 232, 220, 0.08);
    }

    .conv-item.active {
      background: rgba(217, 105, 76, 0.18);
    }

    .conv-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
      min-width: 0;
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
      opacity: 0.5;
    }

    .conv-delete {
      opacity: 0;
      background: none;
      border: none;
      color: rgba(239, 232, 220, 0.5);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      transition: opacity 150ms ease, color 150ms ease;
    }

    .conv-item:hover .conv-delete {
      opacity: 1;
    }

    .conv-delete:hover {
      color: #D9694C;
    }

    .conv-delete .ms {
      font-size: 16px;
    }

    /* ---- Sign-in Prompt ---- */
    .sign-in-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 32px 24px;
      text-align: center;
    }

    .sign-in-icon {
      font-size: 40px;
      opacity: 0.3;
    }

    .sign-in-prompt p {
      font-size: 13px;
      opacity: 0.5;
      line-height: 1.5;
      margin: 0;
    }

    /* ---- Main Chat ---- */
    .chat-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #FAF5EC;
      min-width: 0;
    }

    .chat-topbar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 24px;
      border-bottom: 1px solid rgba(36, 28, 21, 0.08);
      background: rgba(250, 245, 236, 0.95);
      backdrop-filter: blur(8px);
    }

    .topbar-icon {
      font-size: 22px;
      color: #D9694C;
    }

    .topbar-title {
      font-family: 'Instrument Serif', serif;
      font-size: 18px;
      font-weight: 400;
      margin: 0;
      letter-spacing: -0.01em;
    }

    /* ---- Messages ---- */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .messages-area::-webkit-scrollbar {
      width: 6px;
    }

    .messages-area::-webkit-scrollbar-thumb {
      background: rgba(36, 28, 21, 0.12);
      border-radius: 6px;
    }

    /* ---- Welcome ---- */
    .welcome-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      text-align: center;
      padding: 40px 24px;
      max-width: 520px;
      margin: 0 auto;
    }

    .welcome-avatar {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      background: linear-gradient(135deg, #D9694C 0%, #E8956E 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      box-shadow: 0 8px 24px rgba(217, 105, 76, 0.25);
    }

    .welcome-avatar .ms {
      font-size: 32px;
      color: #fff;
    }

    .welcome-heading {
      font-family: 'Instrument Serif', serif;
      font-size: 28px;
      font-weight: 400;
      margin: 0 0 10px;
      letter-spacing: -0.02em;
    }

    .welcome-text {
      font-size: 15px;
      line-height: 1.6;
      opacity: 0.65;
      margin: 0 0 28px;
    }

    .suggestion-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
    }

    .chip {
      padding: 10px 18px;
      background: #fff;
      border: 1px solid rgba(36, 28, 21, 0.1);
      border-radius: 24px;
      font-family: 'Hanken Grotesk', sans-serif;
      font-size: 13px;
      color: #241C15;
      cursor: pointer;
      transition: border-color 200ms ease, box-shadow 200ms ease, transform 150ms ease;
      box-shadow: 0 1px 3px rgba(36, 28, 21, 0.06);
    }

    .chip:hover {
      border-color: #D9694C;
      box-shadow: 0 2px 8px rgba(217, 105, 76, 0.12);
      transform: translateY(-1px);
    }

    .chip:active {
      transform: translateY(0);
    }

    /* ---- Message Rows ---- */
    .message-row {
      display: flex;
      align-items: flex-end;
      gap: 10px;
    }

    .message-row.user {
      justify-content: flex-end;
    }

    .message-row.assistant {
      justify-content: flex-start;
    }

    .bot-avatar {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: linear-gradient(135deg, #D9694C 0%, #E8956E 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .bot-avatar .ms {
      font-size: 18px;
      color: #fff;
    }

    .message-bubble {
      max-width: 65%;
      padding: 12px 18px;
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .user-bubble {
      background: #D9694C;
      color: #fff;
      border-radius: 18px 18px 4px 18px;
      box-shadow: 0 2px 8px rgba(217, 105, 76, 0.2);
    }

    .bot-bubble {
      background: #fff;
      color: #241C15;
      border-radius: 18px 18px 18px 4px;
      box-shadow: 0 2px 8px rgba(36, 28, 21, 0.06);
    }

    /* ---- Typing Indicator ---- */
    .typing-bubble {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 14px 20px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(36, 28, 21, 0.25);
      animation: pulse 1.4s ease-in-out infinite;
    }

    .dot:nth-child(2) {
      animation-delay: 0.2s;
    }

    .dot:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes pulse {
      0%, 80%, 100% {
        transform: scale(0.6);
        opacity: 0.4;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* ---- Input Area ---- */
    .input-area {
      padding: 16px 24px 20px;
      background: rgba(250, 245, 236, 0.95);
      backdrop-filter: blur(8px);
      border-top: 1px solid rgba(36, 28, 21, 0.06);
    }

    .input-row {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      background: #fff;
      border-radius: 16px;
      padding: 6px 6px 6px 18px;
      box-shadow: 0 2px 12px rgba(36, 28, 21, 0.08);
      border: 1px solid rgba(36, 28, 21, 0.08);
      transition: border-color 200ms ease, box-shadow 200ms ease;
    }

    .input-row:focus-within {
      border-color: rgba(217, 105, 76, 0.3);
      box-shadow: 0 2px 16px rgba(217, 105, 76, 0.1);
    }

    .chat-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: 'Hanken Grotesk', sans-serif;
      font-size: 14px;
      color: #241C15;
      resize: none;
      max-height: 120px;
      line-height: 1.5;
      padding: 8px 0;
    }

    .chat-input::placeholder {
      color: rgba(36, 28, 21, 0.35);
    }

    .send-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: #D9694C;
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 200ms ease, transform 150ms ease, opacity 200ms ease;
    }

    .send-btn:hover:not(:disabled) {
      background: #c45a3e;
      transform: translateY(-1px);
    }

    .send-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .send-btn:disabled {
      opacity: 0.4;
      cursor: default;
    }

    .send-btn .ms {
      font-size: 20px;
    }
  `]
})
export class ChatComponent implements OnInit, AfterViewChecked {
  private readonly chatService = inject(ChatService);
  readonly authService = inject(AuthService);

  conversations = signal<ConversationResponse[]>([]);
  currentConversationId = signal<string | null>(null);
  messages = signal<{ role: string; content: string }[]>([]);
  inputText = signal('');
  isTyping = signal(false);
  conversationTitle = signal('New Conversation');

  readonly suggestions: readonly string[] = [
    'Plan a week in Bali under $2000',
    'Best restaurants in Paris',
    'Beach destinations in Europe for families',
    'Compare Tokyo and Seoul for first-time visitors'
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
    this.chatService.getConversation(id).subscribe(detail => {
      this.conversationTitle.set(detail.title);
      this.messages.set(
        detail.messages.map(m => ({ role: m.role, content: m.content }))
      );
    });
  }

  newChat(): void {
    this.currentConversationId.set(null);
    this.messages.set([]);
    this.conversationTitle.set('New Conversation');
  }

  send(): void {
    const text = this.inputText().trim();
    if (!text) return;

    this.messages.update(msgs => [...msgs, { role: 'user', content: text }]);
    this.inputText.set('');
    this.isTyping.set(true);

    this.chatService.chat({
      conversationId: this.currentConversationId(),
      message: text
    }).subscribe({
      next: response => {
        this.isTyping.set(false);
        this.messages.update(msgs => [
          ...msgs,
          { role: 'assistant', content: response.reply }
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

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
