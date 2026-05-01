package com.crafttree.service.portage;

import com.crafttree.dto.portage.ExportCategoryDto;
import com.crafttree.dto.portage.ExportItemDto;
import com.crafttree.dto.portage.ExportManifestDto;
import com.crafttree.dto.portage.ExportPackageDto;
import com.crafttree.dto.portage.ExportTagDto;
import com.crafttree.dto.portage.ImportOptionsDto;
import com.crafttree.dto.portage.ImportReportDto;
import com.crafttree.dto.portage.ImportReportDto.Action;
import com.crafttree.dto.portage.ImportReportDto.RowDto;
import com.crafttree.dto.portage.ImportReportDto.SectionSummaryDto;
import com.crafttree.entity.Category;
import com.crafttree.entity.CraftItem;
import com.crafttree.entity.RecipeIngredient;
import com.crafttree.entity.Tag;
import com.crafttree.repository.CategoryRepository;
import com.crafttree.repository.CraftItemRepository;
import com.crafttree.repository.RecipeIngredientRepository;
import com.crafttree.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ImportService {

    private static final Logger log = LoggerFactory.getLogger(ImportService.class);

    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final CraftItemRepository craftItemRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final TransactionTemplate transactionTemplate;

    @Value("${app.uploads.path:uploads}")
    private String uploadsPath;

    public ImportReportDto run(ExportPackageDto pkg,
                               Map<String, byte[]> archiveImages,
                               ImportOptionsDto options) {

        boolean dryRun = options.isDryRun();
        ImportReportDto report = transactionTemplate.execute(status -> {
            ImportReportDto r = applyInternal(pkg, archiveImages, options);
            if (dryRun) status.setRollbackOnly();
            return r;
        });
        if (report != null) report.setDryRun(dryRun);
        return report;
    }

    private ImportReportDto applyInternal(ExportPackageDto pkg,
                                          Map<String, byte[]> archiveImages,
                                          ImportOptionsDto options) {
        ImportReportDto report = ImportReportDto.builder()
                .manifest(summary(pkg.getManifest(), archiveImages.size()))
                .build();

        Map<String, Category> existingCats = new HashMap<>();
        for (Category c : categoryRepository.findAll()) existingCats.put(c.getCode(), c);
        Map<String, Tag> existingTags = new HashMap<>();
        for (Tag t : tagRepository.findAll()) existingTags.put(t.getCode(), t);
        Map<String, CraftItem> existingItems = new HashMap<>();
        for (CraftItem i : craftItemRepository.findAll()) existingItems.put(i.getName(), i);

        report.setCategories(new SectionSummaryDto());
        report.setTags(new SectionSummaryDto());
        report.setItems(new SectionSummaryDto());
        report.setRecipes(new SectionSummaryDto());
        report.setImages(new SectionSummaryDto());

        for (ExportCategoryDto dto : pkg.getCategories()) {
            try {
                Category existing = existingCats.get(dto.getCode());
                Action action = upsertCategory(existing, dto, options.getConflictMode());
                applyToSummary(report.getCategories(), action);
                report.getCategoryRows().add(row(dto.getCode(), action, null));
                if (existing == null) existingCats.put(dto.getCode(), categoryRepository.findByCode(dto.getCode()).orElse(null));
            } catch (Exception ex) {
                log.warn("Category import failed for {}: {}", dto.getCode(), ex.getMessage());
                applyToSummary(report.getCategories(), Action.FAIL);
                report.getCategoryRows().add(row(dto.getCode(), Action.FAIL, ex.getMessage()));
                report.getErrors().add("category " + dto.getCode() + ": " + ex.getMessage());
            }
        }

        for (ExportTagDto dto : pkg.getTags()) {
            try {
                Tag existing = existingTags.get(dto.getCode());
                Action action = upsertTag(existing, dto, options.getConflictMode());
                applyToSummary(report.getTags(), action);
                report.getTagRows().add(row(dto.getCode(), action, null));
                if (existing == null) {
                    tagRepository.findAll().stream()
                            .filter(t -> dto.getCode().equals(t.getCode()))
                            .findFirst().ifPresent(t -> existingTags.put(t.getCode(), t));
                }
            } catch (Exception ex) {
                log.warn("Tag import failed for {}: {}", dto.getCode(), ex.getMessage());
                applyToSummary(report.getTags(), Action.FAIL);
                report.getTagRows().add(row(dto.getCode(), Action.FAIL, ex.getMessage()));
                report.getErrors().add("tag " + dto.getCode() + ": " + ex.getMessage());
            }
        }

        Path uploadsDir = Paths.get(uploadsPath).toAbsolutePath().normalize();
        if (options.isImportImages() && !options.isDryRun()) {
            try {
                Files.createDirectories(uploadsDir);
            } catch (IOException ex) {
                report.getWarnings().add("Cannot create uploads dir: " + ex.getMessage());
            }
        }

        Map<String, CraftItem> resolvedAfter = new HashMap<>(existingItems);
        for (ExportItemDto dto : pkg.getItems()) {
            try {
                CraftItem existing = existingItems.get(dto.getName());
                ItemUpsertResult res = upsertItem(existing, dto, options, archiveImages,
                        existingCats, existingTags, uploadsDir, report);
                applyToSummary(report.getItems(), res.action);
                report.getItemRows().add(row(dto.getName(), res.action, res.detail));
                if (res.entity != null) {
                    resolvedAfter.put(dto.getName(), res.entity);
                }
            } catch (Exception ex) {
                log.warn("Item import failed for {}: {}", dto.getName(), ex.getMessage());
                applyToSummary(report.getItems(), Action.FAIL);
                report.getItemRows().add(row(dto.getName(), Action.FAIL, ex.getMessage()));
                report.getErrors().add("item " + dto.getName() + ": " + ex.getMessage());
            }
        }

        for (ExportItemDto dto : pkg.getItems()) {
            try {
                CraftItem owner = resolvedAfter.get(dto.getName());
                if (owner == null) continue;
                int recipeWriteCount = upsertRecipe(owner, dto.getRecipe(),
                        resolvedAfter, options.getConflictMode(), report);
                report.getRecipes().setTotal(report.getRecipes().getTotal() + recipeWriteCount);
            } catch (Exception ex) {
                log.warn("Recipe import failed for {}: {}", dto.getName(), ex.getMessage());
                applyToSummary(report.getRecipes(), Action.FAIL);
                report.getErrors().add("recipe of " + dto.getName() + ": " + ex.getMessage());
            }
        }

        return report;
    }

    private Action upsertCategory(Category existing, ExportCategoryDto dto, ImportOptionsDto.ConflictMode mode) {
        if (existing == null) {
            Category c = Category.builder()
                    .code(dto.getCode())
                    .nameRu(orFallback(dto.getNameRu(), dto.getCode()))
                    .nameUz(orFallback(dto.getNameUz(), dto.getCode()))
                    .nameEn(dto.getNameEn())
                    .nameUzCyr(dto.getNameUzCyr())
                    .color(dto.getColor())
                    .icon(dto.getIcon())
                    .sortOrder(dto.getSortOrder())
                    .build();
            categoryRepository.save(c);
            return Action.CREATE;
        }
        if (mode == ImportOptionsDto.ConflictMode.SKIP) {
            return Action.SKIP;
        }
        boolean changed = false;
        changed |= setIfChanged(existing.getNameRu(), dto.getNameRu(), existing::setNameRu, mode);
        changed |= setIfChanged(existing.getNameUz(), dto.getNameUz(), existing::setNameUz, mode);
        changed |= setIfChanged(existing.getNameEn(), dto.getNameEn(), existing::setNameEn, mode);
        changed |= setIfChanged(existing.getNameUzCyr(), dto.getNameUzCyr(), existing::setNameUzCyr, mode);
        changed |= setIfChanged(existing.getColor(), dto.getColor(), existing::setColor, mode);
        changed |= setIfChanged(existing.getIcon(), dto.getIcon(), existing::setIcon, mode);
        if (mode == ImportOptionsDto.ConflictMode.REPLACE
                && !Objects.equals(existing.getSortOrder(), dto.getSortOrder())) {
            existing.setSortOrder(dto.getSortOrder());
            changed = true;
        } else if (existing.getSortOrder() == null && dto.getSortOrder() != null) {
            existing.setSortOrder(dto.getSortOrder());
            changed = true;
        }
        if (changed) {
            categoryRepository.save(existing);
            return mode == ImportOptionsDto.ConflictMode.REPLACE ? Action.REPLACE : Action.UPDATE;
        }
        return Action.UNCHANGED;
    }

    private Action upsertTag(Tag existing, ExportTagDto dto, ImportOptionsDto.ConflictMode mode) {
        if (existing == null) {
            Tag t = Tag.builder()
                    .code(dto.getCode())
                    .nameRu(orFallback(dto.getNameRu(), dto.getCode()))
                    .nameUz(dto.getNameUz())
                    .nameEn(dto.getNameEn())
                    .nameUzCyr(dto.getNameUzCyr())
                    .color(dto.getColor())
                    .sortOrder(dto.getSortOrder())
                    .build();
            tagRepository.save(t);
            return Action.CREATE;
        }
        if (mode == ImportOptionsDto.ConflictMode.SKIP) return Action.SKIP;
        boolean changed = false;
        changed |= setIfChanged(existing.getNameRu(), dto.getNameRu(), existing::setNameRu, mode);
        changed |= setIfChanged(existing.getNameUz(), dto.getNameUz(), existing::setNameUz, mode);
        changed |= setIfChanged(existing.getNameEn(), dto.getNameEn(), existing::setNameEn, mode);
        changed |= setIfChanged(existing.getNameUzCyr(), dto.getNameUzCyr(), existing::setNameUzCyr, mode);
        changed |= setIfChanged(existing.getColor(), dto.getColor(), existing::setColor, mode);
        if (mode == ImportOptionsDto.ConflictMode.REPLACE
                && !Objects.equals(existing.getSortOrder(), dto.getSortOrder())) {
            existing.setSortOrder(dto.getSortOrder());
            changed = true;
        } else if (existing.getSortOrder() == null && dto.getSortOrder() != null) {
            existing.setSortOrder(dto.getSortOrder());
            changed = true;
        }
        if (changed) {
            tagRepository.save(existing);
            return mode == ImportOptionsDto.ConflictMode.REPLACE ? Action.REPLACE : Action.UPDATE;
        }
        return Action.UNCHANGED;
    }

    private record ItemUpsertResult(Action action, CraftItem entity, String detail) {}

    private ItemUpsertResult upsertItem(CraftItem existing,
                                        ExportItemDto dto,
                                        ImportOptionsDto options,
                                        Map<String, byte[]> archiveImages,
                                        Map<String, Category> existingCats,
                                        Map<String, Tag> existingTags,
                                        Path uploadsDir,
                                        ImportReportDto report) {
        Category category = existingCats.get(dto.getCategoryCode());
        if (category == null) {
            return new ItemUpsertResult(Action.FAIL, null,
                    "category not found: " + dto.getCategoryCode());
        }
        Set<Tag> tagSet = new HashSet<>();
        if (dto.getTagCodes() != null) {
            for (String code : dto.getTagCodes()) {
                Tag t = existingTags.get(code);
                if (t != null) tagSet.add(t);
                else report.getWarnings().add("tag missing: " + code + " (item " + dto.getName() + ")");
            }
        }

        ImportOptionsDto.ConflictMode mode = options.getConflictMode();

        if (existing == null) {
            CraftItem c = CraftItem.builder()
                    .name(dto.getName())
                    .nameUz(dto.getNameUz())
                    .nameEn(dto.getNameEn())
                    .nameUzCyr(dto.getNameUzCyr())
                    .description(dto.getDescription())
                    .descriptionUz(dto.getDescriptionUz())
                    .descriptionEn(dto.getDescriptionEn())
                    .descriptionUzCyr(dto.getDescriptionUzCyr())
                    .category(category)
                    .craftTimeSeconds(dto.getCraftTimeSeconds())
                    .tags(tagSet)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            String imageNote = handleImage(c, dto, archiveImages, uploadsDir, options, report, true);
            CraftItem saved = craftItemRepository.save(c);
            return new ItemUpsertResult(Action.CREATE, saved, imageNote);
        }

        if (mode == ImportOptionsDto.ConflictMode.SKIP) {
            return new ItemUpsertResult(Action.SKIP, existing, null);
        }

        boolean changed = false;
        changed |= setIfChanged(existing.getNameUz(), dto.getNameUz(), existing::setNameUz, mode);
        changed |= setIfChanged(existing.getNameEn(), dto.getNameEn(), existing::setNameEn, mode);
        changed |= setIfChanged(existing.getNameUzCyr(), dto.getNameUzCyr(), existing::setNameUzCyr, mode);
        changed |= setIfChanged(existing.getDescription(), dto.getDescription(), existing::setDescription, mode);
        changed |= setIfChanged(existing.getDescriptionUz(), dto.getDescriptionUz(), existing::setDescriptionUz, mode);
        changed |= setIfChanged(existing.getDescriptionEn(), dto.getDescriptionEn(), existing::setDescriptionEn, mode);
        changed |= setIfChanged(existing.getDescriptionUzCyr(), dto.getDescriptionUzCyr(), existing::setDescriptionUzCyr, mode);

        if (!Objects.equals(existing.getCategory().getCode(), category.getCode())) {
            existing.setCategory(category);
            changed = true;
        }

        if (mode == ImportOptionsDto.ConflictMode.REPLACE) {
            if (!Objects.equals(existing.getCraftTimeSeconds(), dto.getCraftTimeSeconds())) {
                existing.setCraftTimeSeconds(dto.getCraftTimeSeconds());
                changed = true;
            }
        } else if (existing.getCraftTimeSeconds() == null && dto.getCraftTimeSeconds() != null) {
            existing.setCraftTimeSeconds(dto.getCraftTimeSeconds());
            changed = true;
        }

        if (mode == ImportOptionsDto.ConflictMode.REPLACE) {
            existing.setTags(tagSet);
            changed = true;
        } else {
            Set<Tag> merged = existing.getTags() == null ? new HashSet<>() : new HashSet<>(existing.getTags());
            if (merged.addAll(tagSet)) {
                existing.setTags(merged);
                changed = true;
            }
        }

        String imageNote = handleImage(existing, dto, archiveImages, uploadsDir, options, report, false);
        if (imageNote != null && !imageNote.isBlank()) changed = true;

        if (changed) {
            existing.setUpdatedAt(LocalDateTime.now());
            CraftItem saved = craftItemRepository.save(existing);
            return new ItemUpsertResult(
                    mode == ImportOptionsDto.ConflictMode.REPLACE ? Action.REPLACE : Action.UPDATE,
                    saved, imageNote);
        }
        return new ItemUpsertResult(Action.UNCHANGED, existing, null);
    }

    private String handleImage(CraftItem entity,
                               ExportItemDto dto,
                               Map<String, byte[]> archiveImages,
                               Path uploadsDir,
                               ImportOptionsDto options,
                               ImportReportDto report,
                               boolean isCreate) {
        String filename = dto.getImageFilename();
        if (filename == null || filename.isBlank()) {
            return null;
        }
        if (!options.isImportImages()) {
            applyToSummary(report.getImages(), Action.SKIP);
            report.getImageRows().add(row(filename, Action.SKIP, "import disabled"));
            return null;
        }

        Path target = uploadsDir.resolve(filename).normalize();
        if (!target.startsWith(uploadsDir)) {
            applyToSummary(report.getImages(), Action.FAIL);
            report.getImageRows().add(row(filename, Action.FAIL, "path traversal"));
            return null;
        }
        byte[] payload = archiveImages.get(filename);
        boolean diskExists = Files.isRegularFile(target);

        Action action;
        String detail = null;
        if (payload == null) {
            if (diskExists) {
                action = Action.UNCHANGED;
                detail = "kept existing file";
            } else {
                action = Action.FAIL;
                detail = "missing in archive and on disk";
                report.getWarnings().add(detail + ": " + filename);
            }
        } else {
            if (diskExists && !options.isOverwriteImages()) {
                action = Action.UNCHANGED;
                detail = "kept existing file (no overwrite)";
            } else {
                if (!options.isDryRun()) {
                    try {
                        Files.createDirectories(target.getParent());
                        Path tmp = target.resolveSibling(filename + ".part");
                        Files.write(tmp, payload);
                        Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING,
                                StandardCopyOption.ATOMIC_MOVE);
                    } catch (IOException ex) {
                        applyToSummary(report.getImages(), Action.FAIL);
                        report.getImageRows().add(row(filename, Action.FAIL, ex.getMessage()));
                        return null;
                    }
                }
                action = diskExists ? Action.REPLACE : Action.CREATE;
            }
        }
        applyToSummary(report.getImages(), action);
        report.getImageRows().add(row(filename, action, detail));

        String url = PortageImagePaths.urlOf(filename);
        if (!Objects.equals(entity.getImageUrl(), url)
                && (isCreate || options.getConflictMode() != ImportOptionsDto.ConflictMode.SKIP)) {
            entity.setImageUrl(url);
            return "image:" + filename;
        }
        return null;
    }

    private int upsertRecipe(CraftItem owner,
                             List<ExportItemDto.Recipe> rows,
                             Map<String, CraftItem> resolved,
                             ImportOptionsDto.ConflictMode mode,
                             ImportReportDto report) {
        if (rows == null) rows = List.of();
        List<RecipeIngredient> existing = recipeIngredientRepository.findByResultItemId(owner.getId());

        Map<String, RecipeIngredient> existingByName = new LinkedHashMap<>();
        for (RecipeIngredient ri : existing) {
            existingByName.put(ri.getIngredientItem().getName(), ri);
        }

        if (mode == ImportOptionsDto.ConflictMode.SKIP && !existing.isEmpty()) {
            applyToSummary(report.getRecipes(), Action.SKIP);
            return 0;
        }

        if (mode == ImportOptionsDto.ConflictMode.REPLACE) {
            recipeIngredientRepository.deleteAll(existing);
            existingByName.clear();
        }

        int writes = 0;
        Set<String> kept = new HashSet<>();
        for (ExportItemDto.Recipe r : rows) {
            CraftItem ing = resolved.get(r.getIngredientName());
            if (ing == null) {
                report.getWarnings().add("recipe of " + owner.getName()
                        + ": ingredient missing → " + r.getIngredientName());
                applyToSummary(report.getRecipes(), Action.FAIL);
                continue;
            }
            BigDecimal qty = r.getQuantity() == null ? BigDecimal.ZERO : r.getQuantity();

            RecipeIngredient existingRow = existingByName.get(ing.getName());
            if (existingRow == null) {
                RecipeIngredient ri = RecipeIngredient.builder()
                        .resultItem(owner)
                        .ingredientItem(ing)
                        .quantity(qty)
                        .build();
                recipeIngredientRepository.save(ri);
                applyToSummary(report.getRecipes(), Action.CREATE);
                writes++;
            } else if (!Objects.equals(existingRow.getQuantity(), qty)) {
                existingRow.setQuantity(qty);
                recipeIngredientRepository.save(existingRow);
                applyToSummary(report.getRecipes(), Action.UPDATE);
                writes++;
            } else {
                applyToSummary(report.getRecipes(), Action.UNCHANGED);
            }
            kept.add(ing.getName());
        }

        if (mode == ImportOptionsDto.ConflictMode.REPLACE) {
            for (String stale : new ArrayList<>(existingByName.keySet())) {
                if (!kept.contains(stale)) {
                    recipeIngredientRepository.delete(existingByName.get(stale));
                    applyToSummary(report.getRecipes(), Action.REPLACE);
                }
            }
        }
        return writes;
    }

    private static <T> boolean setIfChanged(T current, T incoming, java.util.function.Consumer<T> setter,
                                            ImportOptionsDto.ConflictMode mode) {
        if (incoming == null && mode != ImportOptionsDto.ConflictMode.REPLACE) return false;
        if (Objects.equals(current, incoming)) return false;
        if (mode == ImportOptionsDto.ConflictMode.UPDATE && incoming == null) return false;
        setter.accept(incoming);
        return true;
    }

    private static String orFallback(String v, String fallback) {
        return (v == null || v.isBlank()) ? fallback : v;
    }

    private static RowDto row(String identifier, Action action, String detail) {
        return RowDto.builder().identifier(identifier).action(action).detail(detail).build();
    }

    private static void applyToSummary(SectionSummaryDto s, Action action) {
        s.setTotal(s.getTotal() + 1);
        switch (action) {
            case CREATE -> s.setCreated(s.getCreated() + 1);
            case UPDATE, REPLACE -> s.setUpdated(s.getUpdated() + 1);
            case UNCHANGED -> s.setUnchanged(s.getUnchanged() + 1);
            case SKIP -> s.setSkipped(s.getSkipped() + 1);
            case FAIL -> s.setFailed(s.getFailed() + 1);
        }
    }

    private static ImportReportDto.ImportManifestSummaryDto summary(ExportManifestDto m, int imagesInArchive) {
        if (m == null) return null;
        return ImportReportDto.ImportManifestSummaryDto.builder()
                .formatVersion(m.getFormatVersion())
                .generator(m.getGenerator())
                .exportedAt(m.getExportedAt() == null ? null : m.getExportedAt().toString())
                .selection(m.getSelection())
                .categoriesCount(m.getCategoriesCount())
                .tagsCount(m.getTagsCount())
                .itemsCount(m.getItemsCount())
                .recipeRowsCount(m.getRecipeRowsCount())
                .imagesCount(imagesInArchive)
                .build();
    }
}
