package com.crafttree.dto;

import com.crafttree.entity.User;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * Admin paneli uchun foydalanuvchi ko'rinishi. Parol hash'i hech qachon qaytarilmaydi.
 */
@Builder
public record AdminUserDto(
        Long id,
        String username,
        String displayName,
        String role,
        boolean enabled,
        String referralCode,
        int referralCount,
        String referredByUsername,
        LocalDateTime createdAt
) {
    public static AdminUserDto from(User user, long referralCount) {
        return AdminUserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .referralCode(user.getReferralCode())
                .referralCount((int) referralCount)
                .referredByUsername(user.getReferredBy() != null ? user.getReferredBy().getUsername() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
