package com.crafttree.service;

import com.crafttree.dto.CraftItemDto;
import com.crafttree.entity.CraftItem;
import com.crafttree.entity.Favorite;
import com.crafttree.entity.User;
import com.crafttree.exception.ItemNotFoundException;
import com.crafttree.repository.CraftItemRepository;
import com.crafttree.repository.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Foydalanuvchining sevimli itemlari biznes-mantiqi. Barcha amallar joriy foydalanuvchiga
 * tegishli — egalik {@code user} orqali majburlanadi (boshqaning sevimlisiga ta'sir qilib bo'lmaydi).
 */
@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final CraftItemRepository craftItemRepository;
    private final CraftItemService craftItemService;

    @Transactional(readOnly = true)
    public List<CraftItemDto> list(User user) {
        return favoriteRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(f -> craftItemService.toDto(f.getItem()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Long> favoriteItemIds(User user) {
        return favoriteRepository.findItemIdsByUser(user);
    }

    /** Itemni sevimlilarga qo'shadi (idempotent — allaqachon bor bo'lsa hech narsa qilmaydi). */
    @Transactional
    public void add(User user, Long itemId) {
        if (favoriteRepository.existsByUserAndItemId(user, itemId)) {
            return;
        }
        CraftItem item = craftItemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException(itemId));
        favoriteRepository.save(Favorite.builder().user(user).item(item).build());
    }

    /** Itemni sevimlilardan olib tashlaydi (idempotent). */
    @Transactional
    public void remove(User user, Long itemId) {
        favoriteRepository.deleteByUserAndItemId(user, itemId);
    }
}
