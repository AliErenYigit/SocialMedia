import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Input,
  List,
  Space,
  Spin,
  Typography,
  message,
} from "antd";
import { Client } from "@stomp/stompjs";
import { userApi } from "../api/user.api";
import { chatApi } from "../api/chat.api";

const { Title, Text } = Typography;

/**
 * avatarUrl backend'den tam URL gelmiyorsa (ör: /files/xxx.png)
 * burada tamamlıyoruz.
 *
 * image-service local: http://localhost:8087
 * gateway üzerinden /files proxylersen: http://localhost:8080
 */
const IMAGE_PUBLIC_BASE = "http://localhost:8087";

function getAuthFromStorage() {
  const raw = localStorage.getItem("auth");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function toWsUrl(httpUrl) {
  try {
    const u = new URL(httpUrl);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    return u.toString();
  } catch {
    return httpUrl.startsWith("https")
      ? httpUrl.replace(/^https/, "wss")
      : httpUrl.replace(/^http/, "ws");
  }
}

function normalizeAvatarUrl(url) {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) return `${IMAGE_PUBLIC_BASE}${trimmed}`;
  return `${IMAGE_PUBLIC_BASE}/${trimmed}`;
}

/**
 * WS endpointin chat-service: /ws
 * Eğer gateway WS proxy yapmıyorsa direkt chat-service'e bağlan:
 *   http://localhost:8086/ws  -> ws://localhost:8086/ws
 */
const WS_HTTP_URL = "ws://localhost:8086/ws";

