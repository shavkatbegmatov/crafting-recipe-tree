package com.crafttree.service;

import com.crafttree.dto.CraftLogDto;
import com.crafttree.dto.CraftResultDto;
import com.crafttree.dto.InventoryEntryDto;
import com.crafttree.dto.RawTotalDto;
import com.crafttree.entity.CraftItem;
import com.crafttree.entity.CraftLog;
import com.crafttree.entity.GameVersion;
import com.crafttree.entity.User;
import com.crafttree.exception.ItemNotFoundException;
import com.crafttree.repository.CraftItemRepository;
import com.crafttree.repository.CraftLogRepository;
import com.crafttree.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Bulk craft va kraft tarixi. Yasash inventardan xomashyo ayiradi, natija itemni qo'shadi
 * va tarixga yozuv yozadi (atomar — bitta tranzaksiya).
 */
@Service
@RequiredArgsConstructor
public class CraftService {

    private final RecipeTreeService recipeTreeService;
    private final InventoryService inventoryService;
    private final InventoryRepository inventoryRepository;
    private final CraftItemRepository craftItemRepository;
    private final CraftLogRepository craftLogRepository;
    private final GameVersionService gameVersionService;

    /**
     * Itemni {@code quantity} dona yasaydi. Kerakli xomashyo (raw × qty, yuqoriga yaxlitlanadi)
     * inventardan ayiriladi, natija inventarga qo'shiladi, tarixga yozuv yoziladi.
     * Xomashyo yetmasa — {@code success=false} va yetishmaydiganlar; inventar o'zgarmaydi.
     */
    @Transactional
    public CraftResultDto craftBulk(User user, Long itemId, int quantity, String version) {
        int qty = Math.max(1, quantity);
        CraftItem result = craftItemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException(itemId));
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        RawTotalDto raw = recipeTreeService.getRawTotals(itemId, version);

        Map<Long, Integer> inv = new LinkedHashMap<>();
        inventoryRepository.findEntriesByUser(user).forEach(e -> inv.put(e.itemId(), e.quantity()));

        // Kerakli xomashyo (raw × qty, yuqoriga yaxlitlanadi) + yetishmaydiganlarni aniqlaymiz.
        Map<Long, Integer> needed = new LinkedHashMap<>();
        List<CraftResultDto.MissingEntry> missing = new ArrayList<>();
        for (RawTotalDto.RawMaterialEntry rm : raw.getRawMaterials()) {
            int need = rm.getTotalQuantity().multiply(BigDecimal.valueOf(qty))
                    .setScale(0, RoundingMode.CEILING).intValue();
            needed.put(rm.getId(), need);
            int have = inv.getOrDefault(rm.getId(), 0);
            if (have < need) {
                missing.add(new CraftResultDto.MissingEntry(rm.getId(), rm.getName(),
                        rm.getNameUz(), rm.getNameEn(), rm.getNameUzCyr(), need, have));
            }
        }
        if (!missing.isEmpty()) {
            return CraftResultDto.builder().success(false).missing(missing).build();
        }

        // Xomashyoni ayirib, natijani qo'shamiz; 0 ga tushgan yozuvlar tashlanadi.
        Map<Long, Integer> newInv = new LinkedHashMap<>(inv);
        needed.forEach((id, need) -> newInv.merge(id, -need, Integer::sum));
        newInv.merge(itemId, qty, Integer::sum);
        List<InventoryEntryDto> newList = newInv.entrySet().stream()
                .filter(e -> e.getValue() != null && e.getValue() > 0)
                .map(e -> new InventoryEntryDto(e.getKey(), e.getValue()))
                .toList();
        inventoryService.replace(user, newList);

        CraftLog log = craftLogRepository.save(CraftLog.builder()
                .user(user).resultItem(result).resultQuantity(qty).gameVersion(gv).build());

        return CraftResultDto.builder()
                .success(true)
                .newInventory(inventoryRepository.findEntriesByUser(user))
                .log(CraftLogDto.from(log))
                .build();
    }

    @Transactional(readOnly = true)
    public Page<CraftLogDto> getHistory(User user, Pageable pageable) {
        return craftLogRepository.findByUserIdOrderByCraftedAtDesc(user.getId(), pageable)
                .map(CraftLogDto::from);
    }
}
