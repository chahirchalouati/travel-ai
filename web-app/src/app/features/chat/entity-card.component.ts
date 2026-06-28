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
          @if (entity.type === 'destination') {
            <a class="card-action-btn primary" [routerLink]="['/destination', entity.id]">
              <span class="ms">explore</span>
              Explore
            </a>
          } @else {
            <button class="card-action-btn primary">
              <span class="ms">{{ entity.type === 'hotel' ? 'hotel' : 'restaurant' }}</span>
              View Details
            </button>
          }
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
      background: #ffffff;
      border: 1px solid var(--border, #e0e0e0);
      border-radius: 14px;
      overflow: hidden;
      transition: box-shadow 200ms ease, border-color 200ms ease;
      min-width: 280px;
      max-width: 320px;
      flex-shrink: 0;
    }

    .entity-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      border-color: var(--border, #d0d0d0);
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
      background: var(--bg-tertiary, #f0f0f0);
    }

    .card-image-placeholder .ms {
      font-size: 40px;
      color: var(--text-tertiary, #8a8a8a);
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

    .entity-card--destination .card-type-badge { background: var(--brand, #E04A2F); }
    .entity-card--hotel .card-type-badge { background: var(--teal, #00856A); }
    .entity-card--restaurant .card-type-badge { background: var(--gold, #F5A623); }

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
      color: var(--text-primary, #1a1a1a);
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
      color: var(--gold, #F5A623);
    }

    .card-subtitle {
      font-size: 12px;
      color: var(--text-tertiary, #8a8a8a);
      margin: 0;
    }

    .card-desc {
      font-size: 12px;
      color: var(--text-secondary, #545454);
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
      border-radius: 12px;
      background: var(--bg-secondary, #f7f7f7);
      color: var(--text-secondary, #545454);
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
      color: var(--text-primary, #1a1a1a);
    }

    .price-label {
      font-size: 11px;
      color: var(--text-tertiary, #8a8a8a);
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
      background: var(--brand, #E04A2F);
      color: #fff;
    }

    .card-action-btn.primary:hover { background: var(--brand-hover, #c93d25); }

    .entity-card--hotel .card-action-btn.primary { background: var(--teal, #00856A); }
    .entity-card--hotel .card-action-btn.primary:hover { background: #006d57; }

    .entity-card--restaurant .card-action-btn.primary { background: var(--gold, #F5A623); color: #1a1a1a; }
    .entity-card--restaurant .card-action-btn.primary:hover { background: #e09510; }

    .card-action-btn.secondary {
      background: var(--bg-secondary, #f7f7f7);
      color: var(--text-secondary, #545454);
    }

    .card-action-btn.secondary:hover { background: var(--bg-tertiary, #f0f0f0); }
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

  get typeLabel(): string {
    return this.entity.type.charAt(0).toUpperCase() + this.entity.type.slice(1);
  }

  get starsArray(): number[] {
    return [1, 2, 3, 4, 5];
  }
}
