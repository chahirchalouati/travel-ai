import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initial: string;
  avatarGradient: string;
}

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss'
})
export class TestimonialsComponent {
  testimonials: Testimonial[] = [
    {
      quote: '"TravelAI planned our entire honeymoon in Santorini in 20 minutes. The restaurant recommendations were spot-on and the timing for sunset at Oia was absolutely perfect."',
      name: 'Sophie & Marco',
      role: 'Newlyweds · Santorini trip',
      initial: 'S',
      avatarGradient: 'linear-gradient(135deg,#3a4a8e,#6a3a8e)'
    },
    {
      quote: '"I\'ve been a solo traveller for 8 years and this is the first tool that actually understands how I travel. My Tokyo trip was the most organised I\'ve ever had."',
      name: 'James K.',
      role: 'Solo traveller · 47 countries',
      initial: 'J',
      avatarGradient: 'linear-gradient(135deg,#2a5a8e,#1a3a6a)'
    },
    {
      quote: '"We planned a family trip to Bali with three kids — TravelAI factored in nap schedules, age-appropriate activities, and even found a babysitter service we never would have discovered."',
      name: 'Aisha R.',
      role: 'Family travel · Bali trip',
      initial: 'A',
      avatarGradient: 'linear-gradient(135deg,#5a2a6e,#3a1a5e)'
    },
  ];
}
