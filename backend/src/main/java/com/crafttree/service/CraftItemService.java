package com.crafttree.service;

import com.crafttree.dto.*;
import com.crafttree.entity.AuditAction;
import com.crafttree.entity.Category;
import com.crafttree.entity.CraftItem;
import com.crafttree.entity.GameVersion;
import com.crafttree.entity.Recipe;
import com.crafttree.entity.RecipeIngredient;
import com.crafttree.exception.ItemNotFoundException;
import com.crafttree.repository.CategoryRepository;
import com.crafttree.repository.CraftItemRepository;
import com.crafttree.repository.CraftLogRepository;
import com.crafttree.repository.FavoriteRepository;
import com.crafttree.repository.InventoryRepository;
import com.crafttree.repository.RecipeIngredientRepository;
import com.crafttree.repository.RecipeRepository;
import com.crafttree.repository.TagRepository;
import com.crafttree.util.ItemKeys;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CraftItemService {

    private final CraftItemRepository craftItemRepository;
    private final CategoryRepository categoryRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final RecipeRepository recipeRepository;
    private final GameVersionService gameVersionService;
    private final TagRepository tagRepository;
    private final FavoriteRepository favoriteRepository;
    private final InventoryRepository inventoryRepository;
    private final CraftLogRepository craftLogRepository;
    private final AuditService auditService;

    @Cacheable("categories")
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAllByOrderBySortOrderAsc().stream()
                .map(c -> CategoryDto.builder()
                        .id(c.getId())
                        .code(c.getCode())
                        .nameRu(c.getNameRu())
                        .nameUz(c.getNameUz())
                        .nameEn(c.getNameEn())
                        .nameUzCyr(c.getNameUzCyr())
                        .color(c.getColor())
                        .icon(c.getIcon())
                        .sortOrder(c.getSortOrder())
                        .build())
                .collect(Collectors.toList());
    }

    public List<CraftItemDto> getAllItems(String categoryCode, String version) {
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        List<CraftItem> items = (categoryCode != null && !categoryCode.isBlank())
                ? craftItemRepository.findByCategoryCodeAndVersion(categoryCode.toUpperCase(), gv.getId())
                : craftItemRepository.findAllByVersion(gv.getId());
        return items.stream().map(this::toDto).collect(Collectors.toList());
    }

    public CraftItemDto getItemById(Long id) {
        return getItemById(id, null);
    }

    public CraftItemDto getItemById(Long id, String version) {
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        return toDtoWithIngredients(resolveInVersion(id, gv), gv);
    }

    public List<CraftItemDto> searchItems(String query, String version) {
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        return craftItemRepository.searchByNameAndVersion(query, gv.getId()).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Itemni so'ralgan versiyada topadi.
     * <p>
     * Berilgan {@code id} boshqa versiyaga tegishli bo'lsa, o'sha itemning shu
     * versiyadagi nusxasi {@code item_key} orqali qidiriladi — shu tufayli
     * foydalanuvchi versiyani almashtirganda havola buzilmaydi. Item bu versiyada
     * umuman mavjud bo'lmasa (masalan, hali nusxa olinmagan) — 404.
     */
    /**
     * Berilgan id'dagi itemning <b>so'ralgan versiyadagi</b> nusxasini qaytaradi.
     * Id boshqa versiyaga tegishli bo'lsa, {@code itemKey} orqali mos nusxa topiladi —
     * shu tufayli foydalanuvchi versiyani almashtirganda havolalar buzilmaydi.
     */
    public CraftItem resolveInVersion(Long id, GameVersion gv) {
        CraftItem item = craftItemRepository.findById(id)
                .orElseThrow(() -> new ItemNotFoundException(id));
        if (item.getGameVersion().getId().equals(gv.getId())) {
            return item;
        }
        return craftItemRepository.findByItemKeyAndGameVersionId(item.getItemKey(), gv.getId())
                .orElseThrow(() -> new ItemNotFoundException(id));
    }

    // -- Yaratish ------------------------------------------------------------

    /**
     * Yangi item yaratadi. Item DOIM bitta versiyaga tegishli, shuning uchun joriy
     * (yoki so'ralgan) versiyada yaratiladi va {@code item_key} nomdan hosil qilinadi.
     */
    @Transactional
    public CraftItemDto createItem(CreateItemRequest request, String version) {
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        Category category = resolveCategory(request.getCategoryId(), request.getCategoryCode());

        String name = request.getName() == null ? "" : request.getName().trim();
        if (name.isEmpty()) {
            throw new IllegalArgumentException("Nom bo'sh bo'lishi mumkin emas");
        }
        if (craftItemRepository.existsByNameIgnoreCaseAndGameVersionId(name, gv.getId())) {
            throw new IllegalArgumentException(
                    name + " nomli item " + gv.getVersion() + " versiyasida allaqachon bor");
        }

        CraftItem item = buildItem(request, name, category, gv);
        applyTags(item, request.getTagIds());
        craftItemRepository.save(item);
        auditService.log(AuditAction.CREATE, "ITEM", item.getId(),
                item.getName() + " (" + gv.getVersion() + ")");
        return toDtoWithIngredients(item, gv);
    }

    /**
     * Bir necha itemni birdaniga yaratadi.
     * <p>
     * {@code dryRun} rejimida hech narsa yozilmaydi — foydalanuvchi avval natijani ko'radi.
     * Xato qatorlar butun amalni to'xtatmaydi: ular sababi bilan belgilanadi, qolganlari
     * qo'shiladi. 50 qatorli ro'yxatda bitta xato tufayli hammasini rad etish foydasiz.
     */
    @Transactional
    public BulkCreateResultDto createItemsBulk(BulkCreateItemsRequest request,
                                               boolean dryRun, String version) {
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        List<CreateItemRequest> rows = request.getItems() == null ? List.of() : request.getItems();

        // Shu chaqiruv ichidagi takrorlarni ham ushlaymiz (dryRun'da bazaga yozilmaydi).
        Set<String> seenNames = new HashSet<>();
        List<BulkCreateResultDto.Row> report = new ArrayList<>();
        int willCreate = 0;
        int duplicates = 0;
        int invalid = 0;

        for (int i = 0; i < rows.size(); i++) {
            CreateItemRequest row = rows.get(i);
            int line = i + 1;
            String name = row.getName() == null ? "" : row.getName().trim();
            String code = row.getCategoryCode() != null && !row.getCategoryCode().isBlank()
                    ? row.getCategoryCode().trim()
                    : request.getDefaultCategoryCode();

            if (name.isEmpty()) {
                report.add(new BulkCreateResultDto.Row(line, name, code,
                        BulkCreateResultDto.Row.INVALID,
                        BulkCreateResultDto.Row.NAME_EMPTY, null));
                invalid++;
                continue;
            }
            if (name.length() > 100) {
                report.add(new BulkCreateResultDto.Row(line, name, code,
                        BulkCreateResultDto.Row.INVALID,
                        BulkCreateResultDto.Row.NAME_TOO_LONG, null));
                invalid++;
                continue;
            }

            Category category;
            if (row.getCategoryId() == null && (code == null || code.isBlank())) {
                report.add(new BulkCreateResultDto.Row(line, name, code,
                        BulkCreateResultDto.Row.INVALID,
                        BulkCreateResultDto.Row.CATEGORY_MISSING, null));
                invalid++;
                continue;
            }
            try {
                category = resolveCategory(row.getCategoryId(), code);
            } catch (IllegalArgumentException e) {
                report.add(new BulkCreateResultDto.Row(line, name, code,
                        BulkCreateResultDto.Row.INVALID,
                        BulkCreateResultDto.Row.CATEGORY_UNKNOWN, code));
                invalid++;
                continue;
            }

            String dedupKey = name.toLowerCase(Locale.ROOT);
            boolean existsInDb =
                    craftItemRepository.existsByNameIgnoreCaseAndGameVersionId(name, gv.getId());
            if (existsInDb || !seenNames.add(dedupKey)) {
                report.add(new BulkCreateResultDto.Row(line, name, code,
                        BulkCreateResultDto.Row.DUPLICATE,
                        existsInDb ? BulkCreateResultDto.Row.EXISTS
                                   : BulkCreateResultDto.Row.DUP_IN_LIST, null));
                duplicates++;
                continue;
            }

            if (!dryRun) {
                CraftItem item = buildItem(row, name, category, gv);
                applyTags(item, row.getTagIds());
                craftItemRepository.save(item);
            }
            report.add(new BulkCreateResultDto.Row(line, name, category.getCode(),
                    BulkCreateResultDto.Row.NEW, null, null));
            willCreate++;
        }

        if (!dryRun && willCreate > 0) {
            auditService.log(AuditAction.CREATE, "ITEM", null,
                    willCreate + " ta item ommaviy qoshildi (" + gv.getVersion() + ")");
        }
        return new BulkCreateResultDto(dryRun, gv.getVersion(), willCreate, duplicates, invalid, report);
    }

    private CraftItem buildItem(CreateItemRequest src, String name, Category category, GameVersion gv) {
        // Tarjima bo'sh bo'lsa null qoldiriladi — UI o'zi asosiy nomga qaytadi.
        // Bo'sh satrni yozib qo'yish "tarjima bor" degan yolg'on taassurot berardi.
        return CraftItem.builder()
                .name(name)
                .nameUz(blankToNull(src.getNameUz()))
                .nameEn(blankToNull(src.getNameEn()))
                .nameUzCyr(blankToNull(src.getNameUzCyr()))
                .description(blankToNull(src.getDescription()))
                .descriptionUz(blankToNull(src.getDescriptionUz()))
                .descriptionEn(blankToNull(src.getDescriptionEn()))
                .descriptionUzCyr(blankToNull(src.getDescriptionUzCyr()))
                .category(category)
                .gameVersion(gv)
                .craftTimeSeconds(src.getCraftTimeSeconds() == null ? 0 : src.getCraftTimeSeconds())
                // Kalit lotin harflardan tuziladi; ruscha nomdan slug chiqmasa inglizcha
                // nomga tayanamiz, u ham bo'lmasa ItemKeys "item" ga qaytadi.
                .itemKey(ItemKeys.unique(
                        blankToNull(src.getNameEn()) != null ? src.getNameEn() : name,
                        k -> craftItemRepository.existsByItemKeyAndGameVersionId(k, gv.getId())))
                .build();
    }

    private void applyTags(CraftItem item, List<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return;
        }
        item.setTags(new HashSet<>(tagRepository.findAllById(tagIds)));
    }

    private Category resolveCategory(Long id, String code) {
        if (id != null) {
            return categoryRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Kategoriya topilmadi: " + id));
        }
        if (code != null && !code.isBlank()) {
            return categoryRepository.findByCode(code.trim().toUpperCase(Locale.ROOT))
                    .orElseThrow(() -> new IllegalArgumentException("Kategoriya kodi nomalum: " + code));
        }
        throw new IllegalArgumentException("Kategoriya korsatilmagan");
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }


    // -- O'chirish -----------------------------------------------------------

    /**
     * Itemlarni o'chiradi.
     * <p>
     * <b>Ingredient sifatida ishlatilayotgan item o'chirilmaydi</b> — u ketsa boshqa
     * itemning retsepti chala qolardi. Bunday qatorlar sababi bilan belgilanadi,
     * qolganlari o'chiriladi.
     * <p>
     * O'chirish bilan birga itemning o'z retsepti, teglari, sevimlilardagi va
     * inventardagi yozuvlari, kraft tarixi ham ketadi (DB'da ON DELETE CASCADE).
     * Shuning uchun {@code dryRun} hisobotida ularning soni ham ko'rsatiladi:
     * qaytarib bo'lmaydigan amalning ko'lami oldindan ko'rinsin.
     */
    @Transactional
    public DeleteItemsResultDto deleteItems(List<Long> itemIds, boolean dryRun, String version) {
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        List<Long> ids = itemIds == null ? List.of() : itemIds;

        List<DeleteItemsResultDto.Row> rows = new ArrayList<>();
        int deleted = 0;
        int blocked = 0;

        for (Long id : ids) {
            CraftItem item = craftItemRepository.findById(id).orElse(null);
            if (item == null) {
                continue; // allaqachon yo'q — jimgina o'tkazamiz, takror so'rov xato bermasin
            }

            List<String> usedIn = recipeIngredientRepository
                    .findByIngredientItemIdAndGameVersionId(id, item.getGameVersion().getId())
                    .stream()
                    .map(ri -> ri.getRecipe().getResultItem().getName())
                    .distinct()
                    .toList();

            long favorites = favoriteRepository.countByItemId(id);
            long inventory = inventoryRepository.countByItemId(id);
            long craftLogs = craftLogRepository.countByResultItemId(id);
            Optional<Recipe> ownRecipeOpt = recipeRepository
                    .findByResultItemIdAndGameVersionId(id, item.getGameVersion().getId());
            boolean ownRecipe = ownRecipeOpt.isPresent();

            if (!usedIn.isEmpty()) {
                rows.add(new DeleteItemsResultDto.Row(id, item.getName(),
                        DeleteItemsResultDto.Row.BLOCKED, usedIn,
                        favorites, inventory, craftLogs, ownRecipe));
                blocked++;
                continue;
            }

            if (!dryRun) {
                // Retseptni ALOHIDA o'chiramiz. DB'da ON DELETE CASCADE bor, lekin Hibernate
                // undan bexabar: sessiyada yuklangan retsept o'chirilgan itemga ishora qilib
                // qolib, flush paytida TransientObjectException beradi.
                ownRecipeOpt.ifPresent(recipeRepository::delete);
                craftItemRepository.delete(item);
            }
            rows.add(new DeleteItemsResultDto.Row(id, item.getName(),
                    DeleteItemsResultDto.Row.DELETABLE, List.of(),
                    favorites, inventory, craftLogs, ownRecipe));
            deleted++;
        }

        if (!dryRun && deleted > 0) {
            auditService.log(AuditAction.DELETE, "ITEM", null,
                    deleted + " ta item o'chirildi (" + gv.getVersion() + ")");
        }
        return new DeleteItemsResultDto(dryRun, gv.getVersion(), deleted, blocked, rows);
    }

    @Transactional
    public CraftItemDto updateItem(Long id, UpdateItemRequest request) {
        CraftItem item = craftItemRepository.findById(id)
                .orElseThrow(() -> new ItemNotFoundException(id));

        if (request.getCategoryId() != null) {
            item.setCategory(categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found: " + request.getCategoryId())));
        }
        if (request.getName() != null) item.setName(request.getName());
        if (request.getNameUz() != null) item.setNameUz(request.getNameUz());
        if (request.getNameEn() != null) item.setNameEn(request.getNameEn());
        if (request.getNameUzCyr() != null) item.setNameUzCyr(request.getNameUzCyr());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getDescriptionUz() != null) item.setDescriptionUz(request.getDescriptionUz());
        if (request.getDescriptionEn() != null) item.setDescriptionEn(request.getDescriptionEn());
        if (request.getDescriptionUzCyr() != null) item.setDescriptionUzCyr(request.getDescriptionUzCyr());

        item.setUpdatedAt(java.time.LocalDateTime.now());
        craftItemRepository.save(item);
        auditService.log(AuditAction.UPDATE, "ITEM", item.getId(), item.getName());

        return toDtoWithIngredients(item, gameVersionService.getCurrent());
    }

    public List<UsedInDto> getUsedIn(Long itemId, String version) {
        if (!craftItemRepository.existsById(itemId)) {
            throw new ItemNotFoundException(itemId);
        }
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        return recipeIngredientRepository
                .findByIngredientItemIdAndGameVersionId(itemId, gv.getId())
                .stream()
                .map(ri -> {
                    CraftItem result = ri.getRecipe().getResultItem();
                    return UsedInDto.builder()
                            .itemId(result.getId())
                            .itemName(result.getName())
                            .itemNameUz(result.getNameUz())
                            .itemNameEn(result.getNameEn())
                            .itemNameUzCyr(result.getNameUzCyr())
                            .categoryCode(result.getCategory().getCode())
                            .imageUrl(result.getImageUrl())
                            .quantity(ri.getQuantity())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /** Itemni to'liq DTO'ga aylantiradi (kategoriya + teglar bilan). Boshqa servislar ham ishlatadi. */
    public CraftItemDto toDto(CraftItem item) {
        return CraftItemDto.builder()
                .id(item.getId())
                .name(item.getName())
                .nameUz(item.getNameUz())
                .nameEn(item.getNameEn())
                .nameUzCyr(item.getNameUzCyr())
                .description(item.getDescription())
                .descriptionUz(item.getDescriptionUz())
                .descriptionEn(item.getDescriptionEn())
                .descriptionUzCyr(item.getDescriptionUzCyr())
                .categoryCode(item.getCategory().getCode())
                .categoryNameRu(item.getCategory().getNameRu())
                .categoryNameUz(item.getCategory().getNameUz())
                .categoryNameEn(item.getCategory().getNameEn())
                .categoryNameUzCyr(item.getCategory().getNameUzCyr())
                .craftTimeSeconds(item.getCraftTimeSeconds())
                .imageUrl(item.getImageUrl())
                .tags(item.getTags().stream()
                        .map(tag -> TagDto.builder()
                                .id(tag.getId())
                                .code(tag.getCode())
                                .nameRu(tag.getNameRu())
                                .nameUz(tag.getNameUz())
                                .nameEn(tag.getNameEn())
                                .nameUzCyr(tag.getNameUzCyr())
                                .color(tag.getColor())
                                .sortOrder(tag.getSortOrder())
                                .build())
                        .sorted((a, b) -> (a.getSortOrder() != null ? a.getSortOrder() : 0) - (b.getSortOrder() != null ? b.getSortOrder() : 0))
                        .collect(Collectors.toList()))
                .build();
    }

    private CraftItemDto toDtoWithIngredients(CraftItem item, GameVersion gv) {
        Optional<Recipe> recipeOpt = recipeRepository.findByResultItemIdAndGameVersionId(item.getId(), gv.getId());
        List<RecipeIngredientDto> ingredientDtos = recipeOpt.map(r -> r.getIngredients().stream()
                        .map(ri -> RecipeIngredientDto.builder()
                                .ingredientItemId(ri.getIngredientItem().getId())
                                .ingredientName(ri.getIngredientItem().getName())
                                .ingredientNameUz(ri.getIngredientItem().getNameUz())
                                .ingredientNameEn(ri.getIngredientItem().getNameEn())
                                .ingredientNameUzCyr(ri.getIngredientItem().getNameUzCyr())
                                .ingredientCategory(ri.getIngredientItem().getCategory().getCode())
                                .ingredientImageUrl(ri.getIngredientItem().getImageUrl())
                                .quantity(ri.getQuantity())
                                .build())
                        .collect(Collectors.toList()))
                .orElseGet(java.util.Collections::emptyList);

        CraftItemDto dto = toDto(item);
        dto.setIngredients(ingredientDtos);
        // Item's effective craft time for this version: prefer recipe's, fall back to item's own.
        Integer effectiveCraftTime = recipeOpt.map(Recipe::getCraftTimeSeconds).orElse(item.getCraftTimeSeconds());
        dto.setCraftTimeSeconds(effectiveCraftTime);
        return dto;
    }
}
