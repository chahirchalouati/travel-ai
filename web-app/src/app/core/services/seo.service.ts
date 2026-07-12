import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

/** Fields a page can override; anything omitted falls back to site defaults. */
export interface SeoData {
  title?: string;
  description?: string;
  /** Absolute or relative image URL for social cards. */
  image?: string;
  /** og:type — 'website' for listings, 'article' for content, 'product' for detail pages. */
  type?: 'website' | 'article' | 'product';
  /** Overrides the canonical/og:url; defaults to the current location. */
  url?: string;
  /** When true, adds a noindex robots tag (auth-gated / private pages). */
  noindex?: boolean;
}

const SITE_NAME = 'TravelAI';
const TITLE_SUFFIX = ' — TravelAI';
const DEFAULT_DESCRIPTION =
  'Discover destinations, read real reviews, and plan smarter trips with AI-powered recommendations.';
const DEFAULT_IMAGE = '/assets/hero/japan.webp';

/**
 * Centralises document title, meta description, canonical, and Open Graph /
 * Twitter card tags. Client-side only (SPA); crawlers that execute JS pick these
 * up. Call setTag() from a page component or rely on the route-data defaults
 * applied globally in AppComponent.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  /** Apply a page's SEO metadata, filling any gaps with site defaults. */
  setTag(data: SeoData = {}): void {
    const pageTitle = data.title
      ? `${data.title}${TITLE_SUFFIX}`
      : 'TravelAI — Discover, Plan & Book Smarter';
    const description = data.description ?? DEFAULT_DESCRIPTION;
    const image = this.absoluteUrl(data.image ?? DEFAULT_IMAGE);
    const url = data.url ?? this.currentUrl();
    const type = data.type ?? 'website';

    this.title.setTitle(pageTitle);

    this.upsertName('description', description);
    this.upsertName('robots', data.noindex ? 'noindex, nofollow' : 'index, follow');

    this.upsertProperty('og:site_name', SITE_NAME);
    this.upsertProperty('og:title', pageTitle);
    this.upsertProperty('og:description', description);
    this.upsertProperty('og:type', type);
    this.upsertProperty('og:image', image);
    this.upsertProperty('og:url', url);

    this.upsertName('twitter:card', 'summary_large_image');
    this.upsertName('twitter:title', pageTitle);
    this.upsertName('twitter:description', description);
    this.upsertName('twitter:image', image);

    this.setCanonical(url);
  }

  private upsertName(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }

  private upsertProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content });
  }

  private setCanonical(url: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private currentUrl(): string {
    const loc = this.doc.location;
    return loc ? `${loc.origin}${loc.pathname}` : '';
  }

  private absoluteUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    const origin = this.doc.location?.origin ?? '';
    return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}
