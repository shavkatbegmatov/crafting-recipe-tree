package com.crafttree.controller;

import com.crafttree.dto.TagDto;
import com.crafttree.service.TagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
@Tag(name = "Tags", description = "Tag management")
public class TagController {

    private final TagService tagService;

    @GetMapping
    @Operation(summary = "Get all tags")
    public List<TagDto> getAll() {
        return tagService.getAll();
    }

    @PostMapping
    @Operation(summary = "Create tag (admin)")
    public TagDto create(@RequestBody TagDto request) {
        return tagService.create(request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update tag (admin)")
    public TagDto update(@PathVariable Long id, @RequestBody TagDto request) {
        return tagService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete tag (admin)")
    public void delete(@PathVariable Long id) {
        tagService.delete(id);
    }

    @PutMapping("/items/{itemId}")
    @Operation(summary = "Set tags for an item (admin)")
    public List<TagDto> setItemTags(@PathVariable Long itemId, @RequestBody List<Long> tagIds) {
        return tagService.setItemTags(itemId, tagIds);
    }
}
