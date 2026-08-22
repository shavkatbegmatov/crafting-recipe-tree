package com.crafttree.service;

import com.crafttree.dto.CraftLogDto;
import com.crafttree.dto.CraftResultDto;
import com.crafttree.dto.InventoryEntryDto;
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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Bulk craft va kraft tarixi. Yasash inventardan kerakli materiallarni (oraliq itemlar ham,
 * xomashyo ham) ayiradi, natija itemni qo'shadi va tarixga yozuv yozadi
 * (atomar — bitta tranzaksiya).
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
     * Itemni {@code quantity} dona yasaydi. Inventardagi <b>oraliq itemlar ham ishlatiladi</b> —
     * qo'lda tayyor oraliq item bo'lsa, uning xomashyosi qaytadan talab qilinmaydi. Sarflangani
     * inventardan ayiriladi, natija qo'shiladi, tarixga yozuv yoziladi.
     * Yetmasa — {@code success=false} va yetishmaydiganlar; inventar o'zgarmaydi.
     */
    @Transactional
    public CraftResultDto craftBulk(User user, Long itemId, int quantity, String version) {
        int qty = Math.max(1, quantity);
        CraftItem result = craftItemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException(itemId));
        GameVersion gv = gameVersionService.resolveOrCurrent(version);

        Map<Long, Integer> inv = new LinkedHashMap<>();
        inventoryRepository.findEntriesByUser(user).forEach(e -> inv.put(e.itemId(), e.quantity()));

        RecipeTreeService.CraftResolution res =
                recipeTreeService.resolveCraft(result, gv, BigDecimal.valueOf(qty), inv);

        if (!res.shortfall.isEmpty()) {
            List<CraftResultDto.MissingEntry> missing = new ArrayList<>();
            res.shortfall.forEach((id, miss) -> {
                CraftItem it = res.lookup.get(id);
                missing.add(new CraftResultDto.MissingEntry(id, it.getName(),
                        it.getNameUz(), it.getNameEn(), it.getNameUzCyr(),
                        res.required.getOrDefault(id, miss), inv.getOrDefault(id, 0)));
            });
            return CraftResultDto.builder().success(false).missing(missing).build();
        }

        // Sarflanganini ayirib, natijani qo'shamiz; 0 ga tushgan yozuvlar tashlanadi.
        Map<Long, Integer> newInv = new LinkedHashMap<>(inv);
        res.consumed.forEach((id, used) -> newInv.merge(id, -used, Integer::sum));
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
