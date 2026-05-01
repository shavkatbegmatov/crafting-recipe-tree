package com.crafttree.service.portage;

import com.crafttree.dto.portage.ExportManifestDto;
import com.crafttree.dto.portage.ExportPackageDto;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Writes a {@link ExportPackageDto} to a {@code .craftpkg} (ZIP) stream.
 */
@Component
@RequiredArgsConstructor
public class PortageZipWriter {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .enable(SerializationFeature.INDENT_OUTPUT)
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);

    @Value("${app.uploads.path:uploads}")
    private String uploadsPath;

    public void writeTo(ExportPackageDto pkg, OutputStream out) throws IOException {
        Path uploadsDir = Paths.get(uploadsPath).toAbsolutePath().normalize();
        List<ExportManifestDto.ImageEntryDto> imageEntries = new ArrayList<>();

        try (ZipOutputStream zos = new ZipOutputStream(out)) {

            for (var item : pkg.getItems()) {
                String filename = item.getImageFilename();
                if (filename == null) continue;
                Path path = uploadsDir.resolve(filename).normalize();
                if (!path.startsWith(uploadsDir)) continue;
                if (!Files.isRegularFile(path)) continue;

                byte[] bytes = Files.readAllBytes(path);
                String sha = sha256Hex(bytes);

                ZipEntry e = new ZipEntry(PortageImagePaths.ARCHIVE_UPLOADS_FOLDER + filename);
                e.setSize(bytes.length);
                zos.putNextEntry(e);
                zos.write(bytes);
                zos.closeEntry();

                imageEntries.add(ExportManifestDto.ImageEntryDto.builder()
                        .filename(filename)
                        .sizeBytes(bytes.length)
                        .sha256(sha)
                        .build());
            }

            pkg.getManifest().setImages(imageEntries);

            ZipEntry dataEntry = new ZipEntry(PortageImagePaths.ARCHIVE_DATA_FILE);
            zos.putNextEntry(dataEntry);
            MAPPER.writeValue(zos, pkg);
            zos.closeEntry();

            ZipEntry manifestEntry = new ZipEntry(PortageImagePaths.ARCHIVE_MANIFEST_FILE);
            zos.putNextEntry(manifestEntry);
            MAPPER.writeValue(zos, pkg.getManifest());
            zos.closeEntry();
        }
    }

    public static String sha256Hex(byte[] bytes) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
