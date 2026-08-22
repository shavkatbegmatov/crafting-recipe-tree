package com.crafttree.dto.backup;

/**
 * Zaxira muhitining tayyorligi. UI shu ma'lumotga qarab tugmalarni yoqadi yoki
 * sababini ko'rsatadi — vosita yo'qligini bosgandan keyin bilish yomon tajriba.
 *
 * @param available     pg_dump topildimi
 * @param toolVersion   pg_dump versiyasi (mos kelishini admin ko'rib turishi uchun)
 * @param serverVersion PostgreSQL server versiyasi
 * @param database      baza nomi (tiklashda tasdiq sifatida yoziladi)
 * @param size          bazaning o'qishga qulay hajmi
 * @param error         vosita ishlamasa — sababi
 */
public record BackupStatusDto(
        boolean available,
        String toolVersion,
        String serverVersion,
        String database,
        String size,
        String error
) {
}
