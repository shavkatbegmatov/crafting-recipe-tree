package com.crafttree.dto.backup;

import java.util.List;

/**
 * Tiklash natijasi.
 *
 * @param success            tiklandimi
 * @param safetyBackupFile   tiklashdan oldin olingan zaxira fayli nomi (qaytish nuqtasi)
 * @param warnings           pg_restore ogohlantirishlari
 */
public record RestoreReportDto(
        boolean success,
        String safetyBackupFile,
        List<String> warnings
) {
}
