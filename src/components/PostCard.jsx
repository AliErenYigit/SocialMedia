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

  // backend bazen "ImageUrl" döndürüyor
  const imageUrl = post.imageUrl ?? post.ImageUrl ?? null;

  const openDetail = () => onOpen?.(post.id);

  return (
    <Card
      style={{ borderRadius: 12 }}
      bodyStyle={{ padding: 25 }}
      hoverable
      onClick={openDetail} // ✅ artık her yer tıklanınca detail açılır
    >
      {/* header */}
      <Space
        align="center"
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        <Space align="center" onClick={(e) => e.stopPropagation()}>
          {/* ✅ avatar */}
          <Avatar size={47} src={post.avatarUrl || undefined}>
            {!post.avatarUrl && (post.username ?? "U").charAt(0).toUpperCase()}
          </Avatar>

          <div>
            <Space size={10} align="center">
              <Typography.Text style={{ fontSize: 16, fontWeight: 600, color: "#000" }}>
                {post.username ?? "User"}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                •
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {post.createdAt ? new Date(post.createdAt).toLocaleString() : ""}
              </Typography.Text>
            </Space>
          </div>
        </Space>
      </Space>

      {/* content */}
      {post.content ? (
        <div    style={{
              width: "680px",
              height: "auto",
              maxHeight: 320,
              objectFit: "cover",
              display: "block",
              
            }}>
          <Typography.Text style={{ fontSize: 17 }}>
            {post.content}
          </Typography.Text>
        </div>
      ) : null}

      {/* ✅ image only if exists */}
      {imageUrl ? (
        <div
          style={{
            marginTop: 12,
            borderRadius: 12,
            overflow: "hidden",
            background: "rgba(0,0,0,0.04)",
          }}
          onClick={(e) => e.stopPropagation()} // resim tıklanırsa da sorun yok
        >
          <img
            src={imageUrl}
            alt="post"
           style={{
              width: "680px",
              height: "auto",
              maxHeight: 320,
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      ) : null}

      {/* footer actions */}
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginTop: 12,
        }}
        onClick={(e) => e.stopPropagation()} // ✅ butonlara basınca card click çalışmasın
      >
        <Space size={18}>
          <Button
            type="text"
            icon={liked ? <HeartFilled /> : <HeartOutlined />}
            onClick={() => onLike?.(post.id)}
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: liked ? "#1677ff" : undefined,
            }}
          >
            {likeCount}
          </Button>

          <Button
            type="text"
            icon={<MessageOutlined />}
            onClick={openDetail} // ✅ yorum butonu da detail açsın
            style={{ fontSize: 18, fontWeight: 600 }}
          >
            {commentCount}
          </Button>
        </Space>

        <Button
          type="text"
          icon={<BookOutlined />}
          style={{ fontSize: 16, fontWeight: 600 }}
        >
          Kaydet
        </Button>
      </Space>
    </Card>
  );
}
