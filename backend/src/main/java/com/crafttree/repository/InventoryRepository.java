package com.crafttree.repository;

import com.crafttree.dto.InventoryEntryDto;
import com.crafttree.entity.InventoryItem;
import com.crafttree.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InventoryRepository extends JpaRepository<InventoryItem, Long> {

    /**
     * Foydalanuvchi inventari yengil DTO sifatida (item ma'lumotini yuklamaydi).
     * <p>
     * Itemlar versiyaga bog'langani uchun inventar ham versiya bo'yicha ajratiladi:
     * har versiyaning o'z item qatorlari bor, ularni aralashtirib bo'lmaydi.
     */
    @Query("SELECT new com.crafttree.dto.InventoryEntryDto(i.item.id, i.quantity) "
            + "FROM InventoryItem i WHERE i.user = :user AND i.item.gameVersion.id = :versionId "
            + "ORDER BY i.id")
    List<InventoryEntryDto> findEntriesByUserAndVersion(@Param("user") User user,
                                                        @Param("versionId") Long versionId);

    /**
     * Faqat berilgan versiyaning yozuvlarini o'chiradi.
     * Muhim: butun inventarni o'chirish boshqa versiyalardagi ma'lumotni yo'q qilardi.
     */
    @Modifying
    @Query("DELETE FROM InventoryItem i WHERE i.user = :user AND i.item.id IN "
            + "(SELECT ci.id FROM CraftItem ci WHERE ci.gameVersion.id = :versionId)")
    void deleteByUserAndVersion(@Param("user") User user, @Param("versionId") Long versionId);
}
