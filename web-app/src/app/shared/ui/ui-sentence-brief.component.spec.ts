import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiSentenceBriefComponent, type TripBrief } from './ui-sentence-brief.component';

describe('UiSentenceBriefComponent', () => {
  let fixture: ComponentFixture<UiSentenceBriefComponent>;
  let component: UiSentenceBriefComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UiSentenceBriefComponent] }).compileComponents();
    fixture = TestBed.createComponent(UiSentenceBriefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exposes sensible defaults in the brief', () => {
    const b = component.brief();
    expect(b.nights).toBe(7);
    expect(b.place).toBe('Kyoto');
    expect(b.travellers).toBe(2);
    expect(b.budget).toBe(2000);
    expect(b.focus).toEqual(['food', 'temples']);
  });

  it('clamps the nights stepper at a minimum of 1', () => {
    for (let i = 0; i < 10; i++) component.bump('nights', -1);
    expect(component.nights()).toBe(1);
  });

  it('toggles a focus tag off and on and emits the change', () => {
    const emitted: TripBrief[] = [];
    component.briefChange.subscribe((b) => emitted.push(b));

    component.toggleFocus('food'); // present by default -> removed
    expect(component.hasFocus('food')).toBeFalse();
    component.toggleFocus('art'); // absent -> added
    expect(component.hasFocus('art')).toBeTrue();

    expect(emitted.length).toBe(2);
    expect(emitted[1].focus).toContain('art');
  });

  it('labels an empty focus as "anything"', () => {
    component.focus.set([]);
    expect(component.focusLabel()).toBe('anything');
  });

  it('rounds the budget from the range input', () => {
    component.setBudget('2450.7');
    expect(component.budget()).toBe(2451);
  });

  it('emits the brief on compose', () => {
    let composed: TripBrief | undefined;
    component.compose.subscribe((b) => (composed = b));
    component.setPlace('Lisbon');
    component.compose.emit(component.brief());
    expect(composed?.place).toBe('Lisbon');
  });
});
