import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Button,
  Card,
  Divider,
  Input,
  List,
  Space,
  Typography,
  message,
  Spin,
} from "antd";
import {
  HeartOutlined,
  HeartFilled,
  MessageOutlined,
  BookOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { postsApi } from "../api/posts.api";
import { userApi } from "../api/user.api";

const { Title, Text } = Typography;

const IMAGE_PUBLIC_BASE = "http://localhost:8087";
function normalizeUrl(url) {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("/")) return `${IMAGE_PUBLIC_BASE}${t}`;
  return `${IMAGE_PUBLIC_BASE}/${t}`;
}

function toLongOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  // post detail
  const [post, setPost] = useState(null);

  // author profile (avatarUrl vs)
  const [authorProfile, setAuthorProfile] = useState(null);

  // comments
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);

  // like
  const [liking, setLiking] = useState(false);

  const imageUrl = useMemo(() => {
    const raw = post?.imageUrl ?? post?.ImageUrl ?? null;
    return normalizeUrl(raw);
  }, [post]);

  const authorAvatarUrl = useMemo(() => {
    return normalizeUrl(authorProfile?.avatarUrl ?? post?.avatarUrl ?? null);
  }, [authorProfile, post]);

  const authorLetter = (authorProfile?.username ?? post?.username ?? "U")
    .charAt(0)
    .toUpperCase();

  const load = async () => {
    try {
      setLoading(true);

      // 1) post detail
      const res = await postsApi.detail(id);
      const data = res.data?.data ?? res.data;

      const mappedPost = {
        ...data,
        // like
        liked: data?.liked ?? false,
        likeCount: data?.likeCount ?? 0,
        // normalize image key if backend "ImageUrl" dönüyorsa
        imageUrl: data?.imageUrl ?? data?.ImageUrl ?? null,
      };

      setPost(mappedPost);

      // 2) comments
      const embedded = data?.comments ?? data?.commentList ?? [];
      const list = Array.isArray(embedded) ? embedded : [];
      setComments(list);

      // 3) author profile fetch (UserProfile avatarUrl için)
      const authorId = toLongOrNull(mappedPost?.authUserId ?? mappedPost?.userId);
      if (authorId) {
        try {
          const pres = await userApi.getProfileById(authorId);
          const p = pres?.data?.data ?? pres?.data ?? pres;
          setAuthorProfile({
            ...p,
            avatarUrl: p?.avatarUrl ?? null,
          });
        } catch {
          setAuthorProfile(null);
        }
      } else {
        setAuthorProfile(null);
      }

      // 4) comment authors avatarUrl fetch
      // comment item: { id, authUserId, username, content, createdAt } (senin backend böyleydi)
      const uniqCommentUserIds = Array.from(
        new Set(
          list
            .map((c) => toLongOrNull(c?.authUserId ?? c?.userId))
            .filter(Boolean)
        )
      );

      if (uniqCommentUserIds.length) {
        const map = new Map();

        await Promise.allSettled(
          uniqCommentUserIds.map(async (uid) => {
            const r = await userApi.getProfileById(uid);
            const p = r?.data?.data ?? r?.data ?? r;
            map.set(uid, {
              username: p?.username ?? `user_${uid}`,
              avatarUrl: normalizeUrl(p?.avatarUrl),
            });
          })
        );

        // results unused but ok
        setComments((prev) =>
          prev.map((c) => {
            const uid = toLongOrNull(c?.authUserId ?? c?.userId);
            const prof = uid ? map.get(uid) : null;
            return {
              ...c,
              username: c?.username ?? prof?.username ?? "User",
              avatarUrl: prof?.avatarUrl ?? null,
            };
          })
        );
      }
    } catch (e) {
      message.error(e?.response?.data?.message || "Post yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const likePost = async () => {
    if (liking || !post) return;

    const prev = post;

    // optimistic toggle
    setPost((p) => {
      if (!p) return p;
      const nextLiked = !p.liked;
      const nextCount = (p.likeCount ?? 0) + (nextLiked ? 1 : -1);
      return { ...p, liked: nextLiked, likeCount: Math.max(0, nextCount) };
    });

    setLiking(true);
    try {
      const res = await postsApi.like(id);
      const data = res.data?.data ?? res.data; // { liked, likeCount } vb.

      setPost((p) => {
        if (!p) return p;
        return {
          ...p,
          liked: data?.liked ?? p.liked,
          likeCount: data?.likeCount ?? p.likeCount,
        };
      });
    } catch (e) {
      setPost(prev);
      message.error(e?.response?.data?.message || "Like başarısız");
    } finally {
      setLiking(false);
    }
  };

  const sendComment = async () => {
    if (!commentText.trim()) return message.warning("Yorum boş olamaz");
    try {
      setSending(true);
      await postsApi.comment(id, { content: commentText });
      setCommentText("");
      message.success("Yorum eklendi");
      load();
    } catch (e) {
      message.error(e?.response?.data?.message || "Yorum eklenemedi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      {/* top bar */}
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Geri
        </Button>
       
      </Space>

      {/* post card */}
      <Card style={{ borderRadius: 14 }} bodyStyle={{ padding: 22 }}>
        {loading && !post ? (
          <div style={{ padding: 24, display: "grid", placeItems: "center" }}>
            <Spin />
          </div>
        ) : (
          <>
            {/* header */}
            <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
              <Space align="center">
                <Avatar size={46} src={authorAvatarUrl || undefined}>
                  {!authorAvatarUrl && authorLetter}
                </Avatar>

                <div>
                  <Text style={{ fontSize: 16, fontWeight: 700, color: "#000" }}>
                    {authorProfile?.username ?? post?.username ?? "User"}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {post?.createdAt ? new Date(post.createdAt).toLocaleString() : ""}
                  </Text>
                </div>
              </Space>

           
            </Space>

            {/* content */}
            {post?.content ? (
              <div style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 16 }}>{post.content}</Text>
              </div>
            ) : null}

            {/* image */}
            {imageUrl ? (
              <div
                style={{
                  marginTop: 14,
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "rgba(0,0,0,0.04)",
                }}
              >
                <img
                  src={imageUrl}
                  alt="post"
                  style={{
                    width: "100%",
                    height: 520,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            ) : null}

            <Divider style={{ margin: "14px 0" }} />

            {/* actions */}
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Space size={18}>
                <Button
                  type="text"
                  icon={post?.liked ? <HeartFilled /> : <HeartOutlined />}
                  onClick={likePost}
                  loading={liking}
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: post?.liked ? "#1677ff" : undefined,
                  }}
                >
                  {post?.likeCount ?? 0}
                </Button>

                <Button
                  type="text"
                  icon={<MessageOutlined />}
                  style={{ fontSize: 18, fontWeight: 700 }}
                >
                  {comments.length}
                </Button>
              </Space>

              <Button type="text" icon={<BookOutlined />} style={{ fontWeight: 700 }}>
                Kaydet
              </Button>
            </Space>
          </>
        )}
      </Card>

      <div style={{ height: 14 }} />

      {/* comments */}
      <Card style={{ borderRadius: 14 }} bodyStyle={{ padding: 22 }}>
        <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
          Yorumlar
        </Title>

        <Space.Compact style={{ width: "100%", marginBottom: 14 }}>
          <Input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Yorum yaz..."
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                sendComment();
              }
            }}
          />
          <Button type="primary" loading={sending} onClick={sendComment}>
            Gönder
          </Button>
        </Space.Compact>

        <List
          loading={loading}
          dataSource={comments}
          locale={{ emptyText: "Henüz yorum yok" }}
          renderItem={(c) => {
            const cAvatar = normalizeUrl(c?.avatarUrl);
            const cLetter = (c?.username ?? "U").charAt(0).toUpperCase();

            return (
              <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
                <List.Item.Meta
                  avatar={
                    <Avatar src={cAvatar || undefined}>
                      {!cAvatar && cLetter}
                    </Avatar>
                  }
                  title={
                    <Space size={10}>
                      <Text strong>{c?.username ?? "User"}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {c?.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                      </Text>
                    </Space>
                  }
                  description={<Text>{c?.content ?? ""}</Text>}
                />
              </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
}
