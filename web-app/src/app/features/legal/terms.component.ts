import { Component } from '@angular/core';
import { LegalLayoutComponent, LegalSection } from './legal-layout.component';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [LegalLayoutComponent],
  template: `
    <app-legal-layout
      titleKey="terms.title"
      introKey="terms.intro"
      updated="July 2026"
      [sections]="sections" />
  `,
})
export class TermsComponent {
  sections: LegalSection[] = [
    { titleKey: 'terms.s1.title', bodyKeys: ['terms.s1.p1'] },
    { titleKey: 'terms.s2.title', bodyKeys: ['terms.s2.p1', 'terms.s2.p2'] },
    { titleKey: 'terms.s3.title', bodyKeys: ['terms.s3.p1'] },
    { titleKey: 'terms.s4.title', bodyKeys: ['terms.s4.p1'] },
    { titleKey: 'terms.s5.title', bodyKeys: ['terms.s5.p1'] },
    { titleKey: 'terms.s6.title', bodyKeys: ['terms.s6.p1'] },
    { titleKey: 'terms.s7.title', bodyKeys: ['terms.s7.p1'] },
  ];
}
