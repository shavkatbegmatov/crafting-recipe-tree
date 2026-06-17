package com.crafttree.service;

import com.crafttree.service.RateLimiterService.TokenBucket;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link RateLimiterService} va uning ichki {@link TokenBucket} mantiqi uchun unit testlar.
 * Vaqt parametr sifatida uzatilgani uchun testlar real soatga bog'liq emas.
 */
class RateLimiterServiceTest {

    @Test
    @DisplayName("TokenBucket — sig'imgacha ruxsat, keyin rad etadi")
    void allowsUpToCapacityThenBlocks() {
        TokenBucket bucket = new TokenBucket(3, 60_000);
        long t = 1_000;

        assertThat(bucket.tryConsume(t)).isTrue();
        assertThat(bucket.tryConsume(t)).isTrue();
        assertThat(bucket.tryConsume(t)).isTrue();
        assertThat(bucket.tryConsume(t)).isFalse(); // 4-chi — limit oshdi
    }

    @Test
    @DisplayName("TokenBucket — vaqt o'tishi bilan tokenlar tiklanadi")
    void refillsOverTime() {
        TokenBucket bucket = new TokenBucket(2, 1_000); // 1 soniyada 2 token
        long t = 5_000;

        assertThat(bucket.tryConsume(t)).isTrue();
        assertThat(bucket.tryConsume(t)).isTrue();
        assertThat(bucket.tryConsume(t)).isFalse();

        // 600 ms o'tdi → ~1.2 token tiklandi, bittasini olish mumkin
        assertThat(bucket.tryConsume(t + 600)).isTrue();
        assertThat(bucket.tryConsume(t + 600)).isFalse();
    }

    @Test
    @DisplayName("TokenBucket — tiklanish sig'imdan oshmaydi")
    void refillDoesNotExceedCapacity() {
        TokenBucket bucket = new TokenBucket(2, 1_000);
        long t = 1_000;

        // Uzoq vaqt kutish — ko'p token "to'planishi" mumkin edi, lekin sig'im 2
        assertThat(bucket.tryConsume(t + 1_000_000)).isTrue();
        assertThat(bucket.tryConsume(t + 1_000_000)).isTrue();
        assertThat(bucket.tryConsume(t + 1_000_000)).isFalse();
    }

    @Test
    @DisplayName("Service — turli kalitlar mustaqil hisoblanadi")
    void tracksKeysIndependently() {
        RateLimiterService svc = new RateLimiterService();
        Duration window = Duration.ofMinutes(1);

        assertThat(svc.tryAcquire("a", 1, window)).isTrue();
        assertThat(svc.tryAcquire("a", 1, window)).isFalse(); // "a" tugadi
        assertThat(svc.tryAcquire("b", 1, window)).isTrue();  // "b" alohida
    }
}
