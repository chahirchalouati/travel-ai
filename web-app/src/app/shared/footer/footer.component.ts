import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface FooterLink {
  label: string;
  route?: string;
  href?: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  year = new Date().getFullYear();

  columns: FooterColumn[] = [
    {
      title: 'Product',
      links: [
        { label: 'AI Planner', route: '/planner' },
        { label: 'Destinations', route: '/' },
        { label: 'Chat with AI', route: '/chat' },
        { label: 'Trip Dashboard', route: '/profile' },
        { label: 'Booking Integration', route: '/planner' },
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
    { label: 'Twitter / X', icon: '𝕏' },
    { label: 'Instagram', icon: '◎' },
    { label: 'TikTok', icon: '▶' },
    { label: 'YouTube', icon: '▷' },
  ];
}
