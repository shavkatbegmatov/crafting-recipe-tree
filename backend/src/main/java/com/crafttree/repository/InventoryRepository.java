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

    /** Foydalanuvchi inventari yengil DTO sifatida (item ma'lumotini yuklamaydi). */
    @Query("SELECT new com.crafttree.dto.InventoryEntryDto(i.item.id, i.quantity) "
            + "FROM InventoryItem i WHERE i.user = :user ORDER BY i.id")
    List<InventoryEntryDto> findEntriesByUser(@Param("user") User user);

    @Modifying
    @Query("DELETE FROM InventoryItem i WHERE i.user = :user")
    void deleteByUser(@Param("user") User user);
}
