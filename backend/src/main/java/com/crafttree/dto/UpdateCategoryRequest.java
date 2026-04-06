package com.crafttree.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCategoryRequest {
    private String code;
    private String nameRu;
    private String nameUz;
    private String nameEn;
    private String nameUzCyr;
    private String color;
    private String icon;
    private Integer sortOrder;
}
