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
  { key: 'userMenu.tripPlanner', icon: 'auto_awesome',        route: '/planner' },
  { key: 'userMenu.myTrips',     icon: 'luggage',             route: '/trips' },
  { key: 'userMenu.profile',     icon: 'person',              route: '/profile' },
  { key: 'userMenu.bookings',    icon: 'confirmation_number', route: '/bookings' },
  { key: 'userMenu.membership',  icon: 'workspace_premium',   route: '/membership' },
  { key: 'userMenu.rewards',     icon: 'redeem',              route: '/rewards' },
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
          @if (avatarUrl()) {
            <img class="avatar-photo" [src]="avatarUrl()" alt="" />
          } @else if (initials()) {
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

          @if (isAdmin()) {
            <div class="divider"></div>
            <button class="menu-item menu-item--admin" role="menuitem" (click)="navigate('/admin')">
              <span class="ms menu-icon">admin_panel_settings</span>
              {{ 'userMenu.adminPanel' | transloco }}
            </button>
          }

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
      background: var(--color-red);
      display: flex; align-items: center; justify-content: center;
      border: 2px solid var(--border);
      transition: border-color 150ms ease;
      overflow: hidden;
    }
    .avatar-photo { width: 100%; height: 100%; object-fit: cover; display: block; }
    .avatar-btn:hover .avatar-circle { border-color: var(--color-ink); }

    .dropdown {
      position: absolute; top: calc(100% + 8px); right: 0;
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm);
      box-shadow: var(--shadow-lg);
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
      border-radius: var(--radius-sm); padding: 10px 12px;
      font-family: var(--font-body);
      font-size: 14px; font-weight: 500; color: var(--text-primary);
      cursor: pointer; transition: background 100ms ease;
      text-align: left;
    }
    .menu-item:hover { background: var(--surface-hover); }

    .menu-item--danger { color: var(--color-red-ink); }
    .menu-item--danger:hover { background: var(--color-red-tint); }

    .menu-item--admin { color: var(--text-primary); font-weight: 700; }
    .menu-item--admin .menu-icon { color: var(--color-red-ink); }
    .menu-item--admin:hover { background: var(--surface-hover); }

    .menu-icon { font-size: 18px; color: var(--text-subtle); }
    .menu-item--danger .menu-icon { color: var(--color-red-ink); }

    .divider {
      height: 1px; background: var(--border); margin: 4px 0;
    }

    .avatar-initials {
      font-family: var(--font-body);
      font-size: 14px; font-weight: 700; color: #fff; letter-spacing: 0.02em;
    }
  `],
})
export class UserMenuComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly menuItems = MENU_ITEMS;
  readonly open = signal(false);

  readonly avatarUrl = computed(() => this.authService.currentUser()?.avatarUrl ?? null);

  readonly initials = computed(() => {
    const u = this.authService.currentUser();
    if (!u) return '';
    const f = u.firstName?.[0] ?? '';
    const l = u.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || u.email[0].toUpperCase();
  });

  isAdmin(): boolean { return this.authService.isAdmin(); }

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
