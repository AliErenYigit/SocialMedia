import { Avatar, Button, Card, Space, Typography } from "antd";
import {
  HeartOutlined,
  HeartFilled,
  MessageOutlined,
  BookOutlined,
} from "@ant-design/icons";

export default function PostCard({ post, onLike, onOpen }) {
  const liked = !!post.likedByMe;
  const likeCount = post.likeCount ?? 0;
  const commentCount = post.commentCount ?? 0;

  return (
    <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 25 }} hoverable>
      {/* header */}
      <Space
        align="center"
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        <Space align="center">
          <Avatar size={47}>
            {(post.username ?? "U").charAt(0).toUpperCase()}
          </Avatar>

          <div>
            <Typography.Text
              strong
              style={{ display: "block", lineHeight: 1.2 }}
            ></Typography.Text>

            <Space size={220} style={{ marginTop: -2 }}>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 20 }}
              >
                <span
                  style={{
                    color: "#000", // ✅ siyah
                    fontWeight: 500, // biraz güçlü dursun
                  }}
                >
                  {post.username ?? "User"}
                </span>
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 ,marginTop: -2}}>
                •
              </Typography.Text>
              <Typography.Text type="secondary" style={{ color: "#000",fontSize: 12,fontWeight:500, marginTop: -2 }}>
                {post.createdAt
                  ? new Date(post.createdAt).toLocaleString()
                  : ""}
              </Typography.Text>
            </Space>
          </div>
        </Space>
      </Space>

      {/* content */}
      <div style={{ marginTop: 10 }}>
        <Typography.Text style={{ fontSize: 17 }}>
          {post.content ?? ""}
        </Typography.Text>
      </div>

      {/* image placeholder (sonra bağlanacak) */}
      <div
        style={{
          marginTop: 12,
          borderRadius: 12,
          overflow: "hidden",
          background: "rgba(0,0,0,0.04)",
          height: 220,
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
        }}
        onClick={() => onOpen?.(post.id)}
        title="Post detail"
      >
        <Typography.Text type="secondary">Image placeholder</Typography.Text>
      </div>

      {/* footer actions */}
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginTop: 12,
        }}
      >
        <Space size={27}>
          <Button
            type="text"
            icon={liked ? <HeartFilled /> : <HeartOutlined />}
            onClick={() => onLike?.(post.id)}
            style={{
              padding: 15,
              fontSize: 20,
              fontWeight: 600,
              color: liked ? "#1677ff" : undefined, // ant primary hissi
            }}
          >
            {likeCount}
          </Button>

          <Button
            type="text"
            icon={<MessageOutlined />}
            onClick={() => onOpen?.(post.id)}
            style={{ padding: 0, fontSize: 20, fontWeight: 600 }}
          >
            {commentCount}
          </Button>
        </Space>

        {/* Save placeholder */}
        <Button
          type="text"
          icon={<BookOutlined />}
          style={{ padding: 0, fontSize: 20, fontWeight: 600 }}
        >
          Kaydet
        </Button>
      </Space>
    </Card>
  );
}
