import { Menu, Typography } from "antd";
import {
  HomeOutlined,
  MessageOutlined,
  UserOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  ShopOutlined,
  SettingOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { key: "/", icon: <HomeOutlined />, label: "Home" },
    { key: "/chat/100", icon: <MessageOutlined />, label: "Chat" }, // şimdilik test id
    { key: "/profile", icon: <UserOutlined />, label: "Profile" },
    { key: "/notifications", icon: <BellOutlined />, label: "Notifications" },
    { key: "/friends", icon: <TeamOutlined />, label: "Friends" },
    { key: "/videos", icon: <VideoCameraOutlined />, label: "Videos" },
    { key: "/marketplace", icon: <ShopOutlined />, label: "Marketplace" },
    { key: "/settings", icon: <SettingOutlined />, label: "Setting & Privacy" },
  ];

  // selectedKey: route'a göre menüyü aktif yap
  const selectedKey =
    items.find((i) => location.pathname === i.key)?.key ||
    (location.pathname.startsWith("/chat") ? "/chat/100" : location.pathname);

  return (
    <div style={{ padding: 22}}>
      <Typography.Title level={3} style={{ margin: 10 }}>
        Social
      </Typography.Title>

      <div style={{ marginTop:25 }}>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
          onClick={(e) => navigate(e.key)}
          style={{
            borderRight: 0,
            background: "transparent",
            fontSize: 22,
          }}
        />
      </div>
    </div>
  );
}
