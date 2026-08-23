package com.crafttree.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categories", uniqueConstraints = {
        @UniqueConstraint(name = "uq_categories_code_version",
                columnNames = {"code", "game_version_id"}),
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Kod endi faqat VERSIYA ICHIDA noyob: bir xil kategoriya turli versiyalarda
    // mustaqil qator bo'lib yashaydi (uq_categories_code_version).
    @Column(nullable = false, length = 20)
    private String code;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "game_version_id", nullable = false)
    private GameVersion gameVersion;

    @Column(name = "name_ru", nullable = false, length = 100)
    private String nameRu;

    @Column(name = "name_uz", nullable = false, length = 100)
    private String nameUz;

    @Column(name = "name_en", length = 100)
    private String nameEn;

    @Column(name = "name_uz_cyr", length = 100)
    private String nameUzCyr;

    @Column(length = 7)
    private String color;

    @Column(length = 30)
    private String icon;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
