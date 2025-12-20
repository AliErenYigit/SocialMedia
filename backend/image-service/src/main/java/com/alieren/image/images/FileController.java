package com.alieren.image.images;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
public class FileController {

    private final LocalStorageService storageService;

    public FileController(LocalStorageService storageService) {
        this.storageService = storageService;
    }

    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> file(@PathVariable String filename) throws MalformedURLException {
        Path file = Paths.get("uploads").toAbsolutePath().normalize().resolve(filename);
        Resource resource = new UrlResource(file.toUri());
        if (!resource.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(resource);
    }
}
