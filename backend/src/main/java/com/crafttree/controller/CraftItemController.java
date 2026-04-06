package com.crafttree.controller;

import com.crafttree.dto.CategoryDto;
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

    @GetMapping("/categories")
    @Operation(summary = "Get all categories")
    public List<CategoryDto> getCategories() {
        return craftItemService.getAllCategories();
    }

    @GetMapping("/items")
    @Operation(summary = "Get all items, optionally filtered by category")
    public List<CraftItemDto> getItems(@RequestParam(required = false) String category) {
        return craftItemService.getAllItems(category);
    }

    @GetMapping("/items/{id}")
    @Operation(summary = "Get item by ID with recipe ingredients")
    public CraftItemDto getItem(@PathVariable Long id) {
        return craftItemService.getItemById(id);
    }

    @GetMapping("/items/search")
    @Operation(summary = "Search items by name")
    public List<CraftItemDto> searchItems(@RequestParam String q) {
        return craftItemService.searchItems(q);
    }

    @GetMapping("/items/{id}/used-in")
    @Operation(summary = "Get recipes where this item is used as ingredient")
    public List<UsedInDto> getUsedIn(@PathVariable Long id) {
        return craftItemService.getUsedIn(id);
    }

    @PutMapping("/items/{id}")
    @Operation(summary = "Update item names and descriptions (admin only)")
    public CraftItemDto updateItem(@PathVariable Long id, @RequestBody UpdateItemRequest request) {
        return craftItemService.updateItem(id, request);
    }
}
