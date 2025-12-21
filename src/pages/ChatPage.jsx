import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Badge,
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

const IMAGE_PUBLIC_BASE = "http://localhost:8087";
const WS_HTTP_URL = "ws://localhost:8086/ws";

function getAuthFromStorage() {
  const raw = localStorage.getItem("auth");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("auth parse error:", err);
    return null;
  }
}

function toWsUrl(httpUrl) {
  try {
    const u = new URL(httpUrl);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    return u.toString();
  } catch (err) {
    console.error("toWsUrl error:", err);
    return httpUrl.startsWith("https")
      ? httpUrl.replace(/^https/, "wss")
      : httpUrl.replace(/^http/, "ws");
  }
}

function normalizeAvatarUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  if (trimmed.startsWith("/")) return `${IMAGE_PUBLIC_BASE}${trimmed}`;
  return `${IMAGE_PUBLIC_BASE}/${trimmed}`;
}

function unreadKey(myId) {
  return myId ? `chat_unread_${myId}` : "chat_unread_unknown";
}
function loadUnreadMap(myId) {
  try {
    const raw = localStorage.getItem(unreadKey(myId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    console.error("loadUnreadMap error:", err);
    return {};
  }
}
function saveUnreadMap(myId, map) {
  try {
    localStorage.setItem(unreadKey(myId), JSON.stringify(map || {}));
  } catch (err) {
    console.error("saveUnreadMap error:", err);
  }
}

function formatTime(dt) {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleString();
  } catch (err) {
    console.error("formatTime error:", err);
    return "";
  }
}

const ellipsis1Line = {
  display: "block",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
};

export default function ChatPage() {
  const [me, setMe] = useState(null);

  const [loadingFollowing, setLoadingFollowing] = useState(true);
  const [followingUsers, setFollowingUsers] = useState([]);

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [conversations, setConversations] = useState([]);

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activePeer, setActivePeer] = useState(null);

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesState, setMessagesState] = useState([]);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // WS
  const [wsConnected, setWsConnected] = useState(false);
  const stompRef = useRef(null);
  const subActiveRef = useRef(null);
  const subInboxRef = useRef(null);
  const connectedRef = useRef(false);

  // ✅ StrictMode / refresh “fake error” koruması
  const wsInitRef = useRef(false);
  // ✅ 7sn sonra tek seferlik warning
  const wsWarnShownRef = useRef(false);
  const wsWarnTimerRef = useRef(null);

  const listEndRef = useRef(null);

  const auth = useMemo(() => getAuthFromStorage(), []);
  const token = auth?.token ? `Bearer ${auth.token}` : null;

  const myId = useMemo(() => me?.id ?? me?.userId ?? me?.authUserId, [me]);

  const scrollToBottom = (smooth = true) => {
    try {
      listEndRef.current?.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    } catch (err) {
      console.error("scrollToBottom error:", err);
    }
  };

  /**
   * 1) Me
   */
  useEffect(() => {
    const run = async () => {
      try {
        const res = await userApi.me();
        const u = res?.data?.data ?? res?.data ?? res;

        setMe({
          ...u,
          avatarUrl: normalizeAvatarUrl(u?.avatarUrl),
        });
      } catch (err) {
        console.error("userApi.me error:", err);
        message.error("Kullanıcı bilgisi alınamadı (me).");
      }
    };
    run();
  }, []);

  /**
   * 2) Followings
   */
  useEffect(() => {
    const run = async () => {
      try {
        setLoadingFollowing(true);

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

        users.sort((a, b) => (a.username || "").localeCompare(b.username || ""));
        setFollowingUsers(users);
      } catch (err) {
        console.error("followings fetch error:", err);
        message.error("Takip edilenler alınamadı.");
      } finally {
        setLoadingFollowing(false);
      }
    };
    run();
  }, []);

  /**
   * 3) Conversations
   */
  useEffect(() => {
    const run = async () => {
      if (!myId) return;

      try {
        setLoadingConversations(true);

        const unreadMap = loadUnreadMap(myId);

        let list = [];
        try {
          const res = await chatApi.getConversations();
          const data = res?.data ?? res;
          list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        } catch (err) {
          console.error("chatApi.getConversations error:", err);
          list = [];
        }

        const normalized = (list || [])
          .map((c) => {
            const conversationId = Number(c.conversationId ?? c.id ?? c.conversation_id);
            const peerUserId = Number(c.peerUserId ?? c.peerId ?? c.otherUserId ?? c.other_user_id);

            const fromFollow = followingUsers.find((u) => Number(u.id) === peerUserId);

            const peerUsername =
              c.peerUsername ??
              c.peer?.username ??
              c.otherUsername ??
              c.other?.username ??
              fromFollow?.username ??
              `user_${peerUserId}`;

            const peerAvatarUrl = normalizeAvatarUrl(
              c.peerAvatarUrl ??
                c.peer?.avatarUrl ??
                c.otherAvatarUrl ??
                c.other?.avatarUrl ??
                fromFollow?.avatarUrl ??
                null
            );

            const lastMessage = c.lastMessage ?? c.last?.content ?? c.last_content ?? "";
            const lastMessageAt = c.lastMessageAt ?? c.last?.createdAt ?? c.last_created_at ?? null;

            const persistedUnread = unreadMap?.[String(conversationId)] ?? 0;

            return {
              conversationId,
              peerUserId,
              peerUsername,
              peerAvatarUrl,
              lastMessage,
              lastMessageAt,
              unreadCount: Number(c.unreadCount ?? c.unread ?? persistedUnread ?? 0) || 0,
            };
          })
          .filter((x) => x.conversationId && x.peerUserId);

        normalized.sort((a, b) => {
          const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return tb - ta;
        });

        setConversations(normalized);
      } catch (err) {
        console.error("conversations effect error:", err);
        message.error("Sohbetler yüklenirken hata oluştu.");
      } finally {
        setLoadingConversations(false);
      }
    };

    run();
  }, [myId, followingUsers]);

  /**
   * 4) Messages fetch
   */
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
      } catch (err) {
        console.error("chatApi.getMessages error:", err);
        message.error("Mesajlar alınamadı.");
      } finally {
        setLoadingMessages(false);
      }
    };

    run();
  }, [activeConversationId]);

  /**
   * Incoming
   */
  const handleIncoming = (incoming) => {
    try {
      if (!incoming) return;

      const cid = Number(incoming.conversationId ?? incoming.conversation_id);
      if (!cid) return;

      if (activeConversationId && cid === Number(activeConversationId)) {
        setMessagesState((prev) => {
          if (!incoming?.id) return prev;
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
        setTimeout(() => scrollToBottom(true), 0);
      }

      setConversations((prev) => {
        const next = [...prev];
        const idx = next.findIndex((c) => Number(c.conversationId) === cid);

        const isActive = activeConversationId && cid === Number(activeConversationId);
        const bumpUnread = isActive ? 0 : 1;

        const peerIdGuess =
          Number(incoming.senderId) === Number(myId)
            ? Number(incoming.recipientId)
            : Number(incoming.senderId);

        const fromFollow = followingUsers.find((u) => Number(u.id) === Number(peerIdGuess));

        if (idx === -1) {
          next.unshift({
            conversationId: cid,
            peerUserId: peerIdGuess,
            peerUsername: fromFollow?.username ?? `user_${peerIdGuess}`,
            peerAvatarUrl: fromFollow?.avatarUrl ?? null,
            lastMessage: incoming.content ?? "",
            lastMessageAt: incoming.createdAt ?? new Date().toISOString(),
            unreadCount: bumpUnread,
          });
        } else {
          const old = next[idx];
          const updated = {
            ...old,
            peerUserId: old.peerUserId ?? peerIdGuess,
            peerUsername: old.peerUsername ?? fromFollow?.username ?? `user_${peerIdGuess}`,
            peerAvatarUrl: old.peerAvatarUrl ?? fromFollow?.avatarUrl ?? null,
            lastMessage: incoming.content ?? old.lastMessage,
            lastMessageAt: incoming.createdAt ?? old.lastMessageAt,
            unreadCount: Number(old.unreadCount || 0) + bumpUnread,
          };
          next.splice(idx, 1);
          next.unshift(updated);
        }

        if (myId) {
          const map = loadUnreadMap(myId);
          next.forEach((c) => (map[String(c.conversationId)] = Number(c.unreadCount || 0)));
          saveUnreadMap(myId, map);
        }

        return next;
      });
    } catch (err) {
      console.error("handleIncoming error:", err);
    }
  };

  /**
   * ✅ 5) WS connect (1. sorunun çözümü burada)
   */
  useEffect(() => {
    if (!myId) return;

    // ✅ StrictMode double-mount koruması (dev’de refresh sonrası “fake error” engeller)
    if (wsInitRef.current) return;
    wsInitRef.current = true;

    const cleanup = () => {
      try {
        if (wsWarnTimerRef.current) clearTimeout(wsWarnTimerRef.current);
      } catch (err) {
        console.error("clearTimeout error:", err);
      }
      wsWarnTimerRef.current = null;

      try {
        subActiveRef.current?.unsubscribe();
      } catch (err) {
        console.error("unsubscribe active error:", err);
      }
      subActiveRef.current = null;

      try {
        subInboxRef.current?.unsubscribe();
      } catch (err) {
        console.error("unsubscribe inbox error:", err);
      }
      subInboxRef.current = null;

      try {
        stompRef.current?.deactivate();
      } catch (err) {
        console.error("deactivate error:", err);
      }
      stompRef.current = null;

      connectedRef.current = false;
      setWsConnected(false);
    };

    // önce önceki varsa temizle
    cleanup();

    // ✅ 7sn bağlanamazsa 1 kere warning
    wsWarnShownRef.current = false;
    wsWarnTimerRef.current = setTimeout(() => {
      if (!connectedRef.current && !wsWarnShownRef.current) {
        wsWarnShownRef.current = true;
        message.warning("WebSocket bağlantısı gecikti, tekrar bağlanmaya çalışıyorum...");
      }
    }, 7000);

    const client = new Client({
      brokerURL: toWsUrl(WS_HTTP_URL),
      reconnectDelay: 1500,
      connectHeaders: {
        "X-User-Id": String(myId),
        ...(token ? { Authorization: token } : {}),
      },
      debug: (s) => console.log("[STOMP]", s),

      onConnect: () => {
        connectedRef.current = true;
        setWsConnected(true);

        // ✅ bağlandıysa warning timer iptal
        try {
          if (wsWarnTimerRef.current) clearTimeout(wsWarnTimerRef.current);
        } catch (err) {
          console.error("clear warn timer error:", err);
        }
        wsWarnTimerRef.current = null;

        // inbox
        try {
          subInboxRef.current = client.subscribe(`/topic/users/${myId}`, (frame) => {
            try {
              const incoming = JSON.parse(frame.body);
              handleIncoming(incoming);
            } catch (err) {
              console.error("inbox JSON parse error:", err, frame?.body);
            }
          });
        } catch (err) {
          console.warn("Inbox subscription failed:", err);
        }

        // active conversation topic
        if (activeConversationId) {
          try {
            subActiveRef.current = client.subscribe(
              `/topic/conversations/${activeConversationId}`,
              (frame) => {
                try {
                  const incoming = JSON.parse(frame.body);
                  handleIncoming(incoming);
                } catch (err) {
                  console.error("active JSON parse error:", err, frame?.body);
                }
              }
            );
          } catch (err) {
            console.warn("Active subscription failed:", err);
          }

          // presence
          try {
            client.publish({
              destination: "/app/presence.enter",
              headers: { "X-User-Id": String(myId) },
              body: JSON.stringify({ conversationId: activeConversationId }),
            });
          } catch (err) {
            console.error("presence.enter error:", err);
          }
        }
      },

      // ✅ burada artık message.error basmıyoruz (refresh’te “fake error” çıkmasın)
      onWebSocketClose: (evt) => {
        console.warn("WS closed:", evt);
        connectedRef.current = false;
        setWsConnected(false);
      },
      onWebSocketError: (evt) => {
        console.warn("WS error:", evt);
        // UI’da hata basma yok. 7sn timer zaten warning gösteriyor.
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame?.headers, frame?.body);
      },
    });

    stompRef.current = client;

    try {
      client.activate();
    } catch (err) {
      console.error("client.activate error:", err);
    }

    return () => {
      // leave presence
      try {
        if (stompRef.current && connectedRef.current && activeConversationId) {
          stompRef.current.publish({
            destination: "/app/presence.leave",
            headers: { "X-User-Id": String(myId) },
            body: JSON.stringify({ conversationId: activeConversationId }),
          });
        }
      } catch (err) {
        console.error("presence.leave error:", err);
      }

      cleanup();

      // ✅ unmount olunca strictmode guard sıfırla
      wsInitRef.current = false;
      wsWarnShownRef.current = false;
    };
  }, [myId, token, activeConversationId]);

  /**
   * Select from followings -> findOrCreate -> open
   */
  const onSelectFollowing = async (u) => {
    try {
      const res = await chatApi.findOrCreateConversation(u.id);
      const data = res?.data ?? res;

      const cid = Number(data.conversationId ?? data.id ?? data.conversation_id);
      if (!cid) throw new Error("conversationId missing");

      setConversations((prev) => {
        const exists = prev.some((c) => Number(c.conversationId) === cid);
        if (exists) return prev;

        return [
          {
            conversationId: cid,
            peerUserId: Number(u.id),
            peerUsername: u.username ?? `user_${u.id}`,
            peerAvatarUrl: u.avatarUrl ?? null,
            lastMessage: "",
            lastMessageAt: null,
            unreadCount: 0,
          },
          ...prev,
        ];
      });

      openConversation({
        conversationId: cid,
        peerUserId: Number(u.id),
        peerUsername: u.username ?? `user_${u.id}`,
        peerAvatarUrl: u.avatarUrl ?? null,
      });
    } catch (err) {
      console.error("onSelectFollowing error:", err);
      message.error("Conversation oluşturulamadı.");
    }
  };

  /**
   * Open conversation
   */
  const openConversation = async (conv) => {
    try {
      const cid = Number(conv.conversationId);
      if (!cid) return;

      setActiveConversationId(cid);
      setActivePeer({
        id: Number(conv.peerUserId),
        username: conv.peerUsername,
        avatarUrl: conv.peerAvatarUrl,
      });

      setConversations((prev) => {
        const next = prev.map((c) =>
          Number(c.conversationId) === cid ? { ...c, unreadCount: 0 } : c
        );

        if (myId) {
          const map = loadUnreadMap(myId);
          map[String(cid)] = 0;
          saveUnreadMap(myId, map);
        }
        return next;
      });

      try {
        await chatApi.markAsRead?.(cid);
      } catch (err) {
        console.error("chatApi.markAsRead error:", err);
      }
    } catch (err) {
      console.error("openConversation error:", err);
      message.error("Sohbet açılamadı.");
    }
  };

  /**
   * Send
   */
  const onSend = async () => {
    const content = text.trim();
    if (!content) return;

    if (!myId) return message.error("Kullanıcı bilgisi yok (me).");
    if (!activeConversationId) return message.error("Önce bir sohbet seç.");
    if (!activePeer?.id) return message.error("Recipient yok.");
    if (!connectedRef.current || !stompRef.current)
      return message.warning("WebSocket bağlı değil, tekrar deniyor...");

    const nowIso = new Date().toISOString();

    try {
      setSending(true);

      stompRef.current.publish({
        destination: "/app/chat.send",
        headers: { "X-User-Id": String(myId) },
        body: JSON.stringify({
          conversationId: Number(activeConversationId),
          recipientId: Number(activePeer.id),
          content,
        }),
      });

      setConversations((prev) => {
        const next = [...prev];
        const idx = next.findIndex((c) => Number(c.conversationId) === Number(activeConversationId));

        if (idx === -1) {
          next.unshift({
            conversationId: Number(activeConversationId),
            peerUserId: Number(activePeer.id),
            peerUsername: activePeer.username ?? `user_${activePeer.id}`,
            peerAvatarUrl: activePeer.avatarUrl ?? null,
            lastMessage: content,
            lastMessageAt: nowIso,
            unreadCount: 0,
          });
          return next;
        }

        const old = next[idx];
        const updated = { ...old, lastMessage: content, lastMessageAt: nowIso };
        next.splice(idx, 1);
        next.unshift(updated);
        return next;
      });

      setText("");
      setTimeout(() => scrollToBottom(true), 0);
    } catch (err) {
      console.error("onSend error:", err);
      message.error("Mesaj gönderilemedi.");
    } finally {
      setSending(false);
    }
  };

  const centerTitle = useMemo(() => {
    if (!activeConversationId) return "Sohbet seç";
    if (!activePeer?.username) return `conversation #${activeConversationId}`;
    return `${activePeer.username}`;
  }, [activeConversationId, activePeer]);

  const activePeerLetter = (activePeer?.username ?? "U").charAt(0).toUpperCase();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "320px 1fr 320px",
        gap: 16,
        alignItems: "start",
      }}
    >
      {/* SOL */}
      <Card
        title={
          <Space direction="vertical" size={0}>
            <Title level={5} style={{ margin: 0 }}>
              Sohbetler
            </Title>
            <Text type="secondary">{me?.username ? `@${me.username}` : ""}</Text>
          </Space>
        }
        bodyStyle={{ padding: 0, maxHeight: 680, overflow: "auto" }}
      >
        {loadingConversations ? (
          <div style={{ padding: 16 }}>
            <Spin />
          </div>
        ) : (
          <List
            dataSource={conversations}
            locale={{ emptyText: "Henüz sohbet yok. Sağdan birini seçip başlat." }}
            renderItem={(c) => {
              const active = Number(c.conversationId) === Number(activeConversationId);
              const letter = (c.peerUsername ?? "U").charAt(0).toUpperCase();

              return (
                <List.Item
                  style={{
                    cursor: "pointer",
                    padding: "10px 12px",
                    background: active ? "#f0f5ff" : "transparent",
                    height: 74,
                    alignItems: "center",
                  }}
                  onClick={() => openConversation(c)}
                >
                  <div style={{ width: "100%", display: "flex", gap: 12, alignItems: "center" }}>
                    <Avatar src={c.peerAvatarUrl || undefined} size={44}>
                      {!c.peerAvatarUrl && letter}
                    </Avatar>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <Space size={8} style={{ minWidth: 0 }}>
                          <Text strong style={{ ...ellipsis1Line, maxWidth: 160 }}>
                            {c.peerUsername}
                          </Text>
                          {Number(c.unreadCount || 0) > 0 && (
                            <Badge count={Number(c.unreadCount || 0)} />
                          )}
                        </Space>

                        <Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                          {formatTime(c.lastMessageAt)}
                        </Text>
                      </div>

                      <Text
                        type="secondary"
                        style={{ fontSize: 12, ...ellipsis1Line, maxWidth: 240 }}
                        title={c.lastMessage || ""}
                      >
                        {c.lastMessage ? c.lastMessage : "Henüz mesaj yok"}
                      </Text>
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </Card>

      {/* ORTA */}
      <Card
        title={
          <Space align="center" size={12}>
            <Avatar src={activePeer?.avatarUrl || undefined}>
              {!activePeer?.avatarUrl && activePeerLetter}
            </Avatar>

            <Space direction="vertical" size={0}>
              <Title level={5} style={{ margin: 0 }}>
                {centerTitle}
              </Title>

              <Text type="secondary" style={{ fontSize: 12 }}>
                {wsConnected ? "WS: Connected" : "WS: Reconnecting..."}
              </Text>
            </Space>
          </Space>
        }
        bodyStyle={{
          height: 680,
          display: "flex",
          flexDirection: "column",
          padding: 12,
        }}
      >
        {!activeConversationId ? (
          <Text>Bir sohbet seçince mesajlar burada görünecek.</Text>
        ) : (
          <>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                border: "1px solid #f0f0f0",
                borderRadius: 8,
                padding: 12,
                background: "#fff",
              }}
            >
              {loadingMessages ? (
                <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
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
                            borderRadius: mine ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                            border: "1px solid #f0f0f0",
                            background: mine ? "#e6f4ff" : "#fafafa",
                          }}
                        >
                          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {m.content}
                          </div>
                          <div style={{ marginTop: 6, textAlign: "right" }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
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
          </>
        )}
      </Card>

      {/* SAĞ */}
      <Card
        title={
          <Space direction="vertical" size={0}>
            <Title level={5} style={{ margin: 0 }}>
              Takip Ettiklerim
            </Title>
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
              const letter = (u.username ?? "U").charAt(0).toUpperCase();
              return (
                <List.Item
                  style={{ cursor: "pointer", padding: "12px 16px" }}
                  onClick={() => onSelectFollowing(u)}
                >
                  <Space>
                    <Avatar src={u.avatarUrl || undefined}>
                      {!u.avatarUrl && letter}
                    </Avatar>

                    <div style={{ lineHeight: 1.2 }}>
                      <Text strong style={ellipsis1Line}>
                        {u.username || `User #${u.id}`}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        @{u.username || "unknown"}
                      </Text>
                    </div>
                  </Space>
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
}
