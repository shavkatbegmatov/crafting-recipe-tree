package com.crafttree.service;

import com.crafttree.dto.CraftItemDto;
import com.crafttree.entity.CraftItem;
import com.crafttree.entity.Favorite;
import com.crafttree.entity.User;
import com.crafttree.exception.ItemNotFoundException;
import com.crafttree.repository.CraftItemRepository;
import com.crafttree.repository.FavoriteRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link FavoriteService} biznes-mantiqi uchun unit testlar (Mockito).
 */
@ExtendWith(MockitoExtension.class)
class FavoriteServiceTest {

    @Mock
    FavoriteRepository favoriteRepository;
    @Mock
    CraftItemRepository craftItemRepository;
    @Mock
    CraftItemService craftItemService;
    @InjectMocks
    FavoriteService service;

    private final User user = User.builder().id(1L).username("u").role("USER").build();

    @Test
    @DisplayName("add — mavjud bo'lmasa saqlaydi")
    void addSavesWhenNotExists() {
        CraftItem item = CraftItem.builder().id(5L).name("Iron").build();
        when(favoriteRepository.existsByUserAndItemId(user, 5L)).thenReturn(false);
        when(craftItemRepository.findById(5L)).thenReturn(Optional.of(item));

        service.add(user, 5L);

        verify(favoriteRepository).save(any(Favorite.class));
    }

    @Test
    @DisplayName("add — allaqachon mavjud bo'lsa hech narsa qilmaydi (idempotent)")
    void addSkipsWhenExists() {
        when(favoriteRepository.existsByUserAndItemId(user, 5L)).thenReturn(true);

        service.add(user, 5L);

        verify(craftItemRepository, never()).findById(any());
        verify(favoriteRepository, never()).save(any());
    }

    @Test
    @DisplayName("add — item topilmasa ItemNotFoundException")
    void addThrowsWhenItemMissing() {
        when(favoriteRepository.existsByUserAndItemId(user, 99L)).thenReturn(false);
        when(craftItemRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.add(user, 99L))
                .isInstanceOf(ItemNotFoundException.class);
        verify(favoriteRepository, never()).save(any());
    }

    @Test
    @DisplayName("remove — egalik bo'yicha o'chiradi")
    void removeDeletes() {
        service.remove(user, 5L);
        verify(favoriteRepository).deleteByUserAndItemId(user, 5L);
    }

    @Test
    @DisplayName("list — sevimlilarni item DTO'ga aylantiradi")
    void listMapsToDto() {
        CraftItem item = CraftItem.builder().id(5L).name("Iron").build();
        Favorite fav = Favorite.builder().id(1L).user(user).item(item).build();
        when(favoriteRepository.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of(fav));
        when(craftItemService.toDto(item)).thenReturn(CraftItemDto.builder().id(5L).name("Iron").build());

        List<CraftItemDto> result = service.list(user);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(5L);
    }
}
