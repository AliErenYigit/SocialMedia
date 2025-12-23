package com.alieren.post.posts;

import com.alieren.post.posts.dto.CreatePostRequest;
import com.alieren.post.posts.dto.PostDetailResponse;
import com.alieren.post.posts.dto.PostResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.util.List;

@RestController
@RequestMapping("/api/v1/posts")
public class PostController {

    private final PostService service;

    public PostController(PostService service) {
        this.service = service;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CreatePostRequest create(
            @RequestHeader("X-User-Id") String me,
            @RequestPart(value = "content", required = false) String content,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        // me zaten gateway'den geliyor (auth user id)
        return service.create(me, content, file);
    }

    @GetMapping("/list")
    public List<PostResponse> listAll() {
        return service.listAll();
    }

    @GetMapping("/me")
    public List<PostResponse> listMine(@RequestHeader("X-User-Id") String userId) {
        return service.listMine(userId);
    }

    @GetMapping("/users/{userId}")
    public List<PostResponse> listByUser(@PathVariable String userId) {
        return service.listByUser(userId);
    }

    @GetMapping("/feed")
    public java.util.List<com.alieren.post.posts.dto.PostResponse> feed(
            @RequestHeader("X-User-Id") String userId
    ) {
        return service.feed(userId);
    }

    @GetMapping("/{id}")
    public PostDetailResponse detail(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-User-Id") String authUserId
    ) {
        return service.getPostDetail(id, authUserId, authHeader);
    }

    // ✅ kullanıcının post sayısı
    @GetMapping("/users/{userId}/count")
    public long postCount(@PathVariable String userId) {
        return service.getPostCount(userId);
    }

}
