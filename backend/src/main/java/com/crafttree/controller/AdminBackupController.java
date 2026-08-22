package com.crafttree.controller;

import com.crafttree.dto.backup.BackupStatusDto;
import com.crafttree.dto.backup.RestoreReportDto;
import com.crafttree.entity.AuditAction;
import com.crafttree.service.AuditService;
import com.crafttree.service.backup.DatabaseBackupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Butun bazaning zaxirasi va tiklash.
 * <p>
 * {@code /api/admin/**} allaqachon ADMIN talab qiladi; bu yerdagi {@code @PreAuthorize}
 * uni <b>SUPER_ADMIN</b>gacha toraytiradi: zaxira faylida parol xeshlari, foydalanuvchi
 * ma'lumotlari va butun yozishmalar bo'ladi, tiklash esa bazani butunlay almashtiradi.
 */
@RestController
@RequestMapping("/api/admin/backup")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Backup Admin", description = "Butun bazani zaxiralash va tiklash (faqat SUPER_ADMIN)")
public class AdminBackupController {

    private final DatabaseBackupService backupService;
    private final AuditService auditService;

    @GetMapping("/status")
    @Operation(summary = "Zaxira muhitining tayyorligi: vosita, versiyalar, baza hajmi")
    public BackupStatusDto status() {
        return backupService.status();
    }

    @GetMapping("/download")
    @Operation(summary = "Butun bazani .dump fayl sifatida yuklab olish")
    public ResponseEntity<Resource> download() {
        final Path file;
        try {
            file = backupService.dump();
        } catch (Exception e) {
            log.error("Zaxira olishda xato", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }

        long size;
        InputStream stream;
        try {
            size = Files.size(file);
            // Fayl uzatilgach o'chiriladi — zaxira konteyner diskida qolib ketmasin.
            stream = new java.io.FilterInputStream(Files.newInputStream(file)) {
                @Override
                public void close() throws IOException {
                    super.close();
                    Files.deleteIfExists(file);
                }
            };
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }

        auditService.log(AuditAction.BACKUP_DOWNLOAD, "DATABASE", null,
                file.getFileName() + " (" + size + " bayt)");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + file.getFileName() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(size)
                .body(new InputStreamResource(stream));
    }

    /**
     * Bazani yuklangan zaxiradan tiklaydi.
     * <p>
     * Fayl <b>xom tana</b> sifatida qabul qilinadi (multipart emas): zaxira fayli
     * rasm yuklash uchun qo'yilgan 10MB multipart chegarasidan katta bo'lishi mumkin,
     * o'sha chegarani ko'tarish esa rasm yuklash himoyasini zaiflashtirardi.
     * <p>
     * {@code confirm} — baza nomi. Tasodifiy bosishdan himoya: admin nomni qo'lda
     * yozishi kerak, aks holda amal bajarilmaydi.
     */
    @PostMapping(value = "/restore", consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    @Operation(summary = "Bazani zaxiradan tiklash — BUZG'UNCHI amal, baza nomi bilan tasdiqlanadi")
    public RestoreReportDto restore(HttpServletRequest request,
                                    @RequestParam("confirm") String confirm,
                                    @RequestParam(required = false) String filename) {
        BackupStatusDto status = backupService.status();
        if (!status.available()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "pg_restore mavjud emas: " + status.error());
        }
        if (!status.database().equals(confirm)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tasdiq mos kelmadi: baza nomini aniq yozing");
        }
        Path temp = null;
        try {
            temp = Files.createTempFile("restore-", ".dump");
            try (InputStream in = request.getInputStream()) {
                Files.copy(in, temp, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }
            if (Files.size(temp) == 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fayl bo'sh");
            }
            RestoreReportDto report = backupService.restore(temp);
            auditService.log(AuditAction.DATABASE_RESTORE, "DATABASE", null,
                    (filename != null ? filename : "zaxira") + " dan tiklandi; xavfsizlik zaxirasi: "
                            + report.safetyBackupFile());
            return report;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Tiklashda xato", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        } finally {
            if (temp != null) {
                try {
                    Files.deleteIfExists(temp);
                } catch (IOException ignored) {
                    // vaqtinchalik fayl — o'chmasa ham amal natijasiga ta'sir qilmaydi
                }
            }
        }
    }
}
