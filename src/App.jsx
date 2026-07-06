import { useState, useRef, useEffect } from "react";
import McpManager from './McpManager';

// 开发时走 "/api"（由 vite.config.js 代理到本地后端 3000 端口），
// 生产构建时用 .env.production 里的 VITE_API_BASE 指向线上后端
const API = import.meta.env.VITE_API_BASE || "/api";

// 多主题系统：claude（Claude官方米白）/ dark（夜间）/ rose（玫瑰）
const THEMES = {
  claude: {
    label: "米白",
    bg: "#F5F4EE", sidebar: "#F0EEE6", sidebarBorder: "#E5E1D8", sidebarHover: "#E8E5DC",
    sidebarActive: "#D97757", sidebarActiveText: "#FFFFFF",
    input: "#FFFFFF", inputBorder: "#DAD5C9",
    userBubble: "#F0EEE6", userBubbleText: "#1F1E1D",
    text: "#1F1E1D", textSecondary: "#6E6A63", placeholder: "#A8A296",
    accent: "#D97757", accentHover: "#C4623F", accentLight: "#F5E8E0",
    buttonHover: "#E8E4DA", danger: "#C0392B", divider: "#E5E1D8", cardBg: "#FFFFFF",
    glass: "rgba(255,255,255,0.4)", glassHover: "rgba(255,255,255,0.75)",
  },
  dark: {
    label: "夜间",
    bg: "#262624", sidebar: "#1F1E1D", sidebarBorder: "#3A3936", sidebarHover: "#32312E",
    sidebarActive: "#D97757", sidebarActiveText: "#FFFFFF",
    input: "#30302E", inputBorder: "#4A4844",
    userBubble: "#3A3936", userBubbleText: "#ECEAE5",
    text: "#ECEAE5", textSecondary: "#A8A49C", placeholder: "#6E6A63",
    accent: "#D97757", accentHover: "#E08B6D", accentLight: "#4A3A32",
    buttonHover: "#3A3936", danger: "#E06C5B", divider: "#3A3936", cardBg: "#30302E",
    glass: "rgba(48,48,46,0.7)", glassHover: "rgba(58,57,54,0.95)",
  },
  rose: {
    label: "玫瑰",
    bg: "#FDF0F4", sidebar: "#F9E8EE", sidebarBorder: "#F0D9E2", sidebarHover: "#F5DFE7",
    sidebarActive: "#D4849A", sidebarActiveText: "#FFFFFF",
    input: "#FFFFFF", inputBorder: "#E8CBD6",
    userBubble: "#F5DFE7", userBubbleText: "#3D2A32",
    text: "#3D2A32", textSecondary: "#8A6B77", placeholder: "#C0A3AE",
    accent: "#D4849A", accentHover: "#C06B84", accentLight: "#FAE3EA",
    buttonHover: "#F0D9E2", danger: "#C0392B", divider: "#F0D9E2", cardBg: "#FFFFFF",
    glass: "rgba(255,255,255,0.4)", glassHover: "rgba(255,255,255,0.75)",
  },
};
const CAT_COLORS = {
  "生活": { bg: "#FFF3E6", text: "#D4804A" },
  "开发日志": { bg: "#E8F0FE", text: "#4A7FD4" },
  "小说灵感": { bg: "#F3E8FE", text: "#8A4AD4" },
  "工作计划": { bg: "#E6F9EE", text: "#3AAF6B" },
  "记忆库": { bg: "#F5E8E0", text: "#C4623F" },
};
const CAT_DEFAULT = { bg: "#F0F0F0", text: "#6B6B6B" };
function getCatColor(cat) { return CAT_COLORS[cat] || CAT_DEFAULT; }

