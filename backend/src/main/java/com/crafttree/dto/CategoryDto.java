package com.crafttree.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDto {
    private Long id;
    private String code;
    private String nameRu;
    private String nameUz;
    private String nameEn;
    private String nameUzCyr;
    private String color;
    private String icon;
    private Integer sortOrder;
    /** Kategoriya qaysi o'yin versiyasiga tegishli. */
    private String version;
}
