package com.crafttree.controller;

import com.crafttree.dto.AdminStatsDto;
import com.crafttree.service.AdminStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin boshqaruv paneli statistikasi. {@code /api/admin/**} SecurityConfig'da ADMIN talab qiladi
 * (SUPER_ADMIN ham meros qiladi).
 */
@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
@Tag(name = "Admin Stats", description = "Boshqaruv paneli statistikasi")
public class AdminStatsController {

    private final AdminStatsService adminStatsService;

    @GetMapping
    @Operation(summary = "Yig'ma statistika: kontent, foydalanuvchilar, chat, kategoriya taqsimoti")
    public AdminStatsDto stats() {
        return adminStatsService.stats();
    }
}
