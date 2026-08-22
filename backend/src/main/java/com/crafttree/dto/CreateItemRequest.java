package com.crafttree.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * Yangi item yaratish so'rovi.
 * <p>
 * Item DOIM joriy (yoki so'ralgan) o'yin versiyasida yaratiladi — itemlar versiyaga
 * bog'langan. {@code item_key} nomdan avtomatik hosil qilinadi.
 */
@Data
public class CreateItemRequest {

    /** Kategoriya id yoki kodi — bittasi majburiy. Kod ommaviy qo'shishda qulayroq. */
    private Long categoryId;
    private String categoryCode;

    @NotBlank(message = "Nom bo'sh bo'lishi mumkin emas")
    @Size(max = 100, message = "Nom 100 belgidan oshmasligi kerak")
    private String name;

    @Size(max = 100) private String nameUz;
    @Size(max = 100) private String nameEn;
    @Size(max = 100) private String nameUzCyr;

    private String description;
    private String descriptionUz;
    private String descriptionEn;
    private String descriptionUzCyr;

    /** Bo'sh qoldirilsa 0 — retsept qo'shilganda undan olinadi. */
    @PositiveOrZero(message = "Kraft vaqti manfiy bo'lishi mumkin emas")
    private Integer craftTimeSeconds;

    private List<Long> tagIds;
}
