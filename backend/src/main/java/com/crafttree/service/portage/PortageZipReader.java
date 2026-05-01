package com.crafttree.service.portage;

import com.crafttree.dto.portage.ExportPackageDto;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Reads a {@code .craftpkg} ZIP into a parsed package + an in-memory image map.
 *
 * The reader is strict on path traversal and skips any entry whose name escapes
 * its expected folder. Hard cap on archive size protects against zip bombs.
 */
@Component
public class PortageZipReader {

    public static final long MAX_ARCHIVE_BYTES = 200L * 1024 * 1024;

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);

    public ParsedPackage read(InputStream stream) throws IOException {
        ExportPackageDto pkg = null;
        Map<String, byte[]> images = new LinkedHashMap<>();
        long totalRead = 0;

        try (ZipInputStream zis = new ZipInputStream(stream)) {
            ZipEntry e;
            while ((e = zis.getNextEntry()) != null) {
                if (e.isDirectory()) {
                    zis.closeEntry();
                    continue;
                }
                String name = e.getName();
                if (name.contains("..") || name.startsWith("/") || name.startsWith("\\")) {
                    throw new IllegalArgumentException("Unsafe entry path: " + name);
                }

                ByteArrayOutputStream buf = new ByteArrayOutputStream();
                byte[] chunk = new byte[16 * 1024];
                int n;
                while ((n = zis.read(chunk)) > 0) {
                    buf.write(chunk, 0, n);
                    totalRead += n;
                    if (totalRead > MAX_ARCHIVE_BYTES) {
                        throw new IllegalArgumentException(
                                "Archive too large (>" + MAX_ARCHIVE_BYTES + " bytes)");
                    }
                }
                byte[] bytes = buf.toByteArray();

                if (PortageImagePaths.ARCHIVE_DATA_FILE.equals(name)) {
                    pkg = MAPPER.readValue(bytes, ExportPackageDto.class);
                } else if (name.startsWith(PortageImagePaths.ARCHIVE_UPLOADS_FOLDER)) {
                    String filename = name.substring(PortageImagePaths.ARCHIVE_UPLOADS_FOLDER.length());
                    if (!filename.isBlank() && !filename.contains("/") && !filename.contains("\\")) {
                        images.put(filename, bytes);
                    }
                }
                // manifest.json is informational — data.json is the source of truth.
                zis.closeEntry();
            }
        }

        if (pkg == null) {
            throw new IllegalArgumentException(
                    "Archive is missing " + PortageImagePaths.ARCHIVE_DATA_FILE);
        }
        return new ParsedPackage(pkg, images);
    }

    public record ParsedPackage(ExportPackageDto pkg, Map<String, byte[]> images) {}
}
