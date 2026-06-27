package com.travelai.travel;

import com.travelai.shared.domain.ApiResponse;
import com.travelai.travel.dto.CreateTravelRequestRequest;
import com.travelai.travel.dto.TravelProposalResponse;
import com.travelai.travel.dto.TravelRequestResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/travel")
@RequiredArgsConstructor
public class TravelController {

    private final TravelRequestService travelRequestService;

    @PostMapping("/requests")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TravelRequestResponse> createRequest(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody @Valid CreateTravelRequestRequest req) {
        return ApiResponse.ok(travelRequestService.createRequest(user.getUsername(), req));
    }

    @GetMapping("/requests")
    public ApiResponse<Page<TravelRequestResponse>> getMyRequests(
            @AuthenticationPrincipal UserDetails user,
            Pageable pageable) {
        return ApiResponse.ok(travelRequestService.getMyRequests(user.getUsername(), pageable));
    }

    @GetMapping("/requests/{requestId}/proposals")
    public ApiResponse<List<TravelProposalResponse>> getProposals(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID requestId) {
        return ApiResponse.ok(travelRequestService.getProposals(user.getUsername(), requestId));
    }

    @PostMapping("/requests/{requestId}/proposals/{proposalId}/select")
    public ApiResponse<TravelProposalResponse> selectProposal(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID requestId,
            @PathVariable UUID proposalId) {
        return ApiResponse.ok(travelRequestService.selectProposal(user.getUsername(), requestId, proposalId));
    }
}
