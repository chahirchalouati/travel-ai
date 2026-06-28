import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { UserMenuComponent } from '../user-menu/user-menu.component';

interface NavTab {
  key: string;
  route: string;
}

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslocoModule, LanguageSwitcherComponent, UserMenuComponent],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent {
  scrolled = signal(false);
  mobileOpen = signal(false);

  tabs: NavTab[] = [
    { key: 'nav.tabs.discover', route: '/' },
    { key: 'nav.tabs.hotels', route: '/' },
    { key: 'nav.tabs.restaurants', route: '/' },
    { key: 'nav.tabs.cruises', route: '/' },
    { key: 'nav.tabs.flights', route: '/' },
    { key: 'nav.tabs.thingsToDo', route: '/' },
    { key: 'nav.tabs.aiPlanner', route: '/planner' },
    { key: 'nav.tabs.chat', route: '/chat' },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 40);
  }

  openMenu(): void { this.mobileOpen.set(true); document.body.style.overflow = 'hidden'; }
  closeMenu(): void { this.mobileOpen.set(false); document.body.style.overflow = ''; }
}
