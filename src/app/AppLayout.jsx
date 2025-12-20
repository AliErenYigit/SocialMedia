import { Layout, Space, Avatar, Dropdown } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import NotificationBell from "../components/NotificationBell";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { userApi } from "../api/user.api"; // ✅ senin profile fonksiyonun burada

const { Header, Content } = Layout;

export default function AppLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const [username, setUsername] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // ✅ user.api.js içindeki profile fonksiyonun
        const res = await userApi.me();
        const data = res.data?.data ?? res.data;

        if (!cancelled) {
          setUsername(data?.username ?? null);
        }
      } catch {
        if (!cancelled) setUsername(null);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const avatarLetter = (username ?? "U").charAt(0).toUpperCase();

  const menuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profil",
      onClick: () => navigate("/profile"),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Çıkış",
      onClick: () => {
        logout();
        navigate("/login");
      },
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ color: "#fff", fontWeight: 600 }}>MySocialApp</div>

        <Space size={16}>
          <NotificationBell />

          <Dropdown
            menu={{ items: menuItems }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <Avatar
              size={40}
              style={{
                cursor: "pointer",
                backgroundColor: "#1677ff",
                fontWeight: 600,
              }}
            >
              {avatarLetter}
            </Avatar>
          </Dropdown>
        </Space>
      </Header>

      <Content style={{ padding: 24 }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
