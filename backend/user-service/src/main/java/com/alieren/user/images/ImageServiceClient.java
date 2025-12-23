package com.alieren.user.images;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class ImageServiceClient {

    private final WebClient webClient;

    public ImageServiceClient(@Value("${services.image.base-url}") String baseUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    // image-service'in response'u { url: "..." } ise
    public record UploadResponse(String url) {}

    public String upload(byte[] bytes, String filename, String contentType, String authHeader) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();

        builder.part("file", new ByteArrayResource(bytes) {
                    @Override
                    public String getFilename() {
                        return filename;
                    }
                })
                .contentType(contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM);

        UploadResponse res = webClient.post()
                .uri("/api/v1/images") // ✅ image-service endpoint'in buysa. Değilse değiştir.
                .header("Authorization", authHeader) // gerekiyorsa
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(UploadResponse.class)
                .block();

        if (res == null || res.url() == null || res.url().isBlank()) {
            throw new RuntimeException("Image upload failed: url is empty");
        }

        return res.url();
    }
}
