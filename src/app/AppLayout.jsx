import { Layout, Button,Space } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import NotificationBell from "../components/NotificationBell";

const { Header, Content } = Layout;

export default function AppLayout() {
    const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Sol taraf: logo / title */}
        <div style={{ color: "#fff", fontWeight: 600 }}>MySocialApp</div>

        {/* Sağ taraf: notification */}
        <Space>
          <NotificationBell />
          <Button onClick={() => { logout(); navigate("/login"); }}>
          Logout
        </Button>
        </Space>
      </Header>

      <Content style={{ padding: 24 }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
