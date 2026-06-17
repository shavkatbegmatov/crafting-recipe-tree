package com.crafttree.service;

import com.crafttree.dto.InventoryEntryDto;
import com.crafttree.entity.CraftItem;
import com.crafttree.entity.InventoryItem;
import com.crafttree.entity.User;
import com.crafttree.repository.CraftItemRepository;
import com.crafttree.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Foydalanuvchi inventari biznes-mantiqi. Frontend butun ro'yxatni yuboradi va u to'liq
 * almashtiriladi (replace) — bu eng sodda va izchil yondashuv kichik inventar uchun.
 */
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final CraftItemRepository craftItemRepository;

    @Transactional(readOnly = true)
    public List<InventoryEntryDto> list(User user) {
        return inventoryRepository.findEntriesByUser(user);
    }

    /**
     * Inventarni to'liq almashtiradi. Yaroqsiz yozuvlar (null/0/manfiy miqdor yoki mavjud
     * bo'lmagan item) o'tkazib yuboriladi; bir xil item bir necha marta kelса — miqdorlar qo'shiladi.
     */
    @Transactional
    public List<InventoryEntryDto> replace(User user, List<InventoryEntryDto> entries) {
        inventoryRepository.deleteByUser(user);

        if (entries != null && !entries.isEmpty()) {
            Map<Long, Integer> merged = new LinkedHashMap<>();
            for (InventoryEntryDto e : entries) {
                if (e == null || e.itemId() == null || e.quantity() == null || e.quantity() <= 0) {
                    continue;
                }
                merged.merge(e.itemId(), e.quantity(), Integer::sum);
            }
            for (Map.Entry<Long, Integer> e : merged.entrySet()) {
                CraftItem item = craftItemRepository.findById(e.getKey()).orElse(null);
                if (item == null) {
                    continue; // mavjud bo'lmagan itemni jimgina o'tkazib yuboramiz
                }
                inventoryRepository.save(InventoryItem.builder()
                        .user(user).item(item).quantity(e.getValue()).build());
            }
        }
        return inventoryRepository.findEntriesByUser(user);
    }
}
