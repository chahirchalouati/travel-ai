import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Activity {
  icon: string;
  name: string;
  time: string;
  badge: string;
  badgeClass: string;
}

interface ItineraryDay {
  label: string;
  activities: Activity[];
}

@Component({
  selector: 'app-itinerary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './itinerary.component.html',
  styleUrl: './itinerary.component.scss'
})
export class ItineraryComponent {
  days = signal<ItineraryDay[]>([
    {
      label: 'Day 1 — Arrival & Shinjuku',
      activities: [
        { icon: '✈️', name: 'Arrive at Narita Airport', time: 'Morning · Transfer to hotel', badge: 'Transport', badgeClass: '' },
        { icon: '🏯', name: 'Shinjuku Gyoen Garden', time: 'Afternoon · 14:00–17:00', badge: 'Nature', badgeClass: 'sky' },
        { icon: '🍜', name: 'Ichiran Ramen Shinjuku', time: 'Evening · Dinner', badge: 'Dining', badgeClass: '' },
      ]
    },
    {
      label: 'Day 2 — Asakusa & Temples',
      activities: [
        { icon: '⛩', name: 'Senso-ji Temple', time: 'Early morning · Sunrise visit', badge: 'Culture', badgeClass: 'sky' },
        { icon: '🍱', name: 'Tsukiji Outer Market', time: 'Midday · Sushi breakfast', badge: 'Food', badgeClass: '' },
        { icon: '🗼', name: 'Tokyo Skytree at dusk', time: 'Evening · 17:30–20:00', badge: 'Views', badgeClass: 'sky' },
      ]
    },
  ]);

  highlights = signal([
    { icon: '✦', title: 'Optimal scheduling', desc: 'AI sequences activities to minimise travel time and maximise your experience at each site.' },
    { icon: '🌤', title: 'Weather-aware planning', desc: 'Outdoor activities are automatically scheduled for the best weather windows.' },
    { icon: '💡', title: 'Local insider tips', desc: 'Skip queues, find hidden gems, and eat where the locals eat — all built into your plan.' },
    { icon: '🔄', title: 'Instantly editable', desc: 'Swap any activity, adjust timing, or regenerate a day with a single message.' },
  ]);
}
