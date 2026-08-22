package com.crafttree.service.backup;

import com.crafttree.dto.backup.BackupStatusDto;
import com.crafttree.dto.backup.RestoreReportDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Butun ma'lumotlar bazasining zaxirasini oladi va tiklaydi — {@code pg_dump} / {@code pg_restore}
 * orqali.
 * <p>
 * Nega tashqi vosita: sxema, ketma-ketliklar (sequence), Flyway tarixi va barcha jadvallarni
 * ishonchli qamrab oladigan zaxira faqat shu yo'l bilan olinadi. Java'da qo'lda yozilgan
 * "mini pg_dump" jimgina chala zaxira yaratishi mumkin — ishonib bo'lmaydigan zaxira esa
 * zaxira yo'qligidan battar.
 * <p>
 * Parol hech qachon buyruq qatoriga qo'yilmaydi ({@code ps} da ko'rinib qolardi) —
 * faqat {@code PGPASSWORD} muhit o'zgaruvchisi orqali uzatiladi.
 */
@Service
@Slf4j
public class DatabaseBackupService {

    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
    private static final Pattern JDBC_URL =
            Pattern.compile("jdbc:postgresql://([^:/]+)(?::(\\d+))?/([^?]+)");

    /** Zaxira olish uzoq cho'zilsa jarayon uzib tashlanadi (osilib qolmasligi uchun). */
    private static final long DUMP_TIMEOUT_MINUTES = 15;
    private static final long RESTORE_TIMEOUT_MINUTES = 30;

    private final JdbcTemplate jdbcTemplate;
    private final String host;
    private final int port;
    private final String database;
    private final String username;
    private final String password;
    private final Path backupDir;
    private final String pgBinDir;

    public DatabaseBackupService(
            JdbcTemplate jdbcTemplate,
            @Value("${spring.datasource.url}") String url,
            @Value("${spring.datasource.username}") String username,
            @Value("${spring.datasource.password}") String password,
            @Value("${app.backup.dir:backups}") String backupDir,
            @Value("${app.backup.pg-bin-dir:}") String pgBinDir) {
        this.jdbcTemplate = jdbcTemplate;
        this.username = username;
        this.password = password;
        this.backupDir = Paths.get(backupDir).toAbsolutePath();
        this.pgBinDir = pgBinDir;

        Matcher m = JDBC_URL.matcher(url);
        if (!m.find()) {
            throw new IllegalStateException("Zaxira uchun JDBC URL tahlil qilinmadi: " + url);
        }
        this.host = m.group(1);
        this.port = m.group(2) != null ? Integer.parseInt(m.group(2)) : 5432;
        this.database = m.group(3);
    }

    /** UI zaxira bo'limini ko'rsatishdan oldin muhit tayyorligini tekshiradi. */
    public BackupStatusDto status() {
        String toolVersion = null;
        String error = null;
        try {
            ProcessResult r = run(List.of(tool("pg_dump"), "--version"), null, 1);
            if (r.exitCode == 0) {
                toolVersion = r.stdout.trim();
            } else {
                error = r.stderr.trim();
            }
        } catch (Exception e) {
            error = e.getMessage();
        }

        String serverVersion = null;
        String size = null;
        try {
            serverVersion = jdbcTemplate.queryForObject("SHOW server_version", String.class);
            size = jdbcTemplate.queryForObject(
                    "SELECT pg_size_pretty(pg_database_size(current_database()))", String.class);
        } catch (Exception e) {
            log.warn("Baza ma'lumotini o'qib bo'lmadi: {}", e.getMessage());
        }

        return new BackupStatusDto(
                toolVersion != null,
                toolVersion,
                serverVersion,
                database,
                size,
                error);
    }

