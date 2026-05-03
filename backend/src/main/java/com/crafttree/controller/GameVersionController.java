package com.crafttree.controller;

import com.crafttree.dto.GameVersionDto;
import com.crafttree.entity.GameVersion;
import com.crafttree.service.GameVersionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/game-versions")
@RequiredArgsConstructor
@Tag(name = "Game Versions", description = "Manage in-game versions used to scope recipes")
public class GameVersionController {

    private final GameVersionService gameVersionService;

    @GetMapping
    @Operation(summary = "List all game versions, newest first")
    public List<GameVersionDto> list() {
        return gameVersionService.findAll().stream().map(GameVersionDto::from).toList();
    }

    @GetMapping("/current")
    @Operation(summary = "Return the currently active game version")
    public GameVersionDto current() {
        return GameVersionDto.from(gameVersionService.getCurrent());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new game version (admin only)")
    public GameVersionDto create(@RequestBody CreateRequest request) {
        GameVersion gv = gameVersionService.create(
                request.version(),
                request.releasedAt(),
                request.notes(),
                Boolean.TRUE.equals(request.makeCurrent())
        );
        return GameVersionDto.from(gv);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update version metadata (admin only)")
    public GameVersionDto update(@PathVariable Long id, @RequestBody UpdateRequest request) {
        GameVersion gv = gameVersionService.update(id, request.version(), request.releasedAt(), request.notes());
        return GameVersionDto.from(gv);
    }

    @PostMapping("/{id}/set-current")
    @Operation(summary = "Promote a version to current (admin only)")
    public GameVersionDto setCurrent(@PathVariable Long id) {
        return GameVersionDto.from(gameVersionService.setCurrent(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a non-current version with no recipes (admin only)")
    public Map<String, Object> delete(@PathVariable Long id) {
        gameVersionService.delete(id);
        return Map.of("ok", true, "id", id);
    }

    public record CreateRequest(String version, LocalDateTime releasedAt, String notes, Boolean makeCurrent) {}
    public record UpdateRequest(String version, LocalDateTime releasedAt, String notes) {}
}
