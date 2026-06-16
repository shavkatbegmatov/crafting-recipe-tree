package com.crafttree.service;

import com.crafttree.dto.AuditLogDto;
import com.crafttree.dto.PagedResponse;
import com.crafttree.entity.AuditLog;
import com.crafttree.entity.User;
import com.crafttree.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Audit jurnaliga yozish va undan o'qish.
 * <p>
 * Actor (amalni bajaruvchi) {@link SecurityContextHolder}'dan olinadi — shu sabab har qanday
 * service'dan controller'ga tegmasdan {@code log(...)} chaqirsa bo'ladi. Yozuv chaqiruvchi
 * tranzaksiyasiga qo'shiladi: asosiy amal rollback bo'lsa, audit yozuvi ham yozilmaydi.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    private static final int MAX_SUMMARY = 500;

    private final AuditLogRepository auditLogRepository;

    /** Audit yozuvini qo'shadi. Amal muvaffaqiyatli bajarilgach chaqirilishi kerak. */
    @Transactional
    public void log(String action, String targetType, Long targetId, String summary) {
        AuditLog entry = AuditLog.builder()
                .actorUsername(currentUsername())
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .summary(truncate(summary))
                .build();
        auditLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public PagedResponse<AuditLogDto> list(String actor, String action, String targetType, int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLog> result = auditLogRepository.search(
                blankToNull(actor), blankToNull(action), blankToNull(targetType), pageable);
        return PagedResponse.from(result, AuditLogDto::from);
    }

    // ── Yordamchilar ──

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User u) {
            return u.getUsername();
        }
        return null;
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private static String truncate(String s) {
        if (s == null) return null;
        return s.length() > MAX_SUMMARY ? s.substring(0, MAX_SUMMARY) : s;
    }
}
