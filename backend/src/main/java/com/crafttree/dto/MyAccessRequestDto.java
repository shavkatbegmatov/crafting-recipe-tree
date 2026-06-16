package com.crafttree.dto;

import com.crafttree.entity.AccessRequest;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * Foydalanuvchining o'z arizasi ko'rinishi. Boshqa foydalanuvchilarning ma'lumotlari
 * (masalan, qaysi super-admin ko'rib chiqqani) bu yerda oshkor qilinmaydi.
 */
@Builder
public record MyAccessRequestDto(
        Long id,
        String requestedRole,
        String status,
        String message,
        /** Super-adminning javob izohi (rad etilganda sabab bo'lishi mumkin). */
        String reviewNote,
        LocalDateTime createdAt,
        LocalDateTime reviewedAt
) {
    public static MyAccessRequestDto from(AccessRequest r) {
        return MyAccessRequestDto.builder()
                .id(r.getId())
                .requestedRole(r.getRequestedRole())
                .status(r.getStatus())
                .message(r.getMessage())
                .reviewNote(r.getReviewNote())
                .createdAt(r.getCreatedAt())
                .reviewedAt(r.getReviewedAt())
                .build();
    }
}
