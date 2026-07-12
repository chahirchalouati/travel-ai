import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LegalLayoutComponent, LegalSection } from './legal-layout.component';
import { SiteContentService } from '../../core/services/site-content.service';

/**
 * Renders any legal document (privacy, terms, cookies, accessibility) from the
 * backend. The page slug comes from the route's `legalPage` data property.
 */
@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [LegalLayoutComponent],
  template: `
    @if (title()) {
      <app-legal-layout
        [title]="title()"
        [updated]="updated()"
        [intro]="intro()"
        [sections]="sections()" />
    }
  `,
})
export class LegalPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly siteContent = inject(SiteContentService);

  title = signal('');
  updated = signal('');
  intro = signal<string | undefined>(undefined);
  sections = signal<LegalSection[]>([]);

  constructor() {
    const page = this.route.snapshot.data['legalPage'] as string;
    this.siteContent.getPage(page).subscribe({
      next: items => {
        const meta = items.find(i => i.section === 'meta');
        this.title.set(meta?.title ?? '');
        this.updated.set(meta?.value ?? '');
        this.intro.set(meta?.body ?? undefined);
        this.sections.set(
          items
            .filter(i => i.section === 'section')
            .map(i => ({ title: i.title ?? '', paragraphs: i.bullets })),
        );
      },
      error: () => {},
    });
  }
}
