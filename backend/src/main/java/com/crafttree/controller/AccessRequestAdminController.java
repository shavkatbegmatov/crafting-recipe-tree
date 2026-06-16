package com.crafttree.controller;

import com.crafttree.dto.AccessRequestDto;
import com.crafttree.dto.PagedResponse;
import com.crafttree.dto.ReviewAccessRequestRequest;
import com.crafttree.entity.User;
import com.crafttree.service.AccessRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Arizalarni ko'rib chiqish API'si. Tasdiqlash = rol berish bo'lgani uchun, mavjud
 * "rol tayinlash faqat super-admin" qoidasiga muvofiq butun klass SUPER_ADMIN'ga cheklangan.
 * <p>
 * URL {@code /api/admin/**} ostida bo'lgani uchun SecurityConfig allaqachon ADMIN talab qiladi;
 * quyidagi {@code @PreAuthorize} esa uni SUPER_ADMIN'gacha toraytiradi.
 */
@RestController
@RequestMapping("/api/admin/access-requests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Access Request Administration", description = "Admin huquqi arizalarini ko'rib chiqish (super-admin)")
public class AccessRequestAdminController {

    private final AccessRequestService accessRequestService;

    @GetMapping
    @Operation(summary = "Arizalar ro'yxati — holat filtri va sahifalash bilan")
    public PagedResponse<AccessRequestDto> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return accessRequestService.list(status, page, size);
    }

    @GetMapping("/pending-count")
    @Operation(summary = "Ko'rib chiqilishi kutilayotgan arizalar soni (badge uchun)")
    public Map<String, Long> pendingCount() {
        return Map.of("count", accessRequestService.countPending());
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Arizani tasdiqlash — foydalanuvchiga so'ralgan rol beriladi")
    public AccessRequestDto approve(@PathVariable Long id,
                                    @Valid @RequestBody(required = false) ReviewAccessRequestRequest request,
                                    @AuthenticationPrincipal User actor) {
        String note = (request != null) ? request.note() : null;
        return accessRequestService.approve(id, actor, note);
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Arizani rad etish")
    public AccessRequestDto reject(@PathVariable Long id,
                                   @Valid @RequestBody(required = false) ReviewAccessRequestRequest request,
                                   @AuthenticationPrincipal User actor) {
        String note = (request != null) ? request.note() : null;
        return accessRequestService.reject(id, actor, note);
    }
}
