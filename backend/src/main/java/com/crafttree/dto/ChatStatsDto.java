package com.crafttree.dto;

import lombok.Builder;

import java.util.List;

/** Chat statistikasi: umumiy va bugungi xabarlar, onlayn soni, eng faol foydalanuvchilar. */
@Builder
public record ChatStatsDto(
        long totalMessages,
        long todayMessages,
        int onlineCount,
        List<TopSender> topSenders
) {
    /** Eng faol yuboruvchi: foydalanuvchi nomi va xabarlari soni. */
    public record TopSender(String username, long count) {}
}
