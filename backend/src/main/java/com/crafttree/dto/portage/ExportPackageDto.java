package com.crafttree.dto.portage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Top-level shape of the "data.json" inside a .craftpkg archive.
 *
 * Identifiers are domain-stable: {@code Category.code}, {@code Tag.code},
 * {@code CraftItem.name}. Database IDs are intentionally NOT carried over.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExportPackageDto {

    private ExportManifestDto manifest;

    @Builder.Default
    private List<ExportCategoryDto> categories = new ArrayList<>();

    @Builder.Default
    private List<ExportTagDto> tags = new ArrayList<>();

    @Builder.Default
    private List<ExportItemDto> items = new ArrayList<>();
}
