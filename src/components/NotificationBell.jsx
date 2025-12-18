import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Divider,
  List,
  Popover,
  Space,
  Typography,
  message,
} from "antd";
import { BellOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../api/notification.api";

const renderMessage = (n) => {
  const actor = n.username ?? "User";
  const msg = (n.message ?? "").trim();
  if (!msg) return <span>Bildirim</span>;

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

  return (
    <span>
      <span style={{ fontWeight: 700 }}>{actor}</span>{" "}
      <span style={{ fontWeight: 400 }}>{msg}</span>
    </span>
  );
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
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
      setItems(list);
    } catch (e) {
      message.error(e?.response?.data?.message || "Bildirimler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ilk açılışta hazır olsun
    load();
  }, []);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );
  const top = items.slice(0, 6);

  const content = (
    <div style={{ width: 360 }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Typography.Text strong>Bildirimler</Typography.Text>
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
          >
            Tümünü gör
          </Button>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={load}
          />
        </Space>
      </Space>

      <Divider style={{ margin: "10px 0" }} />

      <List
        loading={loading}
        dataSource={top}
        locale={{ emptyText: "Bildirim yok" }}
        renderItem={(n) => {
          const isUnread = !n.read;
          return (
            <List.Item style={{ padding: 0, border: 0 }}>
              <div
                onClick={async () => {
                  try {
                    // ✅ önce okundu yap (sadece okunmamışsa)
                    if (!n.read) {
                      await notificationsApi.markRead(n.id);

                      // ✅ local state güncelle (badge düşsün)
                      setItems((prev) =>
                        prev.map((x) =>
                          x.id === n.id ? { ...x, read: true } : x
                        )
                      );
                    }
                  } catch (e) {
                    message.error(
                      e?.response?.data?.message || "Okundu işaretlenemedi"
                    );
                    // hata olsa bile yönlendirelim mi? (ben yönlendiriyorum)
                  } finally {
                    setOpen(false);

                    // ✅ sonra yönlendir
                    if (n.entityId) navigate(`/posts/${n.entityId}`);
                    else navigate("/notifications");
                  }
                }}
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

      {items.length > 6 ? (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <Button
            type="link"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
          >
            Daha fazla göster
          </Button>
        </div>
      ) : null}
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) load(); // açılınca tazele
      }}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small">
        <Button shape="circle" icon={<BellOutlined />} />
      </Badge>
    </Popover>
  );
}
