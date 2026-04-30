package com.crafttree.controller;

import com.crafttree.dto.ImageMappingSyncRequest;
import com.crafttree.dto.ImageMappingSyncRequest.Mapping;
import com.crafttree.dto.ImageMappingSyncResultDto;
import com.crafttree.dto.UploadsManifestDto;
import com.crafttree.dto.UploadsManifestDto.UploadEntry;
import com.crafttree.entity.CraftItem;
import com.crafttree.repository.CraftItemRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/uploads")
@RequiredArgsConstructor
@Tag(name = "Uploads Admin", description = "Manifest of upload files referenced by the DB (admin only)")
public class UploadsAdminController {

    private static final String UPLOADS_URL_PREFIX = "/uploads/";

    private final CraftItemRepository craftItemRepository;

    @Value("${app.uploads.path:uploads}")
    private String uploadsPath;

    @GetMapping("/manifest")
    @Operation(summary = "List every image referenced in the DB and whether the file exists locally")
    public UploadsManifestDto manifest() {
        Path uploadsDir = Paths.get(uploadsPath).toAbsolutePath().normalize();

        List<CraftItem> items = craftItemRepository.findAll();
        List<UploadEntry> entries = new ArrayList<>(items.size());
        int present = 0;
        long totalBytes = 0L;

        for (CraftItem item : items) {
            String imageUrl = item.getImageUrl();
            if (imageUrl == null || !imageUrl.startsWith(UPLOADS_URL_PREFIX)) {
                continue;
            }

            String filename = imageUrl.substring(UPLOADS_URL_PREFIX.length());
            Path filePath = uploadsDir.resolve(filename).normalize();

            // Reject path traversal — file must stay inside uploads dir.
            if (!filePath.startsWith(uploadsDir)) {
                continue;
            }

            boolean exists = Files.isRegularFile(filePath);
            Long size = null;
            if (exists) {
                present++;
                try {
                    size = Files.size(filePath);
                    totalBytes += size;
                } catch (IOException ignored) {
                    // Leave size as null — manifest still useful.
                }
            }

            entries.add(UploadEntry.builder()
                    .itemId(item.getId())
                    .itemName(item.getName())
                    .imageUrl(imageUrl)
                    .filename(filename)
                    .exists(exists)
                    .sizeBytes(size)
                    .build());
        }

        return UploadsManifestDto.builder()
                .uploadsAbsolutePath(uploadsDir.toString())
                .totalCount(entries.size())
                .presentCount(present)
                .missingCount(entries.size() - present)
                .totalBytes(totalBytes)
                .items(entries)
                .build();
    }

    @PostMapping("/image-mapping/sync")
    @Transactional
    @Operation(summary = "Upsert craft_items.image_url from a remote mapping (used by sync-uploads script)")
    public ImageMappingSyncResultDto syncImageMapping(@RequestBody ImageMappingSyncRequest request) {
        List<Mapping> mappings = request.getItems() == null ? List.of() : request.getItems();
        int updated = 0;
        int unchanged = 0;
        List<Long> notFound = new ArrayList<>();

        for (Mapping mapping : mappings) {
            if (mapping.getItemId() == null) continue;
            Optional<CraftItem> opt = craftItemRepository.findById(mapping.getItemId());
            if (opt.isEmpty()) {
                notFound.add(mapping.getItemId());
                continue;
            }
            CraftItem item = opt.get();
            if (Objects.equals(item.getImageUrl(), mapping.getImageUrl())) {
                unchanged++;
            } else {
                item.setImageUrl(mapping.getImageUrl());
                craftItemRepository.save(item);
                updated++;
            }
        }

        return ImageMappingSyncResultDto.builder()
                .totalSubmitted(mappings.size())
                .updated(updated)
                .unchanged(unchanged)
                .notFound(notFound.size())
                .notFoundIds(notFound)
                .build();
    }
}
