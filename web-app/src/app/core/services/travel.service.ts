import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, CreateTravelRequestRequest, TravelRequestResponse, TravelProposalResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TravelService {
  private readonly http = inject(HttpClient);

  createRequest(req: CreateTravelRequestRequest): Observable<TravelRequestResponse> {
    return this.http.post<ApiWrapper<TravelRequestResponse>>(`${environment.apiUrl}/travel/requests`, req).pipe(
      map(res => res.data)
    );
  }

  getProposals(requestId: string): Observable<TravelProposalResponse[]> {
    return this.http.get<ApiWrapper<TravelProposalResponse[]>>(`${environment.apiUrl}/travel/requests/${requestId}/proposals`).pipe(
      map(res => res.data)
    );
  }

  selectProposal(requestId: string, proposalId: string): Observable<TravelProposalResponse> {
    return this.http.post<ApiWrapper<TravelProposalResponse>>(
      `${environment.apiUrl}/travel/requests/${requestId}/proposals/${proposalId}/select`,
      {}
    ).pipe(map(res => res.data));
  }
}
