import { Avatar, Button, Divider, Popover, Typography } from "antd";
import { MessageOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

export default function FollowingUserItem({ user, onMessage }) {
  const navigate = useNavigate();
  const letter = (user.username ?? "U").charAt(0).toUpperCase();

  const content = (
    <div style={{ minWidth: 180 }}>
      <Button
        type="text"
        icon={<UserOutlined />}
        block
        onClick={() => navigate(`/profile/${user.id}`)}
      >
        Profile Git
      </Button>

      <Divider style={{ margin: "6px 0" }} />

      <Button
        type="text"
        icon={<MessageOutlined />}
        block
        onClick={() => onMessage?.(user)}   // ✅ ChatPage’deki onSelectFollowing çalışacak
      >
        Mesaj Gönder
      </Button>
    </div>
  );

  return (
    <Popover content={content} trigger="click" placement="left">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          cursor: "pointer",
        }}
      >
        <Avatar src={user.avatarUrl || undefined}>
          {!user.avatarUrl && letter}
        </Avatar>

        <div style={{ lineHeight: 1.2 }}>
          <Text strong style={{ display: "block" }}>
            {user.username || `User #${user.id}`}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            @{user.username || "unknown"}
          </Text>
        </div>
      </div>
    </Popover>
  );
}
