package com.crafttree.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Yengil, xotirada ishlovchi tezlik cheklovchi (token-bucket). Bitta instans uchun mo'ljallangan
 * (loyiha bitta backend konteynerda ishlaydi) — taqsimlangan holatda Redis kabi tashqi do'kon kerak bo'ladi.
 * <p>
 * Bucket'lar Caffeine cache'da saqlanadi: {@code expireAfterAccess} + {@code maximumSize} bilan —
 * shu sabab faol bo'lmagan kalitlar avtomatik tozalanadi (cheksiz xotira o'sishi oldini olinadi).
 */
@Service
public class RateLimiterService {

    private final Cache<String, TokenBucket> buckets = Caffeine.newBuilder()
            .maximumSize(100_000)
            .expireAfterAccess(Duration.ofMinutes(15))
            .build();

    /**
     * {@code key} uchun bitta token olishga harakat qiladi.
     *
     * @param capacity oynadagi maksimal so'rovlar soni
     * @param window   to'liq {@code capacity} tiklanadigan vaqt oynasi
     * @return {@code true} — ruxsat berildi; {@code false} — limit oshib ketdi
     */
    public boolean tryAcquire(String key, int capacity, Duration window) {
        TokenBucket bucket = buckets.get(key, k -> new TokenBucket(capacity, window.toMillis()));
        return bucket.tryConsume(System.currentTimeMillis());
    }

    /**
     * Vaqt o'tishi bilan uzluksiz to'ldiriladigan token-bucket. {@code tryConsume} joriy vaqtni
     * parametr sifatida oladi — bu uni soatga bog'liq qilmasdan test qilish imkonini beradi.
     */
    static final class TokenBucket {
        private final int capacity;
        private final double refillPerMillis;
        private double tokens;
        private long lastRefillAt;
        private boolean started;

        TokenBucket(int capacity, long windowMillis) {
            this.capacity = capacity;
            this.refillPerMillis = (double) capacity / windowMillis;
            this.tokens = capacity;
        }

        synchronized boolean tryConsume(long now) {
            refill(now);
            if (tokens >= 1.0) {
                tokens -= 1.0;
                return true;
            }
            return false;
        }

        private void refill(long now) {
            if (!started) {
                started = true;
                lastRefillAt = now;
                return;
            }
            long elapsed = now - lastRefillAt;
            if (elapsed > 0) {
                tokens = Math.min(capacity, tokens + elapsed * refillPerMillis);
                lastRefillAt = now;
            }
        }
    }
}
