package com.alieren.post.posts;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {
    List<PostComment> findByPostIdOrderByCreatedAtAsc(Long postId);
    long countByPostId(Long postId);

    @Query("select c.post.id, count(c) from PostComment c where c.post.id in :postIds group by c.post.id")
    List<Object[]> countByPostIds(@Param("postIds") List<Long> postIds);
}
