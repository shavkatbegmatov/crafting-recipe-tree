package com.crafttree.service;

import com.crafttree.config.JwtService;
import com.crafttree.dto.RegisterRequest;
import com.crafttree.dto.RegisterResponse;
import com.crafttree.dto.UserProfileDto;
import com.crafttree.entity.User;
import com.crafttree.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 8;
    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Register a new user, optionally linking them to a referrer.
     * Returns a response with a JWT token so the user is logged in immediately.
     */
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        // Validate username uniqueness
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("USERNAME_TAKEN");
        }

        // Resolve referrer (if code provided)
        User referrer = null;
        if (request.getReferralCode() != null && !request.getReferralCode().isBlank()) {
            referrer = userRepository.findByReferralCode(request.getReferralCode().toUpperCase().trim())
                    .orElseThrow(() -> new IllegalArgumentException("INVALID_REFERRAL_CODE"));
        }

        // Build user
        User user = User.builder()
                .username(request.getUsername().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName() != null && !request.getDisplayName().isBlank()
                        ? request.getDisplayName().trim()
                        : null)
                .role("USER")
                .referralCode(generateUniqueCode())
                .referredBy(referrer)
                .build();

        userRepository.save(user);

        // Generate JWT
        String token = jwtService.generateToken(user);

        return RegisterResponse.builder()
                .token(token)
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .role(user.getRole())
                .referralCode(user.getReferralCode())
                .build();
    }

    /**
     * Build a profile DTO including referral stats.
     */
    public UserProfileDto getProfile(User user) {
        long referralCount = userRepository.countByReferredBy(user);
        return UserProfileDto.builder()
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .role(user.getRole())
                .referralCode(user.getReferralCode())
                .referralCount((int) referralCount)
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * Look up a referrer's display name / username by their code.
     * Used on the register page to show "Invited by: …".
     */
    public String getReferrerName(String code) {
        return userRepository.findByReferralCode(code.toUpperCase().trim())
                .map(u -> u.getDisplayName() != null ? u.getDisplayName() : u.getUsername())
                .orElse(null);
    }

    // ── helpers ──

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = randomCode();
            if (userRepository.findByReferralCode(code).isEmpty()) {
                return code;
            }
        }
        throw new IllegalStateException("Failed to generate unique referral code");
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
        }
        return sb.toString();
    }
}
