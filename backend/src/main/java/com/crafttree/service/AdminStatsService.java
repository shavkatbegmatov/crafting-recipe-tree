package com.crafttree.service;

import com.crafttree.dto.AdminStatsDto;
import com.crafttree.entity.Role;
import com.crafttree.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Admin paneli uchun yig'ma statistika. Barcha ko'rsatkichlar mavjud repozitoriylardan
 * yengil COUNT so'rovlari orqali to'planadi.
 */
@Service
@RequiredArgsConstructor
public class AdminStatsService {

    private final CraftItemRepository craftItemRepository;
    private final CategoryRepository categoryRepository;
    private final RecipeRepository recipeRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final FavoriteRepository favoriteRepository;
    private final InventoryRepository inventoryRepository;

    @Transactional(readOnly = true)
    public AdminStatsDto stats() {
        List<AdminStatsDto.CategoryCount> byCategory = craftItemRepository.countByCategory().stream()
                .map(r -> new AdminStatsDto.CategoryCount((String) r[0], (Long) r[1]))
                .toList();

        return AdminStatsDto.builder()
                .totalItems(craftItemRepository.count())
                .totalCategories(categoryRepository.count())
                .totalRecipes(recipeRepository.count())
                .totalTags(tagRepository.count())
                .totalUsers(userRepository.count())
                .admins(userRepository.countByRole(Role.ADMIN))
                .superAdmins(userRepository.countByRole(Role.SUPER_ADMIN))
                .blockedUsers(userRepository.countByEnabledFalse())
                .totalMessages(chatMessageRepository.count())
                .todayMessages(chatMessageRepository.countByCreatedAtAfter(LocalDate.now().atStartOfDay()))
                .totalFavorites(favoriteRepository.count())
                .inventoryEntries(inventoryRepository.count())
                .itemsByCategory(byCategory)
                .build();
    }
}
