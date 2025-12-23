import { Card, Form, Input, Button, Typography, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth.api";

export default function Register() {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      await authApi.register(values);
      message.success("Registered! Please login.");
      navigate("/login");
    } catch (e) {
      message.error(e?.response?.data?.message || "Register failed");
    }
  };

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 24 }}>
      <Card style={{ width: 380 }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>Register</Typography.Title>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>Create account</Button>
        </Form>

        <div style={{ marginTop: 12 }}>
          Have an account? <Link to="/login">Login</Link>
        </div>
      </Card>
    </div>
  );
}
