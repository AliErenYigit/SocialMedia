package com.alieren.post.posts;

import com.alieren.post.kafka.NotificationEventProducer;
import com.alieren.post.posts.dto.CommentResponse;
import com.alieren.post.posts.dto.CreateCommentRequest;
import com.alieren.post.posts.dto.LikeResponse;
import com.alieren.shared.events.NotificationEvent;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PostInteractionService {

    private final PostRepository postRepo;
    private final PostLikeRepository likeRepo;
    private final PostCommentRepository commentRepo;
    private final NotificationEventProducer producer;

    public PostInteractionService(
            PostRepository postRepo,
            PostLikeRepository likeRepo,
            PostCommentRepository commentRepo,
            NotificationEventProducer producer
    ) {
        this.postRepo = postRepo;
        this.likeRepo = likeRepo;
        this.commentRepo = commentRepo;
        this.producer = producer;
    }

    @Transactional
    public LikeResponse toggleLike(Long postId, String authUserId) {
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

            // ✅ event: POST_LIKED (sadece like eklenince)
            // kendine bildirim gönderme
            if (!authUserId.equals(post.getAuthUserId())) {
                producer.publish(new NotificationEvent(
                        UUID.randomUUID().toString(),
                        "POST_LIKED",
                        authUserId,                 // actor
                        post.getAuthUserId(),       // target = post owner
                        "POST",
                        String.valueOf(postId),
                        Instant.now(),
                        Map.of("postId", postId)
                ));
            }
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

        // ✅ event: COMMENT_CREATED
        if (!authUserId.equals(post.getAuthUserId())) {
            producer.publish(new NotificationEvent(
                    UUID.randomUUID().toString(),
                    "COMMENT_CREATED",
                    authUserId,
                    post.getAuthUserId(),
                    "POST",
                    String.valueOf(postId),
                    Instant.now(),
                    Map.of(
                            "postId", postId,
                            "commentId", c.getId()
                    )
            ));
        }

        return new CommentResponse(c.getId(), postId, c.getAuthUserId(), c.getContent(), c.getCreatedAt());
    }

    public List<CommentResponse> listComments(Long postId) {
        return commentRepo.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .map(c -> new CommentResponse(c.getId(), postId, c.getAuthUserId(), c.getContent(), c.getCreatedAt()))
                .toList();
    }
}
