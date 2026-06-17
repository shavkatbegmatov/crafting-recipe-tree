package com.crafttree.service;

import com.crafttree.config.JwtService;
import com.crafttree.dto.RegisterRequest;
import com.crafttree.dto.RegisterResponse;
import com.crafttree.dto.UpdateProfileRequest;
import com.crafttree.dto.UserProfileDto;
import com.crafttree.entity.User;
import com.crafttree.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link AuthService} biznes-mantiqi uchun unit testlar (Mockito — DB shart emas).
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    UserRepository userRepository;
    @Mock
    PasswordEncoder passwordEncoder;
    @Mock
    JwtService jwtService;
    @InjectMocks
    AuthService authService;

    private RegisterRequest registerRequest(String username, String password) {
        RegisterRequest r = new RegisterRequest();
        r.setUsername(username);
        r.setPassword(password);
        return r;
    }

    @Test
    @DisplayName("register — username band bo'lsa USERNAME_TAKEN va save chaqirilmaydi")
    void registerThrowsWhenUsernameTaken() {
        when(userRepository.existsByUsername("taken")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest("taken", "secret1")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("USERNAME_TAKEN");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("register — noto'g'ri referral kod INVALID_REFERRAL_CODE")
    void registerThrowsWhenReferralInvalid() {
        RegisterRequest req = registerRequest("newbie", "secret1");
        req.setReferralCode("BADCODE");
        when(userRepository.existsByUsername("newbie")).thenReturn(false);
        when(userRepository.findByReferralCode("BADCODE")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("INVALID_REFERRAL_CODE");
    }

    @Test
    @DisplayName("register — muvaffaqiyatli: USER roli, noyob referral kod va JWT token qaytadi")
    void registerSuccess() {
        RegisterRequest req = registerRequest("newbie", "secret1");
        when(userRepository.existsByUsername("newbie")).thenReturn(false);
        when(userRepository.findByReferralCode(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret1")).thenReturn("hashed");
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt-xyz");

        RegisterResponse res = authService.register(req);

        assertThat(res.getToken()).isEqualTo("jwt-xyz");
        assertThat(res.getUsername()).isEqualTo("newbie");
        assertThat(res.getRole()).isEqualTo("USER");
        assertThat(res.getReferralCode()).isNotBlank();
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("updateProfile — joriy parol noto'g'ri bo'lsa WRONG_PASSWORD")
    void updateProfileWrongPassword() {
        User user = User.builder().username("u").passwordHash("old-hash").role("USER").build();
        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setNewPassword("newpass1");
        req.setCurrentPassword("wrong");
        when(passwordEncoder.matches("wrong", "old-hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.updateProfile(user, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("WRONG_PASSWORD");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateProfile — noto'g'ri layoutWidth qiymati INVALID_LAYOUT_WIDTH")
    void updateProfileInvalidLayout() {
        User user = User.builder().username("u").passwordHash("h").role("USER").build();
        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setLayoutWidth("DIAGONAL");

        assertThatThrownBy(() -> authService.updateProfile(user, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("INVALID_LAYOUT_WIDTH");
    }

    @Test
    @DisplayName("updateProfile — displayName trim qilinadi, layoutWidth katta harfga keltiriladi")
    void updateProfileSuccess() {
        User user = User.builder().username("u").passwordHash("h").role("USER")
                .layoutWidth("CENTERED").build();
        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setDisplayName("  New Name  ");
        req.setLayoutWidth("full");
        when(userRepository.countByReferredBy(user)).thenReturn(0L);

        UserProfileDto dto = authService.updateProfile(user, req);

        assertThat(user.getDisplayName()).isEqualTo("New Name");
        assertThat(user.getLayoutWidth()).isEqualTo("FULL");
        assertThat(dto.getUsername()).isEqualTo("u");
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("getReferrerName — displayName bor bo'lsa o'shani, topilmasa null")
    void getReferrerName() {
        User withName = User.builder().username("inviter").displayName("Inviter Bob").role("USER").build();
        when(userRepository.findByReferralCode("CODE1")).thenReturn(Optional.of(withName));
        assertThat(authService.getReferrerName("code1")).isEqualTo("Inviter Bob");

        when(userRepository.findByReferralCode("CODE2")).thenReturn(Optional.empty());
        assertThat(authService.getReferrerName("code2")).isNull();
    }
}
