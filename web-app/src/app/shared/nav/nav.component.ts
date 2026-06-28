import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface NavTab {
  label: string;
  href: string;
  active: boolean;
}

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent {
  scrolled = signal(false);
  mobileOpen = signal(false);

  tabs: NavTab[] = [
    { label: 'Discover', href: '#destinations', active: true },
    { label: 'Hotels', href: '#hotels', active: false },
    { label: 'Restaurants', href: '#restaurants', active: false },
    { label: 'Things to Do', href: '#things-to-do', active: false },
    { label: 'AI Planner', href: '#itinerary', active: false },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 40);
  }

  openMenu(): void { this.mobileOpen.set(true); document.body.style.overflow = 'hidden'; }
  closeMenu(): void { this.mobileOpen.set(false); document.body.style.overflow = ''; }
}
