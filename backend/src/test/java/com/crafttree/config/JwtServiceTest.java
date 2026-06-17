package com.crafttree.config;

import com.crafttree.entity.User;
import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * {@link JwtService} uchun unit testlar — Spring konteksti shart emas.
 * Sirli kalit va muddat {@code @Value} maydonlari {@link ReflectionTestUtils} bilan o'rnatiladi.
 */
class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        // HMAC-SHA256 uchun kamida 32 baytli base64 kalit.
        ReflectionTestUtils.setField(jwtService, "secret",
                "dGhpc2lzYXZlcnlsb25nc2VjcmV0a2V5Zm9yand0dG9rZW5z");
        ReflectionTestUtils.setField(jwtService, "expiration", 86_400_000L);
    }

    private User user(String username, String role) {
        return User.builder().username(username).role(role).passwordHash("x").build();
    }

    @Test
    @DisplayName("generateToken → extractUsername bir-biriga mos (round-trip)")
    void generateAndExtractRoundTrips() {
        String token = jwtService.generateToken(user("alice", "USER"));
        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo("alice");
    }

    @Test
    @DisplayName("isTokenValid — bir xil foydalanuvchi uchun true")
    void validForSameUser() {
        User u = user("bob", "ADMIN");
        String token = jwtService.generateToken(u);
        assertThat(jwtService.isTokenValid(token, u)).isTrue();
    }

    @Test
    @DisplayName("isTokenValid — boshqa foydalanuvchi uchun false")
    void invalidForDifferentUser() {
        String token = jwtService.generateToken(user("bob", "USER"));
        assertThat(jwtService.isTokenValid(token, user("eve", "USER"))).isFalse();
    }

    @Test
    @DisplayName("muddati o'tgan token — parse paytida ExpiredJwtException")
    void expiredTokenThrows() {
        ReflectionTestUtils.setField(jwtService, "expiration", -1_000L);
        User u = user("carol", "USER");
        String token = jwtService.generateToken(u);
        assertThatThrownBy(() -> jwtService.isTokenValid(token, u))
                .isInstanceOf(ExpiredJwtException.class);
    }
}
