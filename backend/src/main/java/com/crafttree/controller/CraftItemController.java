package com.crafttree.controller;

import com.crafttree.dto.BulkCreateItemsRequest;
import com.crafttree.dto.BulkCreateResultDto;
import com.crafttree.dto.CraftItemDto;
import com.crafttree.dto.CreateItemRequest;
import com.crafttree.dto.DeleteItemsResultDto;
import com.crafttree.dto.UpdateItemRequest;
import com.crafttree.dto.UsedInDto;
import com.crafttree.service.CraftItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new item in the current (or requested) game version (admin only)")
    public CraftItemDto createItem(@Valid @RequestBody CreateItemRequest request,
                                   @RequestParam(value = "version", required = false) String version) {
        return craftItemService.createItem(request, version);
    }

    /**
     * Ommaviy qo'shish.
     * <p>
     * {@code dryRun=true} bilan avval natijani ko'rish mumkin — bazaga hech narsa yozilmaydi.
     * UI aynan shu tartibda ishlaydi: avval ko'rib chiqish, keyin tasdiqlash.
     */
    /**
     * Itemlarni o'chirish (bittasi ham, bir nechtasi ham).
     * <p>
     * {@code dryRun=true} bilan avval nima o'chishini ko'rish mumkin. Ingredient
     * sifatida ishlatilayotgan item o'chirilmaydi — hisobotda sababi ko'rsatiladi.
     */
    @PostMapping("/items/delete")
    @Operation(summary = "Delete items; blocked when used as an ingredient (admin only)")
    public DeleteItemsResultDto deleteItems(
            @RequestBody DeleteItemsRequest request,
            @RequestParam(value = "dryRun", defaultValue = "false") boolean dryRun,
            @RequestParam(value = "version", required = false) String version) {
        return craftItemService.deleteItems(request.itemIds(), dryRun, version);
    }

    public record DeleteItemsRequest(java.util.List<Long> itemIds) {}

    @PostMapping("/items/bulk")
    @Operation(summary = "Create several items at once; dryRun previews without writing (admin only)")
    public BulkCreateResultDto createItemsBulk(
            @RequestBody BulkCreateItemsRequest request,
            @RequestParam(value = "dryRun", defaultValue = "false") boolean dryRun,
            @RequestParam(value = "version", required = false) String version) {
        return craftItemService.createItemsBulk(request, dryRun, version);
    }
}
