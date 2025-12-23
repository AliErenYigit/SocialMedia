import { Card, Form, Input, Button, Typography, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const onFinish = async (values) => {
    try {
      const res = await authApi.login(values);
      // Beklenti: { token, user } (backend'in response'una göre uyarlayabiliriz)
     const token =
  res.data?.token ||
  res.data?.accessToken ||
  res.data?.jwt ||
  res.data?.data?.token ||
  res.data?.data?.accessToken;

const user = res.data?.user || res.data?.data?.user;

if (!token) throw new Error("Token gelmedi (login response'u kontrol et)");
setAuth({ token, user });
      navigate("/");
    } catch (e) {
      message.error(e?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 24 }}>
      <Card style={{ width: 380 }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>Login</Typography.Title>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>Login</Button>
        </Form>

        <div style={{ marginTop: 12 }}>
          No account? <Link to="/register">Register</Link>
        </div>
      </Card>
    </div>
  );
}
