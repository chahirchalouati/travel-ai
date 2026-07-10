import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiRatingComponent } from './ui-rating.component';

describe('UiRatingComponent', () => {
  let fixture: ComponentFixture<UiRatingComponent>;
  let component: UiRatingComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UiRatingComponent] }).compileComponents();
    fixture = TestBed.createComponent(UiRatingComponent);
    component = fixture.componentInstance;
  });

  it('rounds the value to the nearest filled dot', () => {
    fixture.componentRef.setInput('value', 4.6);
    expect(component.rounded()).toBe(5);
    fixture.componentRef.setInput('value', 3.2);
    expect(component.rounded()).toBe(3);
  });

  it('builds one slot per max', () => {
    fixture.componentRef.setInput('max', 5);
    expect(component.slots()).toEqual([1, 2, 3, 4, 5]);
    fixture.componentRef.setInput('max', 3);
    expect(component.slots().length).toBe(3);
  });
});
