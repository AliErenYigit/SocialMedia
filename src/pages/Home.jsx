import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Button,
  Card,
  Divider,
  Input,
  Layout,
  List,
  Space,
  Typography,
  message,
} from "antd";
import {
  HomeOutlined,
  MessageOutlined,
  UserOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  ShopOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { postsApi } from "../api/posts.api";
import NotificationsWidget from "../components/NotificationsWidget";
import PostCard from "../components/PostCard";

const { Sider, Content } = Layout;

const menuItems = [
  { key: "home", label: "Home", icon: <HomeOutlined />, path: "/" },
  { key: "chat", label: "Chat", icon: <MessageOutlined />, path: "/chat" },
  {
    key: "profile",
    label: "Profile",
    icon: <UserOutlined />,
    path: "/profile",
  },
  {
    key: "friends",
    label: "Friends",
    icon: <TeamOutlined />,
    path: "/friends",
  },
  {
    key: "videos",
    label: "Videos",
    icon: <VideoCameraOutlined />,
    path: "/videos",
  },
  {
    key: "market",
    label: "Marketplace",
    icon: <ShopOutlined />,
    path: "/market",
  },
  {
    key: "settings",
    label: "Setting & Privacy",
    icon: <SettingOutlined />,
    path: "/settings",
  },
];

// şimdilik fake friends — sonra backend bağlarız
const mockFriends = [
  { id: 1, name: "Emily" },
  { id: 2, name: "Fiona" },
  { id: 3, name: "Jennifer" },
  { id: 4, name: "Anne" },
  { id: 5, name: "Andrew" },
  { id: 6, name: "Sonia" },
];

export default function Home() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");

  const load = async () => {
    try {
      setLoading(true);

      // 1) feed listesi
      const res = await postsApi.list();
      const arr = res.data?.content ?? res.data;
      const list = Array.isArray(arr) ? arr : [];

      // 2) detail ile username doldur
      const detailed = await Promise.all(
        list.map(async (p) => {
          try {
            const dres = await postsApi.detail(p.id);
            const data = dres.data?.data ?? dres.data;
            return {
              ...p,
              username: data?.username ?? "User",
              likedByMe: data?.liked ?? data?.likedByMe,
            };
          } catch {
            return { ...p, username: "User" };
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
    // küçük optimistic
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const nextLiked = !p.likedByMe;
        const nextCount = (p.likeCount ?? 0) + (nextLiked ? 1 : -1);
        return {
          ...p,
          likedByMe: nextLiked,
          likeCount: Math.max(0, nextCount),
        };
      })
    );

    try {
      await postsApi.like(postId);
    } catch (e) {
      message.error(e?.response?.data?.message || "Like başarısız");
      load(); // rollback
    }
  };

  const sidebar = useMemo(() => {
    return (
      <div style={{ padding: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Social
        </Typography.Title>

        <Divider style={{ margin: "12px 0" }} />

        <Space direction="vertical" style={{ width: "100%" }} size={4}>
          {menuItems.map((m) => (
            <Button
              key={m.key}
              type="text"
              icon={m.icon}
              onClick={() => navigate(m.path)}
              style={{
                width: "100%",
                justifyContent: "flex-start",
                borderRadius: 10,
                padding: "8px 10px",
              }}
            >
              {m.label}
            </Button>
          ))}
        </Space>

        <Divider style={{ margin: "16px 0 10px" }} />

        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Typography.Text strong>Friends</Typography.Text>
          <Button type="link" size="small" onClick={() => navigate("/friends")}>
            →
          </Button>
        </Space>

        <div style={{ marginTop: 8 }}>
          <List
            dataSource={mockFriends}
            renderItem={(f) => (
              <List.Item style={{ padding: "10px 0" }}>
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <Typography.Text>{f.name}</Typography.Text>
                </Space>
              </List.Item>
            )}
          />
        </div>
      </div>
    );
  }, [navigate]);

  return (
    <Layout style={{ background: "#f5f7fb", minHeight: "calc(100vh - 64px)" }}>
      {/* Sol: Sidebar + Friends */}
      <Sider
        width={280}
        theme="light"
        style={{
          borderRight: "1px solid rgba(0,0,0,0.06)",
          background: "#fff",
        }}
      >
        {sidebar}
      </Sider>

      {/* Orta: Home Feed */}
      <Content style={{ padding: 20 }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <Typography.Title level={4} style={{ marginTop: 0 }}>
            Home
          </Typography.Title>

          <Card style={{ borderRadius: 14 }}>
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

          <div style={{ height: 14 }} />

          <Card style={{ borderRadius: 14 }}>
            <List
              loading={loading}
              dataSource={posts}
              locale={{ emptyText: "Henüz post yok" }}
              renderItem={(item) => (
                <List.Item style={{ border: 0, padding: 0, marginBottom: 14 }}>
                  <PostCard
                    post={item}
                    onLike={likePost}
                    onOpen={(id) => navigate(`/posts/${id}`)}
                  />
                </List.Item>
              )}
            />
          </Card>
        </div>
      </Content>

      {/* Sağ: Notifications (Birthday/Communities yok) */}
      <Sider
        width={400}
        theme="light"
        style={{
          background: "#f5f7fb",
          padding: 20,
        }}
      >
        <div style={{ position: "sticky", top: 20 }}>
          <NotificationsWidget />
        </div>
      </Sider>
    </Layout>
  );
}
