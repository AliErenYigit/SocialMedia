import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, List, Space, Typography, message } from "antd";
import { BellOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../api/notification.api";

export default function NotificationsWidget() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.my();
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setItems(list.slice(0, 6)); // widget: ilk 6
    } catch (e) {
      message.error(e?.response?.data?.message || "Bildirimler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );

  const renderMessage = (n) => {
    const actor = n.username ?? "User";
    const msg = (n.message ?? "").trim();

    if (!msg) return <span>Bildirim</span>;

    const lowerMsg = msg.toLowerCase();
    const lowerActor = actor.toLowerCase();

    // mesaj actor ile başlıyorsa
    if (lowerMsg.startsWith(lowerActor)) {
      const rest = msg.slice(actor.length).trimStart();
      return (
        <span>
          <span style={{ fontWeight: 750 }}>{actor}</span>{" "}
          <span style={{ fontWeight: 400 }}>{rest}</span>
        </span>
      );
    }

    // değilse: actor + mesaj
    return (
      <span>
        <span style={{ fontWeight: 700 }}>{actor}</span>{" "}
        <span style={{ fontWeight: 400 }}>{msg}</span>
      </span>
    );
  };

  return (
    <Card
      style={{ borderRadius: 14 }}
      title={
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Space>
            <Badge count={unreadCount} size="small">
              <BellOutlined />
            </Badge>
            <Typography.Text strong>Notifications</Typography.Text>
          </Space>

          <Button
            icon={<ReloadOutlined />}
            size="small"
            onClick={load}
            loading={loading}
          />
        </Space>
      }
      extra={
        <Button type="link" onClick={() => navigate("/notifications")}>
          Tümü
        </Button>
      }
    >
      <List
        loading={loading}
        dataSource={items}
        locale={{ emptyText: "Bildirim yok" }}
       renderItem={(n) => {
  const isUnread = !n.read;

  return (
    <List.Item style={{ padding: 0, border: 0 }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          width: "100%",
          padding: "10px 16px",
          borderRadius: 12,
          marginBottom: 15,
          background: isUnread ? "rgba(22,119,255,0.08)" : "transparent",
          border: isUnread
            ? "1px solid rgba(22,119,255,0.18)"
            : "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* ✅ AVATAR (şimdilik placeholder) */}
        <div
          style={{
            width: 39,
            height: 36,
            borderRadius: "80%",
            background: isUnread ? "rgba(22,119,255,0.2)" : "rgba(0,0,0,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            color: "#1677ff",
            flexShrink: 0,
          }}
        >
          {(n.username ?? "U").charAt(0).toUpperCase()}
        </div>

        {/* ✅ CONTENT */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13 }}>
            {renderMessage(n)}
          </div>

          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 5 }}>
            {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
          </div>
        </div>
      </div>
    </List.Item>
  );
}}

      />
    </Card>
  );
}
