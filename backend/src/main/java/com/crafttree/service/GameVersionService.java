package com.crafttree.service;

import com.crafttree.entity.GameVersion;
import com.crafttree.exception.ItemNotFoundException;
import com.crafttree.repository.GameVersionRepository;
import com.crafttree.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GameVersionService {

    private final GameVersionRepository gameVersionRepository;
    private final RecipeRepository recipeRepository;

    @Transactional(readOnly = true)
    public List<GameVersion> findAll() {
        return gameVersionRepository.findAllByOrderByReleasedAtDesc();
    }

    @Transactional(readOnly = true)
    public GameVersion getCurrent() {
        return gameVersionRepository.findFirstByIsCurrentTrue()
                .orElseThrow(() -> new IllegalStateException(
                        "No current GameVersion configured — at least one row with is_current=true is required"));
    }

    /**
     * Resolve a version by string ("5.7.0") or, if blank/null, return the current one.
     */
    @Transactional(readOnly = true)
    public GameVersion resolveOrCurrent(String version) {
        if (version == null || version.isBlank()) {
            return getCurrent();
        }
        return gameVersionRepository.findByVersion(version)
                .orElseThrow(() -> new IllegalArgumentException("Unknown game version: " + version));
    }

    @Transactional(readOnly = true)
    public GameVersion findById(Long id) {
        return gameVersionRepository.findById(id)
                .orElseThrow(() -> new ItemNotFoundException(id));
    }

    @Transactional
    public GameVersion create(String version, LocalDateTime releasedAt, String notes, boolean makeCurrent) {
        if (gameVersionRepository.existsByVersion(version)) {
            throw new IllegalArgumentException("Game version already exists: " + version);
        }
        if (makeCurrent) {
            gameVersionRepository.clearAllCurrent();
        }
        GameVersion gv = GameVersion.builder()
                .version(version)
                .releasedAt(releasedAt != null ? releasedAt : LocalDateTime.now())
                .notes(notes)
                .isCurrent(makeCurrent)
                .build();
        return gameVersionRepository.save(gv);
    }

    @Transactional
    public GameVersion update(Long id, String version, LocalDateTime releasedAt, String notes) {
        GameVersion gv = findById(id);
        if (version != null && !version.equals(gv.getVersion())) {
            if (gameVersionRepository.existsByVersion(version)) {
                throw new IllegalArgumentException("Game version already exists: " + version);
            }
            gv.setVersion(version);
        }
        if (releasedAt != null) gv.setReleasedAt(releasedAt);
        if (notes != null) gv.setNotes(notes);
        return gameVersionRepository.save(gv);
    }

    @Transactional
    public GameVersion setCurrent(Long id) {
        GameVersion gv = findById(id);
        gameVersionRepository.clearAllCurrent();
        gv.setIsCurrent(true);
        return gameVersionRepository.save(gv);
    }

    @Transactional
    public void delete(Long id) {
        GameVersion gv = findById(id);
        if (Boolean.TRUE.equals(gv.getIsCurrent())) {
            throw new IllegalStateException("Cannot delete the current game version. Promote another one first.");
        }
        if (recipeRepository.existsByGameVersionId(id)) {
            throw new IllegalStateException("Cannot delete game version with existing recipes. Remove recipes first.");
        }
        gameVersionRepository.delete(gv);
    }
}
