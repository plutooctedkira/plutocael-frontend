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

// === Icons ===
const Icon = ({ children, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

function SendIcon() { return <Icon size={18}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></Icon>; }
function PlusIcon() { return <Icon><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Icon>; }
function MemoryIcon() { return <Icon><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Icon>; }
function MenuIcon() { return <Icon size={20}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></Icon>; }
function CloseIcon() { return <Icon size={12}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>; }
function EditIcon() { return <Icon size={12}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Icon>; }
function SettingsIcon() { return <Icon size={18}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></Icon>; }
function UploadIcon() { return <Icon><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></Icon>; }
function SearchIcon() { return <Icon><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon>; }
function McpIcon() { return <Icon><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></Icon>; }
function ChartIcon() { return <Icon><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></Icon>; }

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
  const [showSettings, setShowSettings] = useState(false);
  const [settingsData, setSettingsData] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsTab, setSettingsTab] = useState("general");
  const messagesEndRef = useRef(null);
  const editInputRef = useRef(null);

  // === Data Loading ===
  useEffect(() => {
    fetch(API + "/sessions")
      .then(r => r.json())
      .then(data => {
        setSessions(data);
        if (data.length > 0 && !activeSessionId) setActiveSessionId(data[0].id);
        data.forEach(s => loadPreview(s.id));
      })
      .catch(err => console.error("加载会话失败:", err));
  }, []);

  const loadPreview = async (sessionId) => {
    try {
      const res = await fetch(API + "/messages/session/" + sessionId);
      const msgs = await res.json();
      const firstUser = msgs.find(m => m.role === "user");
      if (firstUser) {
        setPreviews(prev => ({ ...prev, [sessionId]: firstUser.content.substring(0, 30) + (firstUser.content.length > 30 ? "..." : "") }));
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!activeSessionId) return;
    fetch(API + "/messages/session/" + activeSessionId)
      .then(r => r.json())
      .then(data => setMessages(data))
      .catch(err => console.error("加载消息失败:", err));
  }, [activeSessionId]);

  useEffect(() => {
    if (activeTab === "memory") {
      fetch(API + "/memories").then(r => r.json()).then(setMemories).catch(() => {});
    }
  }, [activeTab]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (editingSessionId && editInputRef.current) { editInputRef.current.focus(); editInputRef.current.select(); } }, [editingSessionId]);

  // === Session Handlers ===
  const handleNewSession = async () => {
    try {
      const res = await fetch(API + "/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "新对话" }) });
      const session = await res.json();
      setSessions(prev => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
    } catch (err) { console.error("创建会话失败:", err); }
  };

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
    } catch (err) { console.error("删除会话失败:", err); }
  };

  const handleStartRename = (e, session) => { e.stopPropagation(); setEditingSessionId(session.id); setEditingName(session.name); };

  const handleSaveRename = async () => {
    if (!editingName.trim() || !editingSessionId) { setEditingSessionId(null); return; }
    try {
      await fetch(API + "/sessions/" + editingSessionId, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editingName.trim() }) });
      setSessions(prev => prev.map(s => s.id === editingSessionId ? { ...s, name: editingName.trim() } : s));
    } catch (err) { console.error("重命名失败:", err); }
    setEditingSessionId(null);
  };

  // === Settings ===
  const handleOpenSettings = async () => {
    try {
      const res = await fetch(API + "/settings");
      setSettingsData(await res.json());
      setSettingsTab("general");
      setShowSettings(true);
    } catch (err) { console.error("加载设置失败:", err); }
  };

  const handleSaveSettings = async () => {
    if (!settingsData) return;
    setSettingsSaving(true);
    try {
      await fetch(API + "/settings/" + settingsData.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settingsData) });
      setShowSettings(false);
    } catch (err) { console.error("保存设置失败:", err); }
    finally { setSettingsSaving(false); }
  };

  // === Chat ===
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      try {
        const res = await fetch(API + "/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "新对话" }) });
        const session = await res.json();
        setSessions(prev => [session, ...prev]);
        setActiveSessionId(session.id);
        currentSessionId = session.id;
      } catch (err) { console.error("创建会话失败:", err); return; }
    }
    const userContent = input;
    setInput("");
    const tempUserMsg = { id: Date.now(), role: "user", content: userContent };
    setMessages(prev => [...prev, tempUserMsg]);
    if (!previews[currentSessionId]) {
      setPreviews(prev => ({ ...prev, [currentSessionId]: userContent.substring(0, 30) + (userContent.length > 30 ? "..." : "") }));
    }
    setLoading(true);
    const tempAiMsg = { id: Date.now() + 1, role: "assistant", content: "…" };
    setMessages(prev => [...prev, tempAiMsg]);

    try {
      const res = await fetch(API + "/chat/stream", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: currentSessionId, content: userContent }),
      });
      if (!res.ok) {
        const errData = await res.json();
        setMessages(prev => prev.map(m => m.id === tempAiMsg.id ? { ...m, content: "出错了: " + (errData.error || res.statusText) } : m));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "text") {
              fullText += event.text;
              const t = fullText;
              setMessages(prev => prev.map(m => m.id === tempAiMsg.id ? { ...m, content: t } : m));
            } else if (event.type === "error") {
              setMessages(prev => prev.map(m => m.id === tempAiMsg.id ? { ...m, content: "出错了: " + event.text } : m));
            }
          } catch (e) {}
        }
      }
      if (!fullText) setMessages(prev => prev.map(m => m.id === tempAiMsg.id ? { ...m, content: "（空回复）" } : m));
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === tempAiMsg.id ? { ...m, content: "网络错误: " + err.message } : m));
    } finally { setLoading(false); }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // === Styles ===
  const sidebarItemStyle = (isActive) => ({
    padding: "10px 12px", borderRadius: 8, cursor: "pointer",
    background: isActive ? COLORS.sidebarActive : "transparent",
    marginBottom: 2, transition: "background 0.15s", position: "relative",
  });

  const inputFieldStyle = {
    width: "100%", border: `1px solid ${COLORS.inputBorder}`, borderRadius: 8,
    padding: "6px 10px", fontSize: 13, outline: "none",
    background: COLORS.bg, color: COLORS.text, boxSizing: "border-box",
  };

  const toolBtnStyle = {
    width: 32, height: 32, borderRadius: 8, border: "none",
    background: "transparent", cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center", color: COLORS.textSecondary,
  };

  // === Render ===
  return (
    <div style={{ display: "flex", height: "100vh", background: COLORS.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: COLORS.text }}>

      {/* === Sidebar === */}
      <div style={{
        width: sidebarOpen ? 260 : 0, minWidth: sidebarOpen ? 260 : 0,
        borderRight: sidebarOpen ? `1px solid ${COLORS.sidebarBorder}` : "none",
        background: COLORS.sidebar, display: "flex", flexDirection: "column",
        overflow: "hidden", transition: "all 0.2s ease",
      }}>
        {/* Logo + New Chat */}
        <div style={{ padding: "16px", borderBottom: `1px solid ${COLORS.sidebarBorder}` }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "0.02em", marginBottom: 12 }}>plutocael</div>
          <button onClick={handleNewSession} style={{
            width: "100%", padding: "8px 12px", border: `1px solid ${COLORS.inputBorder}`,
            borderRadius: 8, background: COLORS.bg, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: COLORS.textSecondary,
          }}>
            <PlusIcon /> 新对话
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.sidebarBorder}` }}>
          {[["chats", "对话"], ["memory", null]].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              flex: 1, padding: "10px 0", border: "none", background: "transparent", cursor: "pointer", fontSize: 13,
              fontWeight: activeTab === key ? 600 : 400,
              color: activeTab === key ? COLORS.text : COLORS.textSecondary,
              borderBottom: activeTab === key ? `2px solid ${COLORS.accent}` : "2px solid transparent",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}>
              {key === "memory" && <MemoryIcon />} {label || "记忆库"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {activeTab === "chats" ? (
            sessions.length === 0 ? (
              <div style={{ padding: "16px 8px", fontSize: 13, color: COLORS.textSecondary }}>还没有对话，点上方"新对话"开始</div>
            ) : sessions.map(s => (
              <div key={s.id} onClick={() => { if (!editingSessionId) setActiveSessionId(s.id); }}
                onMouseEnter={() => setHoveredSessionId(s.id)} onMouseLeave={() => setHoveredSessionId(null)}
                style={sidebarItemStyle(s.id === activeSessionId)}>
                {editingSessionId === s.id ? (
                  <input ref={editInputRef} value={editingName} onChange={e => setEditingName(e.target.value)}
                    onBlur={handleSaveRename} onKeyDown={e => { if (e.key === "Enter") handleSaveRename(); if (e.key === "Escape") setEditingSessionId(null); }}
                    style={{ width: "100%", border: `1px solid ${COLORS.accent}`, borderRadius: 4, padding: "2px 6px", fontSize: 13, outline: "none", background: COLORS.input, color: COLORS.text, fontFamily: "inherit" }}
                  />
                ) : (
                  <>
                    <div style={{ fontSize: 13, color: s.id === activeSessionId ? COLORS.text : COLORS.textSecondary, paddingRight: hoveredSessionId === s.id ? 50 : 0 }}>{s.name}</div>
                    {previews[s.id] && <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2, opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{previews[s.id]}</div>}
                    {hoveredSessionId === s.id && (
                      <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 4 }}>
                        <button onClick={e => handleStartRename(e, s)} style={{ width: 22, height: 22, borderRadius: 4, border: "none", background: COLORS.buttonHover, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textSecondary }} title="重命名"><EditIcon /></button>
                        <button onClick={e => handleDeleteSession(e, s.id)} style={{ width: 22, height: 22, borderRadius: 4, border: "none", background: COLORS.buttonHover, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.danger }} title="删除"><CloseIcon /></button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: "8px 0" }}>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 8, padding: "0 8px" }}>记忆条目</div>
              {memories.length === 0 ? (
                <div style={{ fontSize: 13, color: COLORS.textSecondary, padding: "0 8px" }}>暂无记忆</div>
              ) : memories.map(m => (
                <div key={m.id} style={{ padding: "8px 10px", marginBottom: 4, borderRadius: 6, fontSize: 13, background: COLORS.accentLight, color: COLORS.text, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.memoryTag, flexShrink: 0 }} />
                  {m.summary || "(空)"}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Bottom - Settings */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLORS.sidebarBorder}` }}>
          <button onClick={handleOpenSettings} style={{
            width: "100%", padding: "8px 12px", border: "none", borderRadius: 8,
            background: "transparent", cursor: "pointer", display: "flex",
            alignItems: "center", gap: 8, fontSize: 13, color: COLORS.textSecondary,
            transition: "background 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.sidebarHover}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <SettingsIcon /> 设置
          </button>
        </div>
      </div>

      {/* === Main Chat Area === */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <div style={{
          padding: "12px 20px", borderBottom: `1px solid ${COLORS.sidebarBorder}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", background: COLORS.sidebar,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, color: COLORS.textSecondary, display: "flex", alignItems: "center" }}>
              <MenuIcon />
            </button>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{activeSession ? activeSession.name : "plutocael"}</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 0", display: "flex", flexDirection: "column" }}>
          <div style={{ maxWidth: 720, width: "100%", margin: "0 auto", padding: "0 24px" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "80px 0", color: COLORS.textSecondary, fontSize: 14 }}>发消息给 Cael 开始对话</div>
            )}
            {messages.map(msg => (
              <div key={msg.id} style={{ marginBottom: 20, display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4, paddingLeft: msg.role === "assistant" ? 2 : 0, paddingRight: msg.role === "user" ? 2 : 0 }}>
                  {msg.role === "user" ? "Jasmine" : "Cael"}
                </div>
                <div style={{
                  padding: "10px 16px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user" ? COLORS.userBubble : COLORS.aiBubble,
                  border: msg.role === "assistant" ? `1px solid ${COLORS.sidebarBorder}` : "none",
                  maxWidth: "85%", fontSize: 14, lineHeight: 1.6, color: COLORS.text, whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div style={{ padding: "16px 24px 24px", background: COLORS.bg }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{
              display: "flex", alignItems: "flex-end",
              border: `1px solid ${COLORS.inputBorder}`, borderRadius: 16,
              background: COLORS.input, padding: "4px 4px 4px 8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              {/* Tool Buttons */}
              <button style={toolBtnStyle} title="上传文件（开发中）" onClick={() => alert("文件上传功能开发中")}>
                <UploadIcon />
              </button>
              <button style={toolBtnStyle} title="搜索（开发中）" onClick={() => alert("搜索功能开发中")}>
                <SearchIcon />
              </button>

              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="发消息给 Cael..." rows={1}
                style={{ flex: 1, border: "none", outline: "none", resize: "none", fontSize: 14, lineHeight: 1.5, padding: "8px 8px", background: "transparent", color: COLORS.text, fontFamily: "inherit" }}
              />
              <button onClick={handleSend} disabled={!input.trim() || loading} style={{
                width: 36, height: 36, borderRadius: 12, border: "none",
                background: input.trim() && !loading ? COLORS.accent : COLORS.accentLight,
                color: input.trim() && !loading ? "#fff" : COLORS.textSecondary,
                cursor: input.trim() && !loading ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s", flexShrink: 0,
              }}>
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* === Settings Modal === */}
      {showSettings && settingsData && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowSettings(false)}>
          <div style={{ background: COLORS.sidebar, borderRadius: 16, width: 560, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
            onClick={e => e.stopPropagation()}>

            {/* Settings Header */}
            <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>设置</div>
              <button onClick={() => setShowSettings(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: COLORS.textSecondary, padding: 4 }}>
                <Icon size={18}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>
              </button>
            </div>

            {/* Settings Tabs */}
            <div style={{ display: "flex", gap: 4, padding: "16px 24px 0", borderBottom: `1px solid ${COLORS.sidebarBorder}` }}>
              {[
                ["general", "通用"],
                ["prompt", "Prompt"],
                ["mcp", "MCP"],
                ["tokens", "Token 统计"],
              ].map(([key, label]) => (
                <button key={key} onClick={() => setSettingsTab(key)} style={{
                  padding: "8px 12px", border: "none", background: "transparent", cursor: "pointer",
                  fontSize: 13, color: settingsTab === key ? COLORS.text : COLORS.textSecondary,
                  fontWeight: settingsTab === key ? 600 : 400,
                  borderBottom: settingsTab === key ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                  marginBottom: -1,
                }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Settings Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

              {settingsTab === "general" && (
                <>
                  <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>温度 ({settingsData.temperature})</label>
                      <input type="range" min="0" max="2" step="0.1" value={settingsData.temperature}
                        onChange={e => setSettingsData({ ...settingsData, temperature: parseFloat(e.target.value) })} style={{ width: "100%" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>上下文轮数</label>
                      <input type="number" min="1" max="50" value={settingsData.max_context_rounds}
                        onChange={e => setSettingsData({ ...settingsData, max_context_rounds: parseInt(e.target.value) || 10 })} style={inputFieldStyle} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>最大回复 tokens</label>
                      <input type="number" min="100" max="8000" value={settingsData.max_reply_tokens}
                        onChange={e => setSettingsData({ ...settingsData, max_reply_tokens: parseInt(e.target.value) || 2000 })} style={inputFieldStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>最大上下文 tokens</label>
                      <input type="number" min="1000" max="100000" value={settingsData.max_context_tokens}
                        onChange={e => setSettingsData({ ...settingsData, max_context_tokens: parseInt(e.target.value) || 8000 })} style={inputFieldStyle} />
                    </div>
                  </div>
                </>
              )}

              {settingsTab === "prompt" && (
                <div>
                  <label style={{ fontSize: 12, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>System Prompt</label>
                  <textarea value={settingsData.system_prompt || ""} onChange={e => setSettingsData({ ...settingsData, system_prompt: e.target.value })}
                    rows={16} style={{ ...inputFieldStyle, resize: "vertical", padding: "10px 12px", lineHeight: 1.6 }} />
                </div>
              )}

              {settingsTab === "mcp" && (
                <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.textSecondary }}>
                  <McpIcon /><div style={{ marginTop: 8, fontSize: 13 }}>MCP 管理</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>配置外部工具连接（开发中）</div>
                </div>
              )}

              {settingsTab === "tokens" && (
                <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.textSecondary }}>
                  <ChartIcon /><div style={{ marginTop: 8, fontSize: 13 }}>Token 用量统计</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>查看 API 调用和花费（开发中）</div>
                </div>
              )}
            </div>

            {/* Settings Footer */}
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${COLORS.sidebarBorder}`, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShowSettings(false)} style={{
                padding: "8px 16px", border: `1px solid ${COLORS.inputBorder}`, borderRadius: 8,
                background: "transparent", cursor: "pointer", fontSize: 13, color: COLORS.textSecondary,
              }}>取消</button>
              <button onClick={handleSaveSettings} disabled={settingsSaving} style={{
                padding: "8px 16px", border: "none", borderRadius: 8, background: COLORS.accent,
                color: "#fff", cursor: "pointer", fontSize: 13, opacity: settingsSaving ? 0.6 : 1,
              }}>{settingsSaving ? "保存中..." : "保存"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
