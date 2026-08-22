package com.crafttree.dto;

import lombok.Data;

import java.util.List;

/** Bir necha itemni birdaniga yaratish. */
@Data
public class BulkCreateItemsRequest {

    private List<CreateItemRequest> items;

    /**
     * Qatorda kategoriya ko'rsatilmagan bo'lsa ishlatiladigan kategoriya.
     * Foydalanuvchi ko'pincha faqat nomlar ro'yxatini joylashtiradi.
     */
    private String defaultCategoryCode;
}
