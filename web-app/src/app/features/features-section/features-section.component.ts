import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Feature {
  icon: string;
  title: string;
  desc: string;
}

interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
}

@Component({
  selector: 'app-features-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './features-section.component.html',
  styleUrl: './features-section.component.scss'
})
export class FeaturesSectionComponent {
  activeFeature = signal(0);
  isTyping = signal(true);

  features: Feature[] = [
    { icon: '✦', title: 'Natural language planning', desc: 'Just describe your dream trip in plain English. Our AI understands your style, budget, and interests to build the perfect plan.' },
    { icon: '🗺', title: 'Personalised day-by-day itinerary', desc: 'Get a full itinerary with optimal timing, local tips, restaurant recommendations, and hidden gems tailored to you.' },
    { icon: '⚡', title: 'Real-time adaptation', desc: "Weather changes? Venue closed? Your AI travel companion instantly reroutes and replans without missing a beat." },
    { icon: '🔗', title: 'One-tap booking integration', desc: 'Book hotels, flights, experiences, and restaurants all in one place — with the best prices found automatically.' },
  ];

  messages: ChatMessage[] = [
    { role: 'ai', text: "Hello! I'm your AI travel companion. Tell me about your dream trip — where do you want to go, and what kind of experiences are you looking for?" },
    { role: 'user', text: "I want to spend 10 days in Japan. I love food, temples, and a bit of nature. Budget is around $3,000." },
  ];

  aiReply = "Perfect! I'll create a 10-day Japan itinerary focusing on temples, incredible food, and scenic nature. Planning: Tokyo (4 days) → Kyoto (3 days) → Osaka (2 days) → Nara (1 day). Shall I go ahead?";

  constructor() {
    setTimeout(() => {
      this.isTyping.set(false);
      this.messages.push({ role: 'ai', text: this.aiReply });
    }, 2800);
  }

  selectFeature(index: number): void {
    this.activeFeature.set(index);
  }
}
