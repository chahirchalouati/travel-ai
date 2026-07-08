import { Component } from '@angular/core';
import { LegalLayoutComponent, LegalSection } from './legal-layout.component';

@Component({
  selector: 'app-accessibility',
  standalone: true,
  imports: [LegalLayoutComponent],
  template: `
    <app-legal-layout
      titleKey="accessibility.title"
      introKey="accessibility.intro"
      updated="July 2026"
      [sections]="sections" />
  `,
})
export class AccessibilityComponent {
  sections: LegalSection[] = [
    { titleKey: 'accessibility.s1.title', bodyKeys: ['accessibility.s1.p1'] },
    { titleKey: 'accessibility.s2.title', bodyKeys: ['accessibility.s2.p1'] },
    { titleKey: 'accessibility.s3.title', bodyKeys: ['accessibility.s3.p1'] },
    { titleKey: 'accessibility.s4.title', bodyKeys: ['accessibility.s4.p1'] },
    { titleKey: 'accessibility.s5.title', bodyKeys: ['accessibility.s5.p1'] },
  ];
}
