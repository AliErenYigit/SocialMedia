import { useEffect, useState } from "react";
import { Button, Card, Input, List, Space, Typography, message } from "antd";
import { postsApi } from "../api/posts.api";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await postsApi.list();
      // backend bazen {content:[...]} / bazen direkt [...] döner
      const data = res.data?.content ?? res.data;
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      message.error(e?.response?.data?.message || "Posts yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
      await postsApi.like(postId);
      load();
    } catch (e) {
      message.error(e?.response?.data?.message || "Like başarısız");
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Card>
        <Typography.Title level={4} style={{ marginTop: 0 }}>Feed</Typography.Title>

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
                <Button key="like" onClick={() => likePost(item.id)}>
                  Like {item.likeCount ?? ""}
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={item.user?.username || item.author?.username || "User"}
                description={item.content || item.text}
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
