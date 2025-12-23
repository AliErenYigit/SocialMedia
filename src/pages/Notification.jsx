import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Empty,
  List,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import {
  BellOutlined,
  CheckOutlined,
  ReloadOutlined,
  HeartFilled,
  MessageFilled,
  UserAddOutlined,
} from "@ant-design/icons";
import { notificationsApi } from "../api/notification.api";

const typeMeta = (type) => {
  switch (type) {
    case "POST_LIKED":
      return { icon: <HeartFilled />, tag: <Tag>Beğeni</Tag> };
    case "COMMENT_CREATED":
      return { icon: <MessageFilled />, tag: <Tag>Yorum</Tag> };
    case "FOLLOW_CREATED":
      return { icon: <UserAddOutlined />, tag: <Tag>Takip</Tag> };
    default:
      return { icon: <BellOutlined />, tag: <Tag>Bildirim</Tag> };
  }
};

export default function Notifications() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.my();

      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      setItems(list);
    } catch (e) {
      message.error(e?.response?.data?.message || "Bildirimler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );

  const markRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      message.error(e?.response?.data?.message || "Okundu işaretlenemedi");
    }
  };

  // opsiyonel: tek tek uğraşma yerine hızlıca okundu yap
  const markAllRead = async () => {
    const unread = items.filter((n) => !n.read);
    if (unread.length === 0) return;

    try {
      // backend’de toplu endpoint yoksa paralel çağırıyoruz
      await Promise.all(unread.map((n) => notificationsApi.markRead(n.id)));
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      message.success("Tümü okundu");
    } catch (e) {
      message.error(e?.response?.data?.message || "Tümü okundu yapılamadı");
    }
  };

  const openEntity = (n) => {
    // entityId = postId varsayıyoruz
    if (n?.entityId) navigate(`/posts/${n.entityId}`);
  };

  const renderMessage = (n) => {
    const actor = n.username ?? "User";
    const msg = (n.message ?? "").trim();

    // message içinde actor zaten varsa tekrar etmeyelim
    // örn: "ali seni takip etmeye başladı." geldiği için sadece kalınlaştıracağız
    if (!msg) return <span>Bildirim</span>;

    // actor ismi message’in başındaysa, gerisini normal yaz
    const lowerMsg = msg.toLowerCase();
    const lowerActor = actor.toLowerCase();
    if (lowerMsg.startsWith(lowerActor)) {
      const rest = msg.slice(actor.length).trimStart();
      return (
        <span>
          <span style={{ fontWeight: 700 }}>{actor}</span>{" "}
          <span style={{ fontWeight: 400 }}>{rest}</span>
        </span>
      );
    }

    // değilse: actor + message
    return (
      <span>
        <span style={{ fontWeight: 700 }}>{actor}</span>{" "}
        <span style={{ fontWeight: 400 }}>{msg}</span>
      </span>
    );
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      {/* Header */}
      <Card styles={{ body: { padding: 16 } }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Space align="center">
            <Badge count={unreadCount} size="small">
              <BellOutlined style={{ fontSize: 18 }} />
            </Badge>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Bildirimler
            </Typography.Title>
          </Space>

          <Space>
            <Button
              icon={<CheckOutlined />}
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              Tümünü okundu yap
            </Button>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              Yenile
            </Button>
          </Space>
        </Space>
      </Card>

      {/* List */}
      <Card styles={{ body: { padding: 0 } }}>
        <List
          loading={loading}
          dataSource={items}
          locale={{
            emptyText: (
              <div style={{ padding: 24 }}>
                <Empty description="Bildirim yok" />
              </div>
            ),
          }}
          renderItem={(n) => {
            const meta = typeMeta(n.type);
            const isUnread = !n.read;

            return (
              <List.Item
                onClick={() => openEntity(n)}
                style={{
                  cursor: n?.entityId ? "pointer" : "default",
                  padding: "14px 16px",
                  borderLeft: isUnread
                    ? "4px solid rgba(22,119,255,1)"
                    : "4px solid transparent",
                  background: isUnread
                    ? "rgba(22,119,255,0.06)"
                    : "transparent",
                }}
                actions={[
                  <Button
                    key="read"
                    type={isUnread ? "primary" : "default"}
                    onClick={(e) => {
                      e.stopPropagation();
                      markRead(n.id);
                    }}
                    disabled={!isUnread}
                    style={{ width: 140 }} // ✅ SABİT GENİŞLİK
                  >
                    {isUnread ? "Okundu işaretle" : "Okundu"}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        display: "grid",
                        placeItems: "center",
                        background: "rgba(0,0,0,0.04)",
                        fontSize: 16,
                      }}
                    >
                      {meta.icon}
                    </div>
                  }
                  title={
                    <Space
                      style={{ width: "100%", justifyContent: "space-between" }}
                      align="start"
                    >
                      <Space direction="vertical" size={2}>
                        <Space size={8}>
                          {meta.tag}
                          {!n.read ? <Tag color="blue">Yeni</Tag> : null}
                        </Space>

                        <div style={{ fontSize: 14 }}>{renderMessage(n)}</div>

                        {n.entityId ? (
                            <div style={{ width: 180, textAlign: "left" }}>
                        <div
                          style={{
                            opacity: 0.6,
                            fontSize: 12,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleString("tr-TR", "dd/MM/yyyy", {
                                dateStyle: "short",
                                timeStyle: "short",
                                timeZone: "Europe/Istanbul",
                                
                              })
                            : ""}
                        </div>
                      </div>
                        ) : null}
                      </Space>

                    
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>
    </Space>
  );
}
