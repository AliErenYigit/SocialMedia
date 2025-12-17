package com.alieren.post.posts;

import com.alieren.post.posts.dto.CreatePostRequest;
import com.alieren.post.posts.dto.PostDetailResponse;
import com.alieren.post.posts.dto.PostResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/posts")
public class PostController {

    private final PostService service;

    public PostController(PostService service) {
        this.service = service;
    }

    @PostMapping
    public PostResponse create(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreatePostRequest req
    ) {
        return service.create(userId, req);
    }

    @GetMapping
    public List<PostResponse> listAll() {
        return service.listAll();
    }

    @GetMapping("/me")
    public List<PostResponse> listMine(@RequestHeader("X-User-Id") String userId) {
        return service.listMine(userId);
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

}
