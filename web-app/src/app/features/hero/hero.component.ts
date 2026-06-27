import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Suggestion {
  icon: string;
  value: string;
  label: string;
  bold: string;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent {
  searchQuery = signal('');
  showSuggestions = signal(false);
  isPlanning = signal(false);

  suggestions: Suggestion[] = [
    { icon: '🗾', value: '10 days in Japan with focus on temples and cuisine', label: 'temples & cuisine', bold: '10 days in Japan' },
    { icon: '🏛', value: 'Romantic week in Santorini', label: 'Greece', bold: 'Romantic week in Santorini' },
    { icon: '🌴', value: 'Adventure trip to Bali on a budget', label: 'budget-friendly', bold: 'Adventure in Bali' },
    { icon: '🗽', value: 'Long weekend in New York City', label: 'arts & food', bold: 'Weekend in New York' },
  ];

  quickPicks = [
    { label: '✦ Paris', dest: 'Weekend in Paris' },
    { label: '🗾 Tokyo', dest: 'Week in Tokyo' },
    { label: '🌊 Maldives', dest: 'Beach holiday in Maldives' },
    { label: '🦁 Kenya', dest: 'Safari in Kenya' },
    { label: '❄️ Iceland', dest: 'Explore Iceland' },
  ];

  onFocus(): void {
    if (!this.searchQuery()) this.showSuggestions.set(true);
  }

  onInput(val: string): void {
    this.searchQuery.set(val);
    this.showSuggestions.set(!val);
  }

  onBlur(): void {
    setTimeout(() => this.showSuggestions.set(false), 200);
  }

  selectSuggestion(suggestion: Suggestion): void {
    this.searchQuery.set(suggestion.value);
    this.showSuggestions.set(false);
  }

  setQuickPick(dest: string): void {
    this.searchQuery.set(dest);
  }

  planTrip(): void {
    if (!this.searchQuery()) return;
    this.isPlanning.set(true);
    setTimeout(() => {
      this.isPlanning.set(false);
      document.getElementById('itinerary')?.scrollIntoView({ behavior: 'smooth' });
    }, 1600);
  }
}
