package com.crafttree.service;

import com.crafttree.entity.CraftItem;
import com.crafttree.exception.ItemNotFoundException;
import com.crafttree.repository.CraftItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageService {

    private final CraftItemRepository craftItemRepository;

    @Value("${app.uploads.path:uploads}")
    private String uploadsPath;

    @Value("${app.scripts.python:python}")
    private String pythonCommand;

    @Transactional
    public String uploadAndProcessImage(Long itemId, MultipartFile file, boolean removeBg) throws IOException {
        CraftItem item = craftItemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException(itemId));

        Path uploadsDir = Paths.get(uploadsPath);
        Files.createDirectories(uploadsDir);

        // Save original file
        String originalName = itemId + "_original_" + System.currentTimeMillis();
        String extension = getExtension(file.getOriginalFilename());
        Path originalPath = uploadsDir.resolve(originalName + "." + extension);
        Files.copy(file.getInputStream(), originalPath, StandardCopyOption.REPLACE_EXISTING);

        String resultUrl;

        if (removeBg) {
            // Process with rembg
            String processedName = itemId + "_" + System.currentTimeMillis() + ".png";
            Path processedPath = uploadsDir.resolve(processedName);

            boolean success = runBackgroundRemoval(originalPath.toString(), processedPath.toString());

            if (success && Files.exists(processedPath)) {
                resultUrl = "/uploads/" + processedName;
                // Clean up original
                Files.deleteIfExists(originalPath);
            } else {
                // Fallback: use original
                resultUrl = "/uploads/" + originalName + "." + extension;
                log.warn("Background removal failed for item {}, using original image", itemId);
            }
        } else {
            resultUrl = "/uploads/" + originalName + "." + extension;
        }

        // Update DB
        item.setImageUrl(resultUrl);
        craftItemRepository.save(item);

        return resultUrl;
    }

    private boolean runBackgroundRemoval(String inputPath, String outputPath) {
        try {
            String scriptPath = Paths.get("scripts", "remove_bg.py").toAbsolutePath().toString();

            ProcessBuilder pb = new ProcessBuilder(pythonCommand, scriptPath, inputPath, outputPath);
            pb.redirectErrorStream(true);

            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                    log.info("rembg: {}", line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode == 0 && output.toString().contains("OK:")) {
                log.info("Background removed successfully: {}", output);
                return true;
            } else {
                log.error("rembg failed with exit code {}: {}", exitCode, output);
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to run background removal", e);
            return false;
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return "jpg";
        int dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.substring(dot + 1).toLowerCase() : "jpg";
    }
}
