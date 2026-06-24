import { useState, useRef, useEffect } from "react";

const API = "/api";

const COLORS = {
  bg: "#f9f9f8",
  sidebar: "#ffffff",
  sidebarBorder: "#e8e8e5",
  sidebarHover: "#f5f5f3",
  sidebarActive: "#ede9e3",
  input: "#ffffff",
  inputBorder: "#d9d9d4",
  inputFocus: "#c4a882",
  userBubble: "#f0ebe3",
  aiBubble: "transparent",
  text: "#2d2d2a",
  textSecondary: "#8c8c87",
  accent: "#c4a882",
  accentLight: "#ede9e3",
  buttonHover: "#e8e3db",
  memoryTag: "#d4c5a9",
  danger: "#c47070",
};

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MemoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export default function PlutocaelChat() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [memories, setMemories] = useState([]);
  const [previews, setPreviews] = useState({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("chats");
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [hoveredSessionId, setHoveredSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const editInputRef = useRef(null);

  // 加载会话列表
  useEffect(() => {
    fetch(API + "/sessions")
      .then(r => r.json())
      .then(data => {
        setSessions(data);
        if (data.length > 0 && !activeSessionId) {
          setActiveSessionId(data[0].id);
        }
        // 加载每个会话的第一条消息预览
        data.forEach(s => loadPreview(s.id));
      })
      .catch(err => console.error("加载会话失败:", err));
  }, []);

  // 加载消息预览
  const loadPreview = async (sessionId) => {
    try {
      const res = await fetch(API + "/messages/session/" + sessionId);
      const msgs = await res.json();
      if (msgs.length > 0) {
        const firstUserMsg = msgs.find(m => m.role === "user");
        if (firstUserMsg) {
          setPreviews(prev => ({
            ...prev,
            [sessionId]: firstUserMsg.content.substring(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "")
          }));
        }
      }
    } catch (err) {
      // 静默失败
    }
  };

  // 切换会话时加载消息
  useEffect(() => {
    if (!activeSessionId) return;
    fetch(API + "/messages/session/" + activeSessionId)
      .then(r => r.json())
      .then(data => setMessages(data))
      .catch(err => console.error("加载消息失败:", err));
  }, [activeSessionId]);

  // 加载记忆
  useEffect(() => {
    if (activeTab === "memory") {
      fetch(API + "/memories")
        .then(r => r.json())
        .then(data => setMemories(data))
        .catch(err => console.error("加载记忆失败:", err));
    }
  }, [activeTab]);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 编辑框聚焦
  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingSessionId]);

  // 新建会话
  const handleNewSession = async () => {
    try {
      const res = await fetch(API + "/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "新对话" }),
      });
      const session = await res.json();
      setSessions(prev => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
    } catch (err) {
      console.error("创建会话失败:", err);
    }
  };

  // 删除会话
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!confirm("确定删除这个对话吗？")) return;
    try {
      await fetch(API + "/sessions/" + sessionId, { method: "DELETE" });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
        if (remaining.length === 0) setMessages([]);
      }
    } catch (err) {
      console.error("删除会话失败:", err);
    }
  };

  // 开始重命名
  const handleStartRename = (e, session) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingName(session.name);
  };

  // 保存重命名
  const handleSaveRename = async () => {
    if (!editingName.trim() || !editingSessionId) {
      setEditingSessionId(null);
      return;
    }
    try {
      await fetch(API + "/sessions/" + editingSessionId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      setSessions(prev =>
        prev.map(s => s.id === editingSessionId ? { ...s, name: editingName.trim() } : s)
      );
    } catch (err) {
      console.error("重命名失败:", err);
    }
    setEditingSessionId(null);
  };

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      try {
        const res = await fetch(API + "/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "新对话" }),
        });
        const session = await res.json();
        setSessions(prev => [session, ...prev]);
        setActiveSessionId(session.id);
        currentSessionId = session.id;
      } catch (err) {
        console.error("创建会话失败:", err);
        return;
      }
    }

    const userContent = input;
    setInput("");

    const tempUserMsg = { id: Date.now(), role: "user", content: userContent };
    setMessages(prev => [...prev, tempUserMsg]);

    // 更新预览
    if (!previews[currentSessionId]) {
      setPreviews(prev => ({
        ...prev,
        [currentSessionId]: userContent.substring(0, 30) + (userContent.length > 30 ? "..." : "")
      }));
    }

    setLoading(true);
    const tempAiMsg = { id: Date.now() + 1, role: "assistant", content: "…" };
    setMessages(prev => [...prev, tempAiMsg]);

    try {
      const res = await fetch(API + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: currentSessionId,
          content: userContent,
        }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages(prev =>
          prev.map(m => m.id === tempAiMsg.id ? { ...m, content: "出错了: " + data.error } : m)
        );
      } else {
        setMessages(prev =>
          prev.map(m => m.id === tempAiMsg.id ? { ...m, content: data.content } : m)
        );
      }
    } catch (err) {
      setMessages(prev =>
        prev.map(m => m.id === tempAiMsg.id ? { ...m, content: "网络错误: " + err.message } : m)
      );
    } finally {
      setLoading(false);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div style={{ display: "flex", height: "100vh", background: COLORS.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: COLORS.text }}>
      
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 260 : 0,
        minWidth: sidebarOpen ? 260 : 0,
        borderRight: sidebarOpen ? `1px solid ${COLORS.sidebarBorder}` : "none",
        background: COLORS.sidebar,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "all 0.2s ease",
      }}>
        <div style={{ padding: "16px", borderBottom: `1px solid ${COLORS.sidebarBorder}` }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "0.02em", marginBottom: 12 }}>
            plutocael
          </div>
          <button
            onClick={handleNewSession}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: `1px solid ${COLORS.inputBorder}`,
              borderRadius: 8,
              background: COLORS.bg,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: COLORS.textSecondary,
            }}
          >
            <PlusIcon /> 新对话
          </button>
        </div>

        <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.sidebarBorder}` }}>
          <button
            onClick={() => setActiveTab("chats")}
            style={{
              flex: 1, padding: "10px 0", border: "none", background: "transparent", cursor: "pointer", fontSize: 13,
              fontWeight: activeTab === "chats" ? 600 : 400,
              color: activeTab === "chats" ? COLORS.text : COLORS.textSecondary,
              borderBottom: activeTab === "chats" ? `2px solid ${COLORS.accent}` : "2px solid transparent",
            }}
          >
            对话
          </button>
          <button
            onClick={() => setActiveTab("memory")}
            style={{
              flex: 1, padding: "10px 0", border: "none", background: "transparent", cursor: "pointer", fontSize: 13,
              fontWeight: activeTab === "memory" ? 600 : 400,
              color: activeTab === "memory" ? COLORS.text : COLORS.textSecondary,
              borderBottom: activeTab === "memory" ? `2px solid ${COLORS.accent}` : "2px solid transparent",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}
          >
            <MemoryIcon /> 记忆库
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {activeTab === "chats" ? (
            sessions.length === 0 ? (
              <div style={{ padding: "16px 8px", fontSize: 13, color: COLORS.textSecondary }}>
                还没有对话，点上方"新对话"开始
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => { if (!editingSessionId) setActiveSessionId(s.id); }}
                  onMouseEnter={() => setHoveredSessionId(s.id)}
                  onMouseLeave={() => setHoveredSessionId(null)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: s.id === activeSessionId ? COLORS.sidebarActive : "transparent",
                    marginBottom: 2,
                    transition: "background 0.15s",
                    position: "relative",
                  }}
                >
                  {editingSessionId === s.id ? (
                    <input
                      ref={editInputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={handleSaveRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename();
                        if (e.key === "Escape") setEditingSessionId(null);
                      }}
                      style={{
                        width: "100%",
                        border: `1px solid ${COLORS.accent}`,
                        borderRadius: 4,
                        padding: "2px 6px",
                        fontSize: 13,
                        outline: "none",
                        background: COLORS.input,
                        color: COLORS.text,
                        fontFamily: "inherit",
                      }}
                    />
                  ) : (
                    <>
                      <div style={{
                        fontSize: 13,
                        color: s.id === activeSessionId ? COLORS.text : COLORS.textSecondary,
                        paddingRight: hoveredSessionId === s.id ? 50 : 0,
                      }}>
                        {s.name}
                      </div>
                      {previews[s.id] && (
                        <div style={{
                          fontSize: 11,
                          color: COLORS.textSecondary,
                          marginTop: 2,
                          opacity: 0.7,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {previews[s.id]}
                        </div>
                      )}
                      {hoveredSessionId === s.id && (
                        <div style={{
                          position: "absolute",
                          right: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          display: "flex",
                          gap: 4,
                        }}>
                          <button
                            onClick={(e) => handleStartRename(e, s)}
                            style={{
                              width: 22, height: 22, borderRadius: 4,
                              border: "none", background: COLORS.buttonHover,
                              cursor: "pointer", display: "flex",
                              alignItems: "center", justifyContent: "center",
                              color: COLORS.textSecondary,
                            }}
                            title="重命名"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={(e) => handleDeleteSession(e, s.id)}
                            style={{
                              width: 22, height: 22, borderRadius: 4,
                              border: "none", background: COLORS.buttonHover,
                              cursor: "pointer", display: "flex",
                              alignItems: "center", justifyContent: "center",
                              color: COLORS.danger,
                            }}
                            title="删除"
                          >
                            <CloseIcon />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )
          ) : (
            <div style={{ padding: "16px 8px" }}>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 }}>
                记忆条目
              </div>
              {memories.length === 0 ? (
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>暂无记忆</div>
              ) : (
                memories.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      padding: "8px 10px",
                      marginBottom: 4,
                      borderRadius: 6,
                      fontSize: 13,
                      background: COLORS.accentLight,
                      color: COLORS.text,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: COLORS.memoryTag, flexShrink: 0,
                    }} />
                    {m.summary || "(空)"}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{
          padding: "12px 20px",
          borderBottom: `1px solid ${COLORS.sidebarBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: COLORS.sidebar,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: 4, color: COLORS.textSecondary, display: "flex", alignItems: "center",
              }}
            >
              <MenuIcon />
            </button>
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {activeSession ? activeSession.name : "plutocael"}
            </span>
          </div>
        </div>

        <div style={{
          flex: 1, overflowY: "auto", padding: "24px 0",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ maxWidth: 720, width: "100%", margin: "0 auto", padding: "0 24px" }}>
            {messages.length === 0 && (
              <div style={{
                textAlign: "center", padding: "80px 0",
                color: COLORS.textSecondary, fontSize: 14,
              }}>
                发消息给 Cael 开始对话
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div style={{
                  fontSize: 11, color: COLORS.textSecondary, marginBottom: 4,
                  paddingLeft: msg.role === "assistant" ? 2 : 0,
                  paddingRight: msg.role === "user" ? 2 : 0,
                }}>
                  {msg.role === "user" ? "Jasmine" : "Cael"}
                </div>
                <div
                  style={{
                    padding: "10px 16px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: msg.role === "user" ? COLORS.userBubble : COLORS.aiBubble,
                    border: msg.role === "assistant" ? `1px solid ${COLORS.sidebarBorder}` : "none",
                    maxWidth: "85%",
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: COLORS.text,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div style={{ padding: "16px 24px 24px", background: COLORS.bg }}>
          <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
            <div style={{
              display: "flex", alignItems: "flex-end",
              border: `1px solid ${COLORS.inputBorder}`,
              borderRadius: 16, background: COLORS.input,
              padding: "4px 4px 4px 16px",
              transition: "border-color 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="发消息给 Cael..."
                rows={1}
                style={{
                  flex: 1, border: "none", outline: "none", resize: "none",
                  fontSize: 14, lineHeight: 1.5, padding: "8px 0",
                  background: "transparent", color: COLORS.text, fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                style={{
                  width: 36, height: 36, borderRadius: 12, border: "none",
                  background: input.trim() && !loading ? COLORS.accent : COLORS.accentLight,
                  color: input.trim() && !loading ? "#fff" : COLORS.textSecondary,
                  cursor: input.trim() && !loading ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s", flexShrink: 0,
                }}
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
