import { useState, useRef, useEffect } from "react";

const API = "https://api.plutocael.icu/api";

const COLORS = {
  bg: "#FAFAF8",
  sidebar: "#F8F5F2",
  sidebarBorder: "#E8E5E0",
  sidebarHover: "#F0ECE7",
  sidebarActive: "#D5C4B5",
  sidebarActiveText: "#FFFFFF",
  input: "#FFFFFF",
  inputBorder: "#D9D6D0",
  userBubble: "#C4A08A",
  userBubbleText: "#FFFFFF",
  text: "#1A1A1A",
  textSecondary: "#6B6B6B",
  placeholder: "#A3A3A3",
  accent: "#C4A08A",
  accentHover: "#B08E7A",
  accentLight: "#F0ECE7",
  buttonHover: "#E8E3DB",
  danger: "#DC4A4A",
  divider: "#E8E5E0",
  cardBg: "#FFFFFF",
  catLife: { bg: "#FFF3E6", text: "#D4804A" },
  catDev: { bg: "#E8F0FE", text: "#4A7FD4" },
  catFiction: { bg: "#F3E8FE", text: "#8A4AD4" },
  catWork: { bg: "#E6F9EE", text: "#3AAF6B" },
  catDefault: { bg: "#F0F0F0", text: "#6B6B6B" },
};
const CATEGORY_COLORS = { "生活": COLORS.catLife, "开发日志": COLORS.catDev, "小说灵感": COLORS.catFiction, "工作计划": COLORS.catWork };
function getCatColor(cat) { return CATEGORY_COLORS[cat] || COLORS.catDefault; }

