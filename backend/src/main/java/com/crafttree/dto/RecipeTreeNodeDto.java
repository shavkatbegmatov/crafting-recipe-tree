package com.crafttree.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeTreeNodeDto {
    private Long id;
    private String name;
    private String category;
    private Integer craftTimeSeconds;
    private BigDecimal quantity;

    @Builder.Default
    private List<RecipeTreeNodeDto> children = new ArrayList<>();
}
