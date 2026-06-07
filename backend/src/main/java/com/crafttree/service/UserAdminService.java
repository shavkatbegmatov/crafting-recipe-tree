package com.crafttree.service;

import com.crafttree.dto.AdminUserDto;
import com.crafttree.dto.PagedResponse;
import com.crafttree.dto.UserStatsDto;
import com.crafttree.entity.Role;
import com.crafttree.entity.User;
import com.crafttree.exception.ItemNotFoundException;
import com.crafttree.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

/**
 * Foydalanuvchilarni boshqarish biznes-mantiqi. Barcha xavfsizlik qoidalari (lockout va
 * imtiyozni oshirishga qarshi) shu yerda majburlanadi — controller faqat HTTP qatlamidir.
 * <p>
 * "actor" — amalni bajarayotgan autentifikatsiyalangan foydalanuvchi; "target" — amal
 * qaratilgan foydalanuvchi.
 */
@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Chalkashtirmaslik uchun o'xshash belgilarsiz (0/O, 1/l/I) parol alifbosi.
    private static final String TEMP_PWD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final int TEMP_PWD_LENGTH = 10;
    private static final SecureRandom RANDOM = new SecureRandom();

    // ── Ro'yxat va statistika ──

    @Transactional(readOnly = true)
    public PagedResponse<AdminUserDto> listUsers(String search, String role, Boolean enabled, int page, int size) {
        // q hech qachon null bo'lmasligi kerak — null String PostgreSQL'da bytea sifatida
        // uzatilib, LOWER(bytea) xatosini beradi. Bo'sh string = "barcha foydalanuvchilar".
        // Username lowercase saqlangani uchun qidiruvni ham lowercase qilamiz.
        String q = (search != null) ? search.trim().toLowerCase() : "";
        String roleFilter = (role != null && !role.isBlank()) ? role.trim().toUpperCase() : null;
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> result = userRepository.search(q, roleFilter, enabled, pageable);
        return PagedResponse.from(result, this::toDto);
    }

    @Transactional(readOnly = true)
    public UserStatsDto getStats() {
        return UserStatsDto.builder()
                .total(userRepository.count())
                .superAdmins(userRepository.countByRole(Role.SUPER_ADMIN))
                .admins(userRepository.countByRole(Role.ADMIN))
                .users(userRepository.countByRole(Role.USER))
                .blocked(userRepository.countByEnabledFalse())
                .build();
    }

    // ── Amallar ──

    @Transactional
    public AdminUserDto updateRole(Long targetId, String newRole, User actor) {
        String role = (newRole == null ? "" : newRole.trim().toUpperCase());
        if (!Role.ALL.contains(role)) {
            throw new IllegalArgumentException("INVALID_ROLE");
        }
        User target = getUser(targetId);
        requireNotSelf(actor, target, "CANNOT_MODIFY_SELF_ROLE");

        // Rol tayinlash — faqat super-admin (controller'da @PreAuthorize bilan ham himoyalangan).
        if (!isSuperAdmin(actor)) {
            throw new AccessDeniedException("ONLY_SUPER_ADMIN_CAN_ASSIGN_ROLES");
        }
        // Oxirgi super-adminni pasaytirib, tizimni boshqaruvsiz qoldirishga yo'l qo'ymaymiz.
        if (!role.equals(Role.SUPER_ADMIN) && isLastSuperAdmin(target)) {
            throw new IllegalStateException("CANNOT_DEMOTE_LAST_SUPER_ADMIN");
        }
        target.setRole(role);
        userRepository.save(target);
        return toDto(target);
    }

    @Transactional
    public AdminUserDto updateStatus(Long targetId, boolean enabled, User actor) {
        User target = getUser(targetId);
        requireNotSelf(actor, target, "CANNOT_BLOCK_SELF");
        requireCanManage(actor, target);
        if (!enabled && isLastSuperAdmin(target)) {
            throw new IllegalStateException("CANNOT_BLOCK_LAST_SUPER_ADMIN");
        }
        target.setEnabled(enabled);
        userRepository.save(target);
        return toDto(target);
    }

    /** Yangi parol o'rnatadi; bo'sh berilsa tasodifiy vaqtinchalik parol hosil qiladi va uni qaytaradi. */
    @Transactional
    public String resetPassword(Long targetId, String newPassword, User actor) {
        User target = getUser(targetId);
        requireCanManage(actor, target);
        String password = (newPassword != null && !newPassword.isBlank()) ? newPassword : generateTempPassword();
        target.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(target);
        return password;
    }

    @Transactional
    public void deleteUser(Long targetId, User actor) {
        User target = getUser(targetId);
        requireNotSelf(actor, target, "CANNOT_DELETE_SELF");
        requireCanManage(actor, target);
        if (isLastSuperAdmin(target)) {
            throw new IllegalStateException("CANNOT_DELETE_LAST_SUPER_ADMIN");
        }
        // Bu foydalanuvchi taklif qilganlarning referral bog'lanishini uzamiz (FK cheklovi).
        userRepository.clearReferrerReferences(target.getId());
        userRepository.delete(target);
    }

    // ── Yordamchilar ──

    private User getUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new ItemNotFoundException(id));
    }

    private AdminUserDto toDto(User user) {
        return AdminUserDto.from(user, userRepository.countByReferredBy(user));
    }

    private boolean isSuperAdmin(User u) {
        return Role.SUPER_ADMIN.equals(u.getRole());
    }

    private boolean isAdminOrAbove(User u) {
        return Role.ADMIN.equals(u.getRole()) || Role.SUPER_ADMIN.equals(u.getRole());
    }

    private boolean isLastSuperAdmin(User target) {
        return isSuperAdmin(target) && userRepository.countByRole(Role.SUPER_ADMIN) <= 1;
    }

    private void requireNotSelf(User actor, User target, String code) {
        if (actor.getId().equals(target.getId())) {
            throw new IllegalStateException(code);
        }
    }

    /**
     * Imtiyoz chegarasi: ADMIN faqat oddiy USER ustidan amal qila oladi.
     * SUPER_ADMIN esa hamma ustidan amal qiladi (o'z-o'ziga himoya alohida tekshiriladi).
     */
    private void requireCanManage(User actor, User target) {
        if (isSuperAdmin(actor)) {
            return;
        }
        if (isAdminOrAbove(target)) {
            throw new AccessDeniedException("ADMIN_CANNOT_MANAGE_ADMIN");
        }
    }

    private String generateTempPassword() {
        StringBuilder sb = new StringBuilder(TEMP_PWD_LENGTH);
        for (int i = 0; i < TEMP_PWD_LENGTH; i++) {
            sb.append(TEMP_PWD_CHARS.charAt(RANDOM.nextInt(TEMP_PWD_CHARS.length())));
        }
        return sb.toString();
    }
}
