package com.crafttree.service;

import com.crafttree.dto.CategoryDto;
import com.crafttree.dto.UpdateCategoryRequest;
import com.crafttree.entity.Category;
import com.crafttree.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryDto> getAll() {
        return categoryRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDto getById(Long id) {
        return toDto(categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found: " + id)));
    }

    @Transactional
    public CategoryDto create(UpdateCategoryRequest request) {
        Category category = Category.builder()
                .code(request.getCode().toUpperCase())
                .nameRu(request.getNameRu())
                .nameUz(request.getNameUz())
                .nameEn(request.getNameEn())
                .nameUzCyr(request.getNameUzCyr())
                .color(request.getColor())
                .icon(request.getIcon())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();
        return toDto(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDto update(Long id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found: " + id));

        if (request.getCode() != null) category.setCode(request.getCode().toUpperCase());
        if (request.getNameRu() != null) category.setNameRu(request.getNameRu());
        if (request.getNameUz() != null) category.setNameUz(request.getNameUz());
        if (request.getNameEn() != null) category.setNameEn(request.getNameEn());
        if (request.getNameUzCyr() != null) category.setNameUzCyr(request.getNameUzCyr());
        if (request.getColor() != null) category.setColor(request.getColor());
        if (request.getIcon() != null) category.setIcon(request.getIcon());
        if (request.getSortOrder() != null) category.setSortOrder(request.getSortOrder());

        return toDto(categoryRepository.save(category));
    }

    @Transactional
    public void delete(Long id) {
        categoryRepository.deleteById(id);
    }

    private CategoryDto toDto(Category c) {
        return CategoryDto.builder()
                .id(c.getId())
                .code(c.getCode())
                .nameRu(c.getNameRu())
                .nameUz(c.getNameUz())
                .nameEn(c.getNameEn())
                .nameUzCyr(c.getNameUzCyr())
                .color(c.getColor())
                .icon(c.getIcon())
                .sortOrder(c.getSortOrder())
                .build();
    }
}
