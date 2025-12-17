import { Layout, Button } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

const { Header, Content } = Layout;

export default function AppLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ color: "white", fontWeight: 600, cursor: "pointer" }} onClick={() => navigate("/")}>
          Social App
        </div>
        <Button onClick={() => { logout(); navigate("/login"); }}>
          Logout
        </Button>
      </Header>

      <Content style={{ padding: 24, maxWidth: 1000, margin: "0 auto", width: "100%" }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