export default function ChatPage() {
  const [me, setMe] = useState(null);

  const [loadingFollowing, setLoadingFollowing] = useState(true);
  const [followingUsers, setFollowingUsers] = useState([]);

  const [selectedRecipientId, setSelectedRecipientId] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [loadingRecipient, setLoadingRecipient] = useState(false);

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesState, setMessagesState] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const stompRef = useRef(null);
  const subRef = useRef(null);
  const connectedRef = useRef(false);
  const listEndRef = useRef(null);

  const auth = useMemo(() => getAuthFromStorage(), []);
  const token = auth?.token ? `Bearer ${auth.token}` : null;

  const myId = useMemo(() => me?.id ?? me?.userId ?? me?.authUserId, [me]);

  const scrollToBottom = (smooth = true) => {
    listEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  // 1) me() (kendi profilini çeken endpoint zaten avatarUrl döndürüyor olmalı)
  useEffect(() => {
    const run = async () => {
      try {
        const res = await userApi.me();
        const u = res?.data?.data ?? res?.data ?? res;

        setMe({
          ...u,
          avatarUrl: normalizeAvatarUrl(u?.avatarUrl),
        });
      } catch (e) {
        console.error(e);
        message.error("Kullanıcı bilgisi alınamadı (me).");
      }
    };
    run();
  }, []);

  // 2) following ids -> her id için profile-service'ten profil çek (avatar burada!)
  useEffect(() => {
    const run = async () => {
      try {
        setLoadingFollowing(true);

        // burada userApi.followers(...) kullanıyorsun ama "Takip Ettiklerim" yazıyor.
        // endpointin gerçekte following döndürüyorsa ok.
        const idsRes = await userApi.followers(1, 50);
        const payload = idsRes?.data ?? idsRes;

        const ids = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.content)
          ? payload.content
          : Array.isArray(payload?.items)
          ? payload.items
          : [];

        const uniqIds = Array.from(new Set(ids))
          .filter((x) => x !== null && x !== undefined)
          .map((x) => Number(x))
          .filter((x) => !Number.isNaN(x));

        // ✅ artık userApi.profile değil, userApi.getProfileById kullanıyoruz
        const results = await Promise.allSettled(
          uniqIds.map(async (id) => {
            const p = await userApi.getProfileById(id);
            const data = p?.data?.data ?? p?.data ?? p;

            return {
              id,
              username: data?.username ?? `user_${id}`,
              bio: data?.bio ?? "",
              avatarUrl: normalizeAvatarUrl(data?.avatarUrl),
            };
          })
        );

        const users = results
          .filter((r) => r.status === "fulfilled")
          .map((r) => r.value)
          .filter((u) => u?.id);

        users.sort((a, b) =>
          (a.username || "").localeCompare(b.username || "")
        );

        setFollowingUsers(users);
      } catch (e) {
        console.error(e);
        message.error("Takip edilenler alınamadı.");
      } finally {
        setLoadingFollowing(false);
      }
    };

    run();
  }, []);

  // 3) recipient profile (fresh) - seçilen kullanıcıyı da profile-service'ten çek
  useEffect(() => {
    const run = async () => {
      if (!selectedRecipientId) {
        setSelectedRecipient(null);
        return;
      }

      const cached = followingUsers.find(
        (u) => Number(u.id) === Number(selectedRecipientId)
      );
      if (cached) setSelectedRecipient(cached);

      try {
        setLoadingRecipient(true);

        // ✅ user-profile servisten fresh çek
        const freshRes = await userApi.getProfileById(selectedRecipientId);
        const fresh = freshRes?.data?.data ?? freshRes?.data ?? freshRes;

        setSelectedRecipient({
          id: Number(selectedRecipientId),
          username: fresh?.username ?? `user_${selectedRecipientId}`,
          bio: fresh?.bio ?? "",
          avatarUrl: normalizeAvatarUrl(fresh?.avatarUrl),
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingRecipient(false);
      }
    };

    run();
  }, [selectedRecipientId, followingUsers]);

  // 4) messages fetch
  useEffect(() => {
    const run = async () => {
      if (!activeConversationId) {
        setMessagesState([]);
        return;
      }
      try {
        setLoadingMessages(true);
        const data = await chatApi.getMessages(activeConversationId);
        const list = data?.data ?? data;
        setMessagesState(Array.isArray(list) ? list : []);
        setTimeout(() => scrollToBottom(false), 0);
      } catch (e) {
        console.error(e);
        message.error("Mesajlar alınamadı.");
      } finally {
        setLoadingMessages(false);
      }
    };

    run();
  }, [activeConversationId]);

  // 5) WS connect
  useEffect(() => {
    const myIdLocal = me?.id ?? me?.userId ?? me?.authUserId;
    if (!activeConversationId || !myIdLocal) return;

    const cleanup = () => {
      try {
        subRef.current?.unsubscribe();
      } catch (e) {
        console.error(e);
      }
      subRef.current = null;

      try {
        stompRef.current?.deactivate();
      } catch (e) {
        console.error(e);
      }
      stompRef.current = null;

      connectedRef.current = false;
      setWsConnected(false);
    };

    cleanup();

    const client = new Client({
      brokerURL: toWsUrl(WS_HTTP_URL),
      reconnectDelay: 1500,
      connectHeaders: {
        "X-User-Id": String(myIdLocal),
        ...(token ? { Authorization: token } : {}),
      },
      debug: (s) => console.log("[STOMP]", s),
      onConnect: () => {
        connectedRef.current = true;
        setWsConnected(true);

        client.publish({
          destination: "/app/presence.enter",
          headers: { "X-User-Id": String(myIdLocal) },
          body: JSON.stringify({ conversationId: activeConversationId }),
        });

        subRef.current = client.subscribe(
          `/topic/conversations/${activeConversationId}`,
          (frame) => {
            const incoming = JSON.parse(frame.body);
            setMessagesState((prev) => {
              if (!incoming?.id) return prev;
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
            setTimeout(() => scrollToBottom(true), 0);
          }
        );
      },
      onWebSocketClose: () => {
        connectedRef.current = false;
        setWsConnected(false);
      },
      onWebSocketError: (e) => console.error("WS error:", e),
      onStompError: (frame) =>
        console.error("STOMP error:", frame?.headers, frame?.body),
    });

    stompRef.current = client;
    client.activate();

    return () => {
      try {
        if (stompRef.current && connectedRef.current) {
          stompRef.current.publish({
            destination: "/app/presence.leave",
            headers: { "X-User-Id": String(myIdLocal) },
            body: JSON.stringify({ conversationId: activeConversationId }),
          });
        }
      } catch (e) {
        console.error(e);
      }
      cleanup();
    };
  }, [activeConversationId, me, token]);

  // 6) select user
  const onSelectUser = async (u) => {
    setSelectedRecipientId(u.id);

    try {
      const res = await chatApi.findOrCreateConversation(u.id);
      const data = res?.data ?? res;
      setActiveConversationId(data.conversationId);
    } catch (e) {
      console.error(e);
      message.error("Conversation oluşturulamadı.");
    }
  };

  const onSend = async () => {
    const content = text.trim();
    if (!content) return;

    const myIdLocal = me?.id ?? me?.userId ?? me?.authUserId;

    if (!myIdLocal) return message.error("Kullanıcı bilgisi yok (me).");
    if (!activeConversationId) return message.error("Önce bir sohbet seç.");
    if (!selectedRecipientId) return message.error("Recipient seçili değil.");
    if (!connectedRef.current || !stompRef.current)
      return message.error("WebSocket bağlı değil.");

    try {
      setSending(true);

      stompRef.current.publish({
        destination: "/app/chat.send",
        headers: { "X-User-Id": String(myIdLocal) },
        body: JSON.stringify({
          conversationId: Number(activeConversationId),
          recipientId: Number(selectedRecipientId),
          content,
        }),
      });

      setText("");
    } catch (e) {
      console.error(e);
      message.error("Mesaj gönderilemedi.");
    } finally {
      setSending(false);
    }
  };

  const rightTitle = useMemo(() => {
    if (!selectedRecipientId) return "Bir kullanıcı seç";
    if (loadingRecipient) return "Yükleniyor...";
    if (!selectedRecipient) return `Kullanıcı #${selectedRecipientId}`;
    return `@${selectedRecipient.username}`;
  }, [selectedRecipientId, loadingRecipient, selectedRecipient]);

  const rightAvatarLetter = (selectedRecipient?.username ?? "U")
    .charAt(0)
    .toUpperCase();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
      {/* SOL */}
      <Card
        title={
          <Space direction="vertical" size={0}>
            <Title level={5} style={{ margin: 0 }}>
              Takip Ettiklerim
            </Title>
            <Text type="secondary">{me?.username ? `@${me.username}` : ""}</Text>
          </Space>
        }
        bodyStyle={{ padding: 0, maxHeight: 680, overflow: "auto" }}
      >
        {loadingFollowing ? (
          <div style={{ padding: 16 }}>
            <Spin />
          </div>
        ) : (
          <List
            dataSource={followingUsers}
            locale={{ emptyText: "Takip ettiğin kimse yok." }}
            renderItem={(u) => {
              const active = Number(u.id) === Number(selectedRecipientId);
              const letter = (u.username ?? "U").charAt(0).toUpperCase();

              return (
                <List.Item
                  style={{
                    cursor: "pointer",
                    padding: "12px 16px",
                    background: active ? "#f0f5ff" : "transparent",
                  }}
                  onClick={() => onSelectUser(u)}
                >
                  <Space>
                    <Avatar src={u.avatarUrl || undefined}>
                      {!u.avatarUrl && letter}
                    </Avatar>

                    <div>
                      <Text strong>{u.username || `User #${u.id}`}</Text>
                      <br />
                      <Text type="secondary">@{u.username || "unknown"}</Text>
                    </div>
                  </Space>
                </List.Item>
              );
            }}
          />
        )}
      </Card>

      {/* SAĞ */}
      <Card
        title={
          <Space align="center" size={12}>
            <Avatar src={selectedRecipient?.avatarUrl || undefined}>
              {!selectedRecipient?.avatarUrl && rightAvatarLetter}
            </Avatar>

            <Space direction="vertical" size={0}>
              <Title level={5} style={{ margin: 0 }}>
                {rightTitle}
              </Title>

              {selectedRecipient?.username ? (
                <Text type="secondary">@{selectedRecipient.username}</Text>
              ) : (
                <Text type="secondary">
                  Sohbeti başlatmak için soldan birini seç.
                </Text>
              )}
            </Space>
          </Space>
        }
        bodyStyle={{
          minHeight: 680,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {!activeConversationId ? (
          <Text>Soldan bir kullanıcı seçince sohbeti açacağız.</Text>
        ) : (
          <>
            <Text type="secondary">
              conversationId: <Text code>{activeConversationId}</Text>
            </Text>

            <div
              style={{
                flex: 1,
                overflow: "auto",
                border: "1px solid #f0f0f0",
                borderRadius: 8,
                padding: 12,
                background: "#fff",
              }}
            >
              {loadingMessages ? (
                <div
                  style={{
                    display: "grid",
                    placeItems: "center",
                    height: "100%",
                  }}
                >
                  <Spin />
                </div>
              ) : (
                <List
                  dataSource={messagesState}
                  split={false}
                  locale={{ emptyText: "Henüz mesaj yok." }}
                  renderItem={(m) => {
                    const mine = Number(m.senderId) === Number(myId);
                    return (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: mine ? "flex-end" : "flex-start",
                          padding: "6px 0",
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "75%",
                            padding: "10px 12px",
                            borderRadius: mine
                              ? "12px 12px 4px 12px"
                              : "12px 12px 12px 4px",
                            border: "1px solid #f0f0f0",
                            background: mine ? "#e6f4ff" : "#fafafa",
                          }}
                        >
                          <div
                            style={{
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {m.content}
                          </div>
                          <div style={{ marginTop: 6, textAlign: "right" }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {m.createdAt
                                ? new Date(m.createdAt).toLocaleString()
                                : ""}
                            </Text>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              )}
              <div ref={listEndRef} />
            </div>

            <Space.Compact style={{ width: "100%" }}>
              <Input.TextArea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Mesaj yaz..."
                autoSize={{ minRows: 2, maxRows: 4 }}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
              />
              <Button type="primary" onClick={onSend} loading={sending}>
                Gönder
              </Button>
            </Space.Compact>

            <Text type={wsConnected ? "success" : "danger"}>
              {wsConnected ? "WS: Connected" : "WS: Disconnected"}
            </Text>
          </>
        )}
      </Card>
    </div>
  );
}
