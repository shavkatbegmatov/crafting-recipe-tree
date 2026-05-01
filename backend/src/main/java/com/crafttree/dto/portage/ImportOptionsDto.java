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
public class ImportOptionsDto {

    public enum ConflictMode {
        SKIP,
        UPDATE,
        REPLACE
    }

    @Builder.Default
    private ConflictMode conflictMode = ConflictMode.UPDATE;

    @Builder.Default
    private boolean importImages = true;

    @Builder.Default
    private boolean overwriteImages = false;

    @Builder.Default
    private boolean dryRun = true;
}
