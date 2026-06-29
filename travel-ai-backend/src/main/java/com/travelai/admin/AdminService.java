package com.travelai.admin;

import com.travelai.admin.dto.*;
import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.auth.UserRole;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
            totalUsers, totalPartners, totalBookings, 0L, 0.0, activePartners, pendingPartners
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
            .map(p -> new AdminPartnerResponse(
                p.getId(), p.getName(),
                p.getType() != null ? p.getType().name() : null,
                p.getCity(),
                p.getStatus() != null ? p.getStatus().name() : null,
                p.getContactEmail(), p.isActive(), p.getCreatedAt()
            ))
            .toList();
        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    /** Returns paginated bookings via native query (table may not exist yet). */
    @SuppressWarnings("unchecked")
    public Page<AdminBookingResponse> listBookings(Pageable pageable) {
        try {
            var query = entityManager.createNativeQuery(
                "SELECT id, user_id, status, total_amount, created_at FROM bookings ORDER BY created_at DESC"
            );
            query.setFirstResult((int) pageable.getOffset());
            query.setMaxResults(pageable.getPageSize());
            List<Object[]> rows = query.getResultList();
            long total = safeCountTable("bookings");
            List<AdminBookingResponse> content = rows.stream().map(r -> new AdminBookingResponse(
                UUID.fromString(r[0].toString()),
                UUID.fromString(r[1].toString()),
                (String) r[2],
                r[3] != null ? new BigDecimal(r[3].toString()) : null,
                r[4] != null ? ((Timestamp) r[4]).toInstant() : null
            )).toList();
            return new PageImpl<>(content, pageable, total);
        } catch (Exception ex) {
            log.warn("bookings table not yet available: {}", ex.getMessage());
            return Page.empty(pageable);
        }
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
