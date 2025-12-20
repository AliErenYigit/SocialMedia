import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Modal,
  Form,
  Input,
  Space,
  Typography,
  message,
} from "antd";
import { SettingOutlined, CameraOutlined } from "@ant-design/icons";
import { userApi } from "../api/user.api";
import { imageApi } from "../api/image.api"; // ✅ yeni
import { getUserIdFromToken } from "../utils/jwt";

export default function Profile() {
  console.log("PROFILE PAGE RENDER");

  const token = localStorage.getItem("auth");
  const userId = getUserIdFromToken(token);

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false); // ✅ yeni
  const fileInputRef = useRef(null); // ✅ yeni

  const loadProfile = async () => {
    if (!userId) {
      message.error("Kullanıcı bilgisi bulunamadı (userId yok)");
      return;
    }

    try {
      setLoading(true);

      const [profileRes, meRes, postCountRes, followersRes, followingRes] =
        await Promise.all([
          userApi.profile(userId),
          userApi.me(),
          userApi.postCount(userId),
          userApi.followerCount(userId),
          userApi.followingCount(userId),
        ]);

      const profileData = profileRes.data?.data ?? profileRes.data;
      const meData = meRes.data?.data ?? meRes.data;
      const postCount = postCountRes.data?.data ?? postCountRes.data ?? 0;

      const followers = followersRes.data?.data ?? followersRes.data ?? 0;
      const following = followingRes.data?.data ?? followingRes.data ?? 0;

      setProfile({
        username: profileData?.username ?? "User", // @ ile olan (profile)
        meData: meData.username, // üstte kalın nick (users tablosu)
        bio: profileData?.bio ?? "",
        avatarUrl: profileData?.avatarUrl ?? meData?.avatarUrl ?? null,


        postCount: Number(postCount) || 0,
        followers: Number(followers) || 0,
        following: Number(following) || 0,
      });
    } catch (e) {
      message.error(e?.response?.data?.message || "Profil yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const onSaveProfile = async (values) => {
    setProfile((prev) => ({
      ...prev,
      bio: values.bio ?? "",
    }));
    setEditOpen(false);
    message.success("Profil güncellendi (şimdilik UI)");
  };

  // ✅ Kamera tıklanınca file picker aç
  const onPickAvatar = () => {
    if (avatarUploading) return;
    fileInputRef.current?.click();
  };

  // ✅ Dosya seçilince upload + profile update
  const onAvatarSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // aynı dosya tekrar seçilebilsin
    if (!file) return;

    // basit doğrulamalar
    if (!file.type.startsWith("image/")) {
      message.error("Lütfen bir resim dosyası seç");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error("Maksimum 5MB yükleyebilirsin");
      return;
    }

    try {
      setAvatarUploading(true);

      // 1) image-service upload
      const upRes = await imageApi.upload(file);
      const upData = upRes.data?.data ?? upRes.data;
      const url = upData?.url;

      if (!url) {
        message.error("Resim yüklendi ama URL alınamadı");
        return;
      }

      // 2) user-service updateMe -> avatarUrl kaydet
      // backend: PATCH /api/v1/user/me  { avatarUrl: "..." }
      await userApi.updateMe({ avatarUrl: url });

      // 3) UI güncelle
      setProfile((prev) => ({
        ...(prev || {}),
        avatarUrl: url,
      }));

      message.success("Profil fotoğrafı güncellendi");
    } catch (err) {
      message.error(err?.response?.data?.message || "Avatar güncellenemedi");
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>
      <Card
        loading={loading}
        style={{ borderRadius: 16 }}
        bodyStyle={{ padding: 24 }}
      >
        {!profile ? null : (
          <Space align="start" size={24} style={{ width: "100%" }}>
            {/* Avatar */}
       <div
  style={{
    position: "relative",
    width: 160,
    height: 160,
  }}
  onMouseEnter={() => setShowCamera(true)}
  onMouseLeave={() => setShowCamera(false)}
>
  <Avatar
    size={160}
    src={profile.avatarUrl || undefined}
    style={{
      background: "rgba(0,0,0,0.12)",
      color: "#000",
      fontWeight: 700,
    }}
  >
    {(profile.username ?? "U").charAt(0).toUpperCase()}
  </Avatar>

  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    style={{ display: "none" }}
    onChange={onAvatarSelected}
  />

  {/* ✅ Kamera sadece hover’da veya avatar yoksa görünsün */}
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
</div>


            {/* Sağ taraf */}
            <div style={{ flex: 1 }}>
              <Space
                align="center"
                style={{ width: "100%", justifyContent: "space-between" }}
              >
                <div>
                  <Typography.Title level={3} style={{ margin: 0 }}>
                    {profile.meData}
                  </Typography.Title>

                  <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                    @{profile.username}
                  </Typography.Text>
                </div>

                <Button
                  shape="circle"
                  icon={<SettingOutlined />}
                  onClick={() => message.info("Ayarlar sonra eklenecek")}
                />
              </Space>

              {/* Sayılar */}
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

              {/* Bio */}
              {profile.bio ? (
                <div style={{ marginTop: 12 }}>
                  <Typography.Text>{profile.bio}</Typography.Text>
                </div>
              ) : null}

              {/* Butonlar */}
              <Space style={{ marginTop: 18, width: "100%" }} size={12}>
                <Button
                  block
                  style={{
                    borderRadius: 12,
                    height: 44,
                    background: "rgba(0,0,0,0.06)",
                  }}
                  onClick={() => setEditOpen(true)}
                >
                  Profili düzenle
                </Button>

                <Button
                  block
                  style={{
                    borderRadius: 12,
                    height: 44,
                    background: "rgba(0,0,0,0.06)",
                  }}
                  onClick={() => message.info("Arşiv sonra eklenecek")}
                >
                  Arşivi gör
                </Button>
              </Space>
            </div>
          </Space>
        )}
      </Card>

      {/* Edit modal */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initialValues={{
          username: profile?.username ?? "",
          bio: profile?.bio ?? "",
        }}
        onSave={onSaveProfile}
      />
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
