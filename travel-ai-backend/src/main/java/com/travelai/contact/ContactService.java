package com.travelai.contact;

import com.travelai.contact.dto.ContactRequest;
import com.travelai.contact.dto.ContactResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactMessageRepository repository;

    @Transactional
    public ContactResponse submit(ContactRequest req) {
        ContactMessage saved = repository.save(ContactMessage.builder()
                .name(req.name().trim())
                .email(req.email().trim())
                .subject(req.subject().trim())
                .message(req.message().trim())
                .build());
        return new ContactResponse(saved.getId(), saved.getStatus());
    }
}
