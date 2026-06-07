package com.crafttree.dto;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/**
 * Sahifalangan javob uchun universal qobiq. Spring {@link Page} ni frontend uchun qulay
 * va barqaror JSON shakliga o'giradi.
 */
public record PagedResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
    public static <E, T> PagedResponse<T> from(Page<E> page, Function<E, T> mapper) {
        return new PagedResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}
