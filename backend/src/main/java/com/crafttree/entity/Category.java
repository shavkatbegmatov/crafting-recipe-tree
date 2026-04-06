package com.crafttree.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String code;

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
