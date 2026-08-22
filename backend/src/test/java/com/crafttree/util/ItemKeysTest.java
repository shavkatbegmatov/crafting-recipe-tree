package com.crafttree.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link ItemKeys} uchun testlar.
 * <p>
 * Kalit versiyalararo bog'lovchi bo'lgani uchun uning barqarorligi va noyobligi muhim.
 */
class ItemKeysTest {

    @Test
    @DisplayName("lotin nomdan o'qiladigan slug")
    void slugFromLatin() {
        assertThat(ItemKeys.slug("Iron Plate")).isEqualTo("iron-plate");
        assertThat(ItemKeys.slug("  Steel  ")).isEqualTo("steel");
        assertThat(ItemKeys.slug("A/B\\C")).isEqualTo("a-b-c");
    }

    @Test
    @DisplayName("kirill nomlar lotinga o'giriladi — aks holda hammasi 'item' bo'lardi")
    void slugFromCyrillic() {
        assertThat(ItemKeys.slug("Кремний")).isEqualTo("kremniy");
        assertThat(ItemKeys.slug("Медь")).isEqualTo("med");
        assertThat(ItemKeys.slug("Пресс-порошок")).isEqualTo("press-poroshok");
        assertThat(ItemKeys.slug("Азотная кислота")).isEqualTo("azotnaya-kislota");
    }

    @Test
    @DisplayName("o'zbek kirillidagi qo'shimcha harflar")
    void slugFromUzbekCyrillic() {
        assertThat(ItemKeys.slug("Қуём")).isEqualTo("quem");
        assertThat(ItemKeys.slug("Ўсимлик")).isEqualTo("osimlik");
    }

    @Test
    @DisplayName("lotin harfi qolmasa 'item' ga qaytadi")
    void slugFallback() {
        assertThat(ItemKeys.slug("!!!")).isEqualTo("item");
        assertThat(ItemKeys.slug("")).isEqualTo("item");
        assertThat(ItemKeys.slug(null)).isEqualTo("item");
    }

    @Test
    @DisplayName("band kalit uchun raqamli qo'shimcha beriladi")
    void uniqueAppendsSuffix() {
        Set<String> taken = new HashSet<>(Set.of("kremniy", "kremniy-2"));
        assertThat(ItemKeys.unique("Кремний", taken::contains)).isEqualTo("kremniy-3");
        assertThat(ItemKeys.unique("Медь", taken::contains)).isEqualTo("med");
    }

    @Test
    @DisplayName("bir xil nom har doim bir xil kalit beradi — versiyalararo bog'lovchi shunga tayanadi")
    void slugIsStable() {
        assertThat(ItemKeys.slug("Кремний")).isEqualTo(ItemKeys.slug("кремний"));
        assertThat(ItemKeys.slug("Iron Plate")).isEqualTo(ItemKeys.slug("iron plate"));
    }
}
