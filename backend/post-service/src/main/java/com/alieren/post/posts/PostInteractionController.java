package com.alieren.post.posts;

import com.alieren.post.posts.dto.CommentResponse;
import com.alieren.post.posts.dto.CreateCommentRequest;
import com.alieren.post.posts.dto.LikeResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/posts")
public class PostInteractionController {

    private final PostInteractionService service;

    public PostInteractionController(PostInteractionService service) {
        this.service = service;
    }

    // Like toggle: like varsa kaldırır, yoksa ekler
    @PostMapping("/{postId}/like")
    public LikeResponse toggleLike(
            @PathVariable Long postId,
            @RequestHeader("X-User-Id") String userId
    ) {
        return service.toggleLike(postId, userId);
    }

    // Comment ekle
    @PostMapping("/{postId}/comments")
    public CommentResponse addComment(
            @PathVariable Long postId,
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreateCommentRequest req
    ) {
        return service.addComment(postId, userId, req);
    }

    // Comment listele
    @GetMapping("/{postId}/comments")
    public List<CommentResponse> listComments(@PathVariable Long postId) {
        return service.listComments(postId);
    }
}
