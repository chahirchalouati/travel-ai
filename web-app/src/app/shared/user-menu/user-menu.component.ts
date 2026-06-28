import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';

interface MenuItem {
  key: string;
  icon: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { key: 'userMenu.myTrips',     icon: 'luggage',             route: '/trips' },
  { key: 'userMenu.profile',     icon: 'person',              route: '/profile' },
  { key: 'userMenu.bookings',    icon: 'confirmation_number', route: '/bookings' },
  { key: 'userMenu.messages',    icon: 'chat_bubble_outline', route: '/messages' },
  { key: 'userMenu.accountInfo', icon: 'manage_accounts',     route: '/account' },
];

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  template: `
    <div class="user-wrap" [class.open]="open()">
      <button class="avatar-btn" (click)="toggle()" [attr.aria-expanded]="open()" aria-label="User menu">
        <span class="avatar-circle">
          @if (initials()) {
            <span class="avatar-initials">{{ initials() }}</span>
          } @else {
            <span class="ms" style="font-size:20px; color:#fff">person</span>
          }
        </span>
        <span class="ms" style="font-size:14px; color:#8a8a8a; transition:transform 150ms ease"
              [style.transform]="open() ? 'rotate(180deg)' : 'rotate(0)'">
          expand_more
        </span>
      </button>

      @if (open()) {
        <div class="dropdown" role="menu">
          <ul class="menu-list">
            @for (item of menuItems; track item.key) {
              <li>
                <button class="menu-item" role="menuitem" (click)="navigate(item.route)">
                  <span class="ms menu-icon">{{ item.icon }}</span>
                  {{ item.key | transloco }}
                </button>
              </li>
            }
          </ul>

          <div class="divider"></div>

          <button class="menu-item menu-item--danger" role="menuitem" (click)="signOut()">
            <span class="ms menu-icon">logout</span>
            {{ 'userMenu.signOut' | transloco }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { position: relative; display: inline-block; }

    .user-wrap { position: relative; }

    .avatar-btn {
      display: flex; align-items: center; gap: 2px;
      background: none; border: none; cursor: pointer; padding: 2px;
    }

    .avatar-circle {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #E04A2F 0%, #ff7a5a 100%);
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #e0e0e0;
      transition: border-color 150ms ease;
    }
    .avatar-btn:hover .avatar-circle { border-color: #1a1a1a; }

    .dropdown {
      position: absolute; top: calc(100% + 8px); right: 0;
      background: #fff; border: 1px solid #e8e8e8; border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,.14);
      min-width: 200px; z-index: 2000;
      padding: 6px;
      animation: fadeIn 120ms ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .menu-list {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-direction: column;
    }

    .menu-item {
      display: flex; align-items: center; gap: 10px;
      width: 100%; background: none; border: none;
      border-radius: 8px; padding: 10px 12px;
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
      font-size: 14px; font-weight: 500; color: #1a1a1a;
      cursor: pointer; transition: background 100ms ease;
      text-align: left;
    }
    .menu-item:hover { background: #f5f5f5; }

    .menu-item--danger { color: #E04A2F; }
    .menu-item--danger:hover { background: #FFF0ED; }

    .menu-icon { font-size: 18px; color: #8a8a8a; }
    .menu-item--danger .menu-icon { color: #E04A2F; }

    .divider {
      height: 1px; background: #f0f0f0; margin: 4px 0;
    }

    .avatar-initials {
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
      font-size: 14px; font-weight: 700; color: #fff; letter-spacing: 0.02em;
    }
  `],
})
export class UserMenuComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly menuItems = MENU_ITEMS;
  readonly open = signal(false);

  readonly initials = computed(() => {
    const u = this.authService.currentUser();
    if (!u) return '';
    const f = u.firstName?.[0] ?? '';
    const l = u.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || u.email[0].toUpperCase();
  });

  toggle(): void { this.open.update(v => !v); }

  navigate(route: string): void {
    this.open.set(false);
    this.router.navigate([route]);
  }

  signOut(): void {
    this.open.set(false);
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/']),
    });
  }
}
