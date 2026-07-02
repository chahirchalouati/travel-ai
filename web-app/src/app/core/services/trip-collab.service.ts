import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ApiWrapper,
  AcceptInviteResponse,
  InviteMemberRequest,
  SegmentVotesResponse,
  TripMemberResponse,
  VoteValue,
} from '../models/api.models';

/** Trip collaboration: companion invites + itinerary segment voting. */
@Injectable({ providedIn: 'root' })
export class TripCollabService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/trips`;

  listMembers(tripId: string): Observable<TripMemberResponse[]> {
    return this.http
      .get<ApiWrapper<TripMemberResponse[]>>(`${this.base}/${tripId}/members`)
      .pipe(map(res => res.data ?? []));
  }

  invite(tripId: string, request: InviteMemberRequest): Observable<TripMemberResponse> {
    return this.http
      .post<ApiWrapper<TripMemberResponse>>(`${this.base}/${tripId}/members/invite`, request)
      .pipe(map(res => res.data));
  }

  removeMember(tripId: string, memberId: string): Observable<void> {
    return this.http
      .delete<ApiWrapper<void>>(`${this.base}/${tripId}/members/${memberId}`)
      .pipe(map(() => undefined));
  }

  accept(token: string): Observable<AcceptInviteResponse> {
    return this.http
      .post<ApiWrapper<AcceptInviteResponse>>(`${this.base}/members/accept`, { token })
      .pipe(map(res => res.data));
  }

  listVotes(tripId: string): Observable<SegmentVotesResponse[]> {
    return this.http
      .get<ApiWrapper<SegmentVotesResponse[]>>(`${this.base}/${tripId}/segments/votes`)
      .pipe(map(res => res.data ?? []));
  }

  vote(tripId: string, segmentId: string, vote: VoteValue): Observable<SegmentVotesResponse> {
    return this.http
      .put<ApiWrapper<SegmentVotesResponse>>(
        `${this.base}/${tripId}/segments/${segmentId}/vote`,
        { vote },
      )
      .pipe(map(res => res.data));
  }

  clearVote(tripId: string, segmentId: string): Observable<SegmentVotesResponse> {
    return this.http
      .delete<ApiWrapper<SegmentVotesResponse>>(
        `${this.base}/${tripId}/segments/${segmentId}/vote`,
      )
      .pipe(map(res => res.data));
  }
}
