package com.crafttree;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpStatus;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Kontekstni to'liq ko'taradigan yagona integratsiya testi — real PostgreSQL (Testcontainers) bilan.
 * Bu unit testlar tuta olmaydigan butun bir sinf xatolarni qamrab oladi:
 * security filtr zanjirining noto'g'ri qurilishi (filtr-tartibi boot bug), Flyway migratsiyalarining
 * yaroqsizligi, {@code ddl-auto: validate} nomuvofiqligi, bean DI muammolari, security qoidalari.
 * <p>
 * {@code disabledWithoutDocker = true}: Docker bo'lmagan muhitda (masalan, lokal, daemon o'chiq)
 * avtomatik o'tkazib yuboriladi; CI'da (Docker mavjud) to'liq ishlaydi.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers(disabledWithoutDocker = true)
class SmokeIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    TestRestTemplate rest;

    @Test
    void contextLoads() {
        // Kontekst ko'tarilishining o'zi sinov: SecurityFilterChain, barcha bean'lar,
        // Flyway V1..V22 real PostgreSQL'da, Hibernate validate.
    }

    @Test
    void healthIsUp() {
        var res = rest.getForEntity("/actuator/health", String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void publicItemListAccessible() {
        var res = rest.getForEntity("/api/items", String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void adminEndpointBlockedWithoutAuth() {
        var res = rest.getForEntity("/api/admin/stats", String.class);
        assertThat(res.getStatusCode()).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }

    @Test
    void favoritesRequireAuth() {
        var res = rest.getForEntity("/api/favorites", String.class);
        assertThat(res.getStatusCode()).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }

    @Test
    void loginWithBadCredentialsReturns401() {
        var res = rest.postForEntity("/api/auth/login",
                Map.of("username", "nosuchuser", "password", "wrong"), String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
