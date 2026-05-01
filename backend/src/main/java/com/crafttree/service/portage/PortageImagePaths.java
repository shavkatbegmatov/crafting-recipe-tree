package com.crafttree.service.portage;

/**
 * Shared constants for translating between {@code CraftItem.imageUrl}
 * (the public URL prefix) and on-disk filenames.
 */
public final class PortageImagePaths {

    public static final String UPLOADS_URL_PREFIX = "/uploads/";
    public static final String ARCHIVE_UPLOADS_FOLDER = "uploads/";
    public static final String ARCHIVE_DATA_FILE = "data.json";
    public static final String ARCHIVE_MANIFEST_FILE = "manifest.json";

    private PortageImagePaths() {}

    /**
     * Returns the bare filename for a stored upload, or {@code null} when the
     * URL doesn't reference a managed upload (external link, or simply absent).
     */
    public static String filenameOf(String imageUrl) {
        if (imageUrl == null) return null;
        if (!imageUrl.startsWith(UPLOADS_URL_PREFIX)) return null;
        String filename = imageUrl.substring(UPLOADS_URL_PREFIX.length());
        return filename.isBlank() ? null : filename;
    }

    public static String urlOf(String filename) {
        return UPLOADS_URL_PREFIX + filename;
    }
}
