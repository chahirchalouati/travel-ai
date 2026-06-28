import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { AuthService } from '../../core/services/auth.service';

interface NavTab {
  key: string;
  route: string;
}

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslocoModule, LanguageSwitcherComponent, UserMenuComponent, AuthModalComponent],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent {
  readonly auth = inject(AuthService);

  scrolled = signal(false);
  mobileOpen = signal(false);
  authOpen = signal(false);

  openAuth(): void {
    this.mobileOpen.set(false);
    document.body.style.overflow = '';
    this.authOpen.set(true);
  }

  closeAuth(): void {
    this.authOpen.set(false);
  }

  tabs: NavTab[] = [
    { key: 'nav.tabs.discover', route: '/' },
    { key: 'nav.tabs.hotels', route: '/hotels' },
    { key: 'nav.tabs.restaurants', route: '/restaurants' },
    { key: 'nav.tabs.cruises', route: '/cruises' },
    { key: 'nav.tabs.flights', route: '/flights' },
    { key: 'nav.tabs.thingsToDo', route: '/search' },
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
