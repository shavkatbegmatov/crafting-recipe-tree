package com.crafttree.service;

import com.crafttree.entity.Category;
import com.crafttree.entity.CraftItem;
import com.crafttree.entity.GameVersion;
import com.crafttree.entity.Recipe;
import com.crafttree.entity.RecipeIngredient;
import com.crafttree.repository.CraftItemRepository;
import com.crafttree.repository.RecipeRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * {@link RecipeTreeService#resolveCraft} uchun unit testlar: inventardagi oraliq itemlar
 * ishlatiladimi va xomashyo yaxlitlash to'g'ri bajariladimi.
 *
 * <p>Sinov daraxti: T = 2×A + 1×B, A = 3×R. B va R — xomashyo.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CraftResolutionTest {

    @Mock
    CraftItemRepository craftItemRepository;
    @Mock
    RecipeRepository recipeRepository;
    @Mock
    GameVersionService gameVersionService;
    @InjectMocks
    RecipeTreeService service;

    private final GameVersion gv = GameVersion.builder().id(1L).version("1.0").build();

    private static final long T = 100L;
    private static final long A = 10L;
    private static final long B = 20L;
    private static final long R = 30L;
    private static final long C = 40L;

    private final CraftItem itemT = item(T, "T", "CRAFT");
    private final CraftItem itemA = item(A, "A", "CRAFT");
    private final CraftItem itemB = item(B, "B", "RAW");
    private final CraftItem itemR = item(R, "R", "RAW");
    private final CraftItem itemC = item(C, "C", "CRAFT");

    private static CraftItem item(long id, String name, String categoryCode) {
        return CraftItem.builder()
                .id(id).name(name).nameUz(name).nameEn(name).nameUzCyr(name)
                .category(Category.builder().id(1L).code(categoryCode).build())
                .craftTimeSeconds(0)
                .build();
    }

    private static RecipeIngredient ing(CraftItem item, String qty) {
        return RecipeIngredient.builder().ingredientItem(item).quantity(new BigDecimal(qty)).build();
    }

    /** Inventar xaritasi: {@code inv(A, 2, B, 1)} → {A=2, B=1}. */
    private static Map<Long, BigDecimal> inv(Object... pairs) {
        Map<Long, BigDecimal> m = new LinkedHashMap<>();
        for (int i = 0; i + 1 < pairs.length; i += 2) {
            m.put(((Number) pairs[i]).longValue(),
                    BigDecimal.valueOf(((Number) pairs[i + 1]).longValue()));
        }
        return m;
    }

    private void stubRecipeTimed(CraftItem result, int craftSeconds, RecipeIngredient... ingredients) {
        Recipe r = Recipe.builder()
                .resultItem(result).gameVersion(gv).craftTimeSeconds(craftSeconds)
                .ingredients(List.of(ingredients))
                .build();
        when(recipeRepository.findByResultItemIdAndGameVersionId(result.getId(), gv.getId()))
                .thenReturn(Optional.of(r));
    }

    private void stubRecipe(CraftItem result, RecipeIngredient... ingredients) {
        stubRecipeTimed(result, 0, ingredients);
    }

    /** T = 2×A + 1×B, A = 3×R */
    private void stubStandardTree() {
        stubRecipe(itemT, ing(itemA, "2"), ing(itemB, "1"));
        stubRecipe(itemA, ing(itemR, "3"));
    }

    @Test
    @DisplayName("Inventardagi oraliq item ishlatiladi — uning xomashyosi qayta talab qilinmaydi")
    void usesIntermediateFromInventory() {
        stubStandardTree();

        RecipeTreeService.CraftResolution res =
                service.resolveCraft(itemT, gv, BigDecimal.ONE, inv(A, 2, B, 1));

        assertThat(res.shortfall).isEmpty();
        assertThat(res.consumed).containsEntry(A, 2).containsEntry(B, 1);
        // A tayyor bo'lgani uchun uning xomashyosi (R) umuman kerak emas
        assertThat(res.consumed).doesNotContainKey(R);
        assertThat(res.required).doesNotContainKey(R);
    }

    @Test
    @DisplayName("Oraliq item qisman bo'lsa — bori ishlatiladi, qolgani yasaladi")
    void usesPartialIntermediateAndCraftsRest() {
        stubStandardTree();

        // 2 ta A kerak, 1 tasi bor -> 1 tasi yasaladi -> 3 ta R kerak
        RecipeTreeService.CraftResolution res =
                service.resolveCraft(itemT, gv, BigDecimal.ONE, inv(A, 1, B, 1, R, 5));

        assertThat(res.shortfall).isEmpty();
        assertThat(res.consumed).containsEntry(A, 1).containsEntry(B, 1).containsEntry(R, 3);
    }

    @Test
    @DisplayName("Oraliq item yo'q bo'lsa — to'liq xomashyodan yasaladi (eski xatti-harakat)")
    void fallsBackToRawMaterials() {
        stubStandardTree();

        RecipeTreeService.CraftResolution res =
                service.resolveCraft(itemT, gv, BigDecimal.ONE, inv(B, 1, R, 6));

        assertThat(res.shortfall).isEmpty();
        assertThat(res.consumed).containsEntry(R, 6).containsEntry(B, 1);
        assertThat(res.consumed).doesNotContainKey(A);
    }

    @Test
    @DisplayName("Yetmaganda shortfall to'ldiriladi va kerakli miqdor ko'rsatiladi")
    void reportsShortfallWhenNotEnough() {
        stubStandardTree();

        RecipeTreeService.CraftResolution res =
                service.resolveCraft(itemT, gv, BigDecimal.ONE, inv());

        assertThat(res.shortfall).containsEntry(R, 6).containsEntry(B, 1);
        assertThat(res.required).containsEntry(R, 6).containsEntry(B, 1);
    }

    @Test
    @DisplayName("Kasrli xomashyo butun daraxt bo'ylab yig'ilib, faqat OXIRIDA yaxlitlanadi")
    void roundsRawOnlyOnceAcrossBranches() {
        // T2 = 1×A2 + 1×C, A2 = 0.5×R, C = 0.5×R  ->  jami R = 1.0, ceil = 1 (2 emas!)
        stubRecipe(itemT, ing(itemA, "1"), ing(itemC, "1"));
        stubRecipe(itemA, ing(itemR, "0.5"));
        stubRecipe(itemC, ing(itemR, "0.5"));

        RecipeTreeService.CraftResolution res =
                service.resolveCraft(itemT, gv, BigDecimal.ONE, inv(R, 1));

        assertThat(res.required).containsEntry(R, 1);
        assertThat(res.consumed).containsEntry(R, 1);
        assertThat(res.shortfall).isEmpty();
    }

    @Test
    @DisplayName("Maqsad itemning o'zi inventardan olinmaydi — u yasaladi")
    void doesNotConsumeTargetItself() {
        stubStandardTree();

        // Inventarda 5 ta T bor, lekin baribir yangisini yasashi kerak
        RecipeTreeService.CraftResolution res =
                service.resolveCraft(itemT, gv, BigDecimal.ONE, inv(T, 5, B, 1, R, 6));

        assertThat(res.consumed).doesNotContainKey(T);
        assertThat(res.consumed).containsEntry(R, 6).containsEntry(B, 1);
    }

    // --- Reja (craft-plan) uchun ---

    @Test
    @DisplayName("Reja: inventarda tayyor oraliq item qadamlar ro'yxatiga tushmaydi")
    void planSkipsReadyIntermediates() {
        stubStandardTree();

        RecipeTreeService.CraftResolution res =
                service.resolveCraft(itemT, gv, BigDecimal.ONE, inv(A, 2, B, 1));

        // A tayyor bo'lgani uchun faqat T yasaladi
        assertThat(res.toCraft.keySet()).containsExactly(T);
    }

    @Test
    @DisplayName("Reja: oraliq item yo'q bo'lsa qadamlarda ham T, ham A bo'ladi")
    void planIncludesIntermediateWhenMissing() {
        stubStandardTree();

        RecipeTreeService.CraftResolution res =
                service.resolveCraft(itemT, gv, BigDecimal.ONE, inv(B, 1, R, 6));

        assertThat(res.toCraft.keySet()).containsExactlyInAnyOrder(T, A);
        assertThat(res.toCraft.get(A).quantity).isEqualByComparingTo("2");
    }

    @Test
    @DisplayName("Reja vaqti: tayyor oraliq item tarmog'i kritik yo'lga qo'shilmaydi")
    void parallelTimeSkipsReadyBranches() {
        // T (10s) = 2×A + 1×B,  A (30s) = 3×R
        stubRecipeTimed(itemT, 10, ing(itemA, "2"), ing(itemB, "1"));
        stubRecipeTimed(itemA, 30, ing(itemR, "3"));

        // A yo'q -> kritik yo'l = T(10) + A(30×2=60) = 70
        RecipeTreeService.CraftResolution without =
                service.resolveCraft(itemT, gv, BigDecimal.ONE, inv(B, 1, R, 6));
        assertThat(without.parallelSeconds).isEqualTo(70);

        // A tayyor -> faqat T(10)
        RecipeTreeService.CraftResolution ready =
                service.resolveCraft(itemT, gv, BigDecimal.ONE, inv(A, 2, B, 1));
        assertThat(ready.parallelSeconds).isEqualTo(10);
    }
}