const Icon = ({ children, size = 16 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>);
function SendIcon() { return <Icon size={18}><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></Icon>; }
function PlusIcon() { return <Icon><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Icon>; }
function ChatIcon() { return <Icon size={18}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Icon>; }
function MemoryIcon() { return <Icon size={18}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></Icon>; }
function MenuIcon() { return <Icon size={20}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></Icon>; }
function CloseIcon() { return <Icon size={12}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>; }
function EditIcon() { return <Icon size={12}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Icon>; }
function SettingsIcon() { return <Icon size={18}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></Icon>; }
function TrashIcon() { return <Icon size={14}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Icon>; }
function CopyIcon() { return <Icon size={14}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Icon>; }
function StarIcon({ filled }) { return <Icon size={14}>{filled ? <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" /> : <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />}</Icon>; }

const DEFAULT_CATEGORIES = ["生活", "开发日志", "小说灵感", "工作计划"];

export default function PlutocaelChat() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("chat");
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [hoveredSessionId, setHoveredSessionId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsData, setSettingsData] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsTab, setSettingsTab] = useState("general");
  const [previews, setPreviews] = useState({});
  const [memories, setMemories] = useState([]);
  const [memoryFilter, setMemoryFilter] = useState("全部");
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [newMemory, setNewMemory] = useState({ content: "", category: "生活", importance: 3 });
  const [editingMemory, setEditingMemory] = useState(null);
  const [expandedMemoryId, setExpandedMemoryId] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingMsgContent, setEditingMsgContent] = useState("");
  const messagesEndRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => { fetch(API + "/sessions").then(r => r.json()).then(data => { setSessions(data); if (data.length > 0 && !activeSessionId) setActiveSessionId(data[0].id); data.forEach(s => loadPreview(s.id)); }).catch(err => console.error("加载会话失败:", err)); }, []);
  const loadPreview = async (sid) => { try { const res = await fetch(API + "/messages/session/" + sid); const msgs = await res.json(); const f = msgs.find(m => m.role === "user"); if (f) setPreviews(prev => ({ ...prev, [sid]: f.content.substring(0, 30) + (f.content.length > 30 ? "..." : "") })); } catch (e) {} };
  useEffect(() => { if (!activeSessionId) return; fetch(API + "/messages/session/" + activeSessionId).then(r => r.json()).then(setMessages).catch(err => console.error("加载消息失败:", err)); }, [activeSessionId]);
  useEffect(() => { if (currentPage === "memory") loadMemories(); }, [currentPage]);
  const loadMemories = () => { const url = memoryFilter === "全部" ? API + "/memories" : API + "/memories?category=" + encodeURIComponent(memoryFilter); fetch(url).then(r => r.json()).then(setMemories).catch(() => {}); };
  useEffect(() => { if (currentPage === "memory") loadMemories(); }, [memoryFilter]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (editingSessionId && editInputRef.current) { editInputRef.current.focus(); editInputRef.current.select(); } }, [editingSessionId]);

  useEffect(() => {
    const resetScroll = () => { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); document.body.scrollTop = 0; };
    const onResize = () => { resetScroll(); };
    const onScroll = () => { if (window.scrollY !== 0) resetScroll(); };
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onResize);
      window.visualViewport.addEventListener("scroll", onScroll);
    }
    window.addEventListener("scroll", onScroll, { passive: false });
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", onResize);
        window.visualViewport.removeEventListener("scroll", onScroll);
      }
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const handleNewSession = async () => { try { const res = await fetch(API + "/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "新对话" }) }); const s = await res.json(); setSessions(prev => [s, ...prev]); setActiveSessionId(s.id); setMessages([]); setCurrentPage("chat"); setSidebarOpen(false); } catch (err) { console.error("创建会话失败:", err); } };
  const handleDeleteSession = async (e, sid) => { e.stopPropagation(); if (!confirm("确定删除这个对话吗？")) return; try { await fetch(API + "/sessions/" + sid, { method: "DELETE" }); setSessions(prev => prev.filter(s => s.id !== sid)); if (activeSessionId === sid) { const r = sessions.filter(s => s.id !== sid); setActiveSessionId(r.length > 0 ? r[0].id : null); if (r.length === 0) setMessages([]); } } catch (err) { console.error("删除会话失败:", err); } };
  const handleStartRename = (e, s) => { e.stopPropagation(); setEditingSessionId(s.id); setEditingName(s.name); };
  const handleSaveRename = async () => { if (!editingName.trim() || !editingSessionId) { setEditingSessionId(null); return; } try { await fetch(API + "/sessions/" + editingSessionId, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editingName.trim() }) }); setSessions(prev => prev.map(s => s.id === editingSessionId ? { ...s, name: editingName.trim() } : s)); } catch (err) { console.error("重命名失败:", err); } setEditingSessionId(null); };
  const handleAddMemory = async () => { if (!newMemory.content.trim()) return; try { await fetch(API + "/memories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newMemory) }); setNewMemory({ content: "", category: "生活", importance: 3 }); setShowAddMemory(false); loadMemories(); } catch (err) { console.error("添加记忆失败:", err); } };
  const handleUpdateMemory = async () => { if (!editingMemory || !editingMemory.content.trim()) return; try { await fetch(API + "/memories/" + editingMemory.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: editingMemory.content, category: editingMemory.category, importance: editingMemory.importance }) }); setEditingMemory(null); loadMemories(); } catch (err) { console.error("更新记忆失败:", err); } };
  const handleDeleteMemory = async (id) => { if (!confirm("确定删除这条记忆吗？")) return; try { await fetch(API + "/memories/" + id, { method: "DELETE" }); loadMemories(); } catch (err) { console.error("删除记忆失败:", err); } };
  const handleOpenSettings = async () => { try { const res = await fetch(API + "/settings"); setSettingsData(await res.json()); setSettingsTab("general"); setShowSettings(true); } catch (err) { console.error("加载设置失败:", err); } };
  const handleSaveSettings = async () => { if (!settingsData) return; setSettingsSaving(true); try { await fetch(API + "/settings/" + settingsData.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settingsData) }); setShowSettings(false); } catch (err) { console.error("保存设置失败:", err); } finally { setSettingsSaving(false); } };

  const streamChat = async (sessionId, content, tempAiMsgId) => {
    try {
      const res = await fetch(API + "/chat/stream", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sessionId, content }) });
      if (!res.ok) { const e = await res.json(); setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: "出错了: " + (e.error || res.statusText) } : m)); return; }
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = "", fullText = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop();
        for (const line of lines) { if (!line.startsWith("data: ")) continue; try { const ev = JSON.parse(line.slice(6)); if (ev.type === "text") { fullText += ev.text; const t = fullText; setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: t } : m)); } else if (ev.type === "error") { setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: "出错了: " + ev.text } : m)); } } catch (e) {} } }
      if (!fullText) setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: "（空回复）" } : m));
    } catch (err) { setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: "网络错误: " + err.message } : m)); }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    let sid = activeSessionId;
    if (!sid) { try { const res = await fetch(API + "/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "新对话" }) }); const s = await res.json(); setSessions(prev => [s, ...prev]); setActiveSessionId(s.id); sid = s.id; } catch (err) { return; } }
    const content = input; setInput("");
    const uMsg = { id: Date.now(), role: "user", content, created_at: new Date().toISOString() };
    const aMsg = { id: Date.now() + 1, role: "assistant", content: "", created_at: new Date().toISOString() };
    setMessages(prev => [...prev, uMsg, aMsg]);
    if (!previews[sid]) setPreviews(prev => ({ ...prev, [sid]: content.substring(0, 30) + (content.length > 30 ? "..." : "") }));
    setLoading(true); await streamChat(sid, content, aMsg.id); setLoading(false);
  };

  const handleRetry = async (msg) => {
    if (loading) return;
    const idx = messages.indexOf(msg); let uMsg = null;
    for (let j = idx - 1; j >= 0; j--) { if (messages[j].role === "user") { uMsg = messages[j]; break; } }
    if (!uMsg) return; setLoading(true);
    const tempId = Date.now(); setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, id: tempId, content: "" } : m));
    await streamChat(activeSessionId, uMsg.content, tempId); setLoading(false);
  };

  const handleEditSend = async (msg) => {
    if (!editingMsgContent.trim() || loading) return;
    const idx = messages.findIndex(m => m.id === msg.id); const content = editingMsgContent.trim();
    setEditingMsgId(null); setEditingMsgContent("");
    const uMsg = { id: Date.now(), role: "user", content, created_at: new Date().toISOString() };
    const aMsg = { id: Date.now() + 1, role: "assistant", content: "", created_at: new Date().toISOString() };
    setMessages(prev => [...prev.slice(0, idx), uMsg, aMsg]); setLoading(true);
    await streamChat(activeSessionId, content, aMsg.id); setLoading(false);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const formatTime = (d) => { if (!d) return ""; return new Date(d).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }); };
  const formatDate = (d) => { if (!d) return ""; return d.split(" ")[0] || d.split("T")[0] || ""; };
  const ifs = { width: "100%", border: `1px solid ${COLORS.inputBorder}`, borderRadius: 12, padding: "8px 12px", fontSize: 14, outline: "none", background: COLORS.bg, color: COLORS.text, boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ display: "flex", flex: 1, width: "100%", background: COLORS.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: COLORS.text, overflow: "hidden", overscrollBehavior: "none", touchAction: "none" }}>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.25)", zIndex: 999 }} />}
      <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 280, background: COLORS.sidebar, zIndex: 1000, borderRight: `1px solid ${COLORS.sidebarBorder}`, display: "flex", flexDirection: "column", transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.25s ease", borderRadius: "0 16px 16px 0", boxShadow: sidebarOpen ? "4px 0 24px rgba(0,0,0,0.08)" : "none" }}>
        <div style={{ padding: "20px 20px 12px" }}><div style={{ fontSize: 18, fontWeight: 600, color: COLORS.accent }}>Plutocael</div></div>
        <div style={{ padding: "0 12px 8px" }}>
          <button onClick={handleNewSession} style={{ width: "100%", padding: "10px 16px", border: "none", borderRadius: 12, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: COLORS.text }} onMouseEnter={e => e.currentTarget.style.background = COLORS.sidebarHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}><PlusIcon /> 新对话</button>
        </div>
        <div style={{ padding: "0 12px 8px" }}>
          <button onClick={() => { setCurrentPage("chat"); setSidebarOpen(false); }} style={{ width: "100%", padding: "10px 16px", border: "none", borderRadius: 12, cursor: "pointer", background: currentPage === "chat" ? COLORS.sidebarActive : "transparent", color: currentPage === "chat" ? COLORS.sidebarActiveText : COLORS.text, display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}><ChatIcon /> 聊天</button>
          <button onClick={() => { setCurrentPage("memory"); setSidebarOpen(false); }} style={{ width: "100%", padding: "10px 16px", border: "none", borderRadius: 12, cursor: "pointer", marginTop: 2, background: currentPage === "memory" ? COLORS.sidebarActive : "transparent", color: currentPage === "memory" ? COLORS.sidebarActiveText : COLORS.text, display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}><MemoryIcon /> 记忆库</button>
        </div>
        <div style={{ height: 1, background: COLORS.divider, margin: "4px 20px" }} />
        <div style={{ flex: 1, overflow: "hidden auto", padding: "8px 12px", overscrollBehaviorY: "contain", overscrollBehaviorX: "none", touchAction: "pan-y", scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {currentPage === "chat" && (<>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, padding: "8px 8px 6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>最近对话</div>
            {sessions.length === 0 ? <div style={{ padding: "12px 8px", fontSize: 13, color: COLORS.placeholder }}>还没有对话</div> : sessions.map(s => (
              <div key={s.id} onClick={() => { if (!editingSessionId) { setActiveSessionId(s.id); setSidebarOpen(false); } }} onMouseEnter={() => setHoveredSessionId(s.id)} onMouseLeave={() => setHoveredSessionId(null)} style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer", background: s.id === activeSessionId ? COLORS.accentLight : "transparent", marginBottom: 2, position: "relative" }}>
                {editingSessionId === s.id ? <input ref={editInputRef} value={editingName} onChange={e => setEditingName(e.target.value)} onBlur={handleSaveRename} onKeyDown={e => { if (e.key === "Enter") handleSaveRename(); if (e.key === "Escape") setEditingSessionId(null); }} style={{ width: "100%", border: `1px solid ${COLORS.accent}`, borderRadius: 4, padding: "2px 6px", fontSize: 13, outline: "none", background: COLORS.input, color: COLORS.text, fontFamily: "inherit" }} /> : <>
                  <div style={{ fontSize: 14, color: COLORS.text, paddingRight: hoveredSessionId === s.id ? 50 : 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  {previews[s.id] && <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3, opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{previews[s.id]}</div>}
                  {hoveredSessionId === s.id && <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 4 }}>
                    <button onClick={e => handleStartRename(e, s)} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: COLORS.buttonHover, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textSecondary }} title="重命名"><EditIcon /></button>
                    <button onClick={e => handleDeleteSession(e, s.id)} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: COLORS.buttonHover, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.danger }} title="删除"><CloseIcon /></button>
                  </div>}
                </>}
              </div>))}
          </>)}
        </div>
        <div style={{ padding: "12px", borderTop: `1px solid ${COLORS.divider}` }}>
          <button onClick={() => { handleOpenSettings(); setSidebarOpen(false); }} style={{ width: "100%", padding: "10px 16px", border: "none", borderRadius: 12, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: COLORS.textSecondary }} onMouseEnter={e => e.currentTarget.style.background = COLORS.sidebarHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}><SettingsIcon /> 设置</button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, width: "100%" }}>
        {currentPage === "chat" ? (<>
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${COLORS.divider}`, display: "flex", alignItems: "center", background: COLORS.cardBg }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, color: COLORS.textSecondary, display: "flex", alignItems: "center", marginRight: 12 }}><MenuIcon /></button>
            <span style={{ fontSize: 15, fontWeight: 500 }}>{activeSession ? activeSession.name : "Plutocael"}</span>
          </div>
          <div style={{ flex: 1, overflow: "hidden auto", padding: "24px 0", overscrollBehaviorY: "contain", overscrollBehaviorX: "none", touchAction: "pan-y", scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <div style={{ maxWidth: 720, width: "100%", margin: "0 auto", padding: "0 24px" }}>
              {messages.length === 0 && <div style={{ textAlign: "center", padding: "80px 0", color: COLORS.placeholder, fontSize: 15 }}>发消息给 Cael 开始对话</div>}
              {messages.map((msg, i) => {
                const showTime = i === 0 || (messages[i-1] && msg.created_at && messages[i-1].created_at && new Date(msg.created_at).getTime() - new Date(messages[i-1].created_at).getTime() > 300000);
                return (<div key={msg.id}>
                  {showTime && msg.created_at && <div style={{ textAlign: "center", fontSize: 12, color: COLORS.placeholder, margin: "16px 0" }}>{formatTime(msg.created_at)}</div>}
                  <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "70%" }}>
                    {editingMsgId === msg.id ? (
                      <div style={{ width: "100%" }}>
                        <textarea value={editingMsgContent || msg.content} onChange={e => setEditingMsgContent(e.target.value)} onFocus={() => { if (!editingMsgContent) setEditingMsgContent(msg.content); }} rows={3} style={{ width: "100%", border: `1px solid ${COLORS.accent}`, borderRadius: 12, padding: "10px 12px", fontSize: 15, lineHeight: 1.7, outline: "none", background: COLORS.input, color: COLORS.text, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                        <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                          <button onClick={() => { setEditingMsgId(null); setEditingMsgContent(""); }} style={{ padding: "6px 16px", borderRadius: 20, border: `1px solid ${COLORS.inputBorder}`, background: "transparent", cursor: "pointer", fontSize: 13, color: COLORS.textSecondary }}>取消</button>
                          <button onClick={() => handleEditSend(msg)} style={{ padding: "6px 16px", borderRadius: 20, border: "none", background: COLORS.accent, color: "#fff", cursor: "pointer", fontSize: 13 }}>发送</button>
                        </div>
                      </div>
                    ) : (<>
                      <div style={{ padding: msg.role === "user" ? "12px 16px" : "4px 16px", borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : 0, background: msg.role === "user" ? COLORS.userBubble : "transparent", color: msg.role === "user" ? COLORS.userBubbleText : COLORS.text, fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{msg.content}</div>
                      <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
                        <button onClick={() => navigator.clipboard.writeText(msg.content)} style={{ padding: "4px 6px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.placeholder }} title="复制"><CopyIcon /></button>
                        {msg.role === "user" && <button onClick={() => setEditingMsgId(msg.id)} style={{ padding: "4px 6px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.placeholder }} title="编辑"><EditIcon /></button>}
                        {msg.role === "assistant" && <button onClick={() => handleRetry(msg)} style={{ padding: "4px 6px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.placeholder }} title="重试"><Icon size={14}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></Icon></button>}
                      </div>
                    </>)}
                  </div>
                </div>);
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div style={{ padding: "12px 24px 24px", background: COLORS.bg }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "flex-end", borderRadius: 20, background: "rgba(255,255,255,0.72)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", padding: "6px 6px 6px 16px", minHeight: 96, maxHeight: 400, boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)", boxSizing: "border-box" }}>
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="发消息给 Cael..." rows={1} style={{ flex: 1, border: "none", outline: "none", resize: "none", fontSize: 15, lineHeight: 1.5, padding: "8px 0", background: "transparent", color: COLORS.text, fontFamily: "inherit", alignSelf: "center" }} />
                <button onClick={handleSend} disabled={!input.trim() || loading} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: input.trim() && !loading ? COLORS.accent : COLORS.accentLight, color: input.trim() && !loading ? "#fff" : COLORS.placeholder, cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, alignSelf: "flex-start", marginTop: 18 }}><SendIcon /></button>
              </div>
            </div>
          </div>
        </>) : (<>
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${COLORS.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: COLORS.cardBg }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, color: COLORS.textSecondary, display: "flex", alignItems: "center", marginRight: 12 }}><MenuIcon /></button>
              <span style={{ fontSize: 15, fontWeight: 500 }}>记忆库</span>
            </div>
            <button onClick={() => { setEditingMemory(null); setNewMemory({ content: "", category: "生活", importance: 3 }); setShowAddMemory(true); }} style={{ padding: "6px 16px", border: "none", borderRadius: 20, background: COLORS.accent, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}><PlusIcon /> 添加</button>
          </div>
          <div style={{ padding: "12px 20px", display: "flex", gap: 8, flexWrap: "wrap", borderBottom: `1px solid ${COLORS.divider}`, background: COLORS.cardBg }}>
            {["全部", ...DEFAULT_CATEGORIES].map(cat => (<button key={cat} onClick={() => setMemoryFilter(cat)} style={{ padding: "6px 16px", borderRadius: 20, border: memoryFilter === cat ? "none" : `1px solid ${COLORS.divider}`, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap", background: memoryFilter === cat ? COLORS.accent : "transparent", color: memoryFilter === cat ? "#fff" : COLORS.textSecondary }}>{cat}</button>))}
          </div>
          <div style={{ flex: 1, overflow: "hidden auto", padding: "16px 20px", overscrollBehaviorY: "contain", overscrollBehaviorX: "none", touchAction: "pan-y", scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              {memories.length === 0 ? <div style={{ textAlign: "center", padding: "60px 0", color: COLORS.placeholder, fontSize: 14 }}>还没有记忆，点击右上角添加</div> : memories.map(m => (
                <div key={m.id} onClick={() => setExpandedMemoryId(expandedMemoryId === m.id ? null : m.id)} style={{ background: COLORS.cardBg, borderRadius: 16, padding: "16px", marginBottom: 12, border: `1px solid ${COLORS.divider}`, cursor: "pointer" }}>
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: COLORS.text, overflow: expandedMemoryId === m.id ? "visible" : "hidden", display: expandedMemoryId === m.id ? "block" : "-webkit-box", WebkitLineClamp: expandedMemoryId === m.id ? "none" : 3, WebkitBoxOrient: "vertical" }}>{m.content}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 12, background: getCatColor(m.category).bg, color: getCatColor(m.category).text }}>{m.category}</span>
                    <div style={{ display: "flex", gap: 1, color: COLORS.accent }}>{[1,2,3,4,5].map(n => <StarIcon key={n} filled={n <= m.importance} />)}</div>
                    <span style={{ fontSize: 12, color: COLORS.placeholder, marginLeft: "auto" }}>{formatDate(m.created_at)}</span>
                  </div>
                  {expandedMemoryId === m.id && <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.divider}` }}>
                    <button onClick={e => { e.stopPropagation(); setEditingMemory({ ...m }); setShowAddMemory(true); }} style={{ padding: "6px 16px", borderRadius: 20, border: `1px solid ${COLORS.inputBorder}`, background: "transparent", cursor: "pointer", fontSize: 13, color: COLORS.text, display: "flex", alignItems: "center", gap: 4 }}><EditIcon /> 编辑</button>
                    <button onClick={e => { e.stopPropagation(); handleDeleteMemory(m.id); }} style={{ padding: "6px 16px", borderRadius: 20, border: `1px solid ${COLORS.danger}`, background: "transparent", cursor: "pointer", fontSize: 13, color: COLORS.danger, display: "flex", alignItems: "center", gap: 4 }}><TrashIcon /> 删除</button>
                  </div>}
                </div>))}
            </div>
          </div>
        </>)}
      </div>

      {showAddMemory && <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }} onClick={() => { setShowAddMemory(false); setEditingMemory(null); }}>
        <div style={{ background: COLORS.cardBg, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560, maxHeight: "70vh", display: "flex", flexDirection: "column", padding: "20px 24px 32px" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{editingMemory ? "编辑记忆" : "添加记忆"}</div>
            <button onClick={() => { setShowAddMemory(false); setEditingMemory(null); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: COLORS.textSecondary, padding: 4 }}><Icon size={18}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon></button>
          </div>
          <textarea value={editingMemory ? editingMemory.content : newMemory.content} onChange={e => editingMemory ? setEditingMemory({ ...editingMemory, content: e.target.value }) : setNewMemory({ ...newMemory, content: e.target.value })} placeholder="写下你想记住的事..." rows={5} style={{ ...ifs, resize: "vertical", padding: "12px", lineHeight: 1.7, marginBottom: 16 }} />
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 }}>分类</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{DEFAULT_CATEGORIES.map(cat => { const sel = editingMemory ? editingMemory.category === cat : newMemory.category === cat; return <button key={cat} onClick={() => editingMemory ? setEditingMemory({ ...editingMemory, category: cat }) : setNewMemory({ ...newMemory, category: cat })} style={{ padding: "6px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13, background: sel ? getCatColor(cat).bg : COLORS.bg, color: sel ? getCatColor(cat).text : COLORS.textSecondary, border: sel ? `1px solid ${getCatColor(cat).text}33` : `1px solid ${COLORS.divider}`, fontWeight: sel ? 600 : 400 }}>{cat}</button>; })}</div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 }}>重要性</div>
            <div style={{ display: "flex", gap: 4 }}>{[1,2,3,4,5].map(n => <button key={n} onClick={() => editingMemory ? setEditingMemory({ ...editingMemory, importance: n }) : setNewMemory({ ...newMemory, importance: n })} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, color: n <= (editingMemory ? editingMemory.importance : newMemory.importance) ? COLORS.accent : COLORS.placeholder }}><StarIcon filled={n <= (editingMemory ? editingMemory.importance : newMemory.importance)} /></button>)}</div>
          </div>
          <button onClick={editingMemory ? handleUpdateMemory : handleAddMemory} style={{ width: "100%", padding: "12px", border: "none", borderRadius: 20, background: COLORS.accent, color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 500 }} onMouseEnter={e => e.currentTarget.style.background = COLORS.accentHover} onMouseLeave={e => e.currentTarget.style.background = COLORS.accent}>{editingMemory ? "保存修改" : "保存"}</button>
        </div>
      </div>}

      {showSettings && settingsData && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowSettings(false)}>
        <div style={{ background: COLORS.cardBg, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 600, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 -4px 12px rgba(0,0,0,0.08), 0 -16px 48px rgba(0,0,0,0.12)", animation: "slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)" }} onClick={e => e.stopPropagation()}>
          <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>设置</div>
            <button onClick={() => setShowSettings(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: COLORS.textSecondary, padding: 4 }}><Icon size={18}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon></button>
          </div>
          <div style={{ display: "flex", gap: 4, padding: "16px 24px 0", borderBottom: `1px solid ${COLORS.divider}` }}>
            {[["general", "通用"], ["prompt", "Prompt"]].map(([key, label]) => <button key={key} onClick={() => setSettingsTab(key)} style={{ padding: "8px 16px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: settingsTab === key ? COLORS.text : COLORS.textSecondary, fontWeight: settingsTab === key ? 600 : 400, borderBottom: settingsTab === key ? `2px solid ${COLORS.accent}` : "2px solid transparent", marginBottom: -1 }}>{label}</button>)}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {settingsTab === "general" && <>
              <div style={{ marginBottom: 16 }}><label style={{ fontSize: 13, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>API 地址</label><input type="text" value={settingsData.api_base_url || ""} placeholder="留空则使用默认" onChange={e => setSettingsData({ ...settingsData, api_base_url: e.target.value })} style={ifs} /></div>
              <div style={{ marginBottom: 16 }}><label style={{ fontSize: 13, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>API Key</label><input type="password" value={settingsData.api_key || ""} placeholder="留空则使用环境变量" onChange={e => setSettingsData({ ...settingsData, api_key: e.target.value })} style={ifs} /></div>
              <div style={{ marginBottom: 16 }}><label style={{ fontSize: 13, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>模型</label><input type="text" value={settingsData.model || ""} placeholder="如 claude-sonnet-4-20250514" onChange={e => setSettingsData({ ...settingsData, model: e.target.value })} style={ifs} /></div>
              <div style={{ height: 1, background: COLORS.divider, margin: "16px 0" }} />
              <div style={{ marginBottom: 16 }}><label style={{ fontSize: 13, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>温度 ({settingsData.temperature})</label><input type="range" min="0" max="2" step="0.1" value={settingsData.temperature} onChange={e => setSettingsData({ ...settingsData, temperature: parseFloat(e.target.value) })} style={{ width: "100%" }} /></div>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}><label style={{ fontSize: 13, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>上下文轮数</label><input type="number" min="1" max="50" value={settingsData.max_context_rounds} onChange={e => setSettingsData({ ...settingsData, max_context_rounds: parseInt(e.target.value) || 10 })} style={ifs} /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: 13, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>最大回复 tokens</label><input type="number" min="100" max="8000" value={settingsData.max_reply_tokens} onChange={e => setSettingsData({ ...settingsData, max_reply_tokens: parseInt(e.target.value) || 2000 })} style={ifs} /></div>
              </div>
            </>}
            {settingsTab === "prompt" && <div><label style={{ fontSize: 13, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>System Prompt</label><textarea value={settingsData.system_prompt || ""} onChange={e => setSettingsData({ ...settingsData, system_prompt: e.target.value })} rows={16} style={{ ...ifs, resize: "vertical", padding: "12px", lineHeight: 1.7 }} /></div>}
          </div>
          <div style={{ padding: "16px 24px", borderTop: `1px solid ${COLORS.divider}`, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => setShowSettings(false)} style={{ padding: "8px 20px", border: `1px solid ${COLORS.inputBorder}`, borderRadius: 20, background: "transparent", cursor: "pointer", fontSize: 14, color: COLORS.textSecondary }}>取消</button>
            <button onClick={handleSaveSettings} disabled={settingsSaving} style={{ padding: "8px 20px", border: "none", borderRadius: 20, background: COLORS.accent, color: "#fff", cursor: "pointer", fontSize: 14, opacity: settingsSaving ? 0.6 : 1 }}>{settingsSaving ? "保存中..." : "保存"}</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
