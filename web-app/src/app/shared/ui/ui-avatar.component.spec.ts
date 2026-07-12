import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiAvatarComponent } from './ui-avatar.component';

describe('UiAvatarComponent', () => {
  let fixture: ComponentFixture<UiAvatarComponent>;
  let component: UiAvatarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UiAvatarComponent] }).compileComponents();
    fixture = TestBed.createComponent(UiAvatarComponent);
    component = fixture.componentInstance;
  });

  it('takes the first two initials, uppercased', () => {
    fixture.componentRef.setInput('name', 'wow test');
    expect(component.initials()).toBe('WT');
    fixture.componentRef.setInput('name', 'Marco Bianchi Rossi');
    expect(component.initials()).toBe('MB');
  });

  it('handles a single name', () => {
    fixture.componentRef.setInput('name', 'Kyoto');
    expect(component.initials()).toBe('K');
  });

  it('is empty for a blank name', () => {
    fixture.componentRef.setInput('name', '');
    expect(component.initials()).toBe('');
  });
});
