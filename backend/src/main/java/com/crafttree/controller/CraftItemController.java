package com.crafttree.controller;

import com.crafttree.dto.CraftItemDto;
import com.crafttree.dto.UpdateItemRequest;
import com.crafttree.dto.UsedInDto;
import com.crafttree.service.CraftItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Craft Items", description = "Craft items and categories management")
public class CraftItemController {

    private final CraftItemService craftItemService;

    @GetMapping("/items")
    @Operation(summary = "Get items of a game version (default: current), optionally filtered by category")
    public List<CraftItemDto> getItems(
            @RequestParam(required = false) String category,
            @RequestParam(value = "version", required = false) String version) {
        return craftItemService.getAllItems(category, version);
    }

    @GetMapping("/items/{id}")
    @Operation(summary = "Get item by ID with recipe ingredients (scoped to a game version, default current)")
    public CraftItemDto getItem(
            @PathVariable Long id,
            @RequestParam(value = "version", required = false) String version) {
        return craftItemService.getItemById(id, version);
    }

    @GetMapping("/items/search")
    @Operation(summary = "Search items by name within a game version (default: current)")
    public List<CraftItemDto> searchItems(
            @RequestParam String q,
            @RequestParam(value = "version", required = false) String version) {
        return craftItemService.searchItems(q, version);
    }

    @GetMapping("/items/{id}/used-in")
    @Operation(summary = "Get recipes where this item is used as ingredient (scoped to a game version)")
    public List<UsedInDto> getUsedIn(
            @PathVariable Long id,
            @RequestParam(value = "version", required = false) String version) {
        return craftItemService.getUsedIn(id, version);
    }

    @PutMapping("/items/{id}")
    @Operation(summary = "Update item names and descriptions (admin only)")
    public CraftItemDto updateItem(@PathVariable Long id, @RequestBody UpdateItemRequest request) {
        return craftItemService.updateItem(id, request);
    }
}
