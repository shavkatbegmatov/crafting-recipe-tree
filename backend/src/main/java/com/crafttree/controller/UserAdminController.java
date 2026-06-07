package com.crafttree.controller;

import com.crafttree.dto.AdminResetPasswordRequest;
import com.crafttree.dto.AdminUserDto;
import com.crafttree.dto.PagedResponse;
import com.crafttree.dto.UpdateUserRoleRequest;
import com.crafttree.dto.UpdateUserStatusRequest;
import com.crafttree.dto.UserStatsDto;
import com.crafttree.entity.User;
import com.crafttree.service.UserAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Foydalanuvchilarni boshqarish API'si. Klass darajasida hamma uchun ADMIN talab qilinadi
 * (RoleHierarchy tufayli SUPER_ADMIN ham kiradi); rol tayinlash esa faqat SUPER_ADMIN'ga
 * ruxsat etilgan. Qolgan nozik qoidalar UserAdminService'da majburlanadi.
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "User Administration", description = "Foydalanuvchilarni boshqarish (admin)")
public class UserAdminController {

    private final UserAdminService userAdminService;

    @GetMapping
    @Operation(summary = "Foydalanuvchilar ro'yxati — qidiruv, rol/status filtri va sahifalash bilan")
    public PagedResponse<AdminUserDto> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean enabled,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return userAdminService.listUsers(search, role, enabled, page, size);
    }

    @GetMapping("/stats")
    @Operation(summary = "Foydalanuvchilar bo'yicha umumiy statistika")
    public UserStatsDto stats() {
        return userAdminService.getStats();
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Foydalanuvchi rolini o'zgartirish (faqat super-admin)")
    public AdminUserDto updateRole(@PathVariable Long id,
                                   @Valid @RequestBody UpdateUserRoleRequest request,
                                   @AuthenticationPrincipal User actor) {
        return userAdminService.updateRole(id, request.role(), actor);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Akkauntni bloklash yoki faollashtirish")
    public AdminUserDto updateStatus(@PathVariable Long id,
                                     @RequestBody UpdateUserStatusRequest request,
                                     @AuthenticationPrincipal User actor) {
        return userAdminService.updateStatus(id, request.enabled(), actor);
    }

    @PostMapping("/{id}/reset-password")
    @Operation(summary = "Foydalanuvchiga yangi parol o'rnatish (bo'sh bo'lsa — tasodifiy)")
    public Map<String, String> resetPassword(@PathVariable Long id,
                                              @Valid @RequestBody AdminResetPasswordRequest request,
                                              @AuthenticationPrincipal User actor) {
        String password = userAdminService.resetPassword(id, request.newPassword(), actor);
        return Map.of("temporaryPassword", password);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Foydalanuvchini o'chirish")
    public Map<String, Object> delete(@PathVariable Long id, @AuthenticationPrincipal User actor) {
        userAdminService.deleteUser(id, actor);
        return Map.of("ok", true, "id", id);
    }
}
