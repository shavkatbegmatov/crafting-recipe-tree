package com.crafttree.controller;

import com.crafttree.dto.InventoryEntryDto;
import com.crafttree.entity.User;
import com.crafttree.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
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
}
