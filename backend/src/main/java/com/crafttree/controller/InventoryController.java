package com.crafttree.controller;

import com.crafttree.dto.CraftLogDto;
import com.crafttree.dto.CraftRequest;
import com.crafttree.dto.CraftResultDto;
import com.crafttree.dto.InventoryEntryDto;
import com.crafttree.entity.User;
import com.crafttree.service.CraftService;
import com.crafttree.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Foydalanuvchining inventari (qo'lidagi materiallar). Autentifikatsiya talab qilinadi
 * (SecurityConfig: {@code /api/inventory/** → authenticated}).
 */
@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Foydalanuvchi materiallari (inventar)")
public class InventoryController {

    private final InventoryService inventoryService;
    private final CraftService craftService;

    @GetMapping
    @Operation(summary = "Mening inventarim (item id + miqdor)")
    public List<InventoryEntryDto> list(@AuthenticationPrincipal User user) {
        return inventoryService.list(user);
    }

    @PutMapping
    @Operation(summary = "Inventarni to'liq almashtirish (butun ro'yxat)")
    public List<InventoryEntryDto> replace(
            @AuthenticationPrincipal User user,
            @RequestBody List<InventoryEntryDto> entries) {
        return inventoryService.replace(user, entries);
    }

    @PostMapping("/craft")
    @Operation(summary = "Bulk craft — xomashyo inventardan ayiriladi, natija qo'shiladi, tarixga yoziladi")
    public CraftResultDto craft(@AuthenticationPrincipal User user, @RequestBody CraftRequest request) {
        return craftService.craftBulk(user, request.itemId(), request.quantity(), request.gameVersion());
    }

    @GetMapping("/craft-history")
    @Operation(summary = "Mening kraft tarixim (eng yangisi avval)")
    public Page<CraftLogDto> history(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return craftService.getHistory(user, PageRequest.of(page, Math.min(size, 100)));
    }
}
