package com.alieren.post.posts;

import com.alieren.post.clients.ImageClient;
import com.alieren.post.posts.dto.*;
import org.springframework.stereotype.Service;
import com.alieren.post.clients.UserServiceClient;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;


import java.awt.*;
import java.time.Instant;
import java.util.*;
import java.util.List;

@Service
public class PostService {

    private final PostRepository repo;
    private final PostLikeRepository likeRepo;
    private final PostCommentRepository commentRepo;
    private final UserServiceClient userServiceClient;
    private final ImageClient imageClient;

    public PostService(PostRepository repo, PostLikeRepository likeRepo, PostCommentRepository commentRepo,
                       UserServiceClient userServiceClient,ImageClient imageClient) {
        this.repo = repo;
        this.likeRepo = likeRepo;
        this.commentRepo = commentRepo;
        this.userServiceClient = userServiceClient;
        this.imageClient=imageClient;
    }

    public CreatePostRequest create(String authUserId, String content, MultipartFile file) {

        // 1) içerik boşsa ama file varsa yine kabul (frontend bunu destekliyor)
        String safeContent = (content == null) ? "" : content.trim();

        if (safeContent.isEmpty() && (file == null || file.isEmpty())) {
            throw new RuntimeException("Post boş olamaz");
        }

        // 2) file varsa image-service upload -> imageUrl
        String imageUrl = null;
        if (file != null && !file.isEmpty()) {
            imageUrl = imageClient.upload(file);
        }

        // 3) Post oluştur (constructor kullanma!)
        Post p = new Post();
        p.setAuthUserId(authUserId);
        p.setContent(safeContent);
        p.setImageUrl(imageUrl);

        // createdAt sende otomatik set edilmiyorsa aç
        if (p.getCreatedAt() == null) {
            p.setCreatedAt(Instant.now());
        }

        Post saved = repo.save(p);

        // 4) Response
        return new CreatePostRequest(
                saved.getId(),
                saved.getContent(),
                saved.getImageUrl(),
                saved.getAuthUserId(),
                saved.getCreatedAt()
        );
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

    private Long toLongOrNull(String s) {
        try {
            return (s == null || s.isBlank()) ? null : Long.parseLong(s);
        } catch (Exception e) {
            return null;
        }
    }
    public PostDetailResponse getPostDetail(Long id,String authUserId,String authHeader) {
        var post = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found: " + id));
        boolean liked = likeRepo.existsByPostIdAndAuthUserId(id, authUserId);
        // userId’leri topla
        List<Long> ids = new ArrayList<>();

        Long postUserId = toLongOrNull(post.getAuthUserId());
        if (postUserId != null) ids.add(postUserId);

        if (post.getComments() != null) {
            post.getComments().forEach(c -> {
                Long cid = toLongOrNull(c.getAuthUserId());
                if (cid != null) ids.add(cid);
            });
        }

        List<Long> distinctIds = ids.stream().distinct().toList();   // ✅ yeni değişken
        Map<Long, String> usernames = userServiceClient.getUsernames(distinctIds,authHeader);

        // batch ile username map al

        String postUsername = postUserId == null ? "User" : usernames.getOrDefault(postUserId, "User");

        long likeCount = post.getLikes() == null ? 0 : post.getLikes().size();

        List<CommentDetailResponse> comments = post.getComments() == null ? List.of() :
                post.getComments().stream()
                        .map(c -> {
                            Long cid = toLongOrNull(c.getAuthUserId());
                            String uname = cid == null ? "User" : usernames.getOrDefault(cid, "User");
                            return new CommentDetailResponse(
                                    c.getId(),
                                    c.getAuthUserId(),
                                    uname,
                                    c.getContent(),
                                    c.getCreatedAt()
                            );
                        })
                        .toList();

        return new PostDetailResponse(
                post.getId(),
                post.getContent(),// ✅ eklendi
                post.getAuthUserId(),
                postUsername,
                post.getImageUrl(),
                post.getCreatedAt(),
                liked,
                likeCount,
                comments
        );
    }
    private PostResponse toResponse(Post p, long likeCount, long commentCount) {
        return new PostResponse(
                p.getId(),
                p.getAuthUserId(),
                p.getContent(),
                p.getImageUrl(),          // ✅ eklendi
                p.getCreatedAt(),
                likeCount,
                commentCount
        );
    }
    public long getPostCount(String authUserId) {
        return repo.countByAuthUserId(authUserId);
    }
}
