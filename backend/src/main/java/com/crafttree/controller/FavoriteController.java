package com.crafttree.controller;

import com.crafttree.dto.CraftItemDto;
import com.crafttree.entity.User;
import com.crafttree.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Foydalanuvchining sevimli itemlari. Barcha endpointlar autentifikatsiya talab qiladi
 * (SecurityConfig: {@code /api/favorites/** → authenticated}).
 */
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@Tag(name = "Favorites", description = "Foydalanuvchining sevimli itemlari")
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    @Operation(summary = "Mening sevimlilarim (item ma'lumotlari bilan, so'nggidan eskisiga)")
    public List<CraftItemDto> list(@AuthenticationPrincipal User user) {
        return favoriteService.list(user);
    }

    @GetMapping("/ids")
    @Operation(summary = "Sevimli item id'lari (yulduzcha holatini belgilash uchun)")
    public List<Long> ids(@AuthenticationPrincipal User user) {
        return favoriteService.favoriteItemIds(user);
    }

    @PostMapping("/{itemId}")
    @Operation(summary = "Itemni sevimlilarga qo'shish")
    public Map<String, Object> add(@AuthenticationPrincipal User user, @PathVariable Long itemId) {
        favoriteService.add(user, itemId);
        return Map.of("favorited", true);
    }

    @DeleteMapping("/{itemId}")
    @Operation(summary = "Itemni sevimlilardan olib tashlash")
    public Map<String, Object> remove(@AuthenticationPrincipal User user, @PathVariable Long itemId) {
        favoriteService.remove(user, itemId);
        return Map.of("favorited", false);
    }
}
