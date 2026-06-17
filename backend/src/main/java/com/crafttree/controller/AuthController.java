package com.crafttree.controller;

import com.crafttree.config.JwtService;
import com.crafttree.dto.*;
import com.crafttree.entity.User;
import com.crafttree.repository.UserRepository;
import com.crafttree.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, registration, and token management")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Login with username and password, returns JWT token")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow();

            String token = jwtService.generateToken(user);

            return ResponseEntity.ok(LoginResponse.builder()
                    .authenticated(true)
                    .token(token)
                    .username(user.getUsername())
                    .role(user.getRole())
                    .layoutWidth(user.getLayoutWidth())
                    .build());
        } catch (DisabledException e) {
            // Bloklangan akkaunt — parol to'g'ri bo'lsa ham kirishga ruxsat berilmaydi.
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(LoginResponse.builder()
                    .authenticated(false)
                    .errorCode("ACCOUNT_DISABLED")
                    .build());
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(LoginResponse.builder()
                    .authenticated(false)
                    .errorCode("INVALID_CREDENTIALS")
                    .build());
        }
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user, optionally with a referral code")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            RegisterResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            String code = e.getMessage();
            return switch (code) {
                case "USERNAME_TAKEN" -> ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", code));
                case "INVALID_REFERRAL_CODE" -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", code));
                default -> ResponseEntity.badRequest()
                        .body(Map.of("error", code));
            };
        }
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile with referral stats")
    public ResponseEntity<?> me(@AuthenticationPrincipal User user) {
        // JwtAuthFilter SecurityContext'ga faqat FAOL (enabled) foydalanuvchini qo'yadi —
        // shuning uchun bloklangan akkaunt valid token bilan ham bu yerga yetmaydi.
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated"));
        }
        return ResponseEntity.ok(authService.getProfile(user));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update current user's profile (display name, password)")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequest request) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated"));
        }
        try {
            UserProfileDto profile = authService.updateProfile(user, request);
            return ResponseEntity.ok(profile);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/referrer")
    @Operation(summary = "Look up who a referral code belongs to (public)")
    public ResponseEntity<?> lookupReferrer(@RequestParam String code) {
        String name = authService.getReferrerName(code);
        if (name == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "INVALID_REFERRAL_CODE"));
        }
        return ResponseEntity.ok(Map.of("name", name));
    }
}