    /**
     * Butun bazani siqilgan "custom" formatda zaxiralaydi.
     *
     * @return vaqtinchalik fayl — chaqiruvchi uzatib bo'lgach o'chirishi shart
     */
    public Path dump() throws IOException, InterruptedException {
        Files.createDirectories(backupDir);
        Path out = backupDir.resolve("crafttree-" + LocalDateTime.now().format(TS) + ".dump");

        // -Fc: pg_restore uchun custom format (tanlab tiklash imkonini beradi), -Z 6: siqish.
        // --no-owner/--no-privileges: boshqa muhitga ham tiklana olsin (rol nomlari farq qiladi).
        ProcessResult r = run(List.of(
                tool("pg_dump"),
                "-h", host, "-p", String.valueOf(port), "-U", username, "-d", database,
                "-Fc", "-Z", "6", "--no-owner", "--no-privileges",
                "-f", out.toString()), null, DUMP_TIMEOUT_MINUTES);

        if (r.exitCode != 0) {
            Files.deleteIfExists(out);
            throw new IOException("pg_dump muvaffaqiyatsiz (kod " + r.exitCode + "): " + r.stderr.trim());
        }
        log.info("Zaxira olindi: {} ({} bayt)", out.getFileName(), Files.size(out));
        return out;
    }

    /**
     * Bazani zaxiradan tiklaydi. <b>Buzg'unchi amal</b> — mavjud ma'lumot almashtiriladi.
     * <p>
     * Tiklashdan oldin joriy holatning zaxirasi olinadi: tiklangan fayl noto'g'ri chiqsa
     * ham qaytish nuqtasi qoladi.
     */
    public RestoreReportDto restore(Path dumpFile) throws IOException, InterruptedException {
        Path safety = null;
        List<String> warnings = new ArrayList<>();
        try {
            safety = dump();
        } catch (Exception e) {
            // Xavfsizlik zaxirasi olinmasa ham tiklashni to'xtatamiz — qaytish yo'lisiz
            // buzg'unchi amalni bajarish mumkin emas.
            throw new IOException("Tiklashdan oldingi xavfsizlik zaxirasi olinmadi, "
                    + "shuning uchun tiklash bekor qilindi: " + e.getMessage(), e);
        }

        // --single-transaction: yo hammasi tiklanadi, yo hech narsa o'zgarmaydi.
        // --clean --if-exists: mavjud obyektlar avval tushiriladi (yo'q bo'lsa xato bermaydi).
        ProcessResult r = run(List.of(
                tool("pg_restore"),
                "-h", host, "-p", String.valueOf(port), "-U", username, "-d", database,
                "--clean", "--if-exists", "--no-owner", "--no-privileges",
                "--single-transaction",
                dumpFile.toString()), null, RESTORE_TIMEOUT_MINUTES);

        if (r.exitCode != 0) {
            throw new IOException("pg_restore muvaffaqiyatsiz (kod " + r.exitCode + "): "
                    + tail(r.stderr) + " — baza o'zgarmadi, xavfsizlik zaxirasi: " + safety);
        }
        if (!r.stderr.isBlank()) {
            warnings.add(tail(r.stderr));
        }

        log.warn("Baza zaxiradan tiklandi. Xavfsizlik zaxirasi: {}", safety);
        return new RestoreReportDto(true, safety.getFileName().toString(), warnings);
    }

    // -- Ichki yordamchi qism ------------------------------------------------

    private String tool(String name) {
        return pgBinDir == null || pgBinDir.isBlank() ? name : Paths.get(pgBinDir, name).toString();
    }

    private ProcessResult run(List<String> command, Path workDir, long timeoutMinutes)
            throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command);
        if (workDir != null) {
            pb.directory(workDir.toFile());
        }
        // Parol faqat shu yerda — buyruq qatorida emas.
        pb.environment().put("PGPASSWORD", password);

        Process p = pb.start();
        String stdout;
        String stderr;
        try (InputStream out = p.getInputStream(); InputStream err = p.getErrorStream()) {
            stdout = new String(out.readAllBytes(), StandardCharsets.UTF_8);
            stderr = new String(err.readAllBytes(), StandardCharsets.UTF_8);
        }
        if (!p.waitFor(timeoutMinutes, TimeUnit.MINUTES)) {
            p.destroyForcibly();
            throw new IOException("Amal " + timeoutMinutes + " daqiqada tugamadi, uzib tashlandi");
        }
        return new ProcessResult(p.exitValue(), stdout, stderr);
    }

    /** Uzun stderr'ni javobga to'liq tiqmaymiz — oxirgi qismi eng foydali. */
    private static String tail(String s) {
        String t = s.trim();
        return t.length() <= 2000 ? t : "..." + t.substring(t.length() - 2000);
    }

    private record ProcessResult(int exitCode, String stdout, String stderr) {
    }
}
