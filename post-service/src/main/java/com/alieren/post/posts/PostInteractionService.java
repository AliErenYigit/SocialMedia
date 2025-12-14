package com.alieren.post.posts;

import com.alieren.post.posts.dto.CommentResponse;
import com.alieren.post.posts.dto.CreateCommentRequest;
import com.alieren.post.posts.dto.LikeResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PostInteractionService {

    private final PostRepository postRepo;
    private final PostLikeRepository likeRepo;
    private final PostCommentRepository commentRepo;

    public PostInteractionService(PostRepository postRepo, PostLikeRepository likeRepo, PostCommentRepository commentRepo) {
        this.postRepo = postRepo;
        this.likeRepo = likeRepo;
        this.commentRepo = commentRepo;
    }

    @Transactional
    public LikeResponse toggleLike(Long postId, String authUserId) {
        // Post var mı?
        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        boolean exists = likeRepo.existsByPostIdAndAuthUserId(postId, authUserId);
        boolean liked;

        if (exists) {
            likeRepo.deleteByPostIdAndAuthUserId(postId, authUserId);
            liked = false;
        } else {
            likeRepo.save(PostLike.builder()
                    .post(post)
                    .authUserId(authUserId)
                    .build());
            liked = true;
        }

        long likeCount = likeRepo.countByPostId(postId);
        return new LikeResponse(postId, liked, likeCount);
    }

    @Transactional
    public CommentResponse addComment(Long postId, String authUserId, CreateCommentRequest req) {
        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        PostComment c = commentRepo.save(PostComment.builder()
                .post(post)
                .authUserId(authUserId)
                .content(req.content())
                .build());

        return new CommentResponse(c.getId(), postId, c.getAuthUserId(), c.getContent(), c.getCreatedAt());
    }

    public List<CommentResponse> listComments(Long postId) {
        return commentRepo.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .map(c -> new CommentResponse(c.getId(), postId, c.getAuthUserId(), c.getContent(), c.getCreatedAt()))
                .toList();
    }
}
