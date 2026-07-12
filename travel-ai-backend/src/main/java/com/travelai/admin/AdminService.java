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
import com.travelai.shared.config.JwtService;
import com.travelai.shared.domain.AdminListQuery;
import com.travelai.shared.domain.EntitySpecifications;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
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
    private final com.travelai.payment.PaymentRepository paymentRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;
    private final JwtService jwtService;

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
    private static final List<String> USER_SEARCH = List.of("email", "firstName", "lastName", "phone");

    public Page<AdminUserResponse> listUsers(AdminListQuery q) {
        Page<User> page = userRepository.findAll(
                EntitySpecifications.filter(User.class, q.search(), USER_SEARCH, q.filters()),
                q.pageable());
        List<AdminUserResponse> content = page.getContent().stream()
            .map(this::toAdminUser)
            .toList();
        return new PageImpl<>(content, q.pageable(), page.getTotalElements());
    }

    private static final List<String> PARTNER_SEARCH = List.of("name", "contactEmail", "city", "vatNumber");

    /** Returns a filtered/sorted/paginated list of partners. */
    public Page<AdminPartnerResponse> listPartners(AdminListQuery q) {
        Page<Partner> page = partnerRepository.findAll(
                EntitySpecifications.filter(Partner.class, q.search(), PARTNER_SEARCH, q.filters()),
                q.pageable());
        List<AdminPartnerResponse> content = page.getContent().stream()
            .map(this::toAdminPartner)
            .toList();
        return new PageImpl<>(content, q.pageable(), page.getTotalElements());
    }

    /** Returns paginated bookings. */
    public Page<AdminBookingResponse> listBookings(Pageable pageable) {
        return bookingRepository.findAllWithUser(pageable).map(AdminBookingResponse::from);
    }

    /** Full 360° detail for one booking: core data + customer + payments + the customer's reviews. */
    public AdminBookingDetailResponse getBookingDetail(UUID bookingId) {
        Booking b = bookingRepository.findById(bookingId)
            .orElseThrow(() -> TravelAiException.notFound(ErrorCode.BOOKING_NOT_FOUND));
        User u = b.getUser();

        List<AdminBookingDetailResponse.PaymentLine> payments = paymentRepository.findByBookingId(bookingId).stream()
            .map(p -> new AdminBookingDetailResponse.PaymentLine(
                p.getId(),
                p.getStatus() != null ? p.getStatus().name() : null,
                p.getType() != null ? p.getType().name() : null,
                p.getGateway() != null ? p.getGateway().name() : null,
                p.getAmount(), p.getCurrency(), p.getPaidAt(), p.getRefundedAt(),
                p.getFailureReason(), p.getCreatedAt()))
            .toList();

        List<AdminBookingDetailResponse.ReviewLine> reviews = u == null ? List.of()
            : reviewRepository.findByUserIdOrderByCreatedAtDesc(u.getId(), PageRequest.of(0, 10)).getContent().stream()
                .map(r -> new AdminBookingDetailResponse.ReviewLine(
                    r.getId(), r.getTargetType(), r.getRating(), r.getTitle(), r.getCreatedAt()))
                .toList();

        AdminBookingDetailResponse.UserSummary user = u == null ? null
            : new AdminBookingDetailResponse.UserSummary(
                u.getId(), u.getEmail(), u.getFirstName(), u.getLastName(),
                u.getRole() != null ? u.getRole().name() : null, u.isActive(), u.getCreatedAt());

        long userTotalBookings = u == null ? 0 : bookingRepository.findByUserId(u.getId()).size();

        return new AdminBookingDetailResponse(
            b.getId(), b.getBookingReference(),
            b.getStatus() != null ? b.getStatus().name() : null,
            b.getDestination(), b.getCheckIn(), b.getCheckOut(), b.getPartySize(),
            b.getTotalAmount(), b.getHotelAmount(), b.getFlightAmount(), b.getRestaurantAmount(),
            b.getCruiseAmount(), b.getServiceFeeAmount(), b.getCommissionAmount(), b.getCreatedAt(),
            user, payments, reviews, userTotalBookings);
    }

    private static final List<String> BOOKING_SEARCH = List.of("bookingReference", "destination");

    /** Cross-entity admin search: top matches among users, bookings and partners. */
    public AdminSearchResponse search(String query) {
        if (query == null || query.isBlank()) {
            return new AdminSearchResponse(List.of(), List.of(), List.of());
        }
        Pageable top = PageRequest.of(0, 6);

        List<AdminSearchResponse.Hit> users = userRepository.findAll(
                EntitySpecifications.filter(User.class, query, USER_SEARCH, Map.of()), top)
            .map(u -> new AdminSearchResponse.Hit(u.getId(),
                (u.getFirstName() + " " + u.getLastName()).trim(), u.getEmail()))
            .getContent();

        List<AdminSearchResponse.Hit> bookings = bookingRepository.findAll(
                EntitySpecifications.filter(Booking.class, query, BOOKING_SEARCH, Map.of()), top)
            .map(b -> new AdminSearchResponse.Hit(b.getId(),
                b.getBookingReference() != null ? b.getBookingReference() : b.getId().toString().substring(0, 8),
                b.getDestination()))
            .getContent();

        List<AdminSearchResponse.Hit> partners = partnerRepository.findAll(
                EntitySpecifications.filter(Partner.class, query, PARTNER_SEARCH, Map.of()), top)
            .map(p -> new AdminSearchResponse.Hit(p.getId(), p.getName(), p.getCity()))
            .getContent();

        return new AdminSearchResponse(users, bookings, partners);
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

    // ── GDPR (data portability + right to erasure) ─────────────────────────

    /** Assembles the personal data held directly on the user record for a GDPR export. */
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> exportUserData(UUID userId) {
        User u = userRepository.findById(userId)
            .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
        java.util.Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("id", u.getId());
        data.put("email", u.getEmail());
        data.put("firstName", u.getFirstName());
        data.put("lastName", u.getLastName());
        data.put("phone", u.getPhone());
        data.put("bio", u.getBio());
        data.put("location", u.getLocation());
        data.put("handle", u.getHandle());
        data.put("avatarUrl", u.getAvatarUrl());
        data.put("coverUrl", u.getCoverUrl());
        data.put("role", u.getRole());
        data.put("emailVerified", u.isEmailVerified());
        data.put("active", u.isActive());
        data.put("mfaEnabled", u.isMfaEnabled());
        data.put("createdAt", u.getCreatedAt());
        data.put("exportedAt", java.time.Instant.now());
        return data;
    }

    /**
     * GDPR right-to-erasure: scrubs personal data and deactivates the account, keeping the
     * row so financial/booking records stay referentially intact. Not a hard delete.
     */
    @Transactional
    public void anonymizeUser(UUID userId) {
        User u = userRepository.findById(userId)
            .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
        String anon = "anonymized+" + u.getId() + "@deleted.travelai";
        u.setEmail(anon);
        u.setFirstName("Deleted");
        u.setLastName("User");
        u.setPhone(null);
        u.setBio(null);
        u.setLocation(null);
        u.setHandle(null);
        u.setAvatarUrl(null);
        u.setCoverUrl(null);
        u.setActive(false);
        u.setEmailVerified(false);
        u.setEmailVerificationToken(null);
        u.setMfaEnabled(false);
        u.setMfaSecret(null);
        userRepository.save(u);
        log.info("Admin anonymized (GDPR erasure) user {}", userId);
    }

    // ── Support impersonation (login-as) ───────────────────────────────────

    /**
     * Mints an access token for the target user so support can reproduce their view.
     * Refuses to impersonate another ADMIN (no lateral privilege moves). Audited via the
     * admin request interceptor.
     */
    @Transactional(readOnly = true)
    public com.travelai.admin.dto.ImpersonationResponse impersonate(UUID userId) {
        User target = userRepository.findById(userId)
            .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
        if (target.getRole() == UserRole.ADMIN) {
            throw TravelAiException.forbidden(ErrorCode.ACCESS_DENIED);
        }
        if (!target.isActive()) {
            throw TravelAiException.badRequest(ErrorCode.VALIDATION_ERROR);
        }
        String accessToken = jwtService.generateAccessToken(target);
        log.warn("Admin impersonation token issued for user {} ({})", target.getId(), target.getEmail());
        return new com.travelai.admin.dto.ImpersonationResponse(
            accessToken, target.getEmail(),
            target.getFirstName(), target.getLastName(), target.getRole().name());
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
            u.getId(), u.getEmail(), u.getFirstName(), u.getLastName(), u.getAvatarUrl(),
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

    /** Count rows matching a fixed WHERE clause. The clause is never user-supplied. */
    private long safeCountWhere(String table, String whereClause) {
        try {
            var result = entityManager
                    .createNativeQuery("SELECT COUNT(*) FROM " + table + " WHERE " + whereClause)
                    .getSingleResult();
            return ((Number) result).longValue();
        } catch (Exception ex) {
            log.warn("Cannot count table {} where {}: {}", table, whereClause, ex.getMessage());
            return 0L;
        }
    }

    /**
     * Operational alerts for the dashboard: each entry is {code, severity, count}. Severity is
     * "warning" or "info". Only conditions that need attention are returned.
     */
    public List<com.travelai.admin.dto.AdminAlertResponse> getAlerts() {
        List<com.travelai.admin.dto.AdminAlertResponse> alerts = new java.util.ArrayList<>();

        long failedPayments = safeCountWhere("payments", "status = 'FAILED'");
        if (failedPayments > 0) {
            alerts.add(new com.travelai.admin.dto.AdminAlertResponse("failedPayments", "warning", failedPayments));
        }

        long pendingPartners = partnerRepository.countByStatusIn(
                List.of(PartnerStatus.REGISTERED, PartnerStatus.CONFIGURED, PartnerStatus.VALIDATED));
        if (pendingPartners > 0) {
            alerts.add(new com.travelai.admin.dto.AdminAlertResponse("pendingPartners", "info", pendingPartners));
        }

        long ragDocs = safeCountTable("vector_store");
        if (ragDocs == 0) {
            alerts.add(new com.travelai.admin.dto.AdminAlertResponse("ragEmpty", "warning", 0));
        }

        long inactiveUsers = safeCountWhere("users", "active = false");
        if (inactiveUsers > 0) {
            alerts.add(new com.travelai.admin.dto.AdminAlertResponse("inactiveUsers", "info", inactiveUsers));
        }

        return alerts;
    }
}
