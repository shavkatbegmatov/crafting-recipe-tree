package com.crafttree.service;

import com.crafttree.dto.CategoryDto;
import com.crafttree.dto.UpdateCategoryRequest;
import com.crafttree.entity.AuditAction;
import com.crafttree.entity.Category;
import com.crafttree.entity.GameVersion;
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
    private final GameVersionService gameVersionService;
    private final AuditService auditService;

    /** Berilgan (yoki joriy) versiyaning kategoriyalari. */
    @Transactional(readOnly = true)
    public List<CategoryDto> getAll(String version) {
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        return categoryRepository.findByGameVersionIdOrderBySortOrderAsc(gv.getId()).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDto getById(Long id) {
        return toDto(categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found: " + id)));
    }

    /** Kategoriya DOIM bitta versiyada yaratiladi — kod shu versiya ichida noyob. */
    @Transactional
    public CategoryDto create(UpdateCategoryRequest request, String version) {
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        String code = request.getCode() == null ? "" : request.getCode().trim().toUpperCase();
        if (code.isEmpty()) {
            throw new IllegalArgumentException("Kategoriya kodi bo'sh bo'lishi mumkin emas");
        }
        if (categoryRepository.existsByCodeAndGameVersionId(code, gv.getId())) {
            throw new IllegalArgumentException(
                    code + " kodli kategoriya " + gv.getVersion() + " versiyasida allaqachon bor");
        }
        Category category = Category.builder()
                .gameVersion(gv)
                .code(code)
                .nameRu(request.getNameRu())
                .nameUz(request.getNameUz())
                .nameEn(request.getNameEn())
                .nameUzCyr(request.getNameUzCyr())
                .color(request.getColor())
                .icon(request.getIcon())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();
        Category saved = categoryRepository.save(category);
        auditService.log(AuditAction.CREATE, "CATEGORY", saved.getId(), saved.getCode());
        return toDto(saved);
    }

    @Transactional
    public CategoryDto update(Long id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found: " + id));

        if (request.getCode() != null) {
            String newCode = request.getCode().trim().toUpperCase();
            if (!newCode.equals(category.getCode())
                    && categoryRepository.existsByCodeAndGameVersionId(
                            newCode, category.getGameVersion().getId())) {
                throw new IllegalArgumentException(newCode
                        + " kodli kategoriya bu versiyada allaqachon bor");
            }
            category.setCode(newCode);
        }
        if (request.getNameRu() != null) category.setNameRu(request.getNameRu());
        if (request.getNameUz() != null) category.setNameUz(request.getNameUz());
        if (request.getNameEn() != null) category.setNameEn(request.getNameEn());
        if (request.getNameUzCyr() != null) category.setNameUzCyr(request.getNameUzCyr());
        if (request.getColor() != null) category.setColor(request.getColor());
        if (request.getIcon() != null) category.setIcon(request.getIcon());
        if (request.getSortOrder() != null) category.setSortOrder(request.getSortOrder());

        categoryRepository.save(category);
        auditService.log(AuditAction.UPDATE, "CATEGORY", category.getId(), category.getCode());
        return toDto(category);
    }

    @Transactional
    public void delete(Long id) {
        categoryRepository.deleteById(id);
        auditService.log(AuditAction.DELETE, "CATEGORY", id, "Kategoriya #" + id + " o'chirildi");
    }

    private CategoryDto toDto(Category c) {
        return CategoryDto.builder()
                .id(c.getId())
                .version(c.getGameVersion() != null ? c.getGameVersion().getVersion() : null)
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
