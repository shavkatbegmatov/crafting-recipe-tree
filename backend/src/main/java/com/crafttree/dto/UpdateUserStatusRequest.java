package com.crafttree.dto;

/** Akkauntni bloklash/faollashtirish so'rovi (enabled=true → faol, false → bloklangan). */
public record UpdateUserStatusRequest(boolean enabled) {}
