package com.crafttree.service;

import com.crafttree.dto.AdminStatsDto;
import com.crafttree.entity.Role;
import com.crafttree.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * {@link AdminStatsService} uchun unit test — yig'ish va kategoriya taqsimoti mapping'i.
 * Stub qilinmagan COUNT'lar Mockito default'i bilan 0 qaytaradi.
 */
@ExtendWith(MockitoExtension.class)
class AdminStatsServiceTest {

    @Mock CraftItemRepository craftItemRepository;
    @Mock CategoryRepository categoryRepository;
    @Mock RecipeRepository recipeRepository;
    @Mock TagRepository tagRepository;
    @Mock UserRepository userRepository;
    @Mock ChatMessageRepository chatMessageRepository;
    @Mock FavoriteRepository favoriteRepository;
    @Mock InventoryRepository inventoryRepository;
    @InjectMocks AdminStatsService service;

    @Test
    @DisplayName("stats — ko'rsatkichlarni yig'adi va kategoriya taqsimotini map qiladi")
    void aggregatesAndMapsByCategory() {
        when(craftItemRepository.count()).thenReturn(54L);
        when(userRepository.count()).thenReturn(12L);
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(3L);
        when(userRepository.countByRole(Role.SUPER_ADMIN)).thenReturn(1L);
        when(craftItemRepository.countByCategory()).thenReturn(List.of(
                new Object[]{"RAW", 20L},
                new Object[]{"MATERIAL", 15L}));

        AdminStatsDto s = service.stats();

        assertThat(s.totalItems()).isEqualTo(54);
        assertThat(s.totalUsers()).isEqualTo(12);
        assertThat(s.admins()).isEqualTo(3);
        assertThat(s.superAdmins()).isEqualTo(1);
        assertThat(s.itemsByCategory()).hasSize(2);
        assertThat(s.itemsByCategory().get(0).code()).isEqualTo("RAW");
        assertThat(s.itemsByCategory().get(0).count()).isEqualTo(20);
    }
}
