import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input, List, Space, Typography, message } from "antd";
import { postsApi } from "../api/posts.api";

export default function Home() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");

  const load = async () => {
    try {
      setLoading(true);

      // 1) önce feed listesi
      const res = await postsApi.list();
      const arr = res.data?.content ?? res.data;
      const list = Array.isArray(arr) ? arr : [];

      // 2) her post için detail çek → username doldur
      const detailed = await Promise.all(
        list.map(async (p) => {
          try {
            const dres = await postsApi.detail(p.id);
            const data = dres.data?.data ?? dres.data;

            return {
              ...p,
              username: data?.username ?? "User",
              liked: data?.liked ?? p?.liked ?? false,
              likeCount: data?.likeCount ?? p?.likeCount ?? 0,
            };
          } catch {
            return {
              ...p,
              username: "User",
              liked: p?.liked ?? false,
              likeCount: p?.likeCount ?? 0,
            };
          }
        })
      );

      setPosts(detailed);
    } catch (e) {
      message.error(e?.response?.data?.message || "Posts yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createPost = async () => {
    if (!content.trim()) return message.warning("Post boş olamaz");
    try {
      setCreating(true);
      await postsApi.create({ content });
      setContent("");
      message.success("Post paylaşıldı");
      load();
    } catch (e) {
      message.error(e?.response?.data?.message || "Post oluşturulamadı");
    } finally {
      setCreating(false);
    }
  };

  const likePost = async (postId) => {
    try {
      const res = await postsApi.like(postId);

      const data = res.data?.data ?? res.data; // sende nasıl dönüyorsa
      // data: { postId, liked, likeCount }

      setPosts((prev) =>
        prev.map((p) =>
          p.id !== postId
            ? p
            : {
                ...p,
                liked: data?.liked ?? !p.liked, // fallback
                likeCount: data?.likeCount ?? p.likeCount,
              }
        )
      );
    } catch (e) {
      message.error(e?.response?.data?.message || "Like başarısız");
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Card>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          Feed
        </Typography.Title>

        <Space.Compact style={{ width: "100%" }}>
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ne düşünüyorsun?"
          />
          <Button type="primary" loading={creating} onClick={createPost}>
            Paylaş
          </Button>
        </Space.Compact>
      </Card>

      <Card>
        <List
          loading={loading}
          dataSource={posts}
          locale={{ emptyText: "Henüz post yok" }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="detail"
                  onClick={() => navigate(`/posts/${item.id}`)}
                >
                  Yorumlar
                </Button>,
                <Button
                  key="like"
                  type={item.liked ? "primary" : "default"}
                  onClick={() => likePost(item.id)}
                >
                  Like {item.likeCount ?? 0}
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space direction="vertical" size={0}>
                    <span style={{ fontWeight: 600 }}>
                      {item.username || "User"}
                    </span>
                    <span style={{ opacity: 0.6, fontSize: 12 }}>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : ""}
                    </span>
                  </Space>
                }
                description={
                  <span
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/posts/${item.id}`)}
                  >
                    {item.content || ""}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
