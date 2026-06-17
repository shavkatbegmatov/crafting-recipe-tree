package com.crafttree.service;

import com.crafttree.dto.AccessRequestDto;
import com.crafttree.dto.MyAccessRequestDto;
import com.crafttree.entity.AccessRequest;
import com.crafttree.entity.AccessRequestStatus;
import com.crafttree.entity.Role;
import com.crafttree.entity.User;
import com.crafttree.repository.AccessRequestRepository;
import com.crafttree.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * {@link AccessRequestService} biznes-qoidalari uchun unit testlar (Mockito).
 * Diqqat markazi: rolni faqat ko'tarish, bitta PENDING ariza cheklovi, poyga holati va egalik tekshiruvi.
 */
@ExtendWith(MockitoExtension.class)
class AccessRequestServiceTest {

    @Mock
    AccessRequestRepository accessRequestRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    NotificationService notificationService;
    @Mock
    AuditService auditService;
    @InjectMocks
    AccessRequestService service;

    private User user(Long id, String role) {
        return User.builder().id(id).username("user" + id).role(role).build();
    }

    private AccessRequest pending(Long id, User owner) {
        return AccessRequest.builder()
                .id(id).user(owner).requestedRole(Role.ADMIN)
                .status(AccessRequestStatus.PENDING).createdAt(LocalDateTime.now()).build();
    }

    @Test
    @DisplayName("createRequest — imtiyozli foydalanuvchi (ADMIN) ALREADY_PRIVILEGED")
    void createRejectsPrivileged() {
        assertThatThrownBy(() -> service.createRequest(user(1L, Role.ADMIN), "ruxsat"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("ALREADY_PRIVILEGED");
        verifyNoInteractions(accessRequestRepository);
    }

    @Test
    @DisplayName("createRequest — ochiq ariza bor bo'lsa REQUEST_ALREADY_PENDING")
    void createRejectsDuplicate() {
        User u = user(2L, Role.USER);
        when(accessRequestRepository.existsByUserAndStatus(u, AccessRequestStatus.PENDING)).thenReturn(true);

        assertThatThrownBy(() -> service.createRequest(u, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("REQUEST_ALREADY_PENDING");
    }

    @Test
    @DisplayName("createRequest — poyga (unique buzilishi) toza REQUEST_ALREADY_PENDING ga aylanadi")
    void createHandlesRace() {
        User u = user(3L, Role.USER);
        when(accessRequestRepository.existsByUserAndStatus(u, AccessRequestStatus.PENDING)).thenReturn(false);
        when(accessRequestRepository.saveAndFlush(any(AccessRequest.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate"));

        assertThatThrownBy(() -> service.createRequest(u, "xabar"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("REQUEST_ALREADY_PENDING");
        verifyNoInteractions(notificationService);
    }

    @Test
    @DisplayName("createRequest — muvaffaqiyatli: ariza saqlanadi, super-adminlar xabardor qilinadi")
    void createSuccess() {
        User u = user(4L, Role.USER);
        when(accessRequestRepository.existsByUserAndStatus(u, AccessRequestStatus.PENDING)).thenReturn(false);
        when(accessRequestRepository.saveAndFlush(any(AccessRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        MyAccessRequestDto dto = service.createRequest(u, "  iltimos  ");

        assertThat(dto).isNotNull();
        assertThat(dto.requestedRole()).isEqualTo(Role.ADMIN);
        verify(accessRequestRepository).saveAndFlush(any(AccessRequest.class));
        verify(notificationService).notifySuperAdmins(any(), eq("user4"), eq("/admin/access-requests"));
    }

    @Test
    @DisplayName("approve — USER roli ADMIN ga ko'tariladi, holat APPROVED va audit/notif yoziladi")
    void approvePromotes() {
        User target = user(5L, Role.USER);
        User reviewer = user(1L, Role.SUPER_ADMIN);
        AccessRequest req = pending(10L, target);
        when(accessRequestRepository.findById(10L)).thenReturn(Optional.of(req));

        AccessRequestDto dto = service.approve(10L, reviewer, "ok");

        assertThat(dto).isNotNull();
        assertThat(target.getRole()).isEqualTo(Role.ADMIN);
        assertThat(req.getStatus()).isEqualTo(AccessRequestStatus.APPROVED);
        assertThat(req.getReviewedBy()).isEqualTo(reviewer);
        verify(userRepository).save(target);
        verify(auditService).log(any(), eq("ACCESS_REQUEST"), eq(10L), any());
        verify(notificationService).notifyUser(eq(target), any(), eq("user1"), eq("/"));
    }

    @Test
    @DisplayName("approve — allaqachon imtiyozli foydalanuvchining roli pasaytirilmaydi")
    void approveDoesNotDowngrade() {
        User target = user(6L, Role.SUPER_ADMIN);
        AccessRequest req = pending(14L, target);
        when(accessRequestRepository.findById(14L)).thenReturn(Optional.of(req));

        service.approve(14L, user(1L, Role.SUPER_ADMIN), null);

        assertThat(target.getRole()).isEqualTo(Role.SUPER_ADMIN);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("approve — yakunlangan arizani qayta tasdiqlab bo'lmaydi")
    void approveRejectsNonPending() {
        AccessRequest req = AccessRequest.builder()
                .id(11L).user(user(5L, Role.USER)).status(AccessRequestStatus.APPROVED)
                .createdAt(LocalDateTime.now()).build();
        when(accessRequestRepository.findById(11L)).thenReturn(Optional.of(req));

        assertThatThrownBy(() -> service.approve(11L, user(1L, Role.SUPER_ADMIN), null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("REQUEST_NOT_PENDING");
    }

    @Test
    @DisplayName("reject — rol o'zgarmaydi, holat REJECTED bo'ladi")
    void rejectKeepsRole() {
        User target = user(6L, Role.USER);
        AccessRequest req = pending(12L, target);
        when(accessRequestRepository.findById(12L)).thenReturn(Optional.of(req));

        service.reject(12L, user(1L, Role.SUPER_ADMIN), "yo'q");

        assertThat(target.getRole()).isEqualTo(Role.USER);
        assertThat(req.getStatus()).isEqualTo(AccessRequestStatus.REJECTED);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("cancelMyRequest — boshqaning arizasini bekor qilib bo'lmaydi")
    void cancelRejectsForeign() {
        User owner = user(7L, Role.USER);
        User other = user(8L, Role.USER);
        AccessRequest req = pending(13L, owner);
        when(accessRequestRepository.findById(13L)).thenReturn(Optional.of(req));

        assertThatThrownBy(() -> service.cancelMyRequest(other, 13L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("list — noto'g'ri status filtri INVALID_STATUS")
    void listRejectsBadStatus() {
        assertThatThrownBy(() -> service.list("BOGUS", 0, 20))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("INVALID_STATUS");
    }
}
