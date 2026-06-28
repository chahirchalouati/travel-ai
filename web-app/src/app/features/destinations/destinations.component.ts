import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DestinationService } from '../../core/services/destination.service';
import type { DestinationResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-destinations',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './destinations.component.html',
  styleUrl: './destinations.component.scss'
})
export class DestinationsComponent implements OnInit {
  private readonly destinationService = inject(DestinationService);

  destinations = signal<DestinationResponse[]>([]);
  filteredDestinations = signal<DestinationResponse[]>([]);
  activeFilter = signal('all');
  loading = signal(true);

  filters = [
    { id: 'all', label: 'All' },
    { id: 'Asia', label: 'Asia' },
    { id: 'Europe', label: 'Europe' },
    { id: 'Africa', label: 'Africa' },
    { id: 'North America', label: 'Americas' },
    { id: 'Oceania', label: 'Oceania' },
  ];

  ngOnInit(): void {
    this.destinationService.getAll(0, 20).subscribe({
      next: (data) => {
        this.destinations.set(data);
        this.filteredDestinations.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setFilter(id: string): void {
    this.activeFilter.set(id);
    if (id === 'all') {
      this.filteredDestinations.set(this.destinations());
    } else {
      this.filteredDestinations.set(
        this.destinations().filter(d => d.continent === id)
      );
    }
  }

  parseTags(tags: string): string[] {
    if (!tags) return [];
    return tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  formatPrice(avgDailyCost: number): string {
    return '$' + Math.round(avgDailyCost).toLocaleString();
  }
}
