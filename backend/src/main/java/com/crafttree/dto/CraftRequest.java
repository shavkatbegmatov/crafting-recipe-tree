package com.crafttree.dto;

/** Bulk craft so'rovi: qaysi itemni nechta yasash, qaysi versiyada. */
public record CraftRequest(Long itemId, int quantity, String gameVersion) {}
