import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface EntityAttachment {
  id: string;
  type: 'destination' | 'hotel' | 'restaurant';
  name: string;
  subtitle: string;
  description: string;
  imageUrl: string | null;
  price: number | null;
  priceLabel: string | null;
  rating: number | null;
  latitude: number | null;
  longitude: number | null;
  tags: string[];
}

@Component({
  selector: 'app-entity-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="entity-card" [class]="'entity-card--' + entity.type">
      <div class="card-visual">
        @if (entity.imageUrl) {
          <img [src]="entity.imageUrl" [alt]="entity.name" class="card-image" loading="lazy" />
        } @else {
          <div class="card-image-placeholder">
            <span class="ms">{{ typeIcon }}</span>
          </div>
        }
        <span class="card-type-badge">{{ typeLabel }}</span>
      </div>

      <div class="card-body">
        <div class="card-header">
          <h4 class="card-name">{{ entity.name }}</h4>
          @if (entity.rating) {
            <div class="card-rating">
              @for (s of starsArray; track s) {
                <span class="ms star" [class.filled]="s <= entity.rating!">star</span>
              }
            </div>
          }
        </div>

        <p class="card-subtitle">{{ entity.subtitle }}</p>

        @if (entity.description) {
          <p class="card-desc">{{ entity.description }}</p>
        }

        <div class="card-footer">
          @if (entity.tags.length > 0) {
            <div class="card-tags">
              @for (tag of entity.tags.slice(0, 3); track tag) {
                <span class="card-tag">{{ tag }}</span>
              }
            </div>
          }

          @if (entity.price) {
            <div class="card-price">
              <span class="price-amount">€{{ entity.price }}</span>
              <span class="price-label">{{ entity.priceLabel }}</span>
            </div>
          } @else if (entity.priceLabel) {
            <div class="card-price">
              <span class="price-amount">{{ entity.priceLabel }}</span>
            </div>
          }
        </div>

        <div class="card-actions">
          <a class="card-action-btn primary" [routerLink]="detailLink">
            <span class="ms">{{ primaryIcon }}</span>
            {{ primaryLabel }}
          </a>
          @if (entity.latitude && entity.longitude) {
            <a
              class="card-action-btn secondary"
              [href]="'https://maps.google.com/?q=' + entity.latitude + ',' + entity.longitude"
              target="_blank"
              rel="noopener"
            >
              <span class="ms">map</span>
              Map
            </a>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .entity-card {
      display: flex;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 3px;
      overflow: hidden;
      transition: box-shadow 200ms ease, border-color 200ms ease;
      min-width: 280px;
      max-width: 320px;
      flex-shrink: 0;
    }

    .entity-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      border-color: var(--border);
    }

    .entity-card {
      flex-direction: column;
    }

    .card-visual {
      position: relative;
      height: 140px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .card-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .card-image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-tertiary);
    }

    .card-image-placeholder .ms {
      font-size: 40px;
      color: var(--text-tertiary);
    }

    .card-type-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #fff;
    }

    .entity-card--destination .card-type-badge { background: var(--brand); }
    .entity-card--hotel .card-type-badge { background: var(--teal); }
    .entity-card--restaurant .card-type-badge { background: var(--gold); }

    .card-body {
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }

    .card-name {
      font-size: 15px;
      font-weight: 700;
      margin: 0;
      line-height: 1.3;
      color: var(--text-primary);
    }

    .card-rating {
      display: flex;
      gap: 1px;
      flex-shrink: 0;
    }

    .star {
      font-size: 14px;
      color: #ddd;
    }

    .star.filled {
      color: var(--gold);
    }

    .card-subtitle {
      font-size: 12px;
      color: var(--text-tertiary);
      margin: 0;
    }

    .card-desc {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: 4px;
    }

    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .card-tag {
      font-size: 10px;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 3px;
      background: var(--bg-secondary);
      color: var(--text-secondary);
    }

    .card-price {
      display: flex;
      align-items: baseline;
      gap: 3px;
      flex-shrink: 0;
    }

    .price-amount {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .price-label {
      font-size: 11px;
      color: var(--text-tertiary);
    }

    .card-actions {
      display: flex;
      gap: 6px;
      margin-top: 6px;
    }

    .card-action-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 7px 12px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      text-decoration: none;
      transition: background 150ms ease, transform 100ms ease;
    }

    .card-action-btn:active { transform: scale(0.97); }
    .card-action-btn .ms { font-size: 15px; }

    .card-action-btn.primary {
      background: var(--brand);
      color: #fff;
    }

    .card-action-btn.primary:hover { background: var(--brand-hover); }

    .entity-card--hotel .card-action-btn.primary { background: var(--teal); }
    .entity-card--hotel .card-action-btn.primary:hover { background: #242424; }

    .entity-card--restaurant .card-action-btn.primary { background: var(--gold); color: var(--text-primary); }
    .entity-card--restaurant .card-action-btn.primary:hover { background: #a77025; }

    .card-action-btn.secondary {
      background: var(--bg-secondary);
      color: var(--text-secondary);
    }

    .card-action-btn.secondary:hover { background: var(--bg-tertiary); }
  `]
})
export class EntityCardComponent {
  @Input({ required: true }) entity!: EntityAttachment;

  get typeIcon(): string {
    const icons: Record<string, string> = {
      destination: 'travel_explore',
      hotel: 'hotel',
      restaurant: 'restaurant',
    };
    return icons[this.entity.type] ?? 'place';
  }

  /** Router path to the entity's detail page. */
  get detailLink(): (string | number)[] {
    const base: Record<EntityAttachment['type'], string> = {
      destination: '/destination',
      hotel: '/hotels',
      restaurant: '/restaurants',
    };
    return [base[this.entity.type], this.entity.id];
  }

  get primaryIcon(): string {
    return this.entity.type === 'destination' ? 'explore' : this.typeIcon;
  }

  get primaryLabel(): string {
    return this.entity.type === 'destination' ? 'Explore' : 'View Details';
  }

  get typeLabel(): string {
    return this.entity.type.charAt(0).toUpperCase() + this.entity.type.slice(1);
  }

  get starsArray(): number[] {
    return [1, 2, 3, 4, 5];
  }
}
