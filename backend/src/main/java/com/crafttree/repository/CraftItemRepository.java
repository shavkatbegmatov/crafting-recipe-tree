package com.crafttree.repository;

import com.crafttree.entity.CraftItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Itemlar <b>versiyaga bog'langan</b>: deyarli har bir so'rov {@code versionId} talab qiladi.
 * Versiyasiz variantlar ataylab qoldirilmagan — global ro'yxat kutilmagan versiyadagi
 * itemlarni aralashtirib yuborardi.
 */
public interface CraftItemRepository extends JpaRepository<CraftItem, Long> {

    @Query("SELECT ci FROM CraftItem ci WHERE ci.gameVersion.id = :versionId "
            + "ORDER BY ci.category.id ASC, ci.name ASC")
    List<CraftItem> findAllByVersion(@Param("versionId") Long versionId);

    @Query("SELECT ci FROM CraftItem ci WHERE ci.gameVersion.id = :versionId "
            + "AND ci.category.code = :code ORDER BY ci.name")
    List<CraftItem> findByCategoryCodeAndVersion(@Param("code") String code,
                                                 @Param("versionId") Long versionId);

    @Query("SELECT ci FROM CraftItem ci WHERE ci.gameVersion.id = :versionId AND ("
            + "LOWER(ci.name) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(ci.nameUz) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(ci.nameEn) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(ci.nameUzCyr) LIKE LOWER(CONCAT('%', :query, '%'))) "
            + "ORDER BY ci.name")
    List<CraftItem> searchByNameAndVersion(@Param("query") String query,
                                           @Param("versionId") Long versionId);

    /** Kategoriya kodi bo'yicha itemlar soni (admin statistikasi / grafik uchun). */
    @Query("SELECT ci.category.code, COUNT(ci) FROM CraftItem ci "
            + "WHERE ci.gameVersion.id = :versionId "
            + "GROUP BY ci.category.code ORDER BY COUNT(ci) DESC")
    List<Object[]> countByCategoryAndVersion(@Param("versionId") Long versionId);

    /**
     * Versiyalararo bog'lovchi: shu kalitli itemning berilgan versiyadagi nusxasi.
     * Foydalanuvchi versiyani almashtirganda o'sha itemga olib o'tish uchun.
     */
    Optional<CraftItem> findByItemKeyAndGameVersionId(String itemKey, Long versionId);

    boolean existsByItemKeyAndGameVersionId(String itemKey, Long versionId);

    /** Nusxa olishda manba versiyaning butun to'plami. */
    List<CraftItem> findAllByGameVersionId(Long versionId);

    long countByGameVersionId(Long versionId);
}
