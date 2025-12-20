import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Input,
  Layout,
  List,
  Space,
  Typography,
  message,
  Upload,
} from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";

import { postsApi } from "../api/posts.api";
import { userApi } from "../api/user.api";
import NotificationsWidget from "../components/NotificationsWidget";
import PostCard from "../components/PostCard";

const { Sider, Content } = Layout;
const { TextArea } = Input;

const IMAGE_PUBLIC_BASE = "http://localhost:8087";

function normalizeAvatarUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  if (trimmed.startsWith("/")) return `${IMAGE_PUBLIC_BASE}${trimmed}`;
  return `${IMAGE_PUBLIC_BASE}/${trimmed}`;
}

function pickAuthorId(p) {
  return (
    p.userId ?? p.authorId ?? p.ownerId ?? p.authUserId ?? p.createdBy ?? null
  );
}

export default function Home() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [posts, setPosts] = useState([]);

  // composer
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showMedia, setShowMedia] = useState(false);

  // ✅ cleanup preview url
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const removeFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const onPickFile = (info) => {
    const picked = info?.file?.originFileObj || info?.file;
    if (!picked) return;

    // bazı antd versiyonlarında file objesi farklı gelebiliyor
    const realFile =
      picked instanceof File ? picked : picked?.originFileObj || null;
    const f = realFile || picked;
    if (!f) return;

    setFile(f);
    setShowMedia(true); // ✅ dosya seçilince medya alanı otomatik açık kalsın

    // eski preview temizle
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (f.type?.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
  };

  const load = async () => {
    try {
      setLoading(true);

      const res = await postsApi.list();
      const arr = res.data?.content ?? res.data;
      const list = Array.isArray(arr) ? arr : [];

      const basePosts = list.map((p) => ({
        ...p,
        authorId: pickAuthorId(p),
        imageUrl: p.imageUrl ?? p.ImageUrl ?? null, // ✅ normalize
      }));
      const uniqIds = Array.from(
        new Set(
          basePosts
            .map((p) => Number(p.authorId))
            .filter(
              (id) => id !== null && id !== undefined && !Number.isNaN(id)
            )
        )
      );

      const profileMap = new Map();

      await Promise.allSettled(
        uniqIds.map(async (id) => {
          const pres = await userApi.getProfileById(id);
          const data = pres?.data?.data ?? pres?.data ?? pres;

          profileMap.set(id, {
            username: data?.username ?? `user_${id}`,
            avatarUrl: normalizeAvatarUrl(data?.avatarUrl),
          });
        })
      );

      const enriched = basePosts.map((p) => {
        const id = Number(p.authorId);
        const prof = profileMap.get(id);

        return {
          ...p,
          username: prof?.username ?? p.username ?? "User",
          avatarUrl: prof?.avatarUrl ?? null,
        };
      });

      setPosts(enriched);
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
    const hasText = !!content.trim();
    const hasFile = !!file;

    if (!hasText && !hasFile) {
      return message.warning("Paylaşım boş olamaz");
    }

    try {
      setCreating(true);

      if (hasFile) {
        const formData = new FormData();
        formData.append("content", content || "");
        formData.append("file", file);
        await postsApi.createWithFile(formData);
      } else {
        await postsApi.create({ content });
      }

      // ✅ reset composer
      setContent("");
      removeFile();
      setShowMedia(false);

      message.success("Post paylaşıldı");
      load();
    } catch (e) {
      message.error(e?.response?.data?.message || "Post oluşturulamadı");
    } finally {
      setCreating(false);
    }
  };

  const likePost = async (postId) => {
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
      load();
    }
  };

  const uploadHint = useMemo(() => {
    if (!showMedia) return null;
    if (file) return null;
    return (
      <Typography.Text
        type="secondary"
        style={{ display: "block", marginTop: 10 }}
      >
        İstersen bir resim veya belge ekleyebilirsin.
      </Typography.Text>
    );
  }, [showMedia, file]);

  return (
    <Layout style={{ background: "#f5f7fb", minHeight: "calc(100vh - 64px)" }}>
      <Content style={{ padding: 20 }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <Typography.Title level={4} style={{ marginTop: 0 }}>
            Home
          </Typography.Title>

          {/* ✅ Composer */}
          <Card style={{ borderRadius: 14 }}>
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              <TextArea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Ne düşünüyorsun?"
                autoSize={{ minRows: 2, maxRows: 6 }}
              />

              {/* ✅ actions row */}
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Space>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => setShowMedia((p) => !p)}
                  >
                    Medya ekle
                  </Button>

                  {file ? (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={removeFile}
                    >
                      Kaldır
                    </Button>
                  ) : null}
                </Space>

                <Button type="primary" loading={creating} onClick={createPost}>
                  Paylaş
                </Button>
              </Space>

              {/* ✅ media area (default hidden) */}
              {showMedia ? (
                <div
                  style={{
                    border: "1px dashed #d9d9d9",
                    borderRadius: 12,
                    padding: 12,
                    background: "#fafafa",
                  }}
                >
                  <Upload
                    accept="image/*,.pdf,.doc,.docx"
                    maxCount={1}
                    beforeUpload={() => false}
                    showUploadList={false}
                    onChange={onPickFile}
                  >
                    <Button icon={<UploadOutlined />}>Resim / Dosya seç</Button>
                  </Upload>

                  {/* preview */}
                  {file ? (
                    <div style={{ marginTop: 12 }}>
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="preview"
                          style={{
                            width: "100%",
                            maxHeight: 320,
                            objectFit: "cover",
                            borderRadius: 12,
                            display: "block",
                          }}
                        />
                      ) : (
                        <Typography.Text type="secondary">
                          Seçilen dosya: <b>{file.name}</b>
                        </Typography.Text>
                      )}
                    </div>
                  ) : (
                    uploadHint
                  )}
                </div>
              ) : null}
            </Space>
          </Card>

          <div style={{ height: 14 }} />

          {/* ✅ Feed */}
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
