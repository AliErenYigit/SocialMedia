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

  const load = async () => {
    try {
      setLoading(true);
      const res = await postsApi.detail(id);
      const data = res.data?.data ?? res.data;

      setPost(data);

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
  }, [id]);

  const likePost = async () => {
    try {
      await postsApi.like(id);
      load();
    } catch (e) {
      message.error(e?.response?.data?.message || "Like başarısız");
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

        <div style={{ opacity: 0.7, marginBottom: 6 }}>
          {post?.username || "User"}
        </div>

        <div style={{ fontSize: 16 }}>
          {post?.content || ""}
        </div>

        <Divider />

        <Space>
          <Button onClick={likePost}>
            Like {post?.likeCount ?? 0}
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
