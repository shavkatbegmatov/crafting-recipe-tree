package com.crafttree.controller;

import com.crafttree.service.ImageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/items/{id}")
@RequiredArgsConstructor
@Tag(name = "Image Upload", description = "Upload and process item images")
public class ImageController {

    private final ImageService imageService;

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload screenshot and auto-extract icon with background removal")
    public Map<String, String> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "removeBg", defaultValue = "true") boolean removeBg
    ) throws IOException {
        String imageUrl = imageService.uploadAndProcessImage(id, file, removeBg);
        return Map.of("imageUrl", imageUrl);
    }
}
