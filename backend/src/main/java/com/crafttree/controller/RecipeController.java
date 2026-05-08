package com.crafttree.controller;

import com.crafttree.dto.CopyTreeReportDto;
import com.crafttree.dto.RecipeDto;
import com.crafttree.service.ConflictPolicy;
import com.crafttree.service.RecipeService;
import com.crafttree.service.RecipeService.UpsertRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items/{id}")
@RequiredArgsConstructor
@Tag(name = "Recipes", description = "Versioned recipe CRUD")
public class RecipeController {

    private final RecipeService recipeService;

    @GetMapping("/recipes")
    @Operation(summary = "List all recipe versions for this item (history)")
    public List<RecipeDto> listAll(@PathVariable Long id) {
        return recipeService.findAllForItem(id);
    }

    @GetMapping("/recipe")
    @Operation(summary = "Fetch the recipe for this item in a given game version (default: current)")
    public ResponseEntity<RecipeDto> findOne(
            @PathVariable Long id,
            @RequestParam(value = "version", required = false) String version) {
        RecipeDto dto = recipeService.findOne(id, version);
        return dto == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(dto);
    }

    @PutMapping("/recipe")
    @Operation(summary = "Create or replace the recipe for (item, version) — admin only")
    public RecipeDto upsert(
            @PathVariable Long id,
            @RequestParam(value = "version", required = false) String version,
            @RequestBody UpsertRequest body) {
        return recipeService.upsertRecipe(id, version, body);
    }

    @PostMapping("/recipe/copy-from")
    @Operation(summary = "Copy recipe from one game version to another — admin only")
    public RecipeDto copyFrom(
            @PathVariable Long id,
            @RequestParam("fromVersion") String fromVersion,
            @RequestParam(value = "toVersion", required = false) String toVersion,
            @RequestParam(value = "overwrite", required = false, defaultValue = "false") boolean overwrite) {
        return recipeService.copyFromVersion(id, fromVersion, toVersion, overwrite);
    }

    @PostMapping("/recipe/copy-tree-from")
    @Operation(summary = "Copy the entire recipe sub-tree from one game version to another — admin only")
    public CopyTreeReportDto copyTreeFrom(
            @PathVariable Long id,
            @RequestParam("fromVersion") String fromVersion,
            @RequestParam(value = "toVersion", required = false) String toVersion,
            @RequestParam(value = "policy", required = false, defaultValue = "SKIP_EXISTING") ConflictPolicy policy,
            @RequestParam(value = "dryRun", required = false, defaultValue = "false") boolean dryRun) {
        return recipeService.copyTreeFromVersion(id, fromVersion, toVersion, policy, dryRun);
    }

    @DeleteMapping("/recipe")
    @Operation(summary = "Delete the recipe for (item, version) — admin only")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam(value = "version", required = false) String version) {
        recipeService.deleteRecipe(id, version);
        return ResponseEntity.noContent().build();
    }
}
