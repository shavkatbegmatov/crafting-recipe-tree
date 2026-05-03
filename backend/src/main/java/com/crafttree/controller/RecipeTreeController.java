package com.crafttree.controller;

import com.crafttree.dto.RawTotalDto;
import com.crafttree.dto.RecipeTreeNodeDto;
import com.crafttree.service.RecipeTreeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/items/{id}")
@RequiredArgsConstructor
@Tag(name = "Recipe Tree", description = "Recipe tree calculation endpoints")
public class RecipeTreeController {

    private final RecipeTreeService recipeTreeService;

    @GetMapping("/recipe-tree")
    @Operation(summary = "Get full recursive recipe tree for an item, scoped to a game version (default: current)")
    public RecipeTreeNodeDto getRecipeTree(
            @PathVariable Long id,
            @RequestParam(value = "version", required = false) String version) {
        return recipeTreeService.getRecipeTree(id, version);
    }

    @GetMapping("/raw-totals")
    @Operation(summary = "Get total raw materials needed for 1 unit of this item, scoped to a game version")
    public RawTotalDto getRawTotals(
            @PathVariable Long id,
            @RequestParam(value = "version", required = false) String version) {
        return recipeTreeService.getRawTotals(id, version);
    }

    @GetMapping("/total-craft-time")
    @Operation(summary = "Get total sequential craft time in seconds, scoped to a game version")
    public Map<String, Object> getTotalCraftTime(
            @PathVariable Long id,
            @RequestParam(value = "version", required = false) String version) {
        int totalSeconds = recipeTreeService.getTotalCraftTime(id, version);
        return Map.of(
                "itemId", id,
                "version", version != null ? version : "(current)",
                "totalCraftTimeSeconds", totalSeconds
        );
    }
}
