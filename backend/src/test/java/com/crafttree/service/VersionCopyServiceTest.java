package com.crafttree.service;

import com.crafttree.dto.VersionCopyResultDto;
import com.crafttree.entity.Category;
import com.crafttree.entity.CraftItem;
import com.crafttree.entity.GameVersion;
import com.crafttree.entity.Recipe;
import com.crafttree.entity.RecipeIngredient;
import com.crafttree.repository.CategoryRepository;
import com.crafttree.repository.CraftItemRepository;
import com.crafttree.repository.RecipeIngredientRepository;
import com.crafttree.repository.RecipeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link VersionCopyService} uchun unit testlar.
 * <p>
 * Asosiy kafolatlar: nusxa maqsad versiyaga bog'lanadi, {@code itemKey} o'zgarmaydi
 * (versiyalararo bog'lovchi shu), amal idempotent, ingredientlar tranzitiv qo'shiladi.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VersionCopyServiceTest {

    @Mock CraftItemRepository craftItemRepository;
    @Mock CategoryRepository categoryRepository;
    @Mock RecipeRepository recipeRepository;
    @Mock RecipeIngredientRepository recipeIngredientRepository;
    @Mock GameVersionService gameVersionService;
    @Mock AuditService auditService;
    @InjectMocks VersionCopyService service;

    GameVersion v1;
    GameVersion v2;
    Category cat;
    final AtomicLong idSeq = new AtomicLong(1000);

    @BeforeEach
    void setUp() {
        v1 = GameVersion.builder().id(1L).version("1.0.0").build();
        v2 = GameVersion.builder().id(2L).version("5.9.0").build();
        // Kategoriya ham versiyaga bog'langan: nusxa olishda maqsad versiyadagisi kerak.
        cat = Category.builder().id(10L).code("RAW").nameRu("Xom").nameUz("Xom").gameVersion(v1).build();
        when(categoryRepository.findByCodeAndGameVersionId(eq("RAW"), any()))
                .thenReturn(Optional.of(Category.builder()
                        .id(20L).code("RAW").nameRu("Xom").nameUz("Xom").gameVersion(v2).build()));
        when(gameVersionService.findById(1L)).thenReturn(v1);
        when(gameVersionService.findById(2L)).thenReturn(v2);

        // save() saqlangan obyektga id berib qaytaradi — chaqiruvchi mapping uchun ishlatadi.
        when(craftItemRepository.save(any(CraftItem.class))).thenAnswer(inv -> {
            CraftItem it = inv.getArgument(0);
            it.setId(idSeq.incrementAndGet());
            return it;
        });
        when(recipeRepository.save(any(Recipe.class))).thenAnswer(inv -> {
            Recipe r = inv.getArgument(0);
            r.setId(idSeq.incrementAndGet());
            return r;
        });
        // Maqsad versiya sukut bo'yicha bo'sh.
        when(craftItemRepository.findByItemKeyAndGameVersionId(any(), any())).thenReturn(Optional.empty());
        when(recipeRepository.findByResultItemIdAndGameVersionId(any(), any())).thenReturn(Optional.empty());
    }

    private CraftItem item(long id, String name, String key) {
        return CraftItem.builder()
                .id(id).name(name).nameEn(name).itemKey(key)
                .craftTimeSeconds(5).gameVersion(v1).category(cat)
                .build();
    }

    private Recipe recipe(long id, CraftItem result, CraftItem... ingredients) {
        Recipe r = Recipe.builder().id(id).resultItem(result).gameVersion(v1).craftTimeSeconds(5).build();
        for (CraftItem ing : ingredients) {
            r.getIngredients().add(RecipeIngredient.builder()
                    .recipe(r).ingredientItem(ing).gameVersion(v1)
                    .quantity(BigDecimal.valueOf(2)).build());
        }
        return r;
    }

    @Test
    @DisplayName("nusxa maqsad versiyaga bog'lanadi, itemKey esa o'zgarmaydi")
    void copiesIntoTargetVersionKeepingItemKey() {
        CraftItem glass = item(10L, "Стекло", "glass-10");
        when(craftItemRepository.findAllByGameVersionId(1L)).thenReturn(List.of(glass));

        VersionCopyResultDto res = service.copy(1L, 2L, null, false);

        ArgumentCaptor<CraftItem> saved = ArgumentCaptor.forClass(CraftItem.class);
        verify(craftItemRepository).save(saved.capture());
        assertThat(saved.getValue().getGameVersion()).isEqualTo(v2);
        assertThat(saved.getValue().getItemKey()).isEqualTo("glass-10");
        assertThat(saved.getValue().getId()).isNotEqualTo(10L);
        assertThat(res.itemsCopied()).isEqualTo(1);
        assertThat(res.itemsSkipped()).isZero();
    }

    @Test
    @DisplayName("idempotent — maqsad versiyada bor item qayta yaratilmaydi")
    void skipsItemsAlreadyPresentInTarget() {
        CraftItem glass = item(10L, "Стекло", "glass-10");
        CraftItem existing = CraftItem.builder()
                .id(99L).name("Стекло").itemKey("glass-10").gameVersion(v2).category(cat).build();
        when(craftItemRepository.findAllByGameVersionId(1L)).thenReturn(List.of(glass));
        when(craftItemRepository.findByItemKeyAndGameVersionId("glass-10", 2L)).thenReturn(Optional.of(existing));

        VersionCopyResultDto res = service.copy(1L, 2L, null, false);

        verify(craftItemRepository, never()).save(any(CraftItem.class));
        assertThat(res.itemsCopied()).isZero();
        assertThat(res.itemsSkipped()).isEqualTo(1);
    }

    @Test
    @DisplayName("tanlangan item ko'chirilsa, retsept ingredientlari tranzitiv qo'shiladi")
    void pullsIngredientsTransitively() {
        CraftItem sand = item(1L, "Песок", "sand-1");
        CraftItem glass = item(2L, "Стекло", "glass-2");
        CraftItem window = item(3L, "Окно", "window-3");
        when(craftItemRepository.findAllById(List.of(3L))).thenReturn(List.of(window));
        when(recipeRepository.findByResultItemIdAndGameVersionId(3L, 1L))
                .thenReturn(Optional.of(recipe(30L, window, glass)));
        when(recipeRepository.findByResultItemIdAndGameVersionId(2L, 1L))
                .thenReturn(Optional.of(recipe(20L, glass, sand)));

        // Faqat "Окно" tanlangan — lekin "Стекло" va "Песок" ham kerak.
        VersionCopyResultDto res = service.copy(1L, 2L, List.of(3L), true);

        assertThat(res.itemsCopied()).isEqualTo(3);
        assertThat(res.recipesCopied()).isEqualTo(2);
        assertThat(res.warnings()).isEmpty();
    }

    @Test
    @DisplayName("retseptsiz nusxada ingredientlar tortib kelinmaydi")
    void withoutRecipesCopiesOnlySelected() {
        CraftItem glass = item(2L, "Стекло", "glass-2");
        CraftItem window = item(3L, "Окно", "window-3");
        when(craftItemRepository.findAllById(List.of(3L))).thenReturn(List.of(window));
        when(recipeRepository.findByResultItemIdAndGameVersionId(3L, 1L))
                .thenReturn(Optional.of(recipe(30L, window, glass)));

        VersionCopyResultDto res = service.copy(1L, 2L, List.of(3L), false);

        assertThat(res.itemsCopied()).isEqualTo(1);
        assertThat(res.recipesCopied()).isZero();
        verify(recipeRepository, never()).save(any(Recipe.class));
    }

    @Test
    @DisplayName("manba versiyaga tegishli bo'lmagan item o'tkazib yuboriladi va ogohlantiriladi")
    void warnsOnItemFromAnotherVersion() {
        CraftItem foreign = CraftItem.builder()
                .id(77L).name("Чужой").itemKey("foreign-77").gameVersion(v2).category(cat).build();
        when(craftItemRepository.findAllById(List.of(77L))).thenReturn(List.of(foreign));

        VersionCopyResultDto res = service.copy(1L, 2L, List.of(77L), true);

        assertThat(res.itemsCopied()).isZero();
        assertThat(res.warnings()).hasSize(1);
        assertThat(res.warnings().get(0)).contains("77");
    }

    @Test
    @DisplayName("ingredienti tushib qolgan retsept yaratilmaydi — yarim retsept qolmasligi uchun")
    void refusesRecipeWithMissingIngredient() {
        CraftItem sand = item(1L, "Песок", "sand-1");
        CraftItem glass = item(2L, "Стекло", "glass-2");
        // "Стекло" tanlangan, lekin uning retsepti expandIngredients'ga ko'rinmaydi:
        // tranzitiv qidiruvda retsept yo'q, ko'chirish bosqichida esa bor.
        when(craftItemRepository.findAllById(List.of(2L))).thenReturn(List.of(glass));
        when(recipeRepository.findByResultItemIdAndGameVersionId(2L, 1L))
                .thenReturn(Optional.empty(), Optional.of(recipe(20L, glass, sand)));

        VersionCopyResultDto res = service.copy(1L, 2L, List.of(2L), true);

        assertThat(res.recipesCopied()).isZero();
        assertThat(res.recipesSkipped()).isEqualTo(1);
        assertThat(res.warnings()).anyMatch(w -> w.contains("Песок"));
        verify(recipeRepository, never()).save(any(Recipe.class));
    }

    @Test
    @DisplayName("manba va maqsad bir xil bo'lsa rad etiladi")
    void rejectsSameSourceAndTarget() {
        assertThatThrownBy(() -> service.copy(1L, 1L, null, true))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("ko'chirilgan ingredient qatorlari maqsad versiyadagi itemlarga ulanadi")
    void rewiresIngredientsToCopiedItems() {
        CraftItem sand = item(1L, "Песок", "sand-1");
        CraftItem glass = item(2L, "Стекло", "glass-2");
        when(craftItemRepository.findAllById(List.of(2L))).thenReturn(List.of(glass));
        when(recipeRepository.findByResultItemIdAndGameVersionId(2L, 1L))
                .thenReturn(Optional.of(recipe(20L, glass, sand)));

        service.copy(1L, 2L, List.of(2L), true);

        ArgumentCaptor<RecipeIngredient> ri = ArgumentCaptor.forClass(RecipeIngredient.class);
        verify(recipeIngredientRepository).save(ri.capture());
        RecipeIngredient saved = ri.getValue();
        assertThat(saved.getGameVersion()).isEqualTo(v2);
        // Manbadagi "Песок" emas, uning v2 dagi yangi nusxasi.
        assertThat(saved.getIngredientItem().getId()).isNotEqualTo(1L);
        assertThat(saved.getIngredientItem().getItemKey()).isEqualTo("sand-1");
        assertThat(saved.getIngredientItem().getGameVersion()).isEqualTo(v2);
        assertThat(saved.getQuantity()).isEqualByComparingTo(BigDecimal.valueOf(2));
    }
}
