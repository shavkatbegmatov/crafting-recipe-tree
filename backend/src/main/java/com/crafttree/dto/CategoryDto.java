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
    private Integer sortOrder;
}
