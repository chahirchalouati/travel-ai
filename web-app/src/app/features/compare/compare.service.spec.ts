import { TestBed } from '@angular/core/testing';
import { CompareService } from './compare.service';
import type { HotelSearchResult } from '../../core/models/api.models';

function hotel(id: string, price = 100): HotelSearchResult {
  return {
    id,
    name: `Hotel ${id}`,
    stars: 4,
    city: 'Rome',
    description: '',
    imageUrl: '',
    pricePerNight: price,
    totalPrice: price,
    petFriendly: false,
    accessible: false,
    familyFriendly: false,
    seaProximity: false,
    available: true,
    partnerId: 'p1',
  };
}

describe('CompareService', () => {
  let service: CompareService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompareService);
  });

  it('starts empty', () => {
    expect(service.count()).toBe(0);
    expect(service.isFull()).toBeFalse();
  });

  it('toggles an item in and back out', () => {
    const h = hotel('a');
    service.toggle(h);
    expect(service.count()).toBe(1);
    expect(service.has('a')).toBeTrue();

    service.toggle(h);
    expect(service.count()).toBe(0);
    expect(service.has('a')).toBeFalse();
  });

  it('caps the list at the max and ignores extra adds', () => {
    service.toggle(hotel('a'));
    service.toggle(hotel('b'));
    service.toggle(hotel('c'));
    expect(service.count()).toBe(service.max);
    expect(service.isFull()).toBeTrue();

    service.toggle(hotel('d'));
    expect(service.count()).toBe(service.max);
    expect(service.has('d')).toBeFalse();
  });

  it('removes by id and clears', () => {
    service.toggle(hotel('a'));
    service.toggle(hotel('b'));
    service.remove('a');
    expect(service.has('a')).toBeFalse();
    expect(service.count()).toBe(1);

    service.clear();
    expect(service.count()).toBe(0);
  });
});
