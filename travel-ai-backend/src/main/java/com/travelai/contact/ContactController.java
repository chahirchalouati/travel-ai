package com.travelai.contact;

import com.travelai.contact.dto.ContactRequest;
import com.travelai.contact.dto.ContactResponse;
import com.travelai.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/contact")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ContactResponse> submit(@Valid @RequestBody ContactRequest req) {
        return ApiResponse.ok(contactService.submit(req));
    }
}
