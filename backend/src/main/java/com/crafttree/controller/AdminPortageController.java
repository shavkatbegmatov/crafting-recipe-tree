package com.crafttree.controller;

import com.crafttree.dto.portage.ExportPackageDto;
import com.crafttree.dto.portage.ImportOptionsDto;
import com.crafttree.dto.portage.ImportReportDto;
import com.crafttree.service.portage.ExportService;
import com.crafttree.service.portage.ExportService.ExportSelection;
import com.crafttree.service.portage.ImportService;
import com.crafttree.service.portage.PortageZipReader;
import com.crafttree.service.portage.PortageZipWriter;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/admin/portage")
@RequiredArgsConstructor
@Tag(name = "Portage Admin", description = "Export and import packages of categories, tags, items and recipes")
public class AdminPortageController {

    private static final DateTimeFormatter FILENAME_TS =
            DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final ExportService exportService;
    private final ImportService importService;
    private final PortageZipWriter zipWriter;
    private final PortageZipReader zipReader;

    @GetMapping(value = "/preview")
    @Operation(summary = "Lightweight summary of what an export would contain (for UI badge)")
    public ExportPackageDto preview(
            @RequestParam(required = false) List<Long> ids,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "false") boolean all,
            @RequestParam(defaultValue = "true") boolean withDependencies) {

        ExportSelection selection = resolveSelection(ids, category, tag, all, withDependencies);
        ExportPackageDto pkg = exportService.buildPackage(selection);
        for (var item : pkg.getItems()) {
            item.setDescription(null);
            item.setDescriptionUz(null);
            item.setDescriptionEn(null);
            item.setDescriptionUzCyr(null);
        }
        return pkg;
    }

    @GetMapping(value = "/export")
    @Operation(summary = "Download a .craftpkg with the selected scope")
    public ResponseEntity<Resource> export(
            @RequestParam(required = false) List<Long> ids,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "false") boolean all,
            @RequestParam(defaultValue = "true") boolean withDependencies) throws IOException {

        ExportSelection selection = resolveSelection(ids, category, tag, all, withDependencies);
        ExportPackageDto pkg = exportService.buildPackage(selection);

        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        zipWriter.writeTo(pkg, buf);
        byte[] payload = buf.toByteArray();

        String filename = "crafttree-" + slug(selection.label()) + "-"
                + LocalDateTime.now().format(FILENAME_TS) + ".craftpkg";

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
        headers.add(HttpHeaders.CONTENT_TYPE, "application/zip");

        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(payload.length)
                .body(new ByteArrayResource(payload));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Run an import (dry-run by default)")
    public ImportReportDto runImport(
            @RequestPart("file") MultipartFile file,
            @RequestPart(value = "options", required = false) String optionsJson) throws IOException {

        ImportOptionsDto options;
        if (optionsJson == null || optionsJson.isBlank()) {
            options = ImportOptionsDto.builder().build();
        } else {
            options = MAPPER.readValue(optionsJson, ImportOptionsDto.class);
        }

        try (var input = file.getInputStream()) {
            PortageZipReader.ParsedPackage parsed = zipReader.read(input);
            return importService.run(parsed.pkg(), parsed.images(), options);
        }
    }

    private ExportSelection resolveSelection(List<Long> ids, String category, String tag,
                                              boolean all, boolean withDeps) {
        if (all) return ExportSelection.allItems();
        if (ids != null && !ids.isEmpty()) return ExportSelection.byIds(ids, withDeps);
        if (category != null && !category.isBlank()) return ExportSelection.byCategory(category, withDeps);
        if (tag != null && !tag.isBlank()) return ExportSelection.byTag(tag, withDeps);
        throw new IllegalArgumentException("Provide one of: ids, category, tag, or all=true");
    }

    private static String slug(String s) {
        if (s == null) return "export";
        String cleaned = s.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        return cleaned.isBlank() ? "export" : cleaned;
    }
}
