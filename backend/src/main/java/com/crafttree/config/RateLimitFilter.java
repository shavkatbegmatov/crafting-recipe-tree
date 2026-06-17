package com.crafttree.config;

import com.crafttree.service.RateLimiterService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

/**
 * Login va register endpoint'lariga IP bo'yicha tezlik cheklovi — parol brute-force va
 * akkaunt yaratish bilan spam'ga qarshi. Limit oshganda 429 (Too Many Requests) qaytaradi.
 * <p>
 * Security filtr zanjiriga {@code SecurityConfig}'da qo'shiladi (autentifikatsiyadan oldin).
 */
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimiterService rateLimiter;

    private static final int CAPACITY = 10;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        if (shouldLimit(request)) {
            String key = "auth:" + clientIp(request);
            if (!rateLimiter.tryAcquire(key, CAPACITY, WINDOW)) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(
                        "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"RATE_LIMIT_EXCEEDED\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    /** Faqat login/register POST so'rovlariga cheklov qo'llanadi. */
    private boolean shouldLimit(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        String uri = request.getRequestURI();
        return uri.endsWith("/api/auth/login") || uri.endsWith("/api/auth/register");
    }

    /** Reverse-proxy (Coolify) orqasida haqiqiy IP — X-Forwarded-For birinchi qiymati. */
    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
