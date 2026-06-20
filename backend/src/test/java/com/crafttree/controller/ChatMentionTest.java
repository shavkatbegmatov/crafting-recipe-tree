package com.crafttree.controller;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** {@link ChatController#extractMentions} — @username ajratish mantiqining unit testlari. */
class ChatMentionTest {

    @Test
    void extractsSingleAndMultipleMentions() {
        assertThat(ChatController.extractMentions("Salom @admin va @bot!"))
                .containsExactly("admin", "bot");
    }

    @Test
    void dedupesRepeatedMentions() {
        assertThat(ChatController.extractMentions("@admin @admin @admin"))
                .containsExactly("admin");
    }

    @Test
    void ignoresEmailLikeText() {
        // @ oldidan harf bo'lsa (email manzili) — bu mention emas.
        assertThat(ChatController.extractMentions("yozing user@example.com manzilga")).isEmpty();
    }

    @Test
    void stopsAtPunctuation() {
        assertThat(ChatController.extractMentions("@admin, @bot. @user_2?"))
                .containsExactly("admin", "bot", "user_2");
    }

    @Test
    void returnsEmptyWhenNoMention() {
        assertThat(ChatController.extractMentions("oddiy xabar matni")).isEmpty();
        assertThat(ChatController.extractMentions(null)).isEmpty();
        assertThat(ChatController.extractMentions("")).isEmpty();
    }
}
