package com.crafttree.service;

import com.crafttree.entity.ChatAnnouncement;
import com.crafttree.entity.User;
import com.crafttree.exception.ItemNotFoundException;
import com.crafttree.repository.ChatAnnouncementRepository;
import com.crafttree.repository.ChatMessageRepository;
import com.crafttree.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link ChatModerationService} uchun unit testlar (Mockito).
 * Diqqat markazi: mute muddati mantig'i (doimiy vs muddatli), o'chirish/e'lon broadcast'lari.
 */
@ExtendWith(MockitoExtension.class)
class ChatModerationServiceTest {

    @Mock
    ChatMessageRepository chatRepo;
    @Mock
    ChatAnnouncementRepository announcementRepo;
    @Mock
    UserRepository userRepository;
    @Mock
    SimpMessagingTemplate messaging;
    @Mock
    ChatPresenceService presenceService;
    @InjectMocks
    ChatModerationService service;

    private User user() {
        return User.builder().id(1L).username("x").role("USER").build();
    }

    @Test
    @DisplayName("muteUser — null muddat doimiy mute (uzoq kelajak)")
    void muteUserPermanentNull() {
        User u = user();
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));

        service.muteUser(1L, null);

        assertThat(u.getChatMutedUntil()).isAfter(LocalDateTime.now().plusYears(50));
        verify(userRepository).save(u);
    }

    @Test
    @DisplayName("muteUser — 0 yoki manfiy muddat ham doimiy mute")
    void muteUserPermanentZero() {
        User u = user();
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));

        service.muteUser(1L, 0);

        assertThat(u.getChatMutedUntil()).isAfter(LocalDateTime.now().plusYears(50));
    }

    @Test
    @DisplayName("muteUser — muddatli mute (60 daqiqa) taxminan to'g'ri oraliqda")
    void muteUserTimed() {
        User u = user();
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));

        service.muteUser(1L, 60);

        LocalDateTime until = u.getChatMutedUntil();
        assertThat(until).isAfter(LocalDateTime.now().plusMinutes(58));
        assertThat(until).isBefore(LocalDateTime.now().plusMinutes(62));
    }

    @Test
    @DisplayName("muteUser — foydalanuvchi topilmasa ItemNotFoundException")
    void muteUserNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.muteUser(99L, 60))
                .isInstanceOf(ItemNotFoundException.class);
    }

    @Test
    @DisplayName("unmuteUser — mute olib tashlanadi (null)")
    void unmuteUser() {
        User u = User.builder().id(1L).username("x").role("USER")
                .chatMutedUntil(LocalDateTime.now().plusYears(100)).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));

        service.unmuteUser(1L);

        assertThat(u.getChatMutedUntil()).isNull();
        verify(userRepository).save(u);
    }

    @Test
    @DisplayName("deleteMessage — mavjud bo'lmasa ItemNotFoundException, o'chirish chaqirilmaydi")
    void deleteMissing() {
        when(chatRepo.existsById(7L)).thenReturn(false);

        assertThatThrownBy(() -> service.deleteMessage(7L))
                .isInstanceOf(ItemNotFoundException.class);
        verify(chatRepo, never()).deleteById(any());
    }

    @Test
    @DisplayName("deleteMessage — o'chiriladi va /topic/chat.deleted ga broadcast qilinadi")
    void deleteBroadcasts() {
        when(chatRepo.existsById(7L)).thenReturn(true);

        service.deleteMessage(7L);

        verify(chatRepo).deleteById(7L);
        verify(messaging).convertAndSend(eq(ChatModerationService.TOPIC_DELETED), any(Object.class));
    }

    @Test
    @DisplayName("setAnnouncement — matn trim qilinadi, saqlanadi va broadcast qilinadi")
    void setAnnouncementBroadcasts() {
        service.setAnnouncement("  Diqqat!  ", "admin");

        ArgumentCaptor<ChatAnnouncement> captor = ArgumentCaptor.forClass(ChatAnnouncement.class);
        verify(announcementRepo).save(captor.capture());
        assertThat(captor.getValue().getMessage()).isEqualTo("Diqqat!");
        assertThat(captor.getValue().getAuthorUsername()).isEqualTo("admin");
        verify(messaging).convertAndSend(eq(ChatModerationService.TOPIC_ANNOUNCEMENT), any(Object.class));
    }

    @Test
    @DisplayName("clearAnnouncement — hammasi o'chiriladi va bo'sh e'lon broadcast qilinadi")
    void clearAnnouncementBroadcasts() {
        service.clearAnnouncement();

        verify(announcementRepo).deleteAll();
        verify(messaging).convertAndSend(eq(ChatModerationService.TOPIC_ANNOUNCEMENT), any(Object.class));
    }
}
