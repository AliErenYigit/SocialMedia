import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Card, Divider, Input, List, Space, Typography, message } from "antd";
import { postsApi } from "../api/posts.api";

export default function PostDetail() {
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState(null);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);

  const [liking, setLiking] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await postsApi.detail(id);
      const data = res.data?.data ?? res.data;

      // backend: liked + likeCount geliyor varsayıyoruz
      setPost({
        ...data,
        liked: data?.liked ?? false,
        likeCount: data?.likeCount ?? 0,
      });

      const embeddedComments = data?.comments ?? data?.commentList ?? [];
      setComments(Array.isArray(embeddedComments) ? embeddedComments : []);
    } catch (e) {
      message.error(e?.response?.data?.message || "Post yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const likePost = async () => {
    if (liking) return;

    // optimistic toggle
    const prev = post;
    setPost((p) => {
      if (!p) return p;
      const nextLiked = !p.liked;
      const nextCount = (p.likeCount ?? 0) + (nextLiked ? 1 : -1);
      return { ...p, liked: nextLiked, likeCount: Math.max(0, nextCount) };
    });

    setLiking(true);
    try {
      const res = await postsApi.like(id); // toggle
      const data = res.data?.data ?? res.data; // { postId, liked, likeCount }

      // response ile senkronla (homepage mantığı)
      setPost((p) => {
        if (!p) return p;
        return {
          ...p,
          liked: data?.liked ?? p.liked,
          likeCount: data?.likeCount ?? p.likeCount,
        };
      });
    } catch (e) {
      // rollback
      setPost(prev);
      message.error(e?.response?.data?.message || "Like başarısız");
    } finally {
      setLiking(false);
    }
  };

  const sendComment = async () => {
    if (!commentText.trim()) return message.warning("Yorum boş olamaz");
    try {
      setSending(true);
      await postsApi.comment(id, { content: commentText });
      setCommentText("");
      message.success("Yorum eklendi");
      load();
    } catch (e) {
      message.error(e?.response?.data?.message || "Yorum eklenemedi");
    } finally {
      setSending(false);
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Card loading={loading}>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          Post Detail
        </Typography.Title>

        <div style={{ opacity: 0.7, marginBottom: 6 }}>{post?.username || "User"}</div>
        <div style={{ fontSize: 16 }}>{post?.content || ""}</div>

        <Divider />

        <Space>
          <Button
            type={post?.liked ? "primary" : "default"}
            onClick={likePost}
            loading={liking}
          >
            {post?.liked ? "Liked" : "Like"} {post?.likeCount ?? 0}
          </Button>
        </Space>
      </Card>

      <Card>
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          Comments
        </Typography.Title>

        <Space.Compact style={{ width: "100%", marginBottom: 12 }}>
          <Input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Yorum yaz..."
          />
          <Button type="primary" loading={sending} onClick={sendComment}>
            Gönder
          </Button>
        </Space.Compact>

        <List
          loading={loading}
          dataSource={comments}
          locale={{ emptyText: "Henüz yorum yok" }}
          renderItem={(c) => (
            <List.Item>
              <List.Item.Meta
                title={c.username || "User"}
                description={
                  <div>
                    <div>{c.content ?? ""}</div>
                    <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
