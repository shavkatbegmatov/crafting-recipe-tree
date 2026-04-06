package com.crafttree.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateItemRequest {
    private String name;
    private String nameUz;
    private String nameEn;
    private String nameUzCyr;
    private String description;
    private String descriptionUz;
    private String descriptionEn;
    private String descriptionUzCyr;
}
