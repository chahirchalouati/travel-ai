import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  year = new Date().getFullYear();

  columns: FooterColumn[] = [
    {
      title: 'Product',
      links: [
        { label: 'AI Planner', href: '#' },
        { label: 'Destinations', href: '#destinations' },
        { label: 'Itinerary Builder', href: '#itinerary' },
        { label: 'Trip Dashboard', href: '#' },
        { label: 'Booking Integration', href: '#' },
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About us', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Press', href: '#' },
        { label: 'Contact', href: '#' },
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Centre', href: '#' },
        { label: 'Safety', href: '#' },
        { label: 'Community', href: '#' },
        { label: 'Partners', href: '#' },
        { label: 'API', href: '#' },
      ]
    },
  ];

  socials = [
    { label: 'Twitter', icon: '𝕏' },
    { label: 'Instagram', icon: '◎' },
    { label: 'TikTok', icon: '▶' },
    { label: 'YouTube', icon: '▷' },
  ];
}
