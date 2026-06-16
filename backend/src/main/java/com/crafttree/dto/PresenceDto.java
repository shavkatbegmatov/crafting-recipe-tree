package com.crafttree.dto;

import java.util.List;

/** Chatda hozir onlayn foydalanuvchilar (nomlari + soni). */
public record PresenceDto(List<String> users, int count) {}
