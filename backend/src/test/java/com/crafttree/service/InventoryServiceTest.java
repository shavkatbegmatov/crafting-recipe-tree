package com.crafttree.service;

import com.crafttree.dto.InventoryEntryDto;
import com.crafttree.entity.CraftItem;
import com.crafttree.entity.InventoryItem;
import com.crafttree.entity.User;
import com.crafttree.repository.CraftItemRepository;
import com.crafttree.repository.InventoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link InventoryService} biznes-mantiqi uchun unit testlar (Mockito).
 */
@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    InventoryRepository inventoryRepository;
    @Mock
    CraftItemRepository craftItemRepository;
    @InjectMocks
    InventoryService service;

    private final User user = User.builder().id(1L).username("u").role("USER").build();

    @Test
    @DisplayName("replace — avval tozalaydi, keyin yaroqli yozuvlarni saqlaydi")
    void replaceDeletesThenSaves() {
        when(craftItemRepository.findById(anyLong()))
                .thenReturn(Optional.of(CraftItem.builder().id(5L).build()));
        when(inventoryRepository.findEntriesByUser(user)).thenReturn(List.of());

        service.replace(user, List.of(new InventoryEntryDto(5L, 3)));

        verify(inventoryRepository).deleteByUser(user);
        verify(inventoryRepository).save(any(InventoryItem.class));
    }

    @Test
    @DisplayName("replace — yaroqsiz miqdor (0/null) o'tkazib yuboriladi")
    void replaceSkipsInvalidQuantity() {
        when(inventoryRepository.findEntriesByUser(user)).thenReturn(List.of());

        service.replace(user, List.of(
                new InventoryEntryDto(5L, 0),
                new InventoryEntryDto(6L, null)));

        verify(inventoryRepository).deleteByUser(user);
        verify(inventoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("replace — mavjud bo'lmagan item o'tkazib yuboriladi")
    void replaceSkipsMissingItem() {
        when(craftItemRepository.findById(99L)).thenReturn(Optional.empty());
        when(inventoryRepository.findEntriesByUser(user)).thenReturn(List.of());

        service.replace(user, List.of(new InventoryEntryDto(99L, 2)));

        verify(inventoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("replace — bir xil item miqdorlari qo'shiladi")
    void replaceMergesDuplicates() {
        when(craftItemRepository.findById(5L))
                .thenReturn(Optional.of(CraftItem.builder().id(5L).build()));
        when(inventoryRepository.findEntriesByUser(user)).thenReturn(List.of());

        service.replace(user, List.of(
                new InventoryEntryDto(5L, 2),
                new InventoryEntryDto(5L, 3)));

        ArgumentCaptor<InventoryItem> captor = ArgumentCaptor.forClass(InventoryItem.class);
        verify(inventoryRepository, times(1)).save(captor.capture());
        assertThat(captor.getValue().getQuantity()).isEqualTo(5); // 2 + 3
    }

    @Test
    @DisplayName("list — repozitoriy yozuvlarini qaytaradi")
    void listReturnsEntries() {
        when(inventoryRepository.findEntriesByUser(user))
                .thenReturn(List.of(new InventoryEntryDto(5L, 2)));

        List<InventoryEntryDto> result = service.list(user);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).itemId()).isEqualTo(5L);
        assertThat(result.get(0).quantity()).isEqualTo(2);
    }
}
