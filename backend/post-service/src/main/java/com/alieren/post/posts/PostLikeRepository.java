package com.alieren.post.posts;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    boolean existsByPostIdAndAuthUserId(Long postId, String authUserId);
    long countByPostId(Long postId);
    void deleteByPostIdAndAuthUserId(Long postId, String authUserId);

    @Query("select pl.post.id from PostLike pl where pl.authUserId = :authUserId and pl.post.id in :postIds")
    List<Long> findLikedPostIds(@Param("authUserId") String authUserId, @Param("postIds") List<Long> postIds);
    @Query("select l.post.id, count(l) from PostLike l where l.post.id in :postIds group by l.post.id")
    List<Object[]> countByPostIds(@Param("postIds") List<Long> postIds);
}
