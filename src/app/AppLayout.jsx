import { Layout, Space, Avatar, Dropdown } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import NotificationBell from "../components/NotificationBell";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { userApi } from "../api/user.api";
import Sidebar from "../components/Sidebar";

const { Header, Content, Sider } = Layout;

export default function AppLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  // ✅ username + avatarUrl birlikte tut
  const [me, setMe] = useState({ username: null, avatarUrl: null });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await userApi.me();
        const data = res.data?.data ?? res.data;

        if (!cancelled) {
          setMe({
            username: data?.username ?? null,
            avatarUrl: data?.avatarUrl ?? null,
          });
        }
      } catch {
        if (!cancelled) setMe({ username: null, avatarUrl: null });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const avatarLetter = (me.username ?? "U").charAt(0).toUpperCase();

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
      {/* ✅ TOP NAVBAR (full width) */}
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
          width: "100%",
        }}
      >
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
          MySocialApp
        </div>

        <Space size={16}>
          <NotificationBell />

          <Dropdown
            menu={{ items: menuItems }}
            placement="bottomRight"
            trigger={["click"]}
          >
            {/* ✅ avatar varsa resmi göster, yoksa harf */}
            <Avatar
              size={40}
              src={me.avatarUrl || undefined}
              style={{
                cursor: "pointer",
                backgroundColor: me.avatarUrl ? "transparent" : "#1677ff",
                fontWeight: 600,
              }}
            >
              {!me.avatarUrl && avatarLetter}
            </Avatar>
          </Dropdown>
        </Space>
      </Header>

      {/* ✅ BODY: Sidebar left + Content right */}
      <Layout>
        <Sider
          width={300}
          style={{
            background: "#fff",
            borderRight: "1px solid #f0f0f0",
          }}
        >
          <Sidebar />
        </Sider>

        <Content style={{ padding: 24, background: "#f7f7f8" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
