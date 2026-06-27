import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  stats: Stat[] = [
    { value: 12, suffix: 'M+', label: 'Trips Planned', display: '0M+' },
    { value: 195, suffix: '', label: 'Countries Covered', display: '0' },
    { value: 4.9, suffix: '★', label: 'Average Rating', display: '0★' },
    { value: 2, suffix: 'min', label: 'To Full Itinerary', display: '0min' },
  ];

  ngOnInit(): void {
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
