import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Destination {
  id: string;
  name: string;
  country: string;
  flag: string;
  bgClass: string;
  rating: number;
  price: string;
  days: string;
  tags: string[];
  bestTime: string;
  regions: string[];
  featured: boolean;
  glows: { color: string; size: number; top: string; left: string; opacity: number }[];
}

@Component({
  selector: 'app-destinations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './destinations.component.html',
  styleUrl: './destinations.component.scss'
})
export class DestinationsComponent {
  activeFilter = signal('all');

  filters = [
    { id: 'all', label: 'All' },
    { id: 'asia', label: 'Asia' },
    { id: 'europe', label: 'Europe' },
    { id: 'tropics', label: 'Tropics' },
    { id: 'urban', label: 'Urban' },
  ];

  destinations: Destination[] = [
    {
      id: 'tokyo', name: 'Tokyo', country: 'Japan', flag: '🇯🇵',
      bgClass: 'dest-bg-tokyo', rating: 4.9, price: '$890', days: '10 days ideal',
      bestTime: 'Mar–May', tags: ['Culture', 'Food', 'Technology'],
      regions: ['asia'], featured: true,
      glows: [
        { color: '#c80032', size: 300, top: '10%', left: '60%', opacity: .45 },
        { color: '#8800aa', size: 200, top: '60%', left: '15%', opacity: .35 },
      ]
    },
    {
      id: 'santorini', name: 'Santorini', country: 'Greece', flag: '🇬🇷',
      bgClass: 'dest-bg-santorini', rating: 4.8, price: '$720', days: '7 days ideal',
      bestTime: 'May–Oct', tags: ['Romance', 'Views'],
      regions: ['europe'], featured: false,
      glows: [{ color: '#4080c0', size: 180, top: '20%', left: '20%', opacity: .5 }]
    },
    {
      id: 'bali', name: 'Bali', country: 'Indonesia', flag: '🇮🇩',
      bgClass: 'dest-bg-bali', rating: 4.7, price: '$650', days: '10 days ideal',
      bestTime: 'Apr–Oct', tags: ['Nature', 'Spiritual'],
      regions: ['asia', 'tropics'], featured: false,
      glows: [{ color: '#608040', size: 200, top: '15%', left: '15%', opacity: .5 }]
    },
    {
      id: 'maldives', name: 'Maldives', country: 'Maldives', flag: '🌊',
      bgClass: 'dest-bg-maldives', rating: 4.9, price: '$1,200', days: '7 days ideal',
      bestTime: 'Nov–Apr', tags: ['Luxury', 'Beach'],
      regions: ['tropics'], featured: false,
      glows: [{ color: '#20809a', size: 200, top: '20%', left: '20%', opacity: .55 }]
    },
    {
      id: 'ny', name: 'New York', country: 'USA', flag: '🗽',
      bgClass: 'dest-bg-ny', rating: 4.6, price: '$380', days: '5 days ideal',
      bestTime: 'Sep–Nov', tags: ['Urban', 'Arts'],
      regions: ['urban'], featured: false,
      glows: [{ color: '#2060a0', size: 200, top: '20%', left: '60%', opacity: .45 }]
    },
    {
      id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷',
      bgClass: 'dest-bg-paris', rating: 4.8, price: '$550', days: '5 days ideal',
      bestTime: 'Apr–Jun', tags: ['Romance', 'Cuisine'],
      regions: ['europe', 'urban'], featured: false,
      glows: [{ color: '#806090', size: 180, top: '20%', left: '20%', opacity: .5 }]
    },
  ];

  get visibleDestinations(): Destination[] {
    const filter = this.activeFilter();
    if (filter === 'all') return this.destinations;
    return this.destinations.filter(d => d.regions.includes(filter));
  }

  setFilter(id: string): void {
    this.activeFilter.set(id);
  }

  getGlowStyle(g: Destination['glows'][0]): Record<string, string> {
    return {
      position: 'absolute',
      width: `${g.size}px`,
      height: `${g.size}px`,
      background: g.color,
      top: g.top,
      left: g.left,
      borderRadius: '50%',
      filter: 'blur(40px)',
      opacity: String(g.opacity),
    };
  }
}
