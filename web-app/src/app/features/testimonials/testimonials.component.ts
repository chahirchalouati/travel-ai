import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../../core/services/review.service';
import type { ReviewResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss'
})
export class TestimonialsComponent implements OnInit {
  private readonly reviewService = inject(ReviewService);

  reviews = signal<ReviewResponse[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.reviewService.getRecent(6).subscribe({
      next: (data) => {
        this.reviews.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  getAvatarGradient(name: string): string {
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const hue1 = hash % 360;
    const hue2 = (hash * 7) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 45%, 40%), hsl(${hue2}, 45%, 30%))`;
  }

  getStars(rating: number): number[] {
    return Array.from({ length: Math.round(rating) }, (_, i) => i);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}
