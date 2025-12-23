import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Space,
  Typography,
  message,
  List,
  Divider,
} from "antd";
import { SettingOutlined, CameraOutlined } from "@ant-design/icons";

import { userApi } from "../api/user.api";
import { imageApi } from "../api/image.api";
import { postsApi } from "../api/posts.api";
import PostCard from "../components/PostCard";
import { getUserIdFromToken } from "../utils/jwt";

const IMAGE_PUBLIC_BASE = "http://localhost:8087";

function normalizeAvatarUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return `${IMAGE_PUBLIC_BASE}${trimmed}`;
  return `${IMAGE_PUBLIC_BASE}/${trimmed}`;
}

function pickAuthorId(p) {
  return p.userId ?? p.authorId ?? p.ownerId ?? p.authUserId ?? p.createdBy ?? null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { userId: routeUserId } = useParams();

  const token = localStorage.getItem("auth");
  const myUserId = Number(getUserIdFromToken(token));
  const viewedUserId = routeUserId ? Number(routeUserId) : myUserId;

  const isMe = useMemo(() => Number(viewedUserId) === Number(myUserId), [viewedUserId, myUserId]);

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  // follow state (senin mevcut yapın)
  const [followingIds, setFollowingIds] = useState([]);
  const [followLoading, setFollowLoading] = useState(false);

  // posts state
  const [postsLoading, setPostsLoading] = useState(false);
  const [posts, setPosts] = useState([]);

  const loadFollowingIds = async () => {
    try {
      const res = userApi.followingIds
        ? await userApi.followingIds(1, 5000)
        : await userApi.followers(1, 5000);

      const ids =
        Array.isArray(res.data) ? res.data :
        Array.isArray(res.data?.data) ? res.data.data :
        Array.isArray(res.data?.ids) ? res.data.ids :
        [];

      setFollowingIds(ids.map((x) => Number(x)));
    } catch (e) {
      // çok spam olmasın diye sessiz de geçilebilir
      message.error(e?.response?.data?.message || "Takip listesi alınamadı");
    }
  };

  const loadProfile = async () => {
    if (!viewedUserId) return;

    try {
      setLoading(true);

      if (isMe) {
        const [profileRes, meRes, postCountRes, followersRes, followingRes] =
          await Promise.all([
            userApi.profile(myUserId),
            userApi.me(),
            userApi.postCount(myUserId),
            userApi.followerCount(myUserId),
            userApi.followingCount(myUserId),
          ]);

        const profileData = profileRes.data?.data ?? profileRes.data;
        const meData = meRes.data?.data ?? meRes.data;

        setProfile({
          username: profileData?.username ?? "User",     // profile nick (@)
          meData: meData?.username ?? "User",            // users username (kalın)
          bio: profileData?.bio ?? "",
          avatarUrl: profileData?.avatarUrl ?? meData?.avatarUrl ?? null,
          userId: Number(myUserId),
          postCount: Number(postCountRes.data?.data ?? postCountRes.data ?? 0) || 0,
          followers: Number(followersRes.data?.data ?? followersRes.data ?? 0) || 0,
          following: Number(followingRes.data?.data ?? followingRes.data ?? 0) || 0,
        });

        return;
      }

      const [profileInfoRes, userInfoRes, postCountRes, followersRes, followingRes] =
        await Promise.all([
          userApi.getProfileById(viewedUserId), // profile tablosu
          userApi.profile(viewedUserId),        // users tablosu
          userApi.postCount(viewedUserId),
          userApi.followerCount(viewedUserId),
          userApi.followingCount(viewedUserId),
        ]);

      const profileInfo = profileInfoRes.data?.data ?? profileInfoRes.data;
      const userInfo = userInfoRes.data?.data ?? userInfoRes.data;

      setProfile({
        username: profileInfo?.username ?? "User", // profile nick (@)
        meData: userInfo?.username ?? "User",      // users username (kalın)
        bio: profileInfo?.bio ?? "",
        avatarUrl: profileInfo?.avatarUrl ?? null,
        userId: Number(viewedUserId),
        postCount: Number(postCountRes.data?.data ?? postCountRes.data ?? 0) || 0,
        followers: Number(followersRes.data?.data ?? followersRes.data ?? 0) || 0,
        following: Number(followingRes.data?.data ?? followingRes.data ?? 0) || 0,
      });
    } catch (e) {
      message.error(e?.response?.data?.message || "Profil yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Home’daki mantığın aynısı: postları çek + author profile ile enrich et
  const loadPosts = async () => {
    if (!viewedUserId) return;

    try {
      setPostsLoading(true);

      const res = isMe ? await postsApi.listMine() : await postsApi.listByUser(viewedUserId);

      const arr = res.data?.content ?? res.data;
      const list = Array.isArray(arr) ? arr : [];

      const basePosts = list.map((p) => ({
        ...p,
        authorId: pickAuthorId(p),
        imageUrl: p.imageUrl ?? p.ImageUrl ?? null,
      }));

      const uniqIds = Array.from(
        new Set(
          basePosts
            .map((p) => Number(p.authorId))
            .filter((id) => id !== null && id !== undefined && !Number.isNaN(id))
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
      message.error(e?.response?.data?.message || "Gönderiler yüklenemedi");
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadFollowingIds();
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedUserId]);

  const isFollowing = useMemo(() => {
    if (!profile?.userId) return false;
    return followingIds.includes(Number(profile.userId));
  }, [followingIds, profile?.userId]);

  const toggleFollow = async () => {
    if (!profile?.userId) return;

    try {
      setFollowLoading(true);

      if (isFollowing) {
        await userApi.unfollowById(profile.userId);
        setFollowingIds((prev) => prev.filter((id) => id !== Number(profile.userId)));
        setProfile((prev) => prev ? { ...prev, followers: Math.max(0, Number(prev.followers) - 1) } : prev);
        message.success("Takip bırakıldı");
      } else {
        await userApi.followById(profile.userId);
        setFollowingIds((prev) => [...prev, Number(profile.userId)]);
        setProfile((prev) => prev ? { ...prev, followers: Number(prev.followers) + 1 } : prev);
        message.success("Takip edildi");
      }
    } catch (e) {
      message.error(e?.response?.data?.message || "İşlem başarısız");
    } finally {
      setFollowLoading(false);
    }
  };

  const onPickAvatar = () => {
    if (!isMe) return;
    if (avatarUploading) return;
    fileInputRef.current?.click();
  };

  const onAvatarSelected = async (e) => {
    if (!isMe) return;

    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) return message.error("Lütfen bir resim dosyası seç");
    if (file.size > 5 * 1024 * 1024) return message.error("Maksimum 5MB yükleyebilirsin");

    try {
      setAvatarUploading(true);

      const upRes = await imageApi.upload(file);
      const upData = upRes.data?.data ?? upRes.data;
      const url = upData?.url;
      if (!url) return message.error("Resim yüklendi ama URL alınamadı");

      await userApi.updateMe({ avatarUrl: url });
      setProfile((prev) => ({ ...(prev || {}), avatarUrl: url }));
      message.success("Profil fotoğrafı güncellendi");
    } catch (err) {
      message.error(err?.response?.data?.message || "Avatar güncellenemedi");
    } finally {
      setAvatarUploading(false);
    }
  };

  const onSaveProfile = async (values) => {
    setProfile((prev) => ({ ...prev, bio: values.bio ?? "" }));
    setEditOpen(false);
    message.success("Profil güncellendi (şimdilik UI)");
  };

  // Home ile aynı like mantığı (optimistic)
  const likePost = async (postId) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const nextLiked = !p.likedByMe;
        const nextCount = (p.likeCount ?? 0) + (nextLiked ? 1 : -1);
        return { ...p, likedByMe: nextLiked, likeCount: Math.max(0, nextCount) };
      })
    );

    try {
      await postsApi.like(postId);
    } catch (e) {
      message.error(e?.response?.data?.message || "Like başarısız");
      loadPosts();
    }
  };

  return (
    <div style={{ maxWidth: 810, margin: "0 auto", padding: 20 }}>
      {/* Profile Header */}
      <Card loading={loading} style={{ borderRadius: 16 }} bodyStyle={{ padding: 24 }}>
        {!profile ? null : (
          <Space align="start" size={24} style={{ width: "100%" }}>
            {/* Avatar */}
            <div
              style={{ position: "relative", width: 160, height: 160 }}
              onMouseEnter={() => isMe && setShowCamera(true)}
              onMouseLeave={() => isMe && setShowCamera(false)}
            >
              <Avatar
                size={160}
                src={profile.avatarUrl || undefined}
                style={{ background: "rgba(0,0,0,0.12)", color: "#000", fontWeight: 700 }}
              >
                {(profile.username ?? "U").charAt(0).toUpperCase()}
              </Avatar>

              {isMe ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={onAvatarSelected}
                  />

                  {(showCamera || !profile.avatarUrl) && (
                    <button
                      onClick={onPickAvatar}
                      disabled={avatarUploading}
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 54,
                        height: 54,
                        borderRadius: "50%",
                        border: "none",
                        cursor: avatarUploading ? "not-allowed" : "pointer",
                        background: "rgba(255,255,255,0.9)",
                        display: "grid",
                        placeItems: "center",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      }}
                      title="Profil fotoğrafı"
                    >
                      <CameraOutlined style={{ fontSize: 22 }} />
                    </button>
                  )}
                </>
              ) : null}
            </div>

            {/* Right */}
            <div style={{ flex: 1 }}>
              <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
                <div>
                  <Typography.Title level={3} style={{ margin: 0 }}>
                    {profile.meData}
                  </Typography.Title>
                  <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                    @{profile.username}
                  </Typography.Text>
                </div>

                {isMe ? (
                  <Button
                    shape="circle"
                    icon={<SettingOutlined />}
                    onClick={() => message.info("Ayarlar sonra eklenecek")}
                  />
                ) : null}
              </Space>

              <Space size={24} style={{ marginTop: 14 }}>
                <div>
                  <Typography.Text strong>{profile.postCount}</Typography.Text>{" "}
                  <Typography.Text>gönderi</Typography.Text>
                </div>
                <div>
                  <Typography.Text strong>{profile.followers}</Typography.Text>{" "}
                  <Typography.Text>takipçi</Typography.Text>
                </div>
                <div>
                  <Typography.Text strong>{profile.following}</Typography.Text>{" "}
                  <Typography.Text>takip</Typography.Text>
                </div>
              </Space>

              {profile.bio ? (
                <div style={{ marginTop: 12 }}>
                  <Typography.Text>{profile.bio}</Typography.Text>
                </div>
              ) : null}

              <Space style={{ marginTop: 18, width: "100%" }} size={12}>
                {isMe ? (
                  <Button
                    block
                    style={{ borderRadius: 12, height: 44, background: "rgba(0,0,0,0.06)" }}
                    onClick={() => setEditOpen(true)}
                  >
                    Profili düzenle
                  </Button>
                ) : (
                  <Button
                    block
                    type={isFollowing ? "default" : "primary"}
                    loading={followLoading}
                    style={{ borderRadius: 12, height: 44 }}
                    onClick={toggleFollow}
                  >
                    {isFollowing ? "Takibi Bırak" : "Takip Et"}
                  </Button>
                )}
              </Space>
            </div>
          </Space>
        )}
      </Card>

      {/* Posts Section */}
      <Card style={{ borderRadius: 16, marginTop: 14 }} bodyStyle={{ padding: 16 }}>
        <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
          <Typography.Title level={6} style={{ margin: 0 }}>
            Gönderiler
          </Typography.Title>

          <Button onClick={loadPosts} disabled={postsLoading}>
            Yenile
          </Button>
        </Space>

        <Divider style={{ margin: "12px 0" }} />

        <List
          loading={postsLoading}
          dataSource={posts}
          locale={{ emptyText: "Henüz gönderi yok" }}
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

      {/* Edit modal only for me */}
      {isMe ? (
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          initialValues={{ username: profile?.username ?? "", bio: profile?.bio ?? "" }}
          onSave={onSaveProfile}
        />
      ) : null}
    </div>
  );
}

function EditProfileModal({ open, onClose, initialValues, onSave }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) form.setFieldsValue(initialValues);
  }, [open, initialValues, form]);

  return (
    <Modal
      title="Profili düzenle"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Kaydet"
      cancelText="Vazgeç"
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onSave}>
        <Form.Item label="Kullanıcı adı" name="username">
          <Input disabled />
        </Form.Item>
        <Form.Item label="Bio" name="bio">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
