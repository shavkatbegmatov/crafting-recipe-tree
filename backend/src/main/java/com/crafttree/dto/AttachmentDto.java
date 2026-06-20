package com.crafttree.dto;

import com.crafttree.entity.ChatAttachment;
import lombok.Builder;

/** Ulanma metama'lumoti (data'siz). {@code url} — faylni ko'rish/yuklab olish manzili. */
@Builder
public record AttachmentDto(Long id, String filename, String contentType, long sizeBytes, String url) {

    public static AttachmentDto from(ChatAttachment a) {
        if (a == null) {
            return null;
        }
        return AttachmentDto.builder()
                .id(a.getId())
                .filename(a.getFilename())
                .contentType(a.getContentType())
                .sizeBytes(a.getSizeBytes())
                .url("/api/chat/attachment/" + a.getId())
                .build();
    }
}
