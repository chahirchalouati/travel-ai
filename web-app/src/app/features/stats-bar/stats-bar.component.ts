import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService } from '../../core/services/stats.service';

interface Stat {
  value: number;
  suffix: string;
  label: string;
  display: string;
}

@Component({
  selector: 'app-stats-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-bar.component.html',
  styleUrl: './stats-bar.component.scss'
})
export class StatsBarComponent implements OnInit {
  private readonly statsService = inject(StatsService);

  stats: Stat[] = [
    { value: 0, suffix: '', label: 'Destinations', display: '0' },
    { value: 0, suffix: '', label: 'Traveler Reviews', display: '0' },
    { value: 4.8, suffix: '★', label: 'Average Rating', display: '0★' },
    { value: 2, suffix: 'min', label: 'To Full Itinerary', display: '0min' },
  ];

  ngOnInit(): void {
    this.statsService.getStats().subscribe({
      next: (data) => {
        this.stats[0].value = data.destinationCount;
        this.stats[1].value = data.reviewCount;
        this.setupObserver();
      },
      error: () => {
        // Fallback values
        this.stats[0].value = 50;
        this.stats[1].value = 500;
        this.setupObserver();
      }
    });
  }

  private setupObserver(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          observer.unobserve(e.target);
          this.animateStats();
        });
      },
      { threshold: 0.5 }
    );

    setTimeout(() => {
      const el = document.getElementById('stats');
      if (el) observer.observe(el);
    }, 200);
  }

  private animateStats(): void {
    const duration = 1800;
    const start = performance.now();

    const update = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      this.stats.forEach(stat => {
        const isFloat = String(stat.value).includes('.');
        const val = isFloat
          ? (stat.value * ease).toFixed(1)
          : Math.round(stat.value * ease).toString();
        stat.display = val + stat.suffix;
      });

      if (t < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  }
}
