package com.crafttree.dto.portage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExportTagDto {
    private String code;
    private String nameRu;
    private String nameUz;
    private String nameEn;
    private String nameUzCyr;
    private String color;
    private Integer sortOrder;
}
