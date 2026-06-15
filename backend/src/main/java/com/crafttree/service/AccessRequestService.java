package com.crafttree.service;

import com.crafttree.dto.AccessRequestDto;
import com.crafttree.dto.MyAccessRequestDto;
import com.crafttree.dto.PagedResponse;
import com.crafttree.entity.AccessRequest;
import com.crafttree.entity.AccessRequestStatus;
import com.crafttree.entity.Role;
import com.crafttree.entity.User;
import com.crafttree.exception.ItemNotFoundException;
import com.crafttree.repository.AccessRequestRepository;
import com.crafttree.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * "Admin huquqini so'rash" arizalari biznes-mantiqi.
 * <p>
 * Tomonlar: oddiy foydalanuvchi ariza yaratadi/bekor qiladi; super-admin esa ko'rib chiqib
 * tasdiqlaydi (foydalanuvchiga ADMIN rolini beradi) yoki rad etadi. Barcha qoidalar shu yerda
 * majburlanadi — controller faqat HTTP qatlamidir.
 */
@Service
@RequiredArgsConstructor
public class AccessRequestService {

    private final AccessRequestRepository accessRequestRepository;
    private final UserRepository userRepository;

    // Hozircha foydalanuvchi faqat ADMIN darajasini so'ray oladi (mahsulot qarori).
    private static final String REQUESTABLE_ROLE = Role.ADMIN;

    // ── Foydalanuvchi tomoni ──

    /** Yangi ariza yaratadi. Faqat oddiy USER ariza bera oladi va bir vaqtda bittadan ko'p bo'lmaydi. */
    @Transactional
    public MyAccessRequestDto createRequest(User actor, String message) {
        if (isPrivileged(actor)) {
            // Admin/super-admin allaqachon kerakli huquqqa ega — ariza ma'nosiz.
            throw new IllegalStateException("ALREADY_PRIVILEGED");
        }
        if (accessRequestRepository.existsByUserAndStatus(actor, AccessRequestStatus.PENDING)) {
            throw new IllegalStateException("REQUEST_ALREADY_PENDING");
        }
        String trimmed = (message != null && !message.isBlank()) ? message.trim() : null;
        AccessRequest request = AccessRequest.builder()
                .user(actor)
                .requestedRole(REQUESTABLE_ROLE)
                .status(AccessRequestStatus.PENDING)
                .message(trimmed)
                .build();
        try {
            // saveAndFlush — partial unique indeksni darhol tekshiradi. Yuqoridagi tekshiruvdan
            // keyin yuzaga keladigan poyga (bir vaqtning o'zida ikkinchi ariza) shu yerda
            // tutilib, xunuk 500 o'rniga toza 409 (REQUEST_ALREADY_PENDING) qaytariladi.
            accessRequestRepository.saveAndFlush(request);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("REQUEST_ALREADY_PENDING");
        }
        return MyAccessRequestDto.from(request);
    }

    /** Foydalanuvchining eng so'nggi arizasi (yo'q bo'lsa — null). */
    @Transactional(readOnly = true)
    public MyAccessRequestDto getMyLatest(User actor) {
        return accessRequestRepository.findFirstByUserOrderByCreatedAtDesc(actor)
                .map(MyAccessRequestDto::from)
                .orElse(null);
    }

    /** Foydalanuvchi o'zining ochiq (PENDING) arizasini bekor qiladi. */
    @Transactional
    public MyAccessRequestDto cancelMyRequest(User actor, Long requestId) {
        AccessRequest request = getRequest(requestId);
        if (!request.getUser().getId().equals(actor.getId())) {
            throw new AccessDeniedException("NOT_OWN_REQUEST");
        }
        requirePending(request);
        request.setStatus(AccessRequestStatus.CANCELLED);
        accessRequestRepository.save(request);
        return MyAccessRequestDto.from(request);
    }

    // ── Super-admin tomoni ──

    @Transactional(readOnly = true)
    public PagedResponse<AccessRequestDto> list(String status, int page, int size) {
        String statusFilter = normalizeStatus(status);
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AccessRequest> result = (statusFilter == null)
                ? accessRequestRepository.findAll(pageable)
                : accessRequestRepository.findByStatus(statusFilter, pageable);
        return PagedResponse.from(result, AccessRequestDto::from);
    }

    /** Badge uchun: ko'rib chiqilishi kutilayotgan arizalar soni. */
    @Transactional(readOnly = true)
    public long countPending() {
        return accessRequestRepository.countByStatus(AccessRequestStatus.PENDING);
    }

    /** Arizani tasdiqlaydi: foydalanuvchiga so'ralgan rolni beradi (agar hali oddiy USER bo'lsa). */
    @Transactional
    public AccessRequestDto approve(Long requestId, User reviewer, String note) {
        AccessRequest request = getRequest(requestId);
        requirePending(request);

        User target = request.getUser();
        // Rolni faqat KO'TARAMIZ: USER → so'ralgan rol. Allaqachon imtiyozli bo'lsa tegmaymiz
        // (masalan, oradan boshqa super-admin qo'lda ko'targan bo'lishi mumkin) — pasaytirish yo'q.
        if (Role.USER.equals(target.getRole())) {
            target.setRole(request.getRequestedRole());
            userRepository.save(target);
        }
        finishReview(request, AccessRequestStatus.APPROVED, reviewer, note);
        return AccessRequestDto.from(request);
    }

    /** Arizani rad etadi: rol o'zgarmaydi, sabab izohi saqlanadi. */
    @Transactional
    public AccessRequestDto reject(Long requestId, User reviewer, String note) {
        AccessRequest request = getRequest(requestId);
        requirePending(request);
        finishReview(request, AccessRequestStatus.REJECTED, reviewer, note);
        return AccessRequestDto.from(request);
    }

    // ── Yordamchilar ──

    private AccessRequest getRequest(Long id) {
        return accessRequestRepository.findById(id).orElseThrow(() -> new ItemNotFoundException(id));
    }

    private void requirePending(AccessRequest request) {
        if (!AccessRequestStatus.PENDING.equals(request.getStatus())) {
            // Yakunlangan (tasdiq/rad/bekor) arizani qayta o'zgartirib bo'lmaydi.
            throw new IllegalStateException("REQUEST_NOT_PENDING");
        }
    }

    private void finishReview(AccessRequest request, String status, User reviewer, String note) {
        request.setStatus(status);
        request.setReviewedBy(reviewer);
        request.setReviewNote((note != null && !note.isBlank()) ? note.trim() : null);
        request.setReviewedAt(LocalDateTime.now());
        accessRequestRepository.save(request);
    }

    private boolean isPrivileged(User u) {
        return Role.ADMIN.equals(u.getRole()) || Role.SUPER_ADMIN.equals(u.getRole());
    }

    /** Holat filtrini tekshiradi: bo'sh → null (hammasi); noto'g'ri qiymat → xato. */
    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        String normalized = status.trim().toUpperCase();
        if (!AccessRequestStatus.ALL.contains(normalized)) {
            throw new IllegalArgumentException("INVALID_STATUS");
        }
        return normalized;
    }
}
