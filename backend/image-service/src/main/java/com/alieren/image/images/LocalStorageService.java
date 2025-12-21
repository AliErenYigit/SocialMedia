package com.alieren.image.images;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class LocalStorageService {

    @Value("${app.storage.dir:uploads}")
    private String uploadDir;

    @Value("${app.public.base-url:http://localhost:8087}")
    private String publicBaseUrl;

    public StoredImage save(MultipartFile file) {
        try {
            String original = StringUtils.cleanPath(
                    file.getOriginalFilename() == null ? "file" : file.getOriginalFilename()
            );

            String ext = "";
            int dot = original.lastIndexOf(".");
            if (dot > -1) ext = original.substring(dot);

            String filename = UUID.randomUUID() + ext;

            Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(dir);

            Path target = dir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String url = publicBaseUrl + "/files/" + filename;

            return new StoredImage(url, filename);

        } catch (IOException e) {
            throw new RuntimeException("File upload failed", e);
        }
    }
}
