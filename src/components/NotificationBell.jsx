import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Dropdown, List, Space, Typography, message } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../api/notification.api";

export default function NotificationBell() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([]);

  const unreadCount = useMemo(
    () => items.filter((n) => n.read === false).length,
    [items]
  );

  const load = async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.my();
      const data = res.data?.data ?? res.data;
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      message.error(e?.response?.data?.message || "Bildirimler alınamadı");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 7000); // polling
    return () => clearInterval(t);
  }, []);

  const overlay = (
    <div style={{ width: 380, padding: 8 }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Typography.Text strong>Bildirimler</Typography.Text>
        <Button type="link" onClick={() => navigate("/notifications")}>
          Tümünü gör
        </Button>
      </Space>

      <List
        loading={loading}
        dataSource={items.slice(0, 6)}
        locale={{ emptyText: "Bildirim yok" }}
        renderItem={(n) => (
          <List.Item style={{ paddingLeft: 6, paddingRight: 6 }}>
            <List.Item.Meta
              title={
                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: n.read ? 400 : 700 }}>
                    {n.type}
                  </span>
                  <span style={{ opacity: 0.6, fontSize: 12 }}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                  </span>
                </Space>
              }
              description={
                <span style={{ opacity: n.read ? 0.7 : 1 }}>
                  {n.entityType} #{n.entityId} • from {n.actorUserId}
                </span>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) load();
      }}
      dropdownRender={() => overlay}
      trigger={["click"]}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small">
        <Button icon={<BellOutlined />} />
      </Badge>
    </Dropdown>
  );
}
