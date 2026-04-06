package com.crafttree.service;

import com.crafttree.dto.TagDto;
import com.crafttree.entity.CraftItem;
import com.crafttree.entity.Tag;
import com.crafttree.exception.ItemNotFoundException;
import com.crafttree.repository.CraftItemRepository;
import com.crafttree.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final CraftItemRepository craftItemRepository;

    @Transactional(readOnly = true)
    public List<TagDto> getAll() {
        return tagRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public TagDto create(TagDto request) {
        Tag tag = Tag.builder()
                .code(request.getCode().toUpperCase())
                .nameRu(request.getNameRu())
                .nameUz(request.getNameUz())
                .nameEn(request.getNameEn())
                .nameUzCyr(request.getNameUzCyr())
                .color(request.getColor())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();
        return toDto(tagRepository.save(tag));
    }

    @Transactional
    public TagDto update(Long id, TagDto request) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found: " + id));
        if (request.getCode() != null) tag.setCode(request.getCode().toUpperCase());
        if (request.getNameRu() != null) tag.setNameRu(request.getNameRu());
        if (request.getNameUz() != null) tag.setNameUz(request.getNameUz());
        if (request.getNameEn() != null) tag.setNameEn(request.getNameEn());
        if (request.getNameUzCyr() != null) tag.setNameUzCyr(request.getNameUzCyr());
        if (request.getColor() != null) tag.setColor(request.getColor());
        if (request.getSortOrder() != null) tag.setSortOrder(request.getSortOrder());
        return toDto(tagRepository.save(tag));
    }

    @Transactional
    public void delete(Long id) {
        tagRepository.deleteById(id);
    }

    @Transactional
    public List<TagDto> setItemTags(Long itemId, List<Long> tagIds) {
        CraftItem item = craftItemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException(itemId));
        Set<Tag> tags = new HashSet<>(tagRepository.findAllById(tagIds));
        item.setTags(tags);
        craftItemRepository.save(item);
        return tags.stream().map(this::toDto).collect(Collectors.toList());
    }

    public TagDto toDto(Tag tag) {
        return TagDto.builder()
                .id(tag.getId())
                .code(tag.getCode())
                .nameRu(tag.getNameRu())
                .nameUz(tag.getNameUz())
                .nameEn(tag.getNameEn())
                .nameUzCyr(tag.getNameUzCyr())
                .color(tag.getColor())
                .sortOrder(tag.getSortOrder())
                .build();
    }
}
