package com.crafttree.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Caffeine asosidagi kesh — chegaralangan hajm + TTL bilan.
 * <p>
 * Avval default {@code ConcurrentMapCacheManager} ishlatilardi: u cheksiz edi va hech qachon
 * tozalanmasdi (har bir {itemId,version} juftligi abadiy keshlanib, asta-sekin OOM xavfi).
 * Endi har bir kesh {@code maximumSize} va {@code expireAfterWrite} bilan chegaralangan.
 * <p>
 * Retsept o'zgarganda RecipeService {@code @CacheEvict} bilan recipeTrees/rawTotals/craftTimes'ni
 * tozalaydi; categories/tags esa kamdan-kam o'zgaradi, shuning uchun TTL bilan o'z-o'zidan yangilanadi.
 */
@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(
                "recipeTrees", "rawTotals", "craftTimes", "categories", "tags");
        manager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(10_000)
                .expireAfterWrite(Duration.ofMinutes(30))
                .recordStats()); // Actuator orqali cache hit/miss ko'rsatkichlari uchun
        return manager;
    }
}
