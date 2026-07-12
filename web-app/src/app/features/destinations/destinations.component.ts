import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DestinationService } from '../../core/services/destination.service';
import type { DestinationResponse } from '../../core/models/api.models';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { UiSelectComponent, UiCheckboxComponent, UiInputComponent } from '../../shared/ui';
import { UiSkeletonComponent } from '../../shared/ui/ui-skeleton.component';

@Component({
  selector: 'app-destinations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RevealDirective, UiSelectComponent, UiCheckboxComponent, UiInputComponent, UiSkeletonComponent],
  templateUrl: './destinations.component.html',
  styleUrl: './destinations.component.scss'
})
export class DestinationsComponent implements OnInit {
  private readonly destinationService = inject(DestinationService);

  destinations = signal<DestinationResponse[]>([]);
  activeFilter = signal('all');
  activeInterest = signal('all');
  search = signal('');
  sortBy = signal('');
  featuredOnly = signal(false);
  loading = signal(true);

  filters = [
    { id: 'all', label: 'All' },
    { id: 'Asia', label: 'Asia' },
    { id: 'Europe', label: 'Europe' },
    { id: 'Africa', label: 'Africa' },
    { id: 'North America', label: 'Americas' },
    { id: 'Oceania', label: 'Oceania' },
  ];

  /** Distinct interest tags across the loaded destinations, for the interest dropdown. */
  readonly interests = computed(() => {
    const set = new Set<string>();
    for (const d of this.destinations()) {
      for (const tag of this.parseTags(d.tags)) {
        set.add(tag);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  });

  /** Interest dropdown options ("All interests" + each distinct tag). */
  readonly interestOptions = computed(() => [
    { value: 'all', label: 'All interests' },
    ...this.interests().map(tag => ({ value: tag, label: tag })),
  ]);

  /** Applies continent + interest + text + sort entirely client-side over the loaded set. */
  readonly filteredDestinations = computed(() => {
    const continent = this.activeFilter();
    const interest = this.activeInterest();
    const term = this.search().trim().toLowerCase();
    const sort = this.sortBy();
    const featuredOnly = this.featuredOnly();

    let list = this.destinations().filter(d => {
      if (continent !== 'all' && d.continent !== continent) return false;
      if (interest !== 'all' && !this.parseTags(d.tags).includes(interest)) return false;
      if (term && !(`${d.name} ${d.country}`.toLowerCase().includes(term))) return false;
      if (featuredOnly && !d.featured) return false;
      return true;
    });

    const comparators: Record<string, (a: DestinationResponse, b: DestinationResponse) => number> = {
      price_asc: (a, b) => a.avgDailyCost - b.avgDailyCost,
      price_desc: (a, b) => b.avgDailyCost - a.avgDailyCost,
      popularity_desc: (a, b) => b.popularityScore - a.popularityScore,
      name_asc: (a, b) => a.name.localeCompare(b.name),
    };
    if (comparators[sort]) {
      list = [...list].sort(comparators[sort]);
    }
    return list;
  });

  ngOnInit(): void {
    this.destinationService.getAll(0, 60).subscribe({
      next: (data) => {
        this.destinations.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setFilter(id: string): void {
    this.activeFilter.set(id);
  }

  parseTags(tags: string): string[] {
    if (!tags) return [];
    return tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  formatPrice(avgDailyCost: number): string {
    return '$' + Math.round(avgDailyCost).toLocaleString();
  }
}
