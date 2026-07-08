import { Component } from '@angular/core';
import { LegalLayoutComponent, LegalSection } from './legal-layout.component';

@Component({
  selector: 'app-cookies',
  standalone: true,
  imports: [LegalLayoutComponent],
  template: `
    <app-legal-layout
      titleKey="cookies.title"
      introKey="cookies.intro"
      updated="July 2026"
      [sections]="sections" />
  `,
})
export class CookiesComponent {
  sections: LegalSection[] = [
    { titleKey: 'cookies.s1.title', bodyKeys: ['cookies.s1.p1'] },
    { titleKey: 'cookies.s2.title', bodyKeys: ['cookies.s2.p1'] },
    { titleKey: 'cookies.s3.title', bodyKeys: ['cookies.s3.p1'] },
    { titleKey: 'cookies.s4.title', bodyKeys: ['cookies.s4.p1'] },
    { titleKey: 'cookies.s5.title', bodyKeys: ['cookies.s5.p1'] },
  ];
}
