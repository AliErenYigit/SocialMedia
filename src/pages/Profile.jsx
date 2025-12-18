import { useEffect, useState } from "react";
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
import { getUserIdFromToken } from "../utils/jwt";

export default function Profile() {
  console.log("PROFILE PAGE RENDER");

  // ✅ localStorage’dan user al
 const token = localStorage.getItem("auth"); 

 const userId = getUserIdFromToken(token);

console.log("USER ID:", userId);



  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadProfile = async () => {
  if (!userId) {
    message.error("Kullanıcı bilgisi bulunamadı (userId yok)");
    return;
  }

  try {
    setLoading(true);

    const [profileRes, followersRes, followingRes] = await Promise.all([
      userApi.profile(userId),
      userApi.followerCount(userId),
      userApi.followingCount(userId),
    ]);

    const profileData = profileRes.data?.data ?? profileRes.data;

    const followers = followersRes.data?.data ?? followersRes.data ?? 0;
    const following = followingRes.data?.data ?? followingRes.data ?? 0;

    setProfile({
      username: profileData?.username ?? "User",
      bio: profileData?.bio ?? "",
      avatarUrl: profileData?.avatarUrl ?? null,

      // postCount şimdilik profile endpointinden geliyorsa kalsın
      posts: profileData?.posts ?? profileData?.postCount ?? 0,

      // ✅ artık follow endpointlerinden
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
    // şimdilik sadece UI
    setProfile((prev) => ({
      ...prev,
      bio: values.bio ?? "",
    }));
    setEditOpen(false);
    message.success("Profil güncellendi (şimdilik UI)");
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>
      <Card loading={loading} style={{ borderRadius: 16 }} bodyStyle={{ padding: 24 }}>
        {!profile ? null : (
          <Space align="start" size={24} style={{ width: "100%" }}>
            {/* Avatar */}
            <div style={{ position: "relative" }}>
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

              <button
                onClick={() => message.info("Avatar upload sonra eklenecek")}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.9)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                }}
                title="Profil fotoğrafı"
              >
                <CameraOutlined style={{ fontSize: 22 }} />
              </button>
            </div>

            {/* Sağ taraf */}
            <div style={{ flex: 1 }}>
              <Space
                align="center"
                style={{ width: "100%", justifyContent: "space-between" }}
              >
                <div>
                  <Typography.Title level={3} style={{ margin: 0 }}>
                    {profile.username}
                  </Typography.Title>
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
                  <Typography.Text strong>{profile.posts}</Typography.Text>{" "}
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
