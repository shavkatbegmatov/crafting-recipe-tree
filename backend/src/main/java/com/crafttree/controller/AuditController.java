package com.crafttree.controller;

import com.crafttree.dto.AuditLogDto;
import com.crafttree.dto.PagedResponse;
import com.crafttree.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Audit jurnalini ko'rish (faqat o'qish). Admin va super-admin uchun ochiq
 * (URL {@code /api/admin/**} ostida bo'lgani uchun SecurityConfig ADMIN talab qiladi).
 */
@RestController
@RequestMapping("/api/admin/audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Audit Log", description = "Tizimdagi muhim amallar tarixi (admin)")
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    @Operation(summary = "Audit jurnali — actor/amal/ob'ekt filtri va sahifalash bilan")
    public PagedResponse<AuditLogDto> list(
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String targetType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return auditService.list(actor, action, targetType, page, size);
    }
}
