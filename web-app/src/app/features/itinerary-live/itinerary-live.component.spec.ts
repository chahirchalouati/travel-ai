import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';

import { ItineraryLiveComponent } from './itinerary-live.component';
import { ItineraryService } from '../../core/services/itinerary.service';
import { AuthService } from '../../core/services/auth.service';
import type {
  LiveItineraryResponse,
  ItineraryProposalResponse,
} from '../../core/models/api.models';

function translocoStub() {
  return TranslocoTestingModule.forRoot({
    langs: { en: {} },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

const itinerary: LiveItineraryResponse = {
  id: 'itin-1',
  bookingId: 'booking-1',
  watchEnabled: true,
  segments: [
    { id: 'seg-1', segmentType: 'HOTEL', entityId: 'h-1', label: 'Hotel stay', currentStatus: 'ON_SCHEDULE', scheduledAt: null },
  ],
  pendingProposals: [],
};

const pendingProposal: ItineraryProposalResponse = {
  id: 'prop-1',
  status: 'PENDING_APPROVAL',
  aiSummary: 'We found a comparable hotel.',
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  createdAt: new Date().toISOString(),
  changes: [],
};

describe('ItineraryLiveComponent', () => {
  let fixture: ComponentFixture<ItineraryLiveComponent>;
  let component: ItineraryLiveComponent;
  let service: jasmine.SpyObj<ItineraryService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<ItineraryService>('ItineraryService', [
      'getByBooking', 'listProposals', 'reportEvent', 'approve', 'reject', 'openStream',
    ]);
    service.getByBooking.and.returnValue(of(itinerary));
    service.listProposals.and.returnValue(of([]));
    service.reportEvent.and.returnValue(of(void 0));
    service.approve.and.returnValue(of(void 0));
    service.reject.and.returnValue(of(void 0));
    service.openStream.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [ItineraryLiveComponent, translocoStub()],
      providers: [
        { provide: ItineraryService, useValue: service },
        { provide: AuthService, useValue: { getToken: () => null } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['id', 'booking-1']]) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItineraryLiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the itinerary for the route booking id', () => {
    expect(service.getByBooking).toHaveBeenCalledWith('booking-1');
    expect(component.itinerary()?.id).toBe('itin-1');
    expect(component.loading()).toBeFalse();
  });

  it('flags an alert only when a pending proposal exists', () => {
    expect(component.hasAlert()).toBeFalse();

    component.proposals.set([pendingProposal]);
    expect(component.pendingProposals().length).toBe(1);
    expect(component.hasAlert()).toBeTrue();
  });

  it('delegates approve to the service', () => {
    component.approve(pendingProposal);
    expect(service.approve).toHaveBeenCalledWith('prop-1');
  });

  it('delegates reject to the service', () => {
    component.reject(pendingProposal);
    expect(service.reject).toHaveBeenCalledWith('prop-1');
  });

  it('maps segment statuses to material icon names', () => {
    expect(component.statusIcon('ON_SCHEDULE')).toBe('check_circle');
    expect(component.statusIcon('REBOOKED')).toBe('autorenew');
  });
});
