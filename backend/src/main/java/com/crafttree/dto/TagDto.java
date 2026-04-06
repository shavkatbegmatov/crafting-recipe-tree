package com.crafttree.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TagDto {
    private Long id;
    private String code;
    private String nameRu;
    private String nameUz;
    private String nameEn;
    private String nameUzCyr;
    private String color;
    private Integer sortOrder;
}