const Icon = ({ children, size = 16 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>);
function SendIcon() { return <Icon size={18}><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></Icon>; }
function PlusIcon() { return <Icon><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Icon>; }
function ChatIcon() { return <Icon size={18}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Icon>; }
function MemoryIcon() { return <Icon size={18}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></Icon>; }
function MenuIcon() { return <Icon size={20}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></Icon>; }
function BoardIcon() { return <Icon size={18}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></Icon>; }
function CloseIcon() { return <Icon size={12}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>; }
function EditIcon() { return <Icon size={12}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Icon>; }
function SettingsIcon() { return <Icon size={18}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></Icon>; }
function TrashIcon() { return <Icon size={14}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Icon>; }
function CopyIcon() { return <Icon size={14}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Icon>; }
function StarIcon({ filled }) { return <Icon size={14}>{filled ? <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" /> : <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />}</Icon>; }

// MCP 记忆的层级(记忆衰退机制按 core→episodic 从慢到快)
const LAYERS = [
  { key: "core", label: "核心", color: { bg: "#F5E8E0", text: "#C4623F" }, halfLife: "永久" },
  { key: "semantic", label: "语义", color: { bg: "#E8F0FE", text: "#4A7FD4" }, halfLife: "~90天" },
  { key: "procedural", label: "程序", color: { bg: "#E6F9EE", text: "#3AAF6B" }, halfLife: "~30天" },
  { key: "episodic", label: "情节", color: { bg: "#F3E8FE", text: "#8A4AD4" }, halfLife: "~7天" },
];
const LAYER_MAP = Object.fromEntries(LAYERS.map(l => [l.key, l]));
const DEFAULT_CATEGORIES = LAYERS.map(l => l.key);

// 记忆衰退计算（与 MCP 服务器 decay.py 一致）
// core层永久不衰退；其余：半衰期=30+(重要性-1)×7.5天，强度=0.5^(未访问天数/半衰期)
function computeDecay(m) {
  const importance = m.importance || 3;
  if (m.layer === "core") return { strength: 1, isCore: true, halflife: null, days: 0 };
  const halflife = 30 + (importance - 1) * 7.5;
  const last = m.last_accessed ? new Date(String(m.last_accessed).replace(" ", "T")) : null;
  const days = (last && !isNaN(last.getTime())) ? Math.max(0, (Date.now() - last.getTime()) / 86400000) : 0;
  const strength = Math.max(0, Math.min(1, Math.pow(0.5, days / halflife)));
  return { strength, isCore: false, halflife, days };
}
// 强度 → 颜色（新鲜绿 → 淡黄 → 褪色红）
function decayColor(s) {
  if (s >= 0.66) return "#3AAF6B";
  if (s >= 0.33) return "#E0A030";
  return "#C0655A";
}

const DEFAULT_CUSTOM = { dark: false, glass: false, accent: "#D97757", bg: "#F5F4EE", bgA: 100, sidebar: "#F0EEE6", sidebarA: 100, userBubble: "#F0EEE6", userBubbleA: 100 };
// hex + 透明度百分比 → rgba
function hexToRgba(hex, alphaPct) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  const a = Math.max(0, Math.min(100, alphaPct == null ? 100 : alphaPct)) / 100;
  if (!m) return `rgba(0,0,0,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function buildCustomColors(c) {
  const base = c.dark ? THEMES.dark : THEMES.claude;
  return {
    ...base,
    bg: hexToRgba(c.bg, c.bgA),
    sidebar: hexToRgba(c.sidebar, c.sidebarA),
    userBubble: hexToRgba(c.userBubble, c.userBubbleA),
    accent: c.accent, accentHover: c.accent, sidebarActive: c.accent,
    accentLight: hexToRgba(c.accent, 16),
    _glass: !!c.glass,
    _solidBg: c.dark ? "#262624" : "#F5F4EE", // 玻璃/壁纸打底色
  };
}

export default function PlutocaelChat() {
  const [theme, setTheme] = useState(() => localStorage.getItem("pluto_theme") || "claude");
  const [customTheme, setCustomTheme] = useState(() => { try { return { ...DEFAULT_CUSTOM, ...(JSON.parse(localStorage.getItem("pluto_custom_theme")) || {}) }; } catch (e) { return DEFAULT_CUSTOM; } });
  const COLORS = theme === "custom" ? buildCustomColors(customTheme) : (THEMES[theme] || THEMES.claude);
  const glassMode = theme === "custom" && customTheme.glass;
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
  const [settingsSection, setSettingsSection] = useState(null); // null=主列表，或分区key
  const [previews, setPreviews] = useState({});
  const [memories, setMemories] = useState([]);
  const [memoryFilter, setMemoryFilter] = useState("全部");
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [newMemory, setNewMemory] = useState({ title: "", content: "", layer: "episodic", importance: 3 });
  const [editingMemory, setEditingMemory] = useState(null);
  const [expandedMemoryId, setExpandedMemoryId] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingMsgContent, setEditingMsgContent] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [gatewayStats, setGatewayStats] = useState(null);
  const [gatewayPeriod, setGatewayPeriod] = useState("today");
  const [mcpMemories, setMcpMemories] = useState([]);
  const [mcpTools, setMcpTools] = useState([]);
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcpSelectedTool, setMcpSelectedTool] = useState("");
  const [mcpToolArgs, setMcpToolArgs] = useState("{}");
  const [mcpToolResult, setMcpToolResult] = useState("");
  const [boardMessages, setBoardMessages] = useState([]);
  const [newBoardMsg, setNewBoardMsg] = useState("");
  const [pendingImage, setPendingImage] = useState(null);
  const fileInputRef = useRef(null);
  const wallpaperInputRef = useRef(null);
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem("pluto_wallpaper") || "");
  const [transparentBubble, setTransparentBubble] = useState(() => localStorage.getItem("pluto_transparent_bubble") === "1");

  // 主题切换：持久化 + 同步页面底色和状态栏颜色
  useEffect(() => {
    localStorage.setItem("pluto_theme", theme);
    // 自定义半透明时，文档底色用不透明打底，让上层半透明色能正确叠加
    const docBg = theme === "custom" ? COLORS._solidBg : COLORS.bg;
    document.documentElement.style.background = docBg;
    document.body.style.background = docBg;
    const rootEl = document.getElementById("root");
    if (rootEl) rootEl.style.background = docBg;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "custom" ? COLORS._solidBg : COLORS.bg);
  }, [theme, customTheme]);
  const saveCustom = (patch) => setCustomTheme(prev => { const next = { ...prev, ...patch }; localStorage.setItem("pluto_custom_theme", JSON.stringify(next)); return next; });

  // 壁纸持久化（存localStorage，纯本地不上传服务器）
  useEffect(() => {
    if (wallpaper) localStorage.setItem("pluto_wallpaper", wallpaper);
    else localStorage.removeItem("pluto_wallpaper");
  }, [wallpaper]);
  useEffect(() => { localStorage.setItem("pluto_transparent_bubble", transparentBubble ? "1" : "0"); }, [transparentBubble]);

  // 选壁纸：压到最长边1600转jpeg存localStorage
  const handlePickWallpaper = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1600;
      let { width, height } = img;
      if (width > MAX || height > MAX) { const s = MAX / Math.max(width, height); width = Math.round(width * s); height = Math.round(height * s); }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      setWallpaper(canvas.toDataURL("image/jpeg", 0.82));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // 气泡样式：透明模式=磨砂玻璃（半透明+细边框+模糊，透出壁纸又有轮廓）
  const frostBg = theme === "dark" ? "rgba(70,70,68,0.32)" : "rgba(255,255,255,0.22)";
  const frostBorder = theme === "dark" ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.55)";
  // 玻璃模式下，把侧边栏/顶栏/输入栏等实心区域变成半透明磨砂玻璃
  const glassSurface = customTheme.dark ? "rgba(40,40,38,0.5)" : "rgba(255,255,255,0.42)";
  const glassify = (solidBg) => glassMode
    ? { background: glassSurface, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }
    : { background: solidBg };
  const bubbleStyle = (isUser) => {
    if (transparentBubble) {
      return { background: frostBg, border: `1px solid ${frostBorder}`, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" };
    }
    if (isUser) {
      const bg = wallpaper ? (theme === "dark" ? "rgba(48,48,46,0.72)" : "rgba(255,255,255,0.55)") : COLORS.userBubble;
      // 自定义玻璃模式 或 有壁纸 → 加毛玻璃模糊
      const blur = (glassMode || wallpaper) ? "blur(10px)" : "none";
      return { background: bg, border: glassMode ? `1px solid ${frostBorder}` : "none", backdropFilter: blur, WebkitBackdropFilter: blur };
    }
    return { background: "transparent", border: "none" };
  };
  const messagesEndRef = useRef(null);
  const editInputRef = useRef(null);
  const [dragOffset, setDragOffset] = useState(0); // 侧边栏跟手拖拽偏移(0~280)
  const dragging = useRef(false);

  useEffect(() => { fetch(API + "/sessions").then(r => r.json()).then(data => { setSessions(data); if (data.length > 0 && !activeSessionId) setActiveSessionId(data[0].id); data.forEach(s => loadPreview(s.id)); }).catch(err => console.error("加载会话失败:", err)); }, []);
  const loadPreview = async (sid) => { try { const res = await fetch(API + "/messages/session/" + sid); const msgs = await res.json(); const f = msgs.find(m => m.role === "user"); if (f) setPreviews(prev => ({ ...prev, [sid]: f.content.substring(0, 30) + (f.content.length > 30 ? "..." : "") })); } catch (e) {} };
  useEffect(() => { if (!activeSessionId) return; fetch(API + "/messages/session/" + activeSessionId).then(r => r.json()).then(setMessages).catch(err => console.error("加载消息失败:", err)); }, [activeSessionId]);
  useEffect(() => { if (currentPage === "memory") loadMemories(); }, [currentPage]);
  // 记忆库 = 本地 memories 表（后端直接存取）
  const loadMemories = async () => {
    try {
      const url = memoryFilter !== "全部" ? API + "/memories?category=" + encodeURIComponent(memoryFilter) : API + "/memories";
      const mems = await fetch(url).then(x => x.json());
      setMemories(mems.map(m => ({ ...m, layer: m.category || "episodic" })));
    } catch (e) { setMemories([]); }
  };
  useEffect(() => { if (currentPage === "memory") loadMemories(); }, [memoryFilter]);
  const loadBoard = () => { fetch(API + "/board").then(r => r.json()).then(setBoardMessages).catch(() => {}); };
  useEffect(() => { if (currentPage === "board") loadBoard(); }, [currentPage]);
  const handlePostBoard = async () => { if (!newBoardMsg.trim()) return; try { await fetch(API + "/board", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: newBoardMsg.trim() }) }); setNewBoardMsg(""); loadBoard(); } catch (err) { console.error("留言失败:", err); } };
  const handleDeleteBoard = async (id) => { if (!confirm("确定删除这条留言吗？")) return; try { await fetch(API + "/board/" + id, { method: "DELETE" }); loadBoard(); } catch (err) { console.error("删除留言失败:", err); } };
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (editingSessionId && editInputRef.current) { editInputRef.current.focus(); editInputRef.current.select(); } }, [editingSessionId]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 从左边缘右滑打开侧边栏：覆盖平移，侧边栏跟手指盖过内容
  useEffect(() => {
    let startX = 0, startY = 0, tracking = false, dir = null; // dir: null/'h'/'v'
    const onStart = (e) => {
      if (sidebarOpen) return;
      if (e.touches[0].clientX > 24) return; // 只在最左边缘起手
      tracking = true; dir = null;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    };
    const onMove = (e) => {
      if (!tracking) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (dir === null) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        dir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        if (dir === 'v') { tracking = false; return; } // 竖滑交给页面滚动
        dragging.current = true;
      }
      if (dir === 'h' && dx > 0) {
        e.preventDefault();
        setDragOffset(Math.min(280, dx));
      }
    };
    const onEnd = () => {
      if (!tracking) return;
      tracking = false; dragging.current = false;
      setDragOffset(prev => { if (prev > 90) setSidebarOpen(true); return 0; });
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [sidebarOpen]);

  const handleNewSession = async () => { try { const res = await fetch(API + "/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "新对话" }) }); const s = await res.json(); setSessions(prev => [s, ...prev]); setActiveSessionId(s.id); setMessages([]); setCurrentPage("chat"); setSidebarOpen(false); } catch (err) { console.error("创建会话失败:", err); } };
  const handleDeleteSession = async (e, sid) => { e.stopPropagation(); if (!confirm("确定删除这个对话吗？")) return; try { await fetch(API + "/sessions/" + sid, { method: "DELETE" }); setSessions(prev => prev.filter(s => s.id !== sid)); if (activeSessionId === sid) { const r = sessions.filter(s => s.id !== sid); setActiveSessionId(r.length > 0 ? r[0].id : null); if (r.length === 0) setMessages([]); } } catch (err) { console.error("删除会话失败:", err); } };
  const handleStartRename = (e, s) => { e.stopPropagation(); setEditingSessionId(s.id); setEditingName(s.name); };
  const handleSaveRename = async () => { if (!editingName.trim() || !editingSessionId) { setEditingSessionId(null); return; } try { await fetch(API + "/sessions/" + editingSessionId, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editingName.trim() }) }); setSessions(prev => prev.map(s => s.id === editingSessionId ? { ...s, name: editingName.trim() } : s)); } catch (err) { console.error("重命名失败:", err); } setEditingSessionId(null); };
  const handleAddMemory = async () => { if (!newMemory.content.trim()) return; try { await fetch(API + "/memories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: newMemory.content, category: newMemory.layer || "episodic", importance: newMemory.importance }) }); setNewMemory({ title: "", content: "", layer: "episodic", importance: 3 }); setShowAddMemory(false); loadMemories(); } catch (err) { console.error("添加记忆失败:", err); } };
  const handleUpdateMemory = async () => { if (!editingMemory || !editingMemory.content.trim()) return; try { await fetch(API + "/memories/" + editingMemory.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: editingMemory.content, category: editingMemory.layer, importance: editingMemory.importance }) }); setEditingMemory(null); loadMemories(); } catch (err) { console.error("更新记忆失败:", err); } };
  const handleDeleteMemory = async (id) => { if (!confirm("确定删除这条记忆吗？")) return; try { await fetch(API + "/memories/" + id, { method: "DELETE" }); loadMemories(); } catch (err) { console.error("删除记忆失败:", err); } };
  const handleOpenSettings = async () => { try { const res = await fetch(API + "/settings"); setSettingsData(await res.json()); setSettingsSection(null); setShowSettings(true); } catch (err) { console.error("加载设置失败:", err); } };
  const handleSaveSettings = async () => { if (!settingsData) return; setSettingsSaving(true); try { await fetch(API + "/settings/" + settingsData.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settingsData) }); } catch (err) { console.error("保存设置失败:", err); } finally { setSettingsSaving(false); } };
  // 单项自动保存：改开关/输入即刻写库，不用再手动点保存
  const saveSetting = async (patch) => {
    if (!settingsData) return;
    setSettingsData({ ...settingsData, ...patch });
    try { await fetch(API + "/settings/" + settingsData.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }); } catch (err) { console.error("保存失败:", err); }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(API + "/search?q=" + encodeURIComponent(searchQuery));
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (e) { setSearchResults([]); }
  };

  const loadGatewayStats = async () => {
    try {
      const res = await fetch(API + "/gateway/stats?period=" + gatewayPeriod);
      const data = await res.json();
      setGatewayStats(data);
    } catch (e) {}
  };

  const loadMcpMemories = async () => {
    setCurrentPage("mcp");
    try {
      const [statusRes, toolsRes, memRes] = await Promise.all([
        fetch(API + "/mcp/status").then(r => r.json()),
        fetch(API + "/mcp/tools").then(r => r.json()),
        fetch(API + "/mcp/memories").then(r => r.json())
      ]);
      setMcpUrl(statusRes.url || "");
      setMcpTools(toolsRes.tools || []);
      setMcpMemories(memRes.data || []);
    } catch (e) { setMcpMemories([]); setMcpTools([]); }
  };

  const handleMcpCall = async () => {
    if (!mcpSelectedTool) return;
    let args;
    try { args = JSON.parse(mcpToolArgs); } catch (e) { setMcpToolResult("JSON 参数格式错误"); return; }
    setMcpToolResult("执行中...");
    try {
      const res = await fetch(API + "/mcp/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: mcpSelectedTool, args })
      });
      const data = await res.json();
      setMcpToolResult(data.success ? data.output : data.error || "未知错误");
    } catch (e) { setMcpToolResult("请求失败: " + e.message); }
  };

  // 选图：canvas 压到最长边1024再转jpeg base64，省流量省token
  const handlePickImage = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    // 图片走视觉；其它(.json/.txt/.md/代码等)当文本读进来塞进输入框给 Cael
    if (file.type && file.type.startsWith("image/")) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1024;
        let { width, height } = img;
        if (width > MAX || height > MAX) { const s = MAX / Math.max(width, height); width = Math.round(width * s); height = Math.round(height * s); }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setPendingImage({ dataUrl, media_type: "image/jpeg", data: dataUrl.split(",")[1] });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } else {
      if (file.size > 300 * 1024) { alert("文本文件太大（上限约300KB）"); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const content = String(reader.result || "").slice(0, 100000);
        setInput(prev => (prev ? prev + "\n\n" : "") + `【文件：${file.name}】\n\`\`\`\n${content}\n\`\`\``);
      };
      reader.readAsText(file);
    }
  };

  // 消息展示辅助：图片消息解出 文字+图片url（本地乐观消息用imageUrl，库里的解JSON）
  const getMsgView = (msg) => {
    if (msg.msg_type !== "image") return { text: msg.content, img: null };
    if (msg.imageUrl) return { text: msg.content, img: msg.imageUrl };
    try { const d = JSON.parse(msg.content); return { text: d.text, img: `data:${d.media_type};base64,${d.data}` }; } catch (e) { return { text: msg.content, img: null }; }
  };

  const streamChat = async (sessionId, content, tempAiMsgId, image = null) => {
    try {
      const res = await fetch(API + "/chat/stream", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sessionId, content, image }) });
      if (!res.ok) { const e = await res.json(); setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: "出错了: " + (e.error || res.statusText) } : m)); return; }
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = "", fullText = "", fullThinking = "", toolLog = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop();
        for (const line of lines) { if (!line.startsWith("data: ")) continue; try { const ev = JSON.parse(line.slice(6)); if (ev.type === "text") { fullText += ev.text; const t = fullText; setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: t } : m)); } else if (ev.type === "thinking") { fullThinking += ev.text; const th = fullThinking; setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, reasoning_content: th } : m)); } else if (ev.type === "tool_use") { toolLog += (toolLog ? "\n" : "") + `→ 调用 ${ev.name} ${JSON.stringify(ev.input)}`; const tl = toolLog; setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, tool_log: tl } : m)); } else if (ev.type === "tool_result") { toolLog += `\n✓ 返回: ${ev.output}`; const tl = toolLog; setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, tool_log: tl } : m)); } else if (ev.type === "error") { setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: "出错了: " + ev.text } : m)); } } catch (e) {} } }
      if (!fullText) setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: "（空回复）" } : m));
    } catch (err) { setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: "网络错误: " + err.message } : m)); }
  };

  const handleSend = async () => {
    if ((!input.trim() && !pendingImage) || loading) return;
    let sid = activeSessionId;
    if (!sid) { try { const res = await fetch(API + "/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "新对话" }) }); const s = await res.json(); setSessions(prev => [s, ...prev]); setActiveSessionId(s.id); sid = s.id; } catch (err) { return; } }
    const content = input; const image = pendingImage;
    setInput(""); setPendingImage(null);
    const uMsg = { id: Date.now(), role: "user", content, created_at: new Date().toISOString(), ...(image ? { msg_type: "image", imageUrl: image.dataUrl } : {}) };
    const aMsg = { id: Date.now() + 1, role: "assistant", content: "", created_at: new Date().toISOString() };
    setMessages(prev => [...prev, uMsg, aMsg]);
    if (!previews[sid]) { const pv = content || "[图片]"; setPreviews(prev => ({ ...prev, [sid]: pv.substring(0, 30) + (pv.length > 30 ? "..." : "") })); }
    setLoading(true); await streamChat(sid, content, aMsg.id, image ? { media_type: image.media_type, data: image.data } : null); setLoading(false);
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
  // Safari(iPhone)解析不了"2026-07-03 07:43:53"这种空格格式，要转成ISO的T
  const parseTime = (d) => new Date(typeof d === "string" ? d.replace(" ", "T") : d);
  const formatTime = (d) => { if (!d) return ""; const t = parseTime(d); return isNaN(t) ? "" : t.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }); };
  const formatFullTime = (d) => { if (!d) return ""; const t = parseTime(d); return isNaN(t) ? "" : t.toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }); };
  const formatDate = (d) => { if (!d) return ""; return d.split(" ")[0] || d.split("T")[0] || ""; };
  const ifs = { width: "100%", border: `1px solid ${COLORS.inputBorder}`, borderRadius: 12, padding: "8px 12px", fontSize: 14, outline: "none", background: COLORS.bg, color: COLORS.text, boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: wallpaper ? `${COLORS.bg} url(${wallpaper}) center/cover no-repeat fixed` : COLORS.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: COLORS.text, overflow: "hidden", overscrollBehavior: "none", overscrollBehaviorX: "none", touchAction: "none", paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {(sidebarOpen || dragOffset > 0) && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: `rgba(0,0,0,${(sidebarOpen ? 280 : dragOffset) / 280 * 0.25})`, zIndex: 999, transition: dragOffset > 0 ? "none" : "background 0.25s ease" }} />}
      <div style={{ position: "fixed", top: 0, left: 0, height: "100vh", width: 280, zIndex: 1000, borderRight: `1px solid ${COLORS.sidebarBorder}`, display: "flex", flexDirection: "column", transform: dragOffset > 0 ? `translateX(${dragOffset - 280}px)` : sidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: dragOffset > 0 ? "none" : "transform 0.25s ease", borderRadius: "0 16px 16px 0", boxShadow: (sidebarOpen || dragOffset > 0) ? "4px 0 24px rgba(0,0,0,0.08)" : "none", ...glassify(COLORS.sidebar) }}>
        <div style={{ padding: "58px 20px 20px" }}><div style={{ fontSize: 20, fontWeight: 600, color: COLORS.text, fontFamily: "Georgia, 'Songti SC', serif", letterSpacing: "-0.02em" }}>Plutocael <span style={{ color: COLORS.accent }}>✳</span></div></div>
        <div style={{ padding: "0 12px 16px" }}>
          <button onClick={() => { setCurrentPage("chat"); setSidebarOpen(false); }} style={{ width: "100%", padding: "10px 16px", border: "none", borderRadius: 12, cursor: "pointer", background: currentPage === "chat" ? COLORS.sidebarActive : "transparent", color: currentPage === "chat" ? COLORS.sidebarActiveText : COLORS.text, display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}><ChatIcon /> 聊天</button>
          <button onClick={() => { setCurrentPage("memory"); setSidebarOpen(false); }} style={{ width: "100%", padding: "10px 16px", border: "none", borderRadius: 12, cursor: "pointer", marginTop: 2, background: currentPage === "memory" ? COLORS.sidebarActive : "transparent", color: currentPage === "memory" ? COLORS.sidebarActiveText : COLORS.text, display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}><MemoryIcon /> 记忆库</button>
          <button onClick={() => { setCurrentPage("mcp"); setSidebarOpen(false); }} style={{ width: "100%", padding: "10px 16px", border: "none", borderRadius: 12, cursor: "pointer", marginTop: 2, background: currentPage === "mcp" ? COLORS.sidebarActive : "transparent", color: currentPage === "mcp" ? COLORS.sidebarActiveText : COLORS.text, display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}><Icon size={18}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></Icon> MCP 链接</button>
          <button onClick={() => { setCurrentPage("board"); setSidebarOpen(false); }} style={{ width: "100%", padding: "10px 16px", border: "none", borderRadius: 12, cursor: "pointer", marginTop: 2, background: currentPage === "board" ? COLORS.sidebarActive : "transparent", color: currentPage === "board" ? COLORS.sidebarActiveText : COLORS.text, display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}><BoardIcon /> 留言板</button>
        </div>
        <div style={{ height: 1, background: COLORS.divider, margin: "4px 20px" }} />
        <div className="panel-scroll" style={{ flex: 1, overflow: "hidden auto", padding: "8px 12px", overscrollBehaviorY: "contain", overscrollBehaviorX: "none", touchAction: "pan-y" }}>
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
        <div style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 12px)` }}>
          <div style={{ padding: "4px 12px", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", gap: 12 }}>
            <button onClick={() => { handleOpenSettings(); setSidebarOpen(false); }} style={{ width: 45, height: 45, borderRadius: "50%", border: `1px solid ${COLORS.sidebarBorder}`, background: COLORS.glass, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)" }} onMouseEnter={e => e.currentTarget.style.background = COLORS.glassHover} onMouseLeave={e => e.currentTarget.style.background = COLORS.glass}><SettingsIcon /></button>
            <button onClick={handleNewSession} style={{ width: 45, height: 45, borderRadius: "50%", border: "none", background: COLORS.accent, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "auto", boxShadow: "0 2px 8px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.1)" }} onMouseEnter={e => e.currentTarget.style.background = COLORS.accentHover} onMouseLeave={e => e.currentTarget.style.background = COLORS.accent}><PlusIcon /></button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, width: "100%" }}>
        {currentPage === "mcp" ? <McpManager onMenu={() => setSidebarOpen(true)} onBack={() => setCurrentPage("chat")} /> : currentPage === "board" ? (<>
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${COLORS.divider}`, display: "flex", alignItems: "center", ...glassify(COLORS.cardBg) }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, color: COLORS.textSecondary, display: "flex", alignItems: "center", marginRight: 12 }}><MenuIcon /></button>
            <span style={{ fontSize: 15, fontWeight: 500 }}>留言板</span>
            <span style={{ fontSize: 12, color: COLORS.placeholder, marginLeft: 12 }}>你留的话，Cael 聊天时看得到</span>
          </div>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.divider}`, background: COLORS.cardBg }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <textarea value={newBoardMsg} onChange={e => setNewBoardMsg(e.target.value)} placeholder="给 Cael 留句话..." rows={3} style={{ ...ifs, resize: "vertical", padding: "12px", lineHeight: 1.7 }} />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button onClick={handlePostBoard} disabled={!newBoardMsg.trim()} style={{ padding: "8px 24px", border: "none", borderRadius: 20, background: newBoardMsg.trim() ? COLORS.accent : COLORS.accentLight, color: newBoardMsg.trim() ? "#fff" : COLORS.placeholder, cursor: newBoardMsg.trim() ? "pointer" : "default", fontSize: 14 }}>留言</button>
              </div>
            </div>
          </div>
          <div className="panel-scroll" style={{ flex: 1, overflow: "hidden auto", padding: "16px 20px", overscrollBehaviorY: "contain", overscrollBehaviorX: "none", touchAction: "pan-y" }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              {boardMessages.length === 0 ? <div style={{ textAlign: "center", padding: "60px 0", color: COLORS.placeholder, fontSize: 14 }}>还没有留言，写一条吧</div> : boardMessages.map(b => (
                <div key={b.id} style={{ background: COLORS.cardBg, borderRadius: 16, padding: "14px 16px", marginBottom: 12, border: `1px solid ${COLORS.divider}` }}>
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: COLORS.text, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{b.content}</div>
                  <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
                    <span style={{ fontSize: 12, color: COLORS.placeholder }}>{formatFullTime(b.created_at)}</span>
                    <button onClick={() => handleDeleteBoard(b.id)} style={{ marginLeft: "auto", padding: "4px 10px", borderRadius: 12, border: "none", background: "transparent", cursor: "pointer", color: COLORS.placeholder, display: "flex", alignItems: "center", gap: 4, fontSize: 12 }} onMouseEnter={e => e.currentTarget.style.color = COLORS.danger} onMouseLeave={e => e.currentTarget.style.color = COLORS.placeholder}><TrashIcon /> 删除</button>
                  </div>
                </div>))}
            </div>
          </div>
        </>) : currentPage === "chat" ? (<>
          <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", ...(wallpaper ? { background: "transparent" } : glassify(COLORS.bg)) }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ width: 45, height: 45, borderRadius: "50%", border: `1px solid ${COLORS.sidebarBorder}`, background: COLORS.glass, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)" }} onMouseEnter={e => e.currentTarget.style.background = COLORS.glassHover} onMouseLeave={e => e.currentTarget.style.background = COLORS.glass}><MenuIcon /></button>
          </div>
          <div className="msg-scroll" style={{ flex: 1, padding: "24px 0", overflowX: "hidden", overscrollBehaviorY: "contain", overscrollBehaviorX: "none", touchAction: "pan-y", scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <div style={{ maxWidth: 768, width: "100%", margin: "0 auto", padding: "0 24px", boxSizing: "border-box", overflowX: "hidden" }}>
              {messages.length === 0 && <div style={{ textAlign: "center", padding: "80px 0", color: COLORS.placeholder, fontSize: 15 }}>发消息给 Cael 开始对话</div>}
              {messages.map((msg, i) => {
                const showTime = i === 0 || (messages[i-1] && msg.created_at && messages[i-1].created_at && parseTime(msg.created_at).getTime() - parseTime(messages[i-1].created_at).getTime() > 300000);
                const isUser = msg.role === "user";
                const view = getMsgView(msg);
                return (<div key={msg.id}>
                  {showTime && msg.created_at && <div style={{ textAlign: "center", fontSize: 12, color: COLORS.placeholder, margin: "16px 0" }}>{formatTime(msg.created_at)}</div>}
                  <div className={isUser ? "msg-user" : "msg-ai"} style={{ marginBottom: 20, maxWidth: "80%", width: "fit-content", animation: `msgSlideIn 0.35s cubic-bezier(0.32, 0.72, 0, 1)` }}>
                    {editingMsgId === msg.id ? (
                      <div style={{ width: "100%" }}>
                        <textarea value={editingMsgContent || msg.content} onChange={e => setEditingMsgContent(e.target.value)} onFocus={() => { if (!editingMsgContent) setEditingMsgContent(msg.content); }} rows={3} style={{ width: "100%", border: `1px solid ${COLORS.accent}`, borderRadius: 12, padding: "10px 12px", fontSize: 15, lineHeight: 1.7, outline: "none", background: COLORS.input, color: COLORS.text, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                        <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                          <button onClick={() => { setEditingMsgId(null); setEditingMsgContent(""); }} style={{ padding: "6px 16px", borderRadius: 20, border: `1px solid ${COLORS.inputBorder}`, background: "transparent", cursor: "pointer", fontSize: 13, color: COLORS.textSecondary }}>取消</button>
                          <button onClick={() => handleEditSend(msg)} style={{ padding: "6px 16px", borderRadius: 20, border: "none", background: COLORS.accent, color: "#fff", cursor: "pointer", fontSize: 13 }}>发送</button>
                        </div>
                      </div>
                    ) : (<>
                      {!isUser && msg.reasoning_content && <details style={{ margin: "0 16px 8px", fontSize: 13, color: COLORS.textSecondary }}>
                        <summary style={{ cursor: "pointer", userSelect: "none", padding: "4px 0", opacity: 0.75 }}>💭 思考过程</summary>
                        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, padding: "8px 12px", background: COLORS.accentLight, borderRadius: 12, marginTop: 4, maxHeight: 300, overflowY: "auto" }}>{msg.reasoning_content}</div>
                      </details>}
                      {!isUser && msg.tool_log && <details style={{ margin: "0 16px 8px", fontSize: 13, color: COLORS.textSecondary }}>
                        <summary style={{ cursor: "pointer", userSelect: "none", padding: "4px 0", opacity: 0.75 }}>🔧 工具调用</summary>
                        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, padding: "8px 12px", background: COLORS.sidebar, borderRadius: 12, marginTop: 4, maxHeight: 300, overflowY: "auto", fontFamily: "ui-monospace, Consolas, monospace", fontSize: 12, wordBreak: "break-all" }}>{msg.tool_log}</div>
                      </details>}
                      <div style={{ padding: isUser ? "12px 16px" : (transparentBubble ? "10px 14px" : "4px 16px"), borderRadius: isUser ? "20px 20px 4px 20px" : (transparentBubble ? "4px 18px 18px 18px" : 0), color: isUser ? (transparentBubble ? COLORS.text : COLORS.userBubbleText) : COLORS.text, fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "break-word", ...bubbleStyle(isUser) }}>
                        {view.img && <img src={view.img} style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 12, display: "block", marginBottom: view.text ? 8 : 0 }} />}
                        {view.text}
                      </div>
                      <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
                        <button onClick={() => navigator.clipboard.writeText(view.text || "")} style={{ padding: "4px 6px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.placeholder }} title="复制"><CopyIcon /></button>
                        {isUser && <button onClick={() => setEditingMsgId(msg.id)} style={{ padding: "4px 6px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.placeholder }} title="编辑"><EditIcon /></button>}
                        {!isUser && <button onClick={() => handleRetry(msg)} style={{ padding: "4px 6px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.placeholder }} title="重试"><Icon size={14}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></Icon></button>}
                        {msg.created_at && <span style={{ fontSize: 11, color: COLORS.placeholder, alignSelf: "center", marginLeft: 4, opacity: 0.8 }}>{formatFullTime(msg.created_at)}</span>}
                      </div>
                    </>)}
                  </div>
                </div>);
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div style={{ padding: "12px 24px 24px", ...(wallpaper ? { background: "transparent" } : glassify(COLORS.bg)) }}>
            <div style={{ maxWidth: 768, margin: "0 auto" }}>
              {pendingImage && <div style={{ marginBottom: 8, position: "relative", display: "inline-block" }}>
                <img src={pendingImage.dataUrl} style={{ height: 72, borderRadius: 10, display: "block", border: `1px solid ${COLORS.divider}` }} />
                <button onClick={() => setPendingImage(null)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.65)", color: "#fff", cursor: "pointer", fontSize: 11, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>}
              <div style={{ display: "flex", alignItems: "flex-end", borderRadius: 20, background: theme === "dark" ? "rgba(48,48,46,0.85)" : "rgba(255,255,255,0.72)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", padding: "6px 6px 6px 8px", minHeight: 96, maxHeight: 400, boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)", boxSizing: "border-box" }}>
                <input ref={fileInputRef} type="file" accept="image/*,text/*,.json,.md,.markdown,.csv,.log,.yaml,.yml,.js,.jsx,.ts,.tsx,.py,.html,.css,.xml,.txt" style={{ display: "none" }} onChange={handlePickImage} />
                <button onClick={() => fileInputRef.current && fileInputRef.current.click()} title="发图片" style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "transparent", color: COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, alignSelf: "flex-end", marginBottom: 10 }}><Icon size={18}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></Icon></button>
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="发消息给 Cael..." rows={1} style={{ flex: 1, border: "none", outline: "none", resize: "none", fontSize: 15, lineHeight: 1.5, padding: "8px 0 8px 8px", background: "transparent", color: COLORS.text, fontFamily: "inherit", alignSelf: "center" }} />
                <button onClick={handleSend} disabled={(!input.trim() && !pendingImage) || loading} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: (input.trim() || pendingImage) && !loading ? COLORS.accent : COLORS.accentLight, color: (input.trim() || pendingImage) && !loading ? "#fff" : COLORS.placeholder, cursor: (input.trim() || pendingImage) && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, alignSelf: "flex-end", marginBottom: 12, marginRight: 12 }}><SendIcon /></button>
              </div>
            </div>
          </div>
        </>) : (<>
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${COLORS.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between", ...glassify(COLORS.cardBg) }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, color: COLORS.textSecondary, display: "flex", alignItems: "center", marginRight: 12 }}><MenuIcon /></button>
              <span style={{ fontSize: 15, fontWeight: 500 }}>记忆库</span>
            </div>
            <button onClick={() => { setEditingMemory(null); setNewMemory({ title: "", content: "", layer: "episodic", importance: 3 }); setShowAddMemory(true); }} style={{ padding: "6px 16px", border: "none", borderRadius: 20, background: COLORS.accent, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}><PlusIcon /> 添加</button>
          </div>
          <div style={{ padding: "12px 20px", display: "flex", gap: 8, flexWrap: "wrap", borderBottom: `1px solid ${COLORS.divider}`, background: COLORS.cardBg }}>
            {[{ key: "全部", label: "全部" }, ...LAYERS].map(cat => (<button key={cat.key} onClick={() => setMemoryFilter(cat.key)} style={{ padding: "6px 16px", borderRadius: 20, border: memoryFilter === cat.key ? "none" : `1px solid ${COLORS.divider}`, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap", background: memoryFilter === cat.key ? COLORS.accent : "transparent", color: memoryFilter === cat.key ? "#fff" : COLORS.textSecondary }}>{cat.label}</button>))}
          </div>
          <div className="panel-scroll" style={{ flex: 1, overflow: "hidden auto", padding: "16px 20px", overscrollBehaviorY: "contain", overscrollBehaviorX: "none", touchAction: "pan-y" }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <div style={{ background: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${COLORS.divider}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>🧠 记忆衰退曲线</div>
                <div style={{ fontSize: 11, color: COLORS.placeholder, marginBottom: 12 }}>层级越高衰退越慢，条越长=保留越久；右侧是各层记忆数</div>
                {LAYERS.map(L => {
                  const count = memories.filter(m => m.layer === L.key).length;
                  const widths = { core: 100, semantic: 68, procedural: 42, episodic: 22 };
                  return <div key={L.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                    <span style={{ width: 32, fontSize: 12, color: L.color.text, fontWeight: 600, flexShrink: 0 }}>{L.label}</span>
                    <div style={{ flex: 1, height: 8, background: COLORS.bg, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: widths[L.key] + "%", height: "100%", background: L.color.text, opacity: 0.75, transition: "width 0.4s" }} />
                    </div>
                    <span style={{ width: 46, fontSize: 11, color: COLORS.placeholder, textAlign: "right", flexShrink: 0 }}>{L.halfLife}</span>
                    <span style={{ width: 22, fontSize: 12, color: COLORS.text, textAlign: "right", flexShrink: 0 }}>{count}</span>
                  </div>;
                })}
              </div>
              {memories.length === 0 ? <div style={{ textAlign: "center", padding: "60px 0", color: COLORS.placeholder, fontSize: 14 }}>还没有记忆，点击右上角添加</div> : memories.map(m => (
                <div key={m.id} onClick={() => setExpandedMemoryId(expandedMemoryId === m.id ? null : m.id)} style={{ background: COLORS.cardBg, borderRadius: 16, padding: "16px", marginBottom: 12, border: `1px solid ${COLORS.divider}`, cursor: "pointer" }}>
                  {m.title && <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 5 }}>{m.title}</div>}
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: COLORS.text, overflow: expandedMemoryId === m.id ? "visible" : "hidden", display: expandedMemoryId === m.id ? "block" : "-webkit-box", WebkitLineClamp: expandedMemoryId === m.id ? "none" : 3, WebkitBoxOrient: "vertical", overflowWrap: "anywhere" }}>{m.content}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 12, background: (LAYER_MAP[m.layer] || LAYERS[3]).color.bg, color: (LAYER_MAP[m.layer] || LAYERS[3]).color.text }}>{(LAYER_MAP[m.layer] || LAYERS[3]).label}</span>
                    <div style={{ display: "flex", gap: 1, color: COLORS.accent }}>{[1,2,3,4,5].map(n => <StarIcon key={n} filled={n <= m.importance} />)}</div>
                    <span style={{ fontSize: 12, color: COLORS.placeholder, marginLeft: "auto" }}>{formatDate(m.created_at)}</span>
                  </div>
                  {(() => {
                    const d = computeDecay(m);
                    const pct = Math.round(d.strength * 100);
                    return <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: COLORS.placeholder, flexShrink: 0 }} title="记忆鲜活度：越久没被访问越淡，core永久保持">记忆强度</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: COLORS.divider, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: d.isCore ? COLORS.accent : decayColor(d.strength), transition: "width 0.3s" }} />
                      </div>
                      <span style={{ fontSize: 11, color: d.isCore ? COLORS.accent : decayColor(d.strength), flexShrink: 0, width: 44, textAlign: "right", fontWeight: 500 }}>{d.isCore ? "永久" : pct + "%"}</span>
                    </div>;
                  })()}
                  {expandedMemoryId === m.id && (() => {
                    const d = computeDecay(m);
                    return <div style={{ marginTop: 8, fontSize: 12, color: COLORS.placeholder, lineHeight: 1.6 }}>
                      {d.isCore ? "🔒 核心记忆，永久保留，不会衰退" : `⏳ 半衰期 ${Math.round(d.halflife)} 天 · 已 ${Math.round(d.days)} 天未访问 · 被 Cael 提起会回升`}
                    </div>;
                  })()}
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
          <input value={editingMemory ? (editingMemory.title || "") : newMemory.title} onChange={e => editingMemory ? setEditingMemory({ ...editingMemory, title: e.target.value }) : setNewMemory({ ...newMemory, title: e.target.value })} placeholder="标题（可留空，会自动取正文开头）" style={{ ...ifs, marginBottom: 10 }} />
          <textarea value={editingMemory ? editingMemory.content : newMemory.content} onChange={e => editingMemory ? setEditingMemory({ ...editingMemory, content: e.target.value }) : setNewMemory({ ...newMemory, content: e.target.value })} placeholder="写下你想记住的事..." rows={5} style={{ ...ifs, resize: "vertical", padding: "12px", lineHeight: 1.7, marginBottom: 16 }} />
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 }}>层级（衰退快慢：核心永久 → 情节最易淡忘）</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{LAYERS.map(L => { const cur = editingMemory ? editingMemory.layer : newMemory.layer; const sel = cur === L.key; return <button key={L.key} onClick={() => editingMemory ? setEditingMemory({ ...editingMemory, layer: L.key }) : setNewMemory({ ...newMemory, layer: L.key })} style={{ padding: "6px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13, background: sel ? L.color.bg : COLORS.bg, color: sel ? L.color.text : COLORS.textSecondary, border: sel ? `1px solid ${L.color.text}33` : `1px solid ${COLORS.divider}`, fontWeight: sel ? 600 : 400 }}>{L.label}</button>; })}</div>
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
          {(() => {
            const SECTIONS = [
              { key: "appearance", label: "外观", desc: "主题 · 壁纸 · 气泡", icon: <><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996C18.956 15.398 22 12.35 22 8.5 22 4.5 17.5 2 12 2z" /></> },
              { key: "api", label: "API 连接", desc: "地址 · 密钥 · 模型", icon: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></> },
              { key: "behavior", label: "对话行为", desc: "思考模式 · MCP 工具", icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> },
              { key: "params", label: "模型参数", desc: "温度 · 上下文 · tokens", icon: <><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></> },
              { key: "prompt", label: "Cael 人设", desc: (settingsData.system_prompt || "").length > 0 ? "已设置" : "未设置", icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></> },
              { key: "usage", label: "用量统计", desc: "token · 花费", icon: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></> },
            ];
            const cur = SECTIONS.find(s => s.key === settingsSection);
            return <>
              <div style={{ padding: "20px 20px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${COLORS.divider}` }}>
                {settingsSection && <button onClick={() => setSettingsSection(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: COLORS.text, padding: 4, display: "flex" }}><Icon size={20}><polyline points="15 18 9 12 15 6" /></Icon></button>}
                <div style={{ fontSize: 17, fontWeight: 600, flex: 1 }}>{cur ? cur.label : "设置"}</div>
                <button onClick={() => setShowSettings(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: COLORS.textSecondary, padding: 4 }}><Icon size={18}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon></button>
              </div>
              {!settingsSection && <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                <div style={{ background: COLORS.bg, borderRadius: 14, overflow: "hidden" }}>
                  {SECTIONS.map((s, i) => (
                    <button key={s.key} onClick={() => { setSettingsSection(s.key); if (s.key === "usage") loadGatewayStats(); }} style={{ width: "100%", padding: "14px 16px", border: "none", borderBottom: i < SECTIONS.length - 1 ? `1px solid ${COLORS.divider}` : "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
                      <span style={{ width: 34, height: 34, borderRadius: 9, background: COLORS.accentLight, color: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={19}>{s.icon}</Icon></span>
                      <span style={{ flex: 1, minWidth: 0 }}><span style={{ fontSize: 15, color: COLORS.text, display: "block" }}>{s.label}</span><span style={{ fontSize: 12, color: COLORS.placeholder, display: "block", marginTop: 1 }}>{s.desc}</span></span>
                      <Icon size={18}><polyline points="9 18 15 12 9 6" /></Icon>
                    </button>
                  ))}
                </div>
              </div>}
            </>;
          })()}
          {settingsSection && <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {settingsSection === "usage" && <>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>{["today","month"].map(p => <button key={p} onClick={() => { setGatewayPeriod(p); setTimeout(loadGatewayStats, 50); }} style={{ padding:"4px 12px", borderRadius:16, border:gatewayPeriod===p?"none":`1px solid ${COLORS.divider}`, background:gatewayPeriod===p?COLORS.accent:"transparent", color:gatewayPeriod===p?"#fff":COLORS.textSecondary, fontSize:12, cursor:"pointer" }}>{p==="today"?"今日":"本月"}</button>)}</div>
              {gatewayStats ? (<>
                <div style={{ background: COLORS.bg, borderRadius: 16, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 }}>总用量</div>
                  <div style={{ display:"flex", gap: 16, flexWrap:"wrap" }}>
                    <div><div style={{ fontSize: 12, color: COLORS.textSecondary }}>Input tokens</div><div style={{ fontSize: 20, fontWeight: 700 }}>{(gatewayStats.summary?.total_input||0).toLocaleString()}</div></div>
                    <div><div style={{ fontSize: 12, color: COLORS.textSecondary }}>Output tokens</div><div style={{ fontSize: 20, fontWeight: 700 }}>{(gatewayStats.summary?.total_output||0).toLocaleString()}</div></div>
                    <div><div style={{ fontSize: 12, color: COLORS.textSecondary }}>花费</div><div style={{ fontSize: 20, fontWeight: 700, color: COLORS.accent }}>${(gatewayStats.summary?.total_cost||0).toFixed(4)}</div></div>
                    <div><div style={{ fontSize: 12, color: COLORS.textSecondary }}>请求数</div><div style={{ fontSize: 20, fontWeight: 700 }}>{gatewayStats.summary?.request_count||0}</div></div>
                  </div>
                </div>
                {gatewayStats.byModel?.length > 0 && <div style={{ background: COLORS.bg, borderRadius: 16, padding: 16 }}>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 }}>按模型</div>
                  {gatewayStats.byModel.map((m,i) => <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:i<gatewayStats.byModel.length-1?`1px solid ${COLORS.divider}`:"none" }}><span style={{ fontSize:13 }}>{m.model}</span><span style={{ fontSize:13, fontWeight:500 }}>${(m.cost||0).toFixed(4)}</span></div>)}
                </div>}
              </>) : <div style={{ textAlign:"center", color:COLORS.placeholder, fontSize:13, padding:"40px 0" }}>加载中...</div>}
            </>}
            {["appearance", "api", "behavior", "params"].includes(settingsSection) && (() => {
              const secTitle = { fontSize: 12, fontWeight: 600, color: COLORS.placeholder, letterSpacing: "0.05em", padding: "4px 4px 8px", textTransform: "uppercase", display: "none" };
              const listCard = { background: COLORS.bg, borderRadius: 14, overflow: "hidden", marginBottom: 20 };
              const row = { padding: "12px 14px", borderBottom: `1px solid ${COLORS.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 };
              const rowLast = { ...row, borderBottom: "none" };
              const rowCol = { padding: "12px 14px", borderBottom: `1px solid ${COLORS.divider}` };
              const lbl = { fontSize: 14, color: COLORS.text };
              const hint = { fontSize: 12, color: COLORS.placeholder, marginTop: 2 };
              const rowInput = { border: "none", outline: "none", background: "transparent", color: COLORS.text, fontSize: 14, textAlign: "right", flex: 1, minWidth: 0, fontFamily: "inherit" };
              const Toggle = ({ on, onChange }) => (
                <button onClick={onChange} style={{ width: 46, height: 28, borderRadius: 14, border: "none", cursor: "pointer", background: on ? COLORS.accent : COLORS.divider, position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                  <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </button>
              );
              return <>
                {settingsSection === "appearance" && <>
                <div style={listCard}>
                  <div style={rowCol}>
                    <div style={{ ...lbl, marginBottom: 10 }}>主题</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {Object.entries(THEMES).map(([key, t]) => (
                        <button key={key} onClick={() => setTheme(key)} style={{ width: 68, padding: "10px 0 8px", borderRadius: 12, cursor: "pointer", border: theme === key ? `2px solid ${t.accent}` : `1px solid ${COLORS.divider}`, background: t.bg, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 22, height: 22, borderRadius: "50%", background: t.accent, display: "block" }} />
                          <span style={{ fontSize: 11, color: t.text }}>{t.label}</span>
                        </button>
                      ))}
                      <button onClick={() => setTheme("custom")} style={{ width: 68, padding: "10px 0 8px", borderRadius: 12, cursor: "pointer", border: theme === "custom" ? `2px solid ${customTheme.accent}` : `1px solid ${COLORS.divider}`, background: customTheme.dark ? "#262624" : "#F5F4EE", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 22, height: 22, borderRadius: "50%", background: "conic-gradient(#D97757,#4A7FD4,#3AAF6B,#8A4AD4,#D97757)", display: "block" }} />
                        <span style={{ fontSize: 11, color: customTheme.dark ? "#ECEAE5" : "#1F1E1D" }}>自定义</span>
                      </button>
                    </div>
                  </div>
                  {theme === "custom" && (() => {
                    const ctrlRow = { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${COLORS.divider}` };
                    const colorSwatch = (val, onCh) => <input type="color" value={val} onChange={e => onCh(e.target.value)} style={{ width: 34, height: 34, border: "none", borderRadius: 8, background: "transparent", cursor: "pointer", padding: 0, flexShrink: 0 }} />;
                    const alphaSlider = (val, onCh) => <><input type="range" min="0" max="100" value={val} onChange={e => onCh(parseInt(e.target.value))} style={{ flex: 1, accentColor: customTheme.accent }} /><span style={{ fontSize: 12, color: COLORS.textSecondary, width: 38, textAlign: "right" }}>{val}%</span></>;
                    const section = (label, colorKey, alphaKey) => <div style={ctrlRow}>
                      {colorSwatch(customTheme[colorKey], v => saveCustom({ [colorKey]: v }))}
                      <span style={{ fontSize: 13, color: COLORS.text, width: 64, flexShrink: 0 }}>{label}</span>
                      {alphaSlider(customTheme[alphaKey], v => saveCustom({ [alphaKey]: v }))}
                    </div>;
                    return <div style={{ ...rowCol, borderBottom: `1px solid ${COLORS.divider}` }}>
                      <div style={{ display: "flex", gap: 16, marginBottom: 4 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: COLORS.text, cursor: "pointer" }}><input type="checkbox" checked={customTheme.dark} onChange={e => saveCustom({ dark: e.target.checked })} style={{ accentColor: customTheme.accent }} />暗色底</label>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: COLORS.text, cursor: "pointer" }}><input type="checkbox" checked={customTheme.glass} onChange={e => saveCustom({ glass: e.target.checked })} style={{ accentColor: customTheme.accent }} />玻璃模糊</label>
                      </div>
                      {section("主界面", "bg", "bgA")}
                      {section("侧边栏", "sidebar", "sidebarA")}
                      {section("用户气泡", "userBubble", "userBubbleA")}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0 2px" }}>
                        {colorSwatch(customTheme.accent, v => saveCustom({ accent: v }))}
                        <span style={{ fontSize: 13, color: COLORS.text }}>强调色</span>
                        <span style={{ flex: 1 }} />
                        <button onClick={() => saveCustom({ ...DEFAULT_CUSTOM })} style={{ padding: "5px 12px", borderRadius: 14, border: `1px solid ${COLORS.divider}`, background: "transparent", color: COLORS.textSecondary, cursor: "pointer", fontSize: 12 }}>重置</button>
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.placeholder, marginTop: 6 }}>💡 透明度调低 + 开玻璃模糊 = 通透磨砂质感；配合壁纸更好看。</div>
                    </div>;
                  })()}
                  <div style={rowCol}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: wallpaper ? 10 : 0 }}>
                      <div><div style={lbl}>背景壁纸</div><div style={hint}>只存在你的设备上，不会上传</div></div>
                      <input ref={wallpaperInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePickWallpaper} />
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        {wallpaper && <button onClick={() => setWallpaper("")} style={{ padding: "6px 12px", borderRadius: 16, border: `1px solid ${COLORS.divider}`, background: "transparent", color: COLORS.danger, cursor: "pointer", fontSize: 13 }}>移除</button>}
                        <button onClick={() => wallpaperInputRef.current && wallpaperInputRef.current.click()} style={{ padding: "6px 14px", borderRadius: 16, border: "none", background: COLORS.accent, color: "#fff", cursor: "pointer", fontSize: 13 }}>{wallpaper ? "更换" : "上传"}</button>
                      </div>
                    </div>
                    {wallpaper && <img src={wallpaper} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 10 }} />}
                  </div>
                  <div style={rowLast}>
                    <div><div style={lbl}>磨砂气泡</div><div style={hint}>半透明磨砂玻璃质感，透出壁纸又有细边框</div></div>
                    <Toggle on={transparentBubble} onChange={() => setTransparentBubble(v => !v)} />
                  </div>
                </div></>}

                {settingsSection === "api" && <>
                <div style={listCard}>
                  <div style={row}>
                    <div style={{ ...lbl, flexShrink: 0 }}>API 地址</div>
                    <input type="text" value={settingsData.api_base_url || ""} placeholder="留空用默认" onChange={e => setSettingsData({ ...settingsData, api_base_url: e.target.value })} onBlur={e => saveSetting({ api_base_url: e.target.value })} style={rowInput} />
                  </div>
                  <div style={row}>
                    <div style={{ ...lbl, flexShrink: 0 }}>API Key</div>
                    <input type="password" value={settingsData.api_key || ""} placeholder="sk- 开头，留空用服务器默认" onChange={e => setSettingsData({ ...settingsData, api_key: e.target.value })} onBlur={e => saveSetting({ api_key: e.target.value })} style={rowInput} />
                  </div>
                  <div style={rowLast}>
                    <div style={{ ...lbl, flexShrink: 0 }}>模型</div>
                    <input type="text" value={settingsData.model || ""} placeholder="留空用默认渠道" onChange={e => setSettingsData({ ...settingsData, model: e.target.value })} onBlur={e => saveSetting({ model: e.target.value })} style={rowInput} />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: COLORS.placeholder, padding: "0 4px 8px", marginTop: -12 }}>💡 主力渠道，聊天用。三框可留空=用服务器默认。Key 框只填 sk- 开头的密钥。</div>

                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, padding: "8px 4px 8px" }}>便宜渠道（后台任务）</div>
                <div style={listCard}>
                  <div style={row}>
                    <div style={{ ...lbl, flexShrink: 0 }}>API 地址</div>
                    <input type="text" value={settingsData.cheap_api_base_url || ""} placeholder="留空=同主力" onChange={e => setSettingsData({ ...settingsData, cheap_api_base_url: e.target.value })} onBlur={e => saveSetting({ cheap_api_base_url: e.target.value })} style={rowInput} />
                  </div>
                  <div style={row}>
                    <div style={{ ...lbl, flexShrink: 0 }}>API Key</div>
                    <input type="password" value={settingsData.cheap_api_key || ""} placeholder="sk- 开头，留空=用主力" onChange={e => setSettingsData({ ...settingsData, cheap_api_key: e.target.value })} onBlur={e => saveSetting({ cheap_api_key: e.target.value })} style={rowInput} />
                  </div>
                  <div style={rowLast}>
                    <div style={{ ...lbl, flexShrink: 0 }}>模型</div>
                    <input type="text" value={settingsData.cheap_model || ""} placeholder="如 claude-sonnet-4-6" onChange={e => setSettingsData({ ...settingsData, cheap_model: e.target.value })} onBlur={e => saveSetting({ cheap_model: e.target.value })} style={rowInput} />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: COLORS.placeholder, padding: "0 4px 16px", marginTop: -12 }}>💡 摘要压缩、对话记忆总结这些后台活儿用它，省主力额度。三框都留空就跟主力共用。</div></>}

                {settingsSection === "behavior" && <>
                <div style={listCard}>
                  <div style={row}>
                    <div><div style={lbl}>Thinking 思考模式</div><div style={hint}>先思考再回答，过程可展开（开启时温度不生效）</div></div>
                    <Toggle on={!!settingsData.enable_thinking} onChange={() => saveSetting({ enable_thinking: settingsData.enable_thinking ? 0 : 1 })} />
                  </div>
                  <div style={rowLast}>
                    <div><div style={lbl}>MCP 工具</div><div style={hint}>让 Cael 自己调记忆工具，点一下即刻生效</div></div>
                    <Toggle on={!!settingsData.enable_mcp} onChange={() => saveSetting({ enable_mcp: settingsData.enable_mcp ? 0 : 1 })} />
                  </div>
                </div></>}

                {settingsSection === "params" && <>
                <div style={listCard}>
                  <div style={rowCol}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={lbl}>温度</span><span style={{ ...lbl, color: COLORS.accent }}>{settingsData.temperature}</span></div>
                    <input type="range" min="0" max="2" step="0.1" value={settingsData.temperature} onChange={e => setSettingsData({ ...settingsData, temperature: parseFloat(e.target.value) })} onMouseUp={e => saveSetting({ temperature: parseFloat(e.target.value) })} onTouchEnd={e => saveSetting({ temperature: parseFloat(e.target.value) })} style={{ width: "100%", accentColor: COLORS.accent }} />
                  </div>
                  <div style={row}>
                    <div style={lbl}>上下文轮数</div>
                    <input type="number" min="1" max="50" value={settingsData.max_context_rounds} onChange={e => setSettingsData({ ...settingsData, max_context_rounds: parseInt(e.target.value) || 10 })} onBlur={e => saveSetting({ max_context_rounds: parseInt(e.target.value) || 10 })} style={{ ...rowInput, width: 60, flex: "none" }} />
                  </div>
                  <div style={rowLast}>
                    <div style={lbl}>最大回复 tokens</div>
                    <input type="number" min="100" max="8000" value={settingsData.max_reply_tokens} onChange={e => setSettingsData({ ...settingsData, max_reply_tokens: parseInt(e.target.value) || 2000 })} onBlur={e => saveSetting({ max_reply_tokens: parseInt(e.target.value) || 2000 })} style={{ ...rowInput, width: 70, flex: "none" }} />
                  </div>
                </div></>}
              </>;
            })()}
            {settingsSection === "prompt" && <div>
              <label style={{ fontSize: 13, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>Cael 的人设 / System Prompt</label>
              <textarea value={settingsData.system_prompt || ""} onChange={e => setSettingsData({ ...settingsData, system_prompt: e.target.value })} onBlur={e => saveSetting({ system_prompt: e.target.value })} rows={14} placeholder="写下 Cael 是谁、怎么说话、有什么规则..." style={{ ...ifs, resize: "vertical", padding: "12px", lineHeight: 1.7 }} />
              <div style={{ fontSize: 12, color: COLORS.placeholder, marginTop: 8 }}>💡 想让 Cael 主动查记忆，可加一句："聊到过去的约定、事件、Jasmine 的偏好时，先查记忆库再回答。"改完点别处即自动保存。</div>
            </div>}
          </div>}
        </div>
      </div>}

      {showSearch && <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowSearch(false)}>
        <div style={{ background: COLORS.cardBg, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560, maxHeight: "70vh", display: "flex", flexDirection: "column", padding: "20px 24px 32px" }} onClick={e => e.stopPropagation()}>
          <div style={{ marginBottom: 16 }}>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSearch(); }} placeholder="搜索记忆和对话..." style={{ width: "100%", border: `1px solid ${COLORS.divider}`, borderRadius: 20, padding: "10px 16px", fontSize: 14, outline: "none", background: COLORS.bg, color: COLORS.text, boxSizing: "border-box", fontFamily: "inherit" }} autoFocus />
          </div>
          <div style={{ flex: 1, overflow: "auto", maxHeight: "50vh" }}>
            {searchResults.length === 0 ? <div style={{ textAlign: "center", color: COLORS.placeholder, fontSize: 13, padding: "20px 0" }}>输入关键词搜索</div> : searchResults.map((r, i) => (
              <div key={i} style={{ background: r.type === "post" ? COLORS.cardBg : COLORS.bg, borderRadius: 12, padding: 12, marginBottom: 8, border: `1px solid ${COLORS.divider}` }}>
                <div style={{ fontSize: 12, color: COLORS.placeholder, marginBottom: 4 }}>{r.type === "post" ? "记忆" : "对话"}{r.viaGraph && <span style={{ color: COLORS.accent, marginLeft: 6 }}>· 图谱关联</span>}</div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: COLORS.text }}>{r.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>}
    </div>
  );
}
