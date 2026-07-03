package com.travelai.admin;

import com.travelai.admin.dto.*;
import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.auth.UserRole;
import com.travelai.booking.Booking;
import com.travelai.booking.BookingRepository;
import com.travelai.booking.BookingStatus;
import com.travelai.partner.Partner;
import com.travelai.partner.PartnerRepository;
import com.travelai.partner.PartnerStatus;
import com.travelai.review.Review;
import com.travelai.review.ReviewRepository;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final PartnerRepository partnerRepository;
    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;

    /** Returns aggregate dashboard statistics. */
    public AdminDashboardResponse getDashboard() {
        long totalUsers = userRepository.count();
        long totalPartners = partnerRepository.count();
        long activePartners = partnerRepository.countByStatus(PartnerStatus.LIVE);
        long pendingPartners = partnerRepository.countByStatusIn(
            List.of(PartnerStatus.REGISTERED, PartnerStatus.CONFIGURED, PartnerStatus.VALIDATED)
        );
        long totalBookings = safeCountTable("bookings");
        return new AdminDashboardResponse(
            totalUsers, totalPartners, totalBookings, 0L, 0.0, activePartners, pendingPartners,
            safeCountTable("hotels"), safeCountTable("flights"), safeCountTable("cruises"),
            safeCountTable("restaurants"), safeCountTable("destinations"), safeCountTable("travel_stories")
        );
    }

    /** Returns paginated list of all users. */
    public Page<AdminUserResponse> listUsers(Pageable pageable) {
        Page<User> page = userRepository.findAll(pageable);
        List<AdminUserResponse> content = page.getContent().stream()
            .map(u -> new AdminUserResponse(
                u.getId(), u.getEmail(), u.getFirstName(), u.getLastName(),
                u.getRole(), u.isActive(), u.isEmailVerified(), u.getCreatedAt()
            ))
            .toList();
        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    /** Returns paginated list of all partners. */
    public Page<AdminPartnerResponse> listPartners(Pageable pageable) {
        Page<Partner> page = partnerRepository.findAll(pageable);
        List<AdminPartnerResponse> content = page.getContent().stream()
            .map(this::toAdminPartner)
            .toList();
        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    /** Returns paginated bookings. */
    public Page<AdminBookingResponse> listBookings(Pageable pageable) {
        return bookingRepository.findAllWithUser(pageable).map(AdminBookingResponse::from);
    }

    /** Changes a booking's status (confirm / cancel / complete). */
    @Transactional
    public AdminBookingResponse updateBookingStatus(UUID bookingId, BookingStatus status) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> TravelAiException.notFound(ErrorCode.BOOKING_NOT_FOUND));
        booking.setStatus(status);
        Booking saved = bookingRepository.save(booking);
        log.info("Admin set booking {} status={}", bookingId, status);
        return AdminBookingResponse.from(saved);
    }

    /** Returns paginated AI audit logs via native query (table may not exist yet). */
    @SuppressWarnings("unchecked")
    public Page<AdminAiLogResponse> listAiLogs(Pageable pageable) {
        try {
            var query = entityManager.createNativeQuery(
                "SELECT id, request_id, agent, duration_ms, tokens_used, model, error, created_at FROM ai_audit_logs ORDER BY created_at DESC"
            );
            query.setFirstResult((int) pageable.getOffset());
            query.setMaxResults(pageable.getPageSize());
            List<Object[]> rows = query.getResultList();
            long total = safeCountTable("ai_audit_logs");
            List<AdminAiLogResponse> content = rows.stream().map(r -> new AdminAiLogResponse(
                UUID.fromString(r[0].toString()),
                r[1] != null ? UUID.fromString(r[1].toString()) : null,
                (String) r[2],
                r[3] != null ? ((Number) r[3]).intValue() : null,
                r[4] != null ? ((Number) r[4]).intValue() : null,
                (String) r[5],
                r[6] != null,
                r[7] != null ? ((Timestamp) r[7]).toInstant() : null
            )).toList();
            return new PageImpl<>(content, pageable, total);
        } catch (Exception ex) {
            log.warn("ai_audit_logs table not yet available: {}", ex.getMessage());
            return Page.empty(pageable);
        }
    }

    /** Creates a new partner directly from the admin panel (no user link). */
    @Transactional
    public AdminPartnerResponse createPartner(AdminPartnerUpsertRequest req) {
        Partner partner = Partner.builder()
            .type(req.type())
            .name(req.name())
            .vatNumber(req.vatNumber())
            .contactEmail(req.contactEmail())
            .contactPhone(req.contactPhone())
            .address(req.address())
            .city(req.city())
            .country(req.country() != null ? req.country() : "ITA")
            .status(PartnerStatus.REGISTERED)
            .active(req.active() == null || req.active())
            .build();
        Partner saved = partnerRepository.save(partner);
        log.info("Admin created partner {}", saved.getId());
        return toAdminPartner(saved);
    }

    /** Updates partner profile fields from the admin panel. */
    @Transactional
    public AdminPartnerResponse updatePartner(UUID partnerId, AdminPartnerUpsertRequest req) {
        Partner partner = partnerRepository.findById(partnerId)
            .orElseThrow(() -> TravelAiException.notFound(ErrorCode.PARTNER_NOT_FOUND));
        partner.setType(req.type());
        partner.setName(req.name());
        partner.setVatNumber(req.vatNumber());
        partner.setContactEmail(req.contactEmail());
        partner.setContactPhone(req.contactPhone());
        partner.setAddress(req.address());
        partner.setCity(req.city());
        if (req.country() != null) {
            partner.setCountry(req.country());
        }
        if (req.active() != null) {
            partner.setActive(req.active());
        }
        Partner saved = partnerRepository.save(partner);
        log.info("Admin updated partner {}", partnerId);
        return toAdminPartner(saved);
    }

    /** Activates a suspended partner (sets status to LIVE and active=true). */
    @Transactional
    public void activatePartner(UUID partnerId) {
        Partner partner = partnerRepository.findById(partnerId)
            .orElseThrow(() -> TravelAiException.notFound(ErrorCode.PARTNER_NOT_FOUND));
        partner.setStatus(PartnerStatus.LIVE);
        partner.setActive(true);
        partnerRepository.save(partner);
        log.info("Admin activated partner: id={}", partnerId);
    }

    /** Suspends a partner (sets status to SUSPENDED and active=false). */
    @Transactional
    public void suspendPartner(UUID partnerId) {
        Partner partner = partnerRepository.findById(partnerId)
            .orElseThrow(() -> TravelAiException.notFound(ErrorCode.PARTNER_NOT_FOUND));
        partner.setStatus(PartnerStatus.SUSPENDED);
        partner.setActive(false);
        partnerRepository.save(partner);
        log.info("Admin suspended partner: id={}", partnerId);
    }

    // ── User management ───────────────────────────────────────────────────

    /** Creates a new user from the admin panel with a hashed password. */
    @Transactional
    public AdminUserResponse createUser(AdminUserUpsertRequest req) {
        if (req.password() == null || req.password().isBlank()) {
            throw TravelAiException.badRequest(ErrorCode.VALIDATION_ERROR);
        }
        if (userRepository.existsByEmail(req.email())) {
            throw TravelAiException.conflict(ErrorCode.USER_ALREADY_EXISTS);
        }
        User user = User.builder()
            .email(req.email())
            .passwordHash(passwordEncoder.encode(req.password()))
            .firstName(req.firstName())
            .lastName(req.lastName())
            .phone(req.phone())
            .role(req.role() != null ? req.role() : UserRole.TRAVELER)
            .emailVerified(req.emailVerified() != null && req.emailVerified())
            .active(req.active() == null || req.active())
            .build();
        User saved = userRepository.save(user);
        log.info("Admin created user {}", saved.getId());
        return toAdminUser(saved);
    }

    /** Updates a user's profile fields (and optionally resets the password). */
    @Transactional
    public AdminUserResponse updateUser(UUID userId, AdminUserUpsertRequest req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
        user.setFirstName(req.firstName());
        user.setLastName(req.lastName());
        user.setPhone(req.phone());
        if (req.role() != null) {
            user.setRole(req.role());
        }
        if (req.active() != null) {
            user.setActive(req.active());
        }
        if (req.emailVerified() != null) {
            user.setEmailVerified(req.emailVerified());
        }
        if (req.password() != null && !req.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.password()));
        }
        User saved = userRepository.save(user);
        log.info("Admin updated user {}", userId);
        return toAdminUser(saved);
    }

    /** Changes a user's role. */
    @Transactional
    public AdminUserResponse updateUserRole(UUID userId, UserRole role) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
        user.setRole(role);
        User saved = userRepository.save(user);
        log.info("Admin changed role of user {} to {}", userId, role);
        return toAdminUser(saved);
    }

    /** Activates or bans a user (active=false blocks login). */
    @Transactional
    public AdminUserResponse setUserActive(UUID userId, boolean active) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
        user.setActive(active);
        User saved = userRepository.save(user);
        log.info("Admin set user {} active={}", userId, active);
        return toAdminUser(saved);
    }

    // ── Review moderation ─────────────────────────────────────────────────

    /** Returns paginated reviews for moderation. */
    public Page<AdminReviewResponse> listReviews(Pageable pageable) {
        return reviewRepository.findAllByOrderByCreatedAtDesc(pageable)
            .map(AdminReviewResponse::from);
    }

    /** Permanently deletes a review. */
    @Transactional
    public void deleteReview(UUID reviewId) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> TravelAiException.notFound(ErrorCode.REVIEW_NOT_FOUND));
        reviewRepository.delete(review);
        log.info("Admin deleted review {}", reviewId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private AdminUserResponse toAdminUser(User u) {
        return new AdminUserResponse(
            u.getId(), u.getEmail(), u.getFirstName(), u.getLastName(),
            u.getRole(), u.isActive(), u.isEmailVerified(), u.getCreatedAt());
    }

    private AdminPartnerResponse toAdminPartner(Partner p) {
        return new AdminPartnerResponse(
            p.getId(), p.getName(),
            p.getType() != null ? p.getType().name() : null,
            p.getCity(),
            p.getStatus() != null ? p.getStatus().name() : null,
            p.getContactEmail(), p.getContactPhone(), p.getVatNumber(),
            p.getAddress(), p.getCountry(), p.isActive(), p.getCreatedAt());
    }

    private long safeCountTable(String table) {
        try {
            var result = entityManager.createNativeQuery("SELECT COUNT(*) FROM " + table).getSingleResult();
            return ((Number) result).longValue();
        } catch (Exception ex) {
            log.warn("Cannot count table {}: {}", table, ex.getMessage());
            return 0L;
        }
    }
}
