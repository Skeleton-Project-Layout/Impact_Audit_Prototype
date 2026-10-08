package org.abhisaran.audit.evidence;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class EvidenceStorageService {

    private static final Logger log = LoggerFactory.getLogger(EvidenceStorageService.class);
    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

    private final Path storageDirectory;

    public EvidenceStorageService(@Value("${app.evidence.upload-dir:uploads/evidence}") String uploadDir) {
        this.storageDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.storageDirectory);
        } catch (IOException e) {
            log.error("Failed to create evidence storage directory: {}", this.storageDirectory, e);
        }
    }

    public record ProcessedFile(
            String storageFileName,
            String mimeType,
            long sizeBytes,
            String sha256Hex,
            byte[] content
    ) {}

    public ProcessedFile processAndStore(InputStream inputStream, String originalFilename) throws IOException {
        byte[] rawBytes = inputStream.readAllBytes();

        if (rawBytes.length == 0) {
            throw new IllegalArgumentException("Uploaded file cannot be empty");
        }
        if (rawBytes.length > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size exceeds 10 MB limit");
        }

        String detectedMime = detectMimeTypeFromMagicBytes(rawBytes);
        if (detectedMime == null) {
            throw new IllegalArgumentException("Unsupported file type. Only JPG, PNG, WebP, and PDF files are allowed.");
        }

        byte[] sanitizedBytes;
        String extension;

        if (detectedMime.equals("application/pdf")) {
            // PDF: magic byte verified, store raw PDF
            sanitizedBytes = rawBytes;
            extension = ".pdf";
        } else {
            // Image file: strip EXIF/GPS metadata by decoding raster and re-encoding
            sanitizedBytes = stripExifMetadata(rawBytes, detectedMime);
            extension = detectedMime.equals("image/png") ? ".png" : ".jpg";
        }

        String sha256Hex = computeSha256(sanitizedBytes);
        String storageFileName = UUID.randomUUID().toString() + extension;
        Path targetPath = this.storageDirectory.resolve(storageFileName);

        Files.write(targetPath, sanitizedBytes);
        log.info("Saved evidence file {} ({} bytes, MIME: {})", storageFileName, sanitizedBytes.length, detectedMime);

        return new ProcessedFile(storageFileName, detectedMime, sanitizedBytes.length, sha256Hex, sanitizedBytes);
    }

    public byte[] loadFileContent(String storageFileName) throws IOException {
        Path filePath = this.storageDirectory.resolve(storageFileName).normalize();
        if (!filePath.startsWith(this.storageDirectory) || !Files.exists(filePath)) {
            throw new IllegalArgumentException("Evidence file not found: " + storageFileName);
        }
        return Files.readAllBytes(filePath);
    }

    public void deleteFile(String storageFileName) {
        try {
            Path filePath = this.storageDirectory.resolve(storageFileName).normalize();
            if (filePath.startsWith(this.storageDirectory) && Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Deleted evidence file: {}", storageFileName);
            }
        } catch (IOException e) {
            log.warn("Failed to delete evidence file {}", storageFileName, e);
        }
    }

    public String detectMimeTypeFromMagicBytes(byte[] bytes) {
        if (bytes == null || bytes.length < 12) {
            return null;
        }

        // JPEG: FF D8 FF
        if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G') {
            return "image/png";
        }

        // PDF: %PDF (25 50 44 46)
        if (bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F') {
            return "application/pdf";
        }

        // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
        if (bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return "image/webp";
        }

        return null;
    }

    private byte[] stripExifMetadata(byte[] imageBytes, String mimeType) {
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageBytes));
            if (image == null) {
                // If standard ImageIO reader fails, fallback to raw bytes
                return imageBytes;
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            String format = mimeType.equals("image/png") ? "png" : "jpg";
            boolean success = ImageIO.write(image, format, baos);
            if (!success) {
                return imageBytes;
            }
            return baos.toByteArray();
        } catch (Exception e) {
            log.warn("Could not re-encode image for EXIF stripping; preserving raw content", e);
            return imageBytes;
        }
    }

    private String computeSha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
