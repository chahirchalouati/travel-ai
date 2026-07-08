import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

interface FooterLink {
  key: string;
  route?: string;
  href?: string;
}

interface FooterColumn {
  titleKey: string;
  links: FooterLink[];
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  year = new Date().getFullYear();

  columns: FooterColumn[] = [
    {
      titleKey: 'footer.cols.product',
      links: [
        { key: 'footer.links.aiPlanner', route: '/planner' },
        { key: 'footer.links.destinations', route: '/' },
        { key: 'footer.links.chatWithAi', route: '/chat' },
        { key: 'footer.links.tripDashboard', route: '/profile' },
        { key: 'footer.links.bookingIntegration', route: '/planner' },
      ]
    },
    {
      titleKey: 'footer.cols.company',
      links: [
        { key: 'footer.links.about', route: '/about' },
        { key: 'footer.links.blog', route: '/blog' },
        { key: 'footer.links.careers', route: '/careers' },
        { key: 'footer.links.press', route: '/press' },
        { key: 'footer.links.contact', route: '/contact' },
      ]
    },
    {
      titleKey: 'footer.cols.support',
      links: [
        { key: 'footer.links.help', route: '/help' },
        { key: 'footer.links.safety', route: '/safety' },
        { key: 'footer.links.community', route: '/forum' },
        { key: 'footer.links.partners', route: '/partners' },
        { key: 'footer.links.api', route: '/developers' },
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
