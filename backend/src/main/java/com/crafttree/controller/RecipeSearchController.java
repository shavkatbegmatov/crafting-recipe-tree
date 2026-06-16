package com.crafttree.controller;

import com.crafttree.dto.CraftableItemDto;
import com.crafttree.dto.CraftableSearchRequest;
import com.crafttree.service.CraftableSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * "Nima yasay olaman?" teskari qidiruvi. {@code /api/recipes/**} ADMIN cheklovi ostida emas,
 * shuning uchun har qanday tizimga kirgan foydalanuvchi foydalana oladi (SecurityConfig'dagi
 * {@code anyRequest().authenticated()} qoidasi qamraydi).
 */
@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
@Tag(name = "Craftable Search", description = "Mavjud materiallardan nima yasash mumkinligini topish")
public class RecipeSearchController {

    private final CraftableSearchService craftableSearchService;

    @PostMapping("/search-craftable")
    @Operation(summary = "Berilgan materiallardan bevosita yasash mumkin bo'lgan itemlar")
    public List<CraftableItemDto> searchCraftable(@RequestBody CraftableSearchRequest request) {
        return craftableSearchService.search(request.materials(), request.gameVersion());
    }
}
