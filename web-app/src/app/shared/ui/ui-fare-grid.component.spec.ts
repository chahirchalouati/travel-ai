import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiFareGridComponent, type FareDay } from './ui-fare-grid.component';

describe('UiFareGridComponent', () => {
  let fixture: ComponentFixture<UiFareGridComponent>;
  let component: UiFareGridComponent;

  function setDays(days: FareDay[]): void {
    fixture.componentRef.setInput('days', days);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UiFareGridComponent] }).compileComponents();
    fixture = TestBed.createComponent(UiFareGridComponent);
    component = fixture.componentInstance;
  });

  it('marks the lowest-priced available day as cheapest', () => {
    setDays([
      { label: 'A', price: 100 },
      { label: 'B', price: 80 },
      { label: 'C', price: 120 },
    ]);
    expect(component.cheapestIndex()).toBe(1);
  });

  it('skips sold-out days when picking the cheapest', () => {
    setDays([
      { label: 'A', price: 90 },
      { label: 'B', price: 50, available: false },
      { label: 'C', price: 110 },
    ]);
    expect(component.cheapestIndex()).toBe(0);
  });

  it('scales bar height between 10 and 30px', () => {
    setDays([
      { label: 'A', price: 100 },
      { label: 'B', price: 200 },
    ]);
    expect(component.barHeight(100)).toBe(10);
    expect(component.barHeight(200)).toBe(30);
  });

  it('prefers an explicit label over a derived one', () => {
    setDays([{ label: 'FRI 18', price: 100 }]);
    expect(component.labelFor({ label: 'FRI 18', price: 100 })).toBe('FRI 18');
  });

  it('formats the price with the given currency', () => {
    setDays([{ label: 'A', price: 139 }]);
    fixture.componentRef.setInput('currency', 'EUR');
    expect(component.format(139)).toContain('139');
  });
});
