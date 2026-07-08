import { Component } from '@angular/core';
import { LegalLayoutComponent, LegalSection } from './legal-layout.component';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [LegalLayoutComponent],
  template: `
    <app-legal-layout
      titleKey="privacy.title"
      introKey="privacy.intro"
      updated="July 2026"
      [sections]="sections" />
  `,
})
export class PrivacyComponent {
  sections: LegalSection[] = [
    { titleKey: 'privacy.s1.title', bodyKeys: ['privacy.s1.p1', 'privacy.s1.p2'] },
    { titleKey: 'privacy.s2.title', bodyKeys: ['privacy.s2.p1'] },
    { titleKey: 'privacy.s3.title', bodyKeys: ['privacy.s3.p1', 'privacy.s3.p2'] },
    { titleKey: 'privacy.s4.title', bodyKeys: ['privacy.s4.p1'] },
    { titleKey: 'privacy.s5.title', bodyKeys: ['privacy.s5.p1'] },
    { titleKey: 'privacy.s6.title', bodyKeys: ['privacy.s6.p1'] },
  ];
}
