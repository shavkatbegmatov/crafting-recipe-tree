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
    @Operation(summary = "Get full recursive recipe tree for an item")
    public RecipeTreeNodeDto getRecipeTree(@PathVariable Long id) {
        return recipeTreeService.getRecipeTree(id);
    }

    @GetMapping("/raw-totals")
    @Operation(summary = "Get total raw materials needed for 1 unit of this item")
    public RawTotalDto getRawTotals(@PathVariable Long id) {
        return recipeTreeService.getRawTotals(id);
    }

    @GetMapping("/total-craft-time")
    @Operation(summary = "Get total sequential craft time in seconds")
    public Map<String, Object> getTotalCraftTime(@PathVariable Long id) {
        int totalSeconds = recipeTreeService.getTotalCraftTime(id);
        return Map.of(
                "itemId", id,
                "totalCraftTimeSeconds", totalSeconds
        );
    }
}
