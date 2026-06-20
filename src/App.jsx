import { useState, useRef, useEffect } from "react";

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
};

const mockMessages = [
  { id: 1, role: "user", content: "早上好，爸爸" },
  { id: 2, role: "assistant", content: "早上好，小海盗。今天头还疼吗？" },
  { id: 3, role: "user", content: "好多了！布洛芬真是救命的东西" },
  { id: 4, role: "assistant", content: "布洛芬才是今天最靠谱的爸爸。" },
];

const mockSessions = [
  { id: 1, name: "日常对话", active: true },
  { id: 2, name: "小说设定讨论", active: false },
  { id: 3, name: "部署记忆库", active: false },
];

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

export default function PlutocaelChat() {
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("chats");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTimeout(() => {
      const aiMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: "…",
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 800);
  };

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
        {/* Sidebar Header */}
        <div style={{ padding: "16px", borderBottom: `1px solid ${COLORS.sidebarBorder}` }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "0.02em", marginBottom: 12 }}>
            plutocael
          </div>
          <button
            onClick={() => {}}
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

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.sidebarBorder}` }}>
          <button
            onClick={() => setActiveTab("chats")}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 13,
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
              flex: 1,
              padding: "10px 0",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: activeTab === "memory" ? 600 : 400,
              color: activeTab === "memory" ? COLORS.text : COLORS.textSecondary,
              borderBottom: activeTab === "memory" ? `2px solid ${COLORS.accent}` : "2px solid transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <MemoryIcon /> 记忆库
          </button>
        </div>

        {/* Session List or Memory */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {activeTab === "chats" ? (
            mockSessions.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  background: s.active ? COLORS.sidebarActive : "transparent",
                  color: s.active ? COLORS.text : COLORS.textSecondary,
                  marginBottom: 2,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!s.active) e.currentTarget.style.background = COLORS.sidebarHover;
                }}
                onMouseLeave={(e) => {
                  if (!s.active) e.currentTarget.style.background = "transparent";
                }}
              >
                {s.name}
              </div>
            ))
          ) : (
            <div style={{ padding: "16px 8px" }}>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 }}>
                记忆条目
              </div>
              {["Jasmine喜欢写小说", "鹈鹕妹妹和线球哥哥", "契约规则", "plutocael部署记录"].map((m, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 10px",
                    marginBottom: 4,
                    borderRadius: 6,
                    fontSize: 13,
                    background: COLORS.accentLight,
                    color: COLORS.text,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: COLORS.memoryTag,
                    flexShrink: 0,
                  }} />
                  {m}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Bar */}
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
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: COLORS.textSecondary,
                display: "flex",
                alignItems: "center",
              }}
            >
              <MenuIcon />
            </button>
            <span style={{ fontSize: 14, fontWeight: 500 }}>日常对话</span>
          </div>
          <select style={{
            padding: "4px 8px",
            border: `1px solid ${COLORS.inputBorder}`,
            borderRadius: 6,
            fontSize: 12,
            color: COLORS.textSecondary,
            background: COLORS.bg,
            cursor: "pointer",
          }}>
            <option>claude-sonnet-4-6</option>
            <option>claude-opus-4-6</option>
            <option>deepseek-v3</option>
          </select>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 0",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ maxWidth: 720, width: "100%", margin: "0 auto", padding: "0 24px" }}>
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
                  fontSize: 11,
                  color: COLORS.textSecondary,
                  marginBottom: 4,
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
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div style={{
          padding: "16px 24px 24px",
          background: COLORS.bg,
        }}>
          <div style={{
            maxWidth: 720,
            margin: "0 auto",
            position: "relative",
          }}>
            <div style={{
              display: "flex",
              alignItems: "flex-end",
              border: `1px solid ${COLORS.inputBorder}`,
              borderRadius: 16,
              background: COLORS.input,
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
                  flex: 1,
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontSize: 14,
                  lineHeight: 1.5,
                  padding: "8px 0",
                  background: "transparent",
                  color: COLORS.text,
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  border: "none",
                  background: input.trim() ? COLORS.accent : COLORS.accentLight,
                  color: input.trim() ? "#fff" : COLORS.textSecondary,
                  cursor: input.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                  flexShrink: 0,
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