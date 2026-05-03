package com.crafttree.repository;

import com.crafttree.entity.GameVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GameVersionRepository extends JpaRepository<GameVersion, Long> {

    Optional<GameVersion> findByVersion(String version);

    Optional<GameVersion> findFirstByIsCurrentTrue();

    List<GameVersion> findAllByOrderByReleasedAtDesc();

    boolean existsByVersion(String version);

    /**
     * Atomically clear is_current flag from all rows. Used before promoting another version.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE GameVersion gv SET gv.isCurrent = false WHERE gv.isCurrent = true")
    int clearAllCurrent();

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE GameVersion gv SET gv.isCurrent = true WHERE gv.id = :id")
    int markCurrent(@Param("id") Long id);
}
