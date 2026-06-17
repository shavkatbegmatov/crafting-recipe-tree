package com.crafttree.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration:86400000}")
    private long expiration; // 24 hours

    /**
     * Kalit kuchini ishga tushishda tekshiradi — zaif yoki yo'q kalit bilan ishlamaймiz.
     * Prod'da JWT_SECRET majburiy (application-prod.yml'da default yo'q), shuning uchun
     * noto'g'ri sozlangan deploy bu yerda darhol to'xtaydi (soxta token xavfini oldini oladi).
     */
    @PostConstruct
    void validateSecret() {
        int bits = Decoders.BASE64.decode(secret).length * 8;
        if (bits < 256) {
            throw new IllegalStateException(
                    "app.jwt.secret zaif: HMAC-SHA256 uchun kamida 256 bit (32 bayt, base64) kerak. "
                            + "JWT_SECRET muhit o'zgaruvchisini to'g'ri o'rnating.");
        }
    }

    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claims(Map.of("role", userDetails.getAuthorities().iterator().next().getAuthority()))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        final Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return resolver.apply(claims);
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
