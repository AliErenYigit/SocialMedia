package com.alieren.post.posts;

import com.alieren.post.posts.dto.CreatePostRequest;
import com.alieren.post.posts.dto.PostResponse;
import org.springframework.stereotype.Service;
import com.alieren.post.clients.UserServiceClient;


import java.util.*;

@Service
public class PostService {

    private final PostRepository repo;
    private final PostLikeRepository likeRepo;
    private final PostCommentRepository commentRepo;
    private final UserServiceClient userServiceClient;

    public PostService(PostRepository repo, PostLikeRepository likeRepo, PostCommentRepository commentRepo,
                       UserServiceClient userServiceClient) {
        this.repo = repo;
        this.likeRepo = likeRepo;
        this.commentRepo = commentRepo;
        this.userServiceClient = userServiceClient;
    }

    public PostResponse create(String authUserId, CreatePostRequest req) {
        Post post = Post.builder()
                .authUserId(authUserId)
                .content(req.content())
                .build();

        post = repo.save(post);
        return toResponse(post,0L,0L);
    }

    public List<PostResponse> listAll() {
        List<Post> posts = repo.findAllByOrderByCreatedAtDesc();
        return mapWithCounts(posts);
    }
    public List<PostResponse> listMine(String authUserId) {
        List<Post> posts = repo.findByAuthUserIdOrderByCreatedAtDesc(authUserId);
        return mapWithCounts(posts);
    }

    private List<PostResponse> mapWithCounts(List<Post> posts) {
        if (posts.isEmpty()) return List.of();

        List<Long> ids = posts.stream().map(Post::getId).toList();

        Map<Long, Long> likeCounts = toCountMap(likeRepo.countByPostIds(ids));
        Map<Long, Long> commentCounts = toCountMap(commentRepo.countByPostIds(ids));

        List<PostResponse> out = new ArrayList<>(posts.size());
        for (Post p : posts) {
            long likes = likeCounts.getOrDefault(p.getId(), 0L);
            long comments = commentCounts.getOrDefault(p.getId(), 0L);
            out.add(toResponse(p, likes, comments));
        }
        return out;
    }

    private Map<Long, Long> toCountMap(List<Object[]> rows) {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] r : rows) {
            Long postId = (Long) r[0];
            Long count = (Long) r[1];
            map.put(postId, count);
        }
        return map;
    }

    public List<PostResponse> feed(String myId) {
        List<String> followingIds = userServiceClient.getMyFollowingIds(myId);
        if (followingIds == null || followingIds.isEmpty()) return List.of();

        // İstersen kendi postlarını da feed’e kat:
         followingIds = new ArrayList<>(followingIds); followingIds.add(myId);

        List<Post> posts = repo.findByAuthUserIdInOrderByCreatedAtDesc(followingIds);
        return mapWithCounts(posts); // senin yazdığımız count’lu mapper
    }
    private PostResponse toResponse(Post p, long likeCount, long commentCount) {
        return new PostResponse(
                p.getId(),
                p.getAuthUserId(),
                p.getContent(),
                p.getCreatedAt(),
                likeCount,
                commentCount
        );
    }
}
