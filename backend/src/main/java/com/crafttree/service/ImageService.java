package com.crafttree.service;

import com.crafttree.entity.CraftItem;
import com.crafttree.exception.ItemNotFoundException;
import com.crafttree.repository.CraftItemRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageService {

    private final CraftItemRepository craftItemRepository;

    @Value("${app.uploads.path:uploads}")
    private String uploadsPath;

    /** Fon o'chirish servisi manzili (services/rembg). Bo'sh bo'lsa — funksiya o'chirilgan. */
    @Value("${app.rembg.url:}")
    private String rembgUrl;

    /** ML qayta ishlash bir necha soniya olishi mumkin, shuning uchun keng oynа. */
    @Value("${app.rembg.timeout-seconds:120}")
    private int rembgTimeoutSeconds;

    private RestClient rembgClient;

    @PostConstruct
    void initRembgClient() {
        if (rembgUrl == null || rembgUrl.isBlank()) {
            log.info("app.rembg.url sozlanmagan — fon o'chirish o'chirilgan (rasmlar asl holida saqlanadi)");
            return;
        }
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(rembgTimeoutSeconds));
        rembgClient = RestClient.builder().baseUrl(rembgUrl).requestFactory(factory).build();
        log.info("Fon o'chirish servisi: {} (timeout {}s)", rembgUrl, rembgTimeoutSeconds);
    }

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
            String processedName = itemId + "_" + System.currentTimeMillis() + ".png";
            Path processedPath = uploadsDir.resolve(processedName);

            boolean success = runBackgroundRemoval(originalPath, processedPath);

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

    /**
     * Rasmni fon o'chirish servisiga yuboradi va natijani {@code outputPath} ga yozadi.
     * Servis o'chirilgan yoki javob bermasa {@code false} qaytaradi — chaqiruvchi asl
     * rasmni saqlab qoladi, ya'ni yuklash baribir muvaffaqiyatli bo'ladi.
     */
    private boolean runBackgroundRemoval(Path inputPath, Path outputPath) {
        if (rembgClient == null) {
            log.warn("Fon o'chirish so'raldi, lekin servis sozlanmagan (app.rembg.url)");
            return false;
        }
        try {
            byte[] source = Files.readAllBytes(inputPath);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            // Fayl nomi majburiy: usiz FastAPI qismni oddiy matn maydoni deb qabul qiladi.
            body.add("file", new ByteArrayResource(source) {
                @Override
                public String getFilename() {
                    return inputPath.getFileName().toString();
                }
            });

            byte[] png = rembgClient.post()
                    .uri("/remove-bg")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(byte[].class);

            if (png == null || png.length == 0) {
                log.error("Fon o'chirish servisi bo'sh javob qaytardi");
                return false;
            }

            Files.write(outputPath, png);
            log.info("Fon o'chirildi: {} -> {} bayt", source.length, png.length);
            return true;
        } catch (Exception e) {
            log.error("Fon o'chirish servisiga murojaat qilib bo'lmadi ({}): {}", rembgUrl, e.getMessage());
            return false;
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return "jpg";
        int dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.substring(dot + 1).toLowerCase() : "jpg";
    }
}
