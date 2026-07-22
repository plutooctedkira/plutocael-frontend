import { useState, useRef, useEffect } from "react";
import McpManager from './McpManager';
import OmbreMemories from './OmbreMemories';

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
  mint: {
    label: "嫩绿",
    bg: "#F2FCE5", sidebar: "#E9F6D9", sidebarBorder: "#D8ECC4", sidebarHover: "#E1F0CE",
    sidebarActive: "#6FB03E", sidebarActiveText: "#FFFFFF",
    input: "#FFFFFF", inputBorder: "#D0E6BC",
    userBubble: "#E4F3D2", userBubbleText: "#2A3320",
    text: "#2A3320", textSecondary: "#657056", placeholder: "#A3B491",
    accent: "#6FB03E", accentHover: "#5D9832", accentLight: "#E4F3D2",
    buttonHover: "#E1F0CE", danger: "#C0392B", divider: "#D8ECC4", cardBg: "#FFFFFF",
    glass: "rgba(255,255,255,0.4)", glassHover: "rgba(255,255,255,0.75)",
  },
  sky: {
    label: "天蓝",
    bg: "#ECF5FC", sidebar: "#DFEEF9", sidebarBorder: "#C9E1F2", sidebarHover: "#D6E8F6",
    sidebarActive: "#4A90D9", sidebarActiveText: "#FFFFFF",
    input: "#FFFFFF", inputBorder: "#C2DCF0",
    userBubble: "#D8EAF8", userBubbleText: "#1E2A36",
    text: "#1E2A36", textSecondary: "#5A6B7A", placeholder: "#98ACBE",
    accent: "#4A90D9", accentHover: "#3A7BC0", accentLight: "#D8EAF8",
    buttonHover: "#D6E8F6", danger: "#C0392B", divider: "#C9E1F2", cardBg: "#FFFFFF",
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
  const [gatewayLogs, setGatewayLogs] = useState([]);
  const [promptSaved, setPromptSaved] = useState(false); // 人设保存的瞬时反馈
  // 聊天记录搜索（关键词/图片/链接/日期）
  const [showChatMenu, setShowChatMenu] = useState(false); // 右上角…菜单
  const [showPlusPanel, setShowPlusPanel] = useState(false); // +号弹出的底部扩展面板
  const photoInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [showChatSearch, setShowChatSearch] = useState(false); // 全屏搜索页
  const [showCalendar, setShowCalendar] = useState(false); // 按日期查找的日历视图
  const [showDelCalendar, setShowDelCalendar] = useState(false); // 按日期删除的日历
  const [delSelected, setDelSelected] = useState(new Set()); // 多选待删日期
  const [chatDates, setChatDates] = useState(new Set()); // 有聊天记录的日期集合
  const calScrollRef = useRef(null);
  const [chatSearchQ, setChatSearchQ] = useState("");
  const [chatSearchType, setChatSearchType] = useState(""); // "" | image | link
  const [chatSearchDate, setChatSearchDate] = useState("");
  const [chatSearchResults, setChatSearchResults] = useState(null); // null=未搜索
  const [jumpMsgId, setJumpMsgId] = useState(null); // 搜索跳转的目标消息
  // 聊天记录管理
  const [manageBackups, setManageBackups] = useState([]);
  const [manageMsg, setManageMsg] = useState("");
  const importInputRef = useRef(null);
  // 用户气泡颜色（外观-气泡选择）
  const [bubbleColor, setBubbleColor] = useState(() => localStorage.getItem("pluto_bubble_color") || "");
  const [mcpMemories, setMcpMemories] = useState([]);
  const [mcpTools, setMcpTools] = useState([]);
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcpSelectedTool, setMcpSelectedTool] = useState("");
  const [mcpToolArgs, setMcpToolArgs] = useState("{}");
  const [mcpToolResult, setMcpToolResult] = useState("");
  const [pendingImage, setPendingImage] = useState(null);
  const [copiedMsgId, setCopiedMsgId] = useState(null); // 复制成功的瞬时反馈
  const [showKey, setShowKey] = useState(false);
  const [showCheapKey, setShowCheapKey] = useState(false);
  // API 渠道预设（存多个一键切换）
  const [channels, setChannels] = useState([]);
  const [chanForm, setChanForm] = useState(null); // null | {id?, name, api_base_url, api_key, model}
  const [chTest, setChTest] = useState(null); // {id, loading|ok|error}
  const loadChannels = async () => { try { const r = await fetch(API + "/settings/channels").then(x => x.json()); setChannels(r.channels || []); } catch (e) {} };
  const saveChannel = async () => {
    const f = chanForm; if (!f || !f.name.trim()) return;
    try {
      if (f.id) await fetch(API + "/settings/channels/" + f.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      else await fetch(API + "/settings/channels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      setChanForm(null); loadChannels();
    } catch (e) {}
  };
  const delChannel = async (id) => { if (!confirm("删除这个渠道？")) return; try { await fetch(API + "/settings/channels/" + id, { method: "DELETE" }); loadChannels(); } catch (e) {} };
  const activateChannel = async (ch) => {
    try {
      await fetch(API + "/settings/channels/" + ch.id + "/activate", { method: "POST" });
      setSettingsData(prev => ({ ...prev, api_base_url: ch.api_base_url, api_key: ch.api_key, model: ch.model }));
    } catch (e) {}
  };
  const testChannel = async (ch) => {
    setChTest({ id: ch.id, loading: true });
    try {
      const r = await fetch(API + "/settings/test-api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: "main", api_base_url: ch.api_base_url, api_key: ch.api_key, model: ch.model }) }).then(x => x.json());
      setChTest({ id: ch.id, ...r });
    } catch (e) { setChTest({ id: ch.id, ok: false, error: e.message }); }
  };
  const [apiTest, setApiTest] = useState({}); // {main|cheap: null|{loading}|{saved}|{ok,model,error,warnings}}
  const setChanTest = (ch, v) => setApiTest(prev => ({ ...prev, [ch]: v }));

  // 主力/便宜渠道各自独立的本地校验
  const validateChan = (ch) => {
    const bad = (v) => v && /[^\x21-\x7E]/.test(v.trim());
    const key = ch === "main" ? settingsData.api_key : settingsData.cheap_api_key;
    const base = ch === "main" ? settingsData.api_base_url : settingsData.cheap_api_base_url;
    const errs = [];
    if (bad(key)) errs.push("API Key 里有中文或空格——你可能把模型名贴错框了，Key 应该是 sk- 开头的英文串");
    if (key && /claude|gpt|\[/i.test(key)) errs.push("Key 看起来像模型名——模型名请填在「模型」框");
    if (bad(base)) errs.push("API 地址里有非法字符");
    return errs;
  };
  // 保存：只保存这个渠道的三个字段
  const saveApi = async (ch) => {
    const errs = validateChan(ch);
    if (errs.length) { setChanTest(ch, { ok: false, error: errs.join("；") }); return; }
    const fields = ch === "main"
      ? { api_base_url: settingsData.api_base_url || "", api_key: settingsData.api_key || "", model: settingsData.model || "" }
      : { cheap_api_base_url: settingsData.cheap_api_base_url || "", cheap_api_key: settingsData.cheap_api_key || "", cheap_model: settingsData.cheap_model || "" };
    try {
      await fetch(API + "/settings/" + (settingsData.id || 1), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) });
      setChanTest(ch, { saved: true });
      setTimeout(() => setApiTest(prev => (prev[ch] && prev[ch].saved ? { ...prev, [ch]: null } : prev)), 2500);
    } catch (e) { setChanTest(ch, { ok: false, error: e.message }); }
  };
  // 测试：拿输入框里的当前值实测（不保存），便宜渠道留空的字段服务端会回退主力
  const testApi = async (ch) => {
    const errs = validateChan(ch);
    if (errs.length) { setChanTest(ch, { ok: false, error: errs.join("；") }); return; }
    setChanTest(ch, { loading: true });
    const payload = ch === "main"
      ? { channel: "main", api_base_url: settingsData.api_base_url || "", api_key: settingsData.api_key || "", model: settingsData.model || "" }
      : { channel: "cheap", api_base_url: settingsData.cheap_api_base_url || "", api_key: settingsData.cheap_api_key || "", model: settingsData.cheap_model || "" };
    try {
      const r = await fetch(API + "/settings/test-api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(x => x.json());
      setChanTest(ch, r);
    } catch (e) { setChanTest(ch, { ok: false, error: e.message }); }
  };
  const fileInputRef = useRef(null);
  const wallpaperInputRef = useRef(null);
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem("pluto_wallpaper") || "");
  // 头像：气泡旁显示，云同步；空=显示默认字母圆
  const avatarUserInputRef = useRef(null);
  const avatarAiInputRef = useRef(null);
  const [avatarUser, setAvatarUser] = useState(() => localStorage.getItem("pluto_avatar_user") || "");
  const [avatarAi, setAvatarAi] = useState(() => localStorage.getItem("pluto_avatar_ai") || "");
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
    // 拟物阴影的深浅色开关（CSS 按 body[data-sk] 切换按钮光影强度）
    document.body.dataset.sk = (theme === "dark" || (theme === "custom" && customTheme.dark)) ? "dark" : "light";
  }, [theme, customTheme]);
  // 外观云同步：改动推到服务器，任何设备打开都一致（localStorage仅作秒开缓存）
  const pushAppearance = (over = {}) => {
    const payload = { theme, customTheme, transparentBubble, bubbleColor, ...over };
    fetch(API + "/settings/1", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appearance: JSON.stringify(payload) }) }).catch(() => {});
  };
  const changeTheme = (key) => { setTheme(key); pushAppearance({ theme: key }); };
  const saveCustom = (patch) => setCustomTheme(prev => { const next = { ...prev, ...patch }; localStorage.setItem("pluto_custom_theme", JSON.stringify(next)); pushAppearance({ customTheme: next }); return next; });
  const toggleBubble = () => setTransparentBubble(v => { const next = !v; pushAppearance({ transparentBubble: next }); return next; });

  // 启动时从服务器拉外观配置（覆盖本地缓存）
  useEffect(() => {
    fetch(API + "/settings").then(r => r.json()).then(s => {
      if (!s) return;
      setSettingsData(s);
      if (s.appearance) {
        try {
          const a = JSON.parse(s.appearance);
          if (a.theme) setTheme(a.theme);
          if (a.customTheme) setCustomTheme(prev => ({ ...prev, ...a.customTheme }));
          if (a.transparentBubble !== undefined) setTransparentBubble(!!a.transparentBubble);
          if (a.bubbleColor !== undefined) setBubbleColor(a.bubbleColor || "");
        } catch (e) {}
      }
      if (s.wallpaper !== undefined && s.wallpaper !== null) setWallpaper(s.wallpaper || "");
      if (s.avatar_user !== undefined && s.avatar_user !== null) setAvatarUser(s.avatar_user || "");
      if (s.avatar_ai !== undefined && s.avatar_ai !== null) setAvatarAi(s.avatar_ai || "");
    }).catch(() => {});
  }, []);

  // 本地缓存（秒开用，云端数据到达后覆盖）
  useEffect(() => {
    if (wallpaper) localStorage.setItem("pluto_wallpaper", wallpaper);
    else localStorage.removeItem("pluto_wallpaper");
  }, [wallpaper]);
  useEffect(() => { localStorage.setItem("pluto_transparent_bubble", transparentBubble ? "1" : "0"); }, [transparentBubble]);
  useEffect(() => { if (bubbleColor) localStorage.setItem("pluto_bubble_color", bubbleColor); else localStorage.removeItem("pluto_bubble_color"); }, [bubbleColor]);
  useEffect(() => { if (avatarUser) localStorage.setItem("pluto_avatar_user", avatarUser); else localStorage.removeItem("pluto_avatar_user"); }, [avatarUser]);
  useEffect(() => { if (avatarAi) localStorage.setItem("pluto_avatar_ai", avatarAi); else localStorage.removeItem("pluto_avatar_ai"); }, [avatarAi]);

  // 选头像：居中裁成正方形压到256px，同步到服务器（跨设备可见）
  const handlePickAvatar = (who) => (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const S = 256;
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2, sy = (img.height - side) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = S; canvas.height = S;
      canvas.getContext("2d").drawImage(img, sx, sy, side, side, 0, 0, S, S);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const field = who === "user" ? "avatar_user" : "avatar_ai";
      fetch(API + "/settings/1", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: dataUrl }) }).catch(() => {});
      (who === "user" ? setAvatarUser : setAvatarAi)(dataUrl);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };
  const removeAvatar = (who) => {
    const field = who === "user" ? "avatar_user" : "avatar_ai";
    fetch(API + "/settings/1", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: "" }) }).catch(() => {});
    (who === "user" ? setAvatarUser : setAvatarAi)("");
  };

  // 选壁纸：压缩后同步到服务器（跨设备可见）
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
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      fetch(API + "/settings/1", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wallpaper: dataUrl }) }).catch(() => {});
      setWallpaper(dataUrl);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // 气泡样式：透明模式=磨砂玻璃（半透明+细边框+模糊，透出壁纸又有轮廓）
  const frostBg = theme === "dark" ? "rgba(70,70,68,0.32)" : "rgba(255,255,255,0.22)";
  const frostBorder = theme === "dark" ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.55)";
  // 拟物化质感：凸起(按钮/卡片)与凹陷(输入槽)的光影
  const embossHi = (theme === "dark" || (theme === "custom" && customTheme.dark)) ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.65)";
  const skRaised = {
    backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.30), rgba(0,0,0,0.06))",
    boxShadow: `0 2px 5px rgba(0,0,0,0.20), 0 6px 14px rgba(0,0,0,0.10), inset 0 1px 0 ${embossHi}, inset 0 -2px 3px rgba(0,0,0,0.12)`
  };
  const skCard = { boxShadow: `0 1px 2px rgba(0,0,0,0.07), 0 4px 10px rgba(0,0,0,0.07), inset 0 1px 0 ${embossHi}` };
  const skInset = { boxShadow: `inset 0 2px 6px rgba(0,0,0,0.10), inset 0 -1px 0 ${embossHi}, 0 1px 0 ${embossHi}, 0 4px 14px rgba(0,0,0,0.08)` };

  // 玻璃模式下，把侧边栏/顶栏/输入栏等实心区域变成半透明磨砂玻璃
  const glassSurface = customTheme.dark ? "rgba(40,40,38,0.5)" : "rgba(255,255,255,0.42)";
  const glassify = (solidBg) => glassMode
    ? { background: glassSurface, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }
    : { background: solidBg };
  const bubbleStyle = (isUser) => {
    if (transparentBubble) {
      return { backgroundColor: frostBg, border: `1px solid ${frostBorder}`, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" };
    }
    // 古早聊天风：用户=粉调胖气泡，AI=灰色胖气泡，都带小尾巴
    // 凸起感靠 backgroundImage 渐变高光罩在纯色 backgroundColor 上（尾巴取纯色，能对上）
    const dark = theme === "dark" || (theme === "custom" && customTheme.dark);
    const blur = (glassMode || wallpaper) ? "blur(10px)" : "none";
    // 只留极淡的顶部提亮，去掉底部暗带——暗带在圆角边缘看起来像脏阴影
    const gloss = dark
      ? "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0) 55%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.38), rgba(255,255,255,0) 55%)";
    // 单层极柔投影：内嵌高光线在圆角处会断裂、半透明底会透出多层阴影导致角落发灰
    const raised = dark
      ? "0 1px 4px rgba(0,0,0,0.26)"
      : "0 1px 4px rgba(0,0,0,0.06)";
    if (isUser) {
      const bg = bubbleColor || (theme === "custom" ? COLORS.userBubble : (wallpaper ? (dark ? "rgba(74,58,50,0.86)" : "rgba(245,228,232,0.9)") : COLORS.accentLight));
      return { backgroundColor: bg, backgroundImage: gloss, border: glassMode ? `1px solid ${frostBorder}` : "none", backdropFilter: blur, WebkitBackdropFilter: blur, boxShadow: raised };
    }
    const aiBg = wallpaper ? (dark ? "rgba(56,55,53,0.86)" : "rgba(224,224,229,0.92)") : (dark ? "#3A3936" : "#E0E0E5");
    return { backgroundColor: aiBg, backgroundImage: gloss, border: glassMode ? `1px solid ${frostBorder}` : "none", backdropFilter: blur, WebkitBackdropFilter: blur, boxShadow: raised };
  };
  // 微信式浅灰刘海/底栏：顶部和底部用浅灰条增加层次感（深色模式用深灰，壁纸下半透明磨砂）
  const barDark = theme === "dark" || (theme === "custom" && customTheme.dark);
  const barBg = (wallpaper || glassMode)
    ? { background: barDark ? "rgba(40,40,38,0.80)" : "rgba(237,237,234,0.80)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }
    : { background: barDark ? "#2A2A28" : "#EDEDEA" };
  // 顶栏：主题色实底（不透壁纸），只有菜单键（+ 可选的右侧内容）
  const caelHeader = (right) => (
    <div style={{ padding: "calc(8px + env(safe-area-inset-top, 0px)) 14px 2px", display: "flex", alignItems: "center", gap: 11, flexShrink: 0, position: "relative", zIndex: 5, background: theme === "custom" ? COLORS._solidBg : COLORS.bg }}>
      <button className="flat" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: "transparent", color: COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MenuIcon /></button>
      <span style={{ flex: 1 }} />
      {right}
    </div>
  );
  const messagesEndRef = useRef(null);
  const editInputRef = useRef(null);
  const [dragOffset, setDragOffset] = useState(0); // 侧边栏跟手拖拽偏移(0~280)
  const dragging = useRef(false);
  // steps 底部弹层（thinking+工具调用合并）：存消息id，流式时内容跟着长；高度可上拉（默认约半屏，最高距顶20px）
  const [thinkingSheet, setThinkingSheet] = useState(null);
  const [sheetH, setSheetH] = useState(360);
  const [openSteps, setOpenSteps] = useState({}); // 每条step的展开状态，默认折叠
  const sheetDrag = useRef(null);
  const openThinkingSheet = (id) => { setSheetH(Math.round(window.innerHeight * 0.47)); setOpenSteps({}); setThinkingSheet(id); };
  // 把消息的 thinking 和工具日志拆成 steps 列表
  const filterToolLines = (log) => (log || "").split("\n").filter(l => !['→ 调用 memory', '✓ 返回: memory'].some(p => l.includes(p))).filter(l => l.trim());
  const buildSteps = (m) => {
    const steps = [];
    if (m && m.reasoning_content) steps.push({ key: "thinking", kind: "thinking", title: "Thinking", content: m.reasoning_content });
    if (m && m.tool_log) {
      let cur = null;
      for (const l of filterToolLines(m.tool_log)) {
        const mm = l.match(/^→ 调用 (\S+)\s*(.*)$/);
        if (mm) { cur = { key: "tool" + steps.length + mm[1], kind: "tool", title: mm[1].charAt(0).toUpperCase() + mm[1].slice(1), content: mm[2] ? "参数: " + mm[2] : "" }; steps.push(cur); }
        else if (cur) cur.content += (cur.content ? "\n" : "") + l;
        else { cur = { key: "tool" + steps.length, kind: "tool", title: "工具调用", content: l }; steps.push(cur); }
      }
    }
    return steps;
  };
  // 长按气泡菜单：{id, isUser, text, x, y}
  const [bubbleMenu, setBubbleMenu] = useState(null);
  const lpTimer = useRef(null);
  const openBubbleMenu = (msg, isUser, text, rect) => {
    if (navigator.vibrate) navigator.vibrate(10);
    setBubbleMenu({ id: msg.id, isUser, text: text || "", rect: { top: rect.top, bottom: rect.bottom, cx: rect.left + rect.width / 2 } });
  };
  const cancelLongPress = () => { if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; } };
  const handleWithdraw = async (id) => {
    setBubbleMenu(null);
    try { await fetch(API + "/messages/" + id, { method: "DELETE" }); setMessages(prev => prev.filter(m => m.id !== id)); } catch (e) { console.error("撤回失败:", e); }
  };
  // 引用：先挂在输入框上方待发送，发送时以标记拼进正文，渲染时拆出来显示成气泡下方小灰条
  const [pendingQuote, setPendingQuote] = useState(null); // {from, text}
  const handleQuote = (text, isUser) => { setBubbleMenu(null); setPendingQuote({ from: isUser ? "我" : "Cael", text }); };
  const parseQuote = (text) => {
    if (!text || typeof text !== "string") return { text, quote: null };
    const i = text.lastIndexOf("\n\n〔引用·");
    if (i === -1) return { text, quote: null };
    const m = text.slice(i + 2).match(/^〔引用·(.+?)〕([\s\S]*)$/);
    if (!m) return { text, quote: null };
    return { text: text.slice(0, i), quote: { from: m[1], text: m[2] } };
  };

  useEffect(() => { fetch(API + "/sessions").then(r => r.json()).then(data => { setSessions(data); if (data.length > 0 && !activeSessionId) setActiveSessionId(data[0].id); data.forEach(s => loadPreview(s.id)); }).catch(err => console.error("加载会话失败:", err)); }, []);
  const loadPreview = async (sid) => { try { const res = await fetch(API + "/messages/session/" + sid); const msgs = await res.json(); const f = msgs.find(m => m.role === "user"); if (f) setPreviews(prev => ({ ...prev, [sid]: f.content.substring(0, 30) + (f.content.length > 30 ? "..." : "") })); } catch (e) {} };
  useEffect(() => { if (!activeSessionId) return; fetch(API + "/messages/session/" + activeSessionId).then(r => r.json()).then(setMessages).catch(err => console.error("加载消息失败:", err)); }, [activeSessionId]);
  useEffect(() => { if (currentPage === "memory") loadMemories(); }, [currentPage]);
  // 记忆库 = MCP 真实记忆库（数据在远程服务器，本地不丢失）
  const loadMemories = async () => {
    try {
      const r = await fetch(API + "/mcp/memories?limit=100").then(x => x.json());
      let mems = (r.data || []).map(m => ({
        id: m.id, title: m.title, content: m.content,
        importance: m.importance || 3, layer: m.layer || "episodic",
        author: m.author, created_at: m.created_at, last_accessed: m.last_accessed
      }));
      if (memoryFilter !== "全部") mems = mems.filter(m => m.layer === memoryFilter);
      setMemories(mems);
    } catch (e) { setMemories([]); }
  };
  useEffect(() => { if (currentPage === "memory") loadMemories(); }, [memoryFilter]);
  // +面板展开时，消息区跟随动画持续贴底——整个对话界面看起来和面板同步上滑
  useEffect(() => {
    if (!showPlusPanel) return;
    const el = messagesEndRef.current;
    if (!el) return;
    let raf; const start = performance.now();
    const tick = (t) => { el.scrollIntoView({ block: "end" }); if (t - start < 520) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [showPlusPanel]);
  // 自动钉在最后一条消息（打开会话/新消息都定位到底；搜索跳转时让位）
  useEffect(() => {
    if (jumpMsgId != null) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);
  // 搜索跳转：消息加载后滚到目标条并短暂高亮
  useEffect(() => {
    if (jumpMsgId == null) return;
    const t = setTimeout(() => {
      const el = document.getElementById("msg-" + jumpMsgId);
      if (el) {
        el.scrollIntoView({ block: "center" });
        el.style.transition = "opacity 0.3s"; el.style.opacity = "0.4";
        setTimeout(() => { el.style.opacity = "1"; }, 500);
      }
      setJumpMsgId(null);
    }, 400);
    return () => clearTimeout(t);
  }, [jumpMsgId, messages]);
  // 聊天记录搜索：输入停 300ms 后请求
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!chatSearchQ.trim() && !chatSearchType && !chatSearchDate) { setChatSearchResults(null); return; }
      try {
        const p = new URLSearchParams();
        if (chatSearchQ.trim()) p.set("q", chatSearchQ.trim());
        if (chatSearchType) p.set("type", chatSearchType);
        if (chatSearchDate) p.set("date", chatSearchDate);
        const r = await fetch(API + "/messages/search/all?" + p.toString()).then(x => x.json());
        setChatSearchResults(r.items || []);
      } catch (e) { setChatSearchResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [chatSearchQ, chatSearchType, chatSearchDate]);
  const jumpToMsg = (r) => { setShowSettings(false); setShowChatSearch(false); setCurrentPage("chat"); setActiveSessionId(r.session_id); setJumpMsgId(r.id); setSidebarOpen(false); };
  const closeChatSearch = () => { setShowChatSearch(false); setShowCalendar(false); setChatSearchQ(""); setChatSearchType(""); setChatSearchDate(""); };
  const openCalendar = async () => {
    try { const r = await fetch(API + "/messages/dates/all").then(x => x.json()); setChatDates(new Set((r.dates || []).map(x => x.d))); } catch (e) { setChatDates(new Set()); }
    setShowCalendar(true);
  };
  // 打开日历时滚到最底（今天在最下面，和微信一致）
  useEffect(() => { if ((showCalendar || showDelCalendar) && calScrollRef.current) calScrollRef.current.scrollTop = calScrollRef.current.scrollHeight; }, [showCalendar, showDelCalendar]);
  // 共用日历主体：聊过天的日子可点，selectedSet 非空时为多选模式（选中=强调色圆）
  const renderCalendarBody = (onDayTap, selectedSet) => {
    const pad2 = n => String(n).padStart(2, "0");
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    let startY = now.getFullYear(), startM = now.getMonth();
    const sorted = [...chatDates].sort();
    if (sorted.length > 0) { const p = sorted[0].split("-").map(Number); startY = p[0]; startM = p[1] - 1; }
    const months = [];
    for (let y = startY, m = startM; y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth());) {
      months.push({ y, m }); m++; if (m > 11) { m = 0; y++; }
    }
    return <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "6px 0 4px", borderBottom: `1px solid ${COLORS.divider}` }}>
        {["日", "一", "二", "三", "四", "五", "六"].map(w => <div key={w} style={{ textAlign: "center", fontSize: 12, color: COLORS.placeholder }}>{w}</div>)}
      </div>
      {months.map(({ y, m }) => {
        const first = new Date(y, m, 1).getDay();
        const days = new Date(y, m + 1, 0).getDate();
        const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
        return <div key={y + "-" + m} style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 14, color: COLORS.textSecondary, padding: "12px 2px 6px" }}>{y}年{m + 1}月</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 4 }}>
            {cells.map((d, i) => {
              if (d === null) return <div key={"b" + i} />;
              const key = `${y}-${pad2(m + 1)}-${pad2(d)}`;
              const has = chatDates.has(key);
              const isToday = key === todayKey;
              const isSel = selectedSet ? selectedSet.has(key) : false;
              return <button key={key} className="flat ghost" disabled={!has} onClick={() => onDayTap(key)} style={{ border: "none", background: "transparent", padding: 0, height: isToday ? 52 : 44, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", cursor: has ? "pointer" : "default", fontFamily: "inherit" }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: isSel ? COLORS.accent : (isToday && !selectedSet) ? COLORS.accent : "transparent", border: isToday && selectedSet && !isSel ? `1.5px solid ${COLORS.accent}` : "none", color: (isSel || (isToday && !selectedSet)) ? "#fff" : has ? COLORS.text : COLORS.placeholder, fontWeight: has && !isToday ? 500 : 400, opacity: (!has && !isToday) ? 0.5 : 1, boxSizing: "border-box" }}>{d}</span>
                {isToday && <span style={{ fontSize: 10, color: COLORS.accent, marginTop: 1 }}>今天</span>}
              </button>;
            })}
          </div>
        </div>;
      })}
    </>;
  };
  // 按日期多选删除
  const openDeleteCalendar = async () => {
    try { const r = await fetch(API + "/messages/dates/all").then(x => x.json()); setChatDates(new Set((r.dates || []).map(x => x.d))); } catch (e) { setChatDates(new Set()); }
    setDelSelected(new Set());
    setShowDelCalendar(true);
  };
  const doDeleteDates = async () => {
    if (!delSelected.size) return;
    if (!confirm(`确定删除选中 ${delSelected.size} 天的全部聊天记录吗？\n不可恢复，建议先去 设置→聊天记录管理 备份一份。`)) return;
    try {
      await fetch(API + "/messages/delete-dates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dates: [...delSelected] }) });
      setShowDelCalendar(false);
      const msgs = await fetch(API + "/messages/session/" + (activeSessionId || "")).then(x => x.json());
      if (Array.isArray(msgs)) setMessages(msgs);
    } catch (e) {}
  };
  const clearChat = async () => {
    if (!activeSessionId) return;
    if (!confirm("确定清空整个对话吗？所有消息将被删除且不可恢复。\n建议先去 设置→聊天记录管理 备份一份。")) return;
    try { await fetch(API + "/messages/session/" + activeSessionId + "/all", { method: "DELETE" }); setMessages([]); } catch (e) {}
  };
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
  // 从侧边栏打开某个设置分区（全页显示）
  const openSettingsPage = async (key) => {
    setSidebarOpen(false);
    setSettingsSection(key);
    setShowSettings(true);
    if (key === "usage") loadGatewayStats();
    if (key === "chatmgmt") { setManageMsg(""); loadBackups(); }
    if (key === "api") loadChannels();
    if (!settingsData) { try { const res = await fetch(API + "/settings"); setSettingsData(await res.json()); } catch (err) { console.error("加载设置失败:", err); } }
  };
  const handleSaveSettings = async () => { if (!settingsData) return; setSettingsSaving(true); try { await fetch(API + "/settings/" + settingsData.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settingsData) }); } catch (err) { console.error("保存设置失败:", err); } finally { setSettingsSaving(false); } };
  // ── 聊天记录管理 ──
  const loadBackups = async () => {
    try { const r = await fetch(API + "/manage/backups").then(x => x.json()); setManageBackups(r.backups || []); } catch (e) {}
  };
  const doBackup = async () => {
    setManageMsg("备份中…");
    try { const r = await fetch(API + "/manage/backup", { method: "POST" }).then(x => x.json()); setManageMsg(r.ok ? "✓ 备份完成：" + r.file : "备份失败：" + (r.error || "")); loadBackups(); } catch (e) { setManageMsg("备份失败：" + e.message); }
  };
  const doRestore = async (file) => {
    if (!confirm(`确定恢复到备份「${file}」吗？\n当前数据会先自动快照一份，然后被这个备份覆盖。`)) return;
    setManageMsg("恢复中…");
    try {
      const r = await fetch(API + "/manage/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file }) }).then(x => x.json());
      if (r.ok) { alert("恢复完成，页面将刷新"); location.reload(); }
      else setManageMsg("恢复失败：" + (r.error || ""));
    } catch (e) { setManageMsg("恢复失败：" + e.message); }
  };
  const doLocalBackup = () => { window.open(API + "/manage/backup/download", "_blank"); setManageMsg("✓ 本地备份已开始下载"); };
  const doDeleteBackup = async (file) => {
    if (!confirm(`删除云端备份「${file}」？此操作不可恢复。`)) return;
    try { await fetch(API + "/manage/backups/" + encodeURIComponent(file), { method: "DELETE" }); loadBackups(); } catch (e) {}
  };
  const localRestoreRef = useRef(null);
  const doLocalRestore = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!confirm(`确定用本地文件「${file.name}」恢复吗？\n当前数据会先自动快照一份，然后被覆盖。`)) return;
    setManageMsg("恢复中…");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const b64 = btoa(new Uint8Array(reader.result).reduce((s, b) => s + String.fromCharCode(b), ""));
        const r = await fetch(API + "/manage/restore-upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: b64 }) }).then(x => x.json());
        if (r.ok) { alert("恢复完成，页面将刷新"); location.reload(); }
        else setManageMsg("恢复失败：" + (r.error || ""));
      } catch (err) { setManageMsg("恢复失败：" + err.message); }
    };
    reader.readAsArrayBuffer(file);
  };
  // 智能导入：md/json 都行，后端丢给 DeepSeek 清洗去重后并入当前对话；前端轮询进度
  const importPollRef = useRef(null);
  const [importRunning, setImportRunning] = useState(false);
  const cancelImport = async () => {
    try { await fetch(API + "/manage/import-cancel", { method: "POST" }); setManageMsg("⏳ 正在中断…当前段处理完就停"); } catch (e) {}
  };
  const doImport = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setManageMsg("上传中…");
        const r = await fetch(API + "/manage/import-smart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: reader.result, session_id: activeSessionId }) }).then(x => x.json());
        if (!r.ok) { setManageMsg("导入失败：" + (r.error || "")); return; }
        setManageMsg("⏳ 已开始后台处理…");
        setImportRunning(true);
        clearInterval(importPollRef.current);
        importPollRef.current = setInterval(async () => {
          try {
            const st = await fetch(API + "/manage/import-status").then(x => x.json());
            if (st.status === "running") {
              if (!st.cancelRequested) setManageMsg(`⏳ DeepSeek 后台清洗中… ${st.doneChunks}/${st.totalChunks || "?"} 段，已导入 ${st.imported} 条，跳过重复/无效 ${st.skipped} 条`);
            } else {
              clearInterval(importPollRef.current);
              setImportRunning(false);
              if (st.status === "done" || st.status === "cancelled") {
                setManageMsg(`${st.status === "cancelled" ? "⏹ 已中断" : "✓ 清洗完成"}：整理出 ${st.imported} 条，跳过重复/无效 ${st.skipped} 条`);
                if (st.imported > 0) { await loadStaging(); setShowStaging(true); }
              } else setManageMsg("导入失败：" + (st.error || "未知错误"));
            }
          } catch (err) {}
        }, 2500);
      } catch (err) { setManageMsg("导入失败：" + err.message); }
    };
    reader.readAsText(file);
  };
  const exportChat = (fmt) => { window.open(API + "/manage/export?format=" + fmt, "_blank"); };

  // ── 导入暂存审阅区：清洗结果先落缓存，改删满意后上传到对话 / 备份 ──
  const [showStaging, setShowStaging] = useState(false);
  const [stagingItems, setStagingItems] = useState([]);
  const [editStageId, setEditStageId] = useState(null);
  const [editStageText, setEditStageText] = useState("");
  const loadStaging = async () => {
    try { const r = await fetch(API + "/manage/staging").then(x => x.json()); setStagingItems(r.items || []); } catch (e) { setStagingItems([]); }
  };
  const saveStageEdit = async (id) => {
    try { await fetch(API + "/manage/staging/" + id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: editStageText }) }); } catch (e) {}
    setStagingItems(prev => prev.map(m => m.id === id ? { ...m, content: editStageText } : m));
    setEditStageId(null); setEditStageText("");
  };
  const delStageItem = async (id) => {
    try { await fetch(API + "/manage/staging/" + id, { method: "DELETE" }); } catch (e) {}
    setStagingItems(prev => prev.filter(m => m.id !== id));
  };
  const toggleStageRole = async (m) => {
    const role = m.role === "user" ? "assistant" : "user";
    try { await fetch(API + "/manage/staging/" + m.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) }); } catch (e) {}
    setStagingItems(prev => prev.map(x => x.id === m.id ? { ...x, role } : x));
  };
  const commitStaging = async () => {
    if (!stagingItems.length) return;
    if (!confirm(`确定把这 ${stagingItems.length} 条上传到当前对话吗？`)) return;
    try {
      const r = await fetch(API + "/manage/staging/commit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: activeSessionId }) }).then(x => x.json());
      setShowStaging(false); setStagingItems([]);
      setManageMsg(`✓ 已上传：新增 ${r.imported} 条，跳过重复 ${r.skipped} 条`);
      const msgs = await fetch(API + "/messages/session/" + (r.session_id || activeSessionId || "")).then(x => x.json());
      if (Array.isArray(msgs)) setMessages(msgs);
    } catch (e) {}
  };
  const discardStaging = async () => {
    if (!confirm("放弃这批清洗结果吗？暂存区会清空。")) return;
    try { await fetch(API + "/manage/staging/clear", { method: "POST" }); } catch (e) {}
    setShowStaging(false); setStagingItems([]); setManageMsg("已放弃这批导入");
  };
  const exportStaging = (fmt) => { window.open(API + "/manage/staging/export?format=" + fmt, "_blank"); };

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

  // p 显式传入，避免闭包里拿到旧的 gatewayPeriod（之前切"本月"显示的还是今日数据）
  const loadGatewayStats = async (p = gatewayPeriod) => {
    try {
      const res = await fetch(API + "/gateway/stats?period=" + p);
      const data = await res.json();
      setGatewayStats(data);
    } catch (e) {}
    try {
      const r2 = await fetch(API + "/gateway/logs?limit=30");
      const d2 = await r2.json();
      setGatewayLogs(d2.logs || []);
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
    if (msg.msg_type !== "image") { const p = parseQuote(msg.content); return { text: p.text, img: null, quote: p.quote }; }
    if (msg.imageUrl) return { text: msg.content, img: msg.imageUrl, quote: null };
    try { const d = JSON.parse(msg.content); const p = parseQuote(d.text); return { text: p.text, img: `data:${d.media_type};base64,${d.data}`, quote: p.quote }; } catch (e) { return { text: msg.content, img: null, quote: null }; }
  };

  const chatAbortRef = useRef(null);

  const streamChat = async (sessionId, content, tempAiMsgId, image = null) => {
    try {
      // 中断上一次未完成的流
      if (chatAbortRef.current) { chatAbortRef.current.abort(); chatAbortRef.current = null; }
      const ctrl = new AbortController(); chatAbortRef.current = ctrl;
      const res = await fetch(API + "/chat/stream", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sessionId, content, image }), signal: ctrl.signal });
      if (!res.ok) { const e = await res.json(); setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: "出错了: " + (e.error || res.statusText) } : m)); return; }
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = "", fullText = "", fullThinking = "", toolLog = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop();
        for (const line of lines) { if (!line.startsWith("data: ")) continue; try { const ev = JSON.parse(line.slice(6)); if (ev.type === "text") { fullText += ev.text; const t = fullText; setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: t } : m)); } else if (ev.type === "thinking") { fullThinking += ev.text; const th = fullThinking; setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, reasoning_content: th } : m)); } else if (ev.type === "tool_use") { toolLog += (toolLog ? "\n" : "") + `→ 调用 ${ev.name} ${JSON.stringify(ev.input)}`; const tl = toolLog; setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, tool_log: tl } : m)); } else if (ev.type === "tool_result") { toolLog += `\n✓ 返回: ${ev.output}`; const tl = toolLog; setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, tool_log: tl } : m)); } else if (ev.type === "usage") { const u = ev.usage; setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, usage: u } : m)); } else if (ev.type === "error") { setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: "出错了: " + ev.text } : m)); } } catch (e) {} } }
      // 流程结束但没有文本回复——如果有 thinking 或工具调用，不覆盖为"空回复"，让三点动画继续显示
      if (!fullText && !fullThinking && !toolLog) setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: "（空回复）" } : m));
    } catch (err) { if (err.name !== "AbortError") setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: "网络错误: " + err.message } : m)); }
    chatAbortRef.current = null;
  };

  const handleSend = async () => {
    if ((!input.trim() && !pendingImage) || loading) return;
    let sid = activeSessionId;
    if (!sid) { try { const res = await fetch(API + "/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "新对话" }) }); const s = await res.json(); setSessions(prev => [s, ...prev]); setActiveSessionId(s.id); sid = s.id; } catch (err) { return; } }
    const image = pendingImage;
    const content = pendingQuote ? `${input}\n\n〔引用·${pendingQuote.from}〕${pendingQuote.text}` : input;
    setInput(""); setPendingImage(null); setPendingQuote(null);
    const uMsg = { id: Date.now(), role: "user", content, created_at: new Date().toISOString(), ...(image ? { msg_type: "image", imageUrl: image.dataUrl } : {}) };
    const aMsg = { id: Date.now() + 1, role: "assistant", content: "", created_at: new Date().toISOString() };
    setMessages(prev => [...prev, uMsg, aMsg]);
    if (!previews[sid]) { const pv = input || "[图片]"; setPreviews(prev => ({ ...prev, [sid]: pv.substring(0, 30) + (pv.length > 30 ? "..." : "") })); }
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
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  // 时间分隔标签：当天只显示时刻，昨天/更早自动带上日期，跨年带年份
  const formatTime = (d) => {
    if (!d) return ""; const t = parseTime(d); if (isNaN(t)) return "";
    const hm = t.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    const now = new Date();
    if (sameDay(t, now)) return hm;
    const yest = new Date(now); yest.setDate(now.getDate() - 1);
    if (sameDay(t, yest)) return `昨天 ${hm}`;
    if (t.getFullYear() === now.getFullYear()) return `${t.getMonth() + 1}月${t.getDate()}日 ${hm}`;
    return `${t.getFullYear()}年${t.getMonth() + 1}月${t.getDate()}日 ${hm}`;
  };
  const formatFullTime = (d) => { if (!d) return ""; const t = parseTime(d); return isNaN(t) ? "" : t.toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }); };
  const formatDate = (d) => { if (!d) return ""; return d.split(" ")[0] || d.split("T")[0] || ""; };
  const ifs = { width: "100%", border: `1px solid ${COLORS.inputBorder}`, borderRadius: 12, padding: "8px 12px", fontSize: 14, outline: "none", background: COLORS.bg, color: COLORS.text, boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: (wallpaper && currentPage === "chat") ? `${COLORS.bg} url(${wallpaper}) center/cover no-repeat fixed` : (theme === "custom" ? COLORS._solidBg : COLORS.bg), fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: COLORS.text, overflow: "hidden", overscrollBehavior: "none", overscrollBehaviorX: "none", touchAction: "none" }}>
      {(sidebarOpen || dragOffset > 0) && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: `rgba(0,0,0,${(sidebarOpen ? 280 : dragOffset) / 280 * 0.25})`, zIndex: 999, transition: dragOffset > 0 ? "none" : "background 0.25s ease" }} />}
      <div style={{ position: "fixed", top: 0, left: 0, height: "100vh", width: 280, zIndex: 1000, borderRight: `1px solid ${COLORS.sidebarBorder}`, display: "flex", flexDirection: "column", transform: dragOffset > 0 ? `translateX(${dragOffset - 280}px)` : sidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: dragOffset > 0 ? "none" : "transform 0.25s ease", borderRadius: "0 16px 16px 0", boxShadow: (sidebarOpen || dragOffset > 0) ? "4px 0 24px rgba(0,0,0,0.08)" : "none", ...glassify(COLORS.sidebar) }}>
        <div style={{ padding: "58px 20px 20px" }}><div style={{ fontSize: 24, fontWeight: 400, color: COLORS.text, fontFamily: "'Snell Roundhand', 'Savoye LET', 'Brush Script MT', 'Segoe Script', 'Lucida Handwriting', cursive", fontStyle: "italic" }}>Plutocael</div></div>
        <div style={{ padding: "0 12px 16px" }}>
          <button onClick={() => { setShowSettings(false); setCurrentPage("chat"); setSidebarOpen(false); }} className={!showSettings && currentPage === "chat" ? "ghost" : "flat ghost"} style={{ width: "100%", padding: "10px 16px", border: "none", borderRadius: 12, cursor: "pointer", background: !showSettings && currentPage === "chat" ? COLORS.sidebarActive : "transparent", color: !showSettings && currentPage === "chat" ? COLORS.sidebarActiveText : COLORS.text, display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}><ChatIcon /> 聊天</button>
          <button onClick={() => { setShowSettings(false); setCurrentPage("obmem"); setSidebarOpen(false); }} className={!showSettings && currentPage === "obmem" ? "ghost" : "flat ghost"} style={{ width: "100%", padding: "10px 16px", border: "none", borderRadius: 12, cursor: "pointer", marginTop: 2, background: !showSettings && currentPage === "obmem" ? COLORS.sidebarActive : "transparent", color: !showSettings && currentPage === "obmem" ? COLORS.sidebarActiveText : COLORS.text, display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}><Icon size={18}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></Icon> 记忆库</button>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 12px)` }}>
          <div style={{ padding: "4px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <button className="flat ghost" onClick={() => openSettingsPage("")} title="设置" style={{ width: 45, height: 45, borderRadius: "50%", border: "none", background: "transparent", color: (showSettings ? COLORS.accent : COLORS.textSecondary), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={22}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></Icon></button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, width: "100%" }}>
        {currentPage === "mcp" ? (<>
          {caelHeader()}
          <McpManager />
        </>) : currentPage === "obmem" ? (<>
          {caelHeader()}
          <OmbreMemories api={API} colors={COLORS} dark={barDark} />
        </>) : (<>
          {caelHeader(<button className="flat ghost" onClick={() => setShowChatMenu(true)} title="更多" style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: "transparent", color: COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={20}><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" /></Icon></button>)}
          {(() => {
            const inputBar = (
              <div style={{ maxWidth: 768, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
                {pendingQuote && <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 10, background: (theme === "dark" || (theme === "custom" && customTheme.dark)) ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)", fontSize: 13, color: COLORS.textSecondary }}>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pendingQuote.from}：{pendingQuote.text}</span>
                  <button className="flat" onClick={() => setPendingQuote(null)} style={{ width: 20, height: 20, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.30)", color: "#fff", cursor: "pointer", fontSize: 11, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}>✕</button>
                </div>}
                {pendingImage && <div style={{ marginBottom: 8, position: "relative", display: "inline-block" }}>
                  <img src={pendingImage.dataUrl} style={{ height: 72, borderRadius: 10, display: "block", border: `1px solid ${COLORS.divider}` }} />
                  <button onClick={() => setPendingImage(null)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.65)", color: "#fff", cursor: "pointer", fontSize: 11, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                  {/* accept 不含图片类型 → iOS 直达文件App；纯 image/* → 直达照片图库；带 capture → 直达相机 */}
                  <input ref={fileInputRef} type="file" accept=".json,.md,.markdown,.csv,.log,.yaml,.yml,.js,.jsx,.ts,.tsx,.py,.html,.css,.xml,.txt,text/plain,text/markdown,application/json" style={{ display: "none" }} onChange={handlePickImage} />
                  <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePickImage} />
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePickImage} />
                  <button onClick={() => setShowPlusPanel(v => !v)} title="更多" style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: COLORS.cardBg, color: COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transform: showPlusPanel ? "rotate(45deg)" : "none", transition: "transform 0.2s ease", ...skRaised }}><Icon size={21}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Icon></button>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", borderRadius: 20, background: (theme === "dark" || (theme === "custom" && customTheme.dark)) ? "rgba(48,48,46,0.85)" : "rgba(255,255,255,0.75)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", padding: "2px 14px", minHeight: 40, maxHeight: 300, boxSizing: "border-box", ...skInset }}>
                    <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} rows={1} style={{ flex: 1, border: "none", outline: "none", resize: "none", fontSize: 15, lineHeight: 1.5, padding: "6px 0", background: "transparent", color: COLORS.text, fontFamily: "inherit", alignSelf: "center" }} />
                  </div>
                  <button onClick={handleSend} disabled={(!input.trim() && !pendingImage) || loading} style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: (input.trim() || pendingImage) && !loading ? COLORS.accent : COLORS.accentLight, color: (input.trim() || pendingImage) && !loading ? "#fff" : COLORS.placeholder, cursor: (input.trim() || pendingImage) && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, ...skRaised }}><Icon size={19}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></Icon></button>
                </div>
                <div style={{ overflow: "hidden", maxHeight: showPlusPanel ? 140 : 0, opacity: showPlusPanel ? 1 : 0, transform: showPlusPanel ? "translateY(0)" : "translateY(14px)", transition: "max-height 0.45s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.35s ease, transform 0.45s cubic-bezier(0.32, 0.72, 0, 1)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, padding: "18px 6px 8px" }}>
                  {[
                    { l: "照片", ref: photoInputRef, icon: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></> },
                    { l: "拍摄", ref: cameraInputRef, icon: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></> },
                    { l: "文件", ref: fileInputRef, icon: <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></> },
                  ].map(it => (
                    <button key={it.l} className="flat ghost" onClick={() => { setShowPlusPanel(false); it.ref.current && it.ref.current.click(); }} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 0, fontFamily: "inherit" }}>
                      <span style={{ width: 58, height: 58, borderRadius: 16, background: COLORS.cardBg, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.text, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}><Icon size={26}>{it.icon}</Icon></span>
                      <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{it.l}</span>
                    </button>
                  ))}
                </div>
                </div>
              </div>
            );
            return <>
          <div className="msg-scroll" style={{ flex: 1, padding: "24px 0", overflowX: "hidden", overscrollBehaviorY: "contain", overscrollBehaviorX: "none", touchAction: "pan-y", scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <div style={{ maxWidth: 768, width: "100%", margin: "0 auto", padding: "0 12px", boxSizing: "border-box", overflowX: "hidden" }}>
              {messages.map((msg, i) => {
                const showTime = i === 0 || (messages[i-1] && msg.created_at && messages[i-1].created_at && (parseTime(msg.created_at).getTime() - parseTime(messages[i-1].created_at).getTime() > 300000 || !sameDay(parseTime(msg.created_at), parseTime(messages[i-1].created_at))));
                const isUser = msg.role === "user";
                const view = getMsgView(msg);
                return (<div key={msg.id}>
                  {showTime && msg.created_at && <div style={{ textAlign: "center", fontSize: 12, color: COLORS.placeholder, margin: "16px 0" }}>{formatTime(msg.created_at)}</div>}
                  <div className={isUser ? "msg-user" : "msg-ai"} style={{ marginBottom: 20, maxWidth: "84%", width: "fit-content", animation: `msgSlideIn 0.35s cubic-bezier(0.32, 0.72, 0, 1)` }}>
                    {editingMsgId !== msg.id && !isUser && (() => {
                      // 标题自适应：只有思考=thinking，只有工具=工具调用，都有=steps
                      const hasThink = !!msg.reasoning_content;
                      const hasTools = filterToolLines(msg.tool_log).length > 0;
                      if (!hasThink && !hasTools) return null;
                      const label = hasThink && hasTools ? "steps" : hasThink ? "thinking" : "工具调用";
                      return <button className="flat ghost" onClick={() => openThinkingSheet(msg.id)} style={{ margin: "0 4px 7px 48px", padding: "5px 4px", borderRadius: 14, border: "none", background: "transparent", color: COLORS.textSecondary, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", fontFamily: "inherit" }}>{label}<span style={{ marginLeft: "8ch", display: "flex", alignItems: "center" }}><Icon size={13}><polyline points="9 18 15 12 9 6" /></Icon></span></button>;
                    })()}
                    <div style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, overflow: "hidden", background: COLORS.accentLight, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.10)" }}>
                      {(isUser ? avatarUser : avatarAi)
                        ? <img src={isUser ? avatarUser : avatarAi} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        : <span style={{ fontFamily: "'Snell Roundhand', 'Brush Script MT', cursive", fontStyle: "italic", fontSize: 18, color: COLORS.accent }}>{isUser ? "J" : "C"}</span>}
                    </div>
                    <div style={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
                    {editingMsgId === msg.id ? (
                      <div style={{ width: "100%" }}>
                        <textarea value={editingMsgContent || msg.content} onChange={e => setEditingMsgContent(e.target.value)} onFocus={() => { if (!editingMsgContent) setEditingMsgContent(msg.content); }} rows={3} style={{ width: "100%", border: `1px solid ${COLORS.accent}`, borderRadius: 12, padding: "10px 12px", fontSize: 15, lineHeight: 1.7, outline: "none", background: COLORS.input, color: COLORS.text, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                        <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                          <button onClick={() => { setEditingMsgId(null); setEditingMsgContent(""); }} style={{ padding: "6px 16px", borderRadius: 20, border: `1px solid ${COLORS.inputBorder}`, background: "transparent", cursor: "pointer", fontSize: 13, color: COLORS.textSecondary }}>取消</button>
                          <button onClick={() => handleEditSend(msg)} style={{ padding: "6px 16px", borderRadius: 20, border: "none", background: COLORS.accent, color: "#fff", cursor: "pointer", fontSize: 13 }}>发送</button>
                        </div>
                      </div>
                    ) : (<>
                      {(() => {
                        const bs = bubbleStyle(isUser);
                        return <div style={{ position: "relative", maxWidth: "100%", width: "fit-content" }}>
                          <div
                            onContextMenu={e => { e.preventDefault(); openBubbleMenu(msg, isUser, view.text, e.currentTarget.getBoundingClientRect()); }}
                            onTouchStart={e => { const r = e.currentTarget.getBoundingClientRect(); cancelLongPress(); lpTimer.current = setTimeout(() => openBubbleMenu(msg, isUser, view.text, r), 450); }}
                            onTouchMove={cancelLongPress} onTouchEnd={cancelLongPress} onTouchCancel={cancelLongPress}
                            style={{ padding: "4px 14px", borderRadius: 27, color: COLORS.text, fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "break-word", WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none", overflow: "hidden", isolation: "isolate", WebkitMaskImage: "-webkit-radial-gradient(white, black)", ...bs }}>
                            {view.img && <img src={view.img} style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 14, display: "block", marginBottom: view.text ? 8 : 0 }} />}
                            {(!view.text && !isUser) ? <span className="dot-typing"><span></span><span></span><span></span></span> : view.text}
                          </div>
                        </div>;
                      })()}
                      {view.quote && <div style={{ marginTop: 5, marginLeft: isUser ? "auto" : 0, width: "fit-content", maxWidth: "100%", padding: "6px 11px", borderRadius: 9, background: (theme === "dark" || (theme === "custom" && customTheme.dark)) ? "rgba(255,255,255,0.10)" : (wallpaper ? "rgba(238,238,236,0.85)" : "rgba(0,0,0,0.06)"), ...(wallpaper ? { backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" } : {}), color: COLORS.textSecondary, fontSize: 13, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflowWrap: "anywhere", boxSizing: "border-box" }}>{view.quote.from}：{view.quote.text}</div>}
                      <div style={{ display: "flex", marginTop: 4, alignItems: "center", justifyContent: isUser ? "flex-end" : "space-between", gap: 8 }}>
                        {!isUser && (() => {
                          let u = null; try { u = msg.usage ? (typeof msg.usage === "string" ? JSON.parse(msg.usage) : msg.usage) : null; } catch (e) {}
                          if (!u || (!u.in && !u.out)) return <span />;
                          return <span style={{ fontSize: 10.5, color: COLORS.placeholder, opacity: 0.75, padding: "0 6px", whiteSpace: "nowrap" }} title={`输入 ${u.in} · 输出 ${u.out}${u.cr ? ` · 缓存命中 ${u.cr}` : ""}${u.cw ? ` · 缓存写入 ${u.cw}` : ""}`}>↑{u.in} ↓{u.out}{u.cr ? ` ⚡${u.cr}` : ""}</span>;
                        })()}
                        {msg.created_at && <span style={{ fontSize: 11, color: COLORS.placeholder, opacity: 0.8, padding: "0 6px" }}>{formatFullTime(msg.created_at)}</span>}
                      </div>
                    </>)}
                    </div>
                    </div>
                  </div>
                </div>);
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div style={{ padding: "8px 18px calc(8px + env(safe-area-inset-bottom, 0px))", ...barBg, borderTop: `1px solid ${COLORS.divider}` }}>
            {inputBar}
          </div>
            </>;
          })()}
        </>)}
      </div>


      {thinkingSheet != null && (() => {
        const tMsg = messages.find(m => m.id === thinkingSheet);
        const tKinds = new Set(buildSteps(tMsg).map(s => s.kind));
        const sheetTitle = tKinds.size > 1 ? "Steps" : tKinds.has("thinking") ? "Thinking" : "工具调用";
        return <div onClick={() => setThinkingSheet(null)} style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.35)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: barDark ? "rgba(40,40,38,0.78)" : "rgba(255,255,255,0.72)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", border: `1px solid ${frostBorder}`, borderBottom: "none", borderRadius: "22px 22px 0 0", height: sheetH, margin: "0 4px", display: "flex", flexDirection: "column", animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)", boxShadow: "0 -8px 32px rgba(0,0,0,0.20)" }}>
            <div style={{ flexShrink: 0, touchAction: "none", cursor: "grab" }}
              onPointerDown={e => { sheetDrag.current = { y: e.clientY, h: sheetH }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {} }}
              onPointerMove={e => { if (!sheetDrag.current) return; setSheetH(Math.min(window.innerHeight - 20, Math.max(180, sheetDrag.current.h + (sheetDrag.current.y - e.clientY)))); }}
              onPointerUp={() => { sheetDrag.current = null; }} onPointerCancel={() => { sheetDrag.current = null; }}>
              <div style={{ width: 40, height: 5, borderRadius: 3, background: COLORS.divider, margin: "10px auto 0" }} />
              <div style={{ display: "flex", alignItems: "center", padding: "10px 20px 6px" }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{sheetTitle}</div>
                <span style={{ flex: 1 }} />
                <button className="flat" onClick={() => setThinkingSheet(null)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.07)", color: COLORS.textSecondary, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>✕</button>
              </div>
            </div>
            <div className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehaviorY: "contain", touchAction: "pan-y", padding: "2px 20px calc(24px + env(safe-area-inset-bottom, 0px))" }}>
              {(() => {
                const steps = buildSteps(tMsg);
                if (steps.length === 0) return <div style={{ fontSize: 13, color: COLORS.placeholder, padding: "16px 0" }}>（暂无过程）</div>;
                return steps.map(st => {
                  const opened = !!openSteps[st.key];
                  return <div key={st.key} style={{ borderBottom: `1px solid ${COLORS.divider}` }}>
                    <button className="flat ghost" onClick={() => setOpenSteps(prev => ({ ...prev, [st.key]: !prev[st.key] }))} style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "13px 2px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit" }}>
                      <span style={{ color: COLORS.textSecondary, display: "flex", flexShrink: 0 }}>
                        {st.kind === "thinking"
                          ? <Icon size={16}><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z" /></Icon>
                          : <Icon size={16}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></Icon>}
                      </span>
                      <span style={{ fontSize: 14.5, color: COLORS.text, flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{st.title}</span>
                      <span style={{ color: COLORS.placeholder, display: "flex", flexShrink: 0 }}><Icon size={14}>{opened ? <polyline points="6 9 12 15 18 9" /> : <polyline points="9 18 15 12 9 6" />}</Icon></span>
                    </button>
                    {opened && <div style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.7, color: COLORS.textSecondary, padding: "0 2px 14px 34px", overflowWrap: "anywhere" }}>{st.content || "（空）"}</div>}
                  </div>;
                });
              })()}
            </div>
          </div>
        </div>;
      })()}
      {bubbleMenu && (() => {
        // 微信式长按菜单：气泡上方深色面板，图标+文字横排，带指向气泡的小箭头
        const items = [
          { label: "复制", icon: <Icon size={20}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Icon>, onClick: () => { navigator.clipboard.writeText(bubbleMenu.text); setBubbleMenu(null); } },
          { label: "引用", icon: <Icon size={20}><path d="M10 11H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6c0 2-1 3.5-3 4" /><path d="M20 11h-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6c0 2-1 3.5-3 4" /></Icon>, onClick: () => handleQuote(bubbleMenu.text, bubbleMenu.isUser) },
        ];
        if (bubbleMenu.isUser) items.unshift(
          { label: "撤回", icon: <Icon size={20}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></Icon>, onClick: () => handleWithdraw(bubbleMenu.id) },
        );
        const itemW = 60, panelW = items.length * itemW + 16, panelH = 64;
        const vw = window.innerWidth;
        const left = Math.max(8, Math.min(bubbleMenu.rect.cx - panelW / 2, vw - panelW - 8));
        const above = bubbleMenu.rect.top - panelH - 12 > 8;
        const top = above ? bubbleMenu.rect.top - panelH - 10 : bubbleMenu.rect.bottom + 10;
        const arrowX = Math.max(18, Math.min(bubbleMenu.rect.cx - left, panelW - 18));
        const panelBg = "rgba(64,64,64,0.97)";
        return <div onClick={() => setBubbleMenu(null)} onContextMenu={e => { e.preventDefault(); setBubbleMenu(null); }} style={{ position: "fixed", inset: 0, zIndex: 600, WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", left, top, width: panelW, height: panelH, background: panelBg, borderRadius: 14, padding: "8px", boxSizing: "border-box", display: "flex", alignItems: "center", boxShadow: "0 10px 32px rgba(0,0,0,0.32), 0 3px 10px rgba(0,0,0,0.2)", animation: "msgSlideIn 0.18s ease" }}>
            {items.map(it => <button key={it.label} className="flat" onClick={it.onClick} style={{ flex: 1, border: "none", background: "transparent", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: 0, fontSize: 12, fontFamily: "inherit", lineHeight: 1 }}>{it.icon}<span>{it.label}</span></button>)}
            <span style={{ position: "absolute", left: arrowX - 7, width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", ...(above ? { bottom: -7, borderTop: `8px solid ${panelBg}` } : { top: -7, borderBottom: `8px solid ${panelBg}` }) }} />
          </div>
        </div>;
      })()}
      {showStaging && <div style={{ position: "fixed", inset: 0, zIndex: 570, display: "flex", flexDirection: "column", background: theme === "custom" ? COLORS._solidBg : COLORS.bg, paddingTop: "calc(10px + env(safe-area-inset-top, 0px))" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "2px 14px 6px", flexShrink: 0 }}>
          <button className="flat ghost" onClick={() => setShowStaging(false)} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "transparent", color: COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={19}><polyline points="15 18 9 12 15 6" /></Icon></button>
          <span style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 600, color: COLORS.text }}>审阅导入（{stagingItems.length} 条）</span>
          <button className="flat ghost" onClick={discardStaging} style={{ border: "none", background: "transparent", color: COLORS.danger, cursor: "pointer", fontSize: 13, padding: "6px 8px", fontFamily: "inherit" }}>放弃</button>
        </div>
        <div style={{ fontSize: 12, color: COLORS.placeholder, textAlign: "center", paddingBottom: 8, flexShrink: 0 }}>点消息可编辑，点角色标签可切换用户/Cael，✕ 删除</div>
        <div className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehaviorY: "contain", touchAction: "pan-y", padding: "0 14px 12px" }}>
          {stagingItems.length === 0 ? <div style={{ textAlign: "center", padding: "30px 0", fontSize: 13, color: COLORS.placeholder }}>暂存区空了</div> : stagingItems.map(m => (
            <div key={m.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <button className="flat ghost" onClick={() => toggleStageRole(m)} style={{ flexShrink: 0, marginTop: 2, padding: "3px 9px", borderRadius: 10, border: "none", background: m.role === "user" ? COLORS.accentLight : (theme === "dark" || (theme === "custom" && customTheme.dark) ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"), color: m.role === "user" ? COLORS.accent : COLORS.textSecondary, fontSize: 11, cursor: "pointer", fontFamily: "inherit", width: 44, textAlign: "center" }}>{m.role === "user" ? "我" : "Cael"}</button>
              <div style={{ flex: 1, minWidth: 0 }}>
                {editStageId === m.id ? (
                  <div>
                    <textarea value={editStageText} onChange={e => setEditStageText(e.target.value)} rows={3} autoFocus style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${COLORS.accent}`, borderRadius: 10, padding: "8px 10px", fontSize: 13.5, lineHeight: 1.6, outline: "none", background: COLORS.input, color: COLORS.text, fontFamily: "inherit", resize: "vertical" }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 6, justifyContent: "flex-end" }}>
                      <button className="ghost" onClick={() => { setEditStageId(null); setEditStageText(""); }} style={{ padding: "5px 14px", borderRadius: 14, border: `1px solid ${COLORS.divider}`, background: "transparent", color: COLORS.textSecondary, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>取消</button>
                      <button className="ghost" onClick={() => saveStageEdit(m.id)} style={{ padding: "5px 14px", borderRadius: 14, border: "none", background: COLORS.accent, color: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>保存</button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => { setEditStageId(m.id); setEditStageText(m.content); }} style={{ padding: "9px 12px", borderRadius: 12, background: COLORS.cardBg, cursor: "text", fontSize: 13.5, lineHeight: 1.6, color: COLORS.text, whiteSpace: "pre-wrap", overflowWrap: "anywhere", ...skCard }}>{m.content}</div>
                )}
              </div>
              <button className="flat ghost" onClick={() => delStageItem(m.id)} style={{ flexShrink: 0, marginTop: 4, width: 24, height: 24, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.06)", color: COLORS.danger, cursor: "pointer", fontSize: 12, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 16px calc(14px + env(safe-area-inset-bottom, 0px))", flexShrink: 0, borderTop: `1px solid ${COLORS.divider}`, display: "flex", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="ghost" onClick={() => exportStaging("json")} style={{ padding: "12px 14px", border: `1px solid ${COLORS.divider}`, borderRadius: 14, background: "transparent", color: COLORS.text, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>备份.json</button>
            <button className="ghost" onClick={() => exportStaging("md")} style={{ padding: "12px 14px", border: `1px solid ${COLORS.divider}`, borderRadius: 14, background: "transparent", color: COLORS.text, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>.md</button>
          </div>
          <button className="ghost" disabled={stagingItems.length === 0} onClick={commitStaging} style={{ flex: 1, padding: "12px", border: "none", borderRadius: 14, background: stagingItems.length ? COLORS.accent : COLORS.divider, color: stagingItems.length ? "#fff" : COLORS.placeholder, cursor: stagingItems.length ? "pointer" : "default", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>上传到当前对话</button>
        </div>
      </div>}
      {showChatMenu && <div onClick={() => setShowChatMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 540 }}>
        <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 52px)", right: 12, background: COLORS.cardBg, borderRadius: 14, boxShadow: "0 8px 28px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)", padding: 5, minWidth: 176 }}>
          <button className="flat ghost" onClick={() => { setShowChatMenu(false); setShowChatSearch(true); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", border: "none", background: "transparent", color: COLORS.text, cursor: "pointer", fontSize: 14, fontFamily: "inherit", borderRadius: 10, textAlign: "left" }}><Icon size={17}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon>搜索聊天记录</button>
          <button className="flat ghost" onClick={() => { setShowChatMenu(false); openDeleteCalendar(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", border: "none", background: "transparent", color: COLORS.text, cursor: "pointer", fontSize: 14, fontFamily: "inherit", borderRadius: 10, textAlign: "left" }}><Icon size={17}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></Icon>按日期删除</button>
          <button className="flat ghost" onClick={() => { setShowChatMenu(false); clearChat(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", border: "none", background: "transparent", color: COLORS.danger, cursor: "pointer", fontSize: 14, fontFamily: "inherit", borderRadius: 10, textAlign: "left" }}><Icon size={17}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Icon>清空对话</button>
        </div>
      </div>}
      {showDelCalendar && <div style={{ position: "fixed", inset: 0, zIndex: 560, display: "flex", flexDirection: "column", background: theme === "custom" ? COLORS._solidBg : COLORS.bg, paddingTop: "calc(10px + env(safe-area-inset-top, 0px))" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "2px 14px 4px", flexShrink: 0 }}>
          <button className="flat ghost" onClick={() => setShowDelCalendar(false)} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "transparent", color: COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={19}><polyline points="15 18 9 12 15 6" /></Icon></button>
          <span style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 600, color: COLORS.text }}>按日期删除</span>
          <span style={{ width: 36 }} />
        </div>
        <div style={{ fontSize: 12, color: COLORS.placeholder, textAlign: "center", paddingBottom: 4, flexShrink: 0 }}>点选要删除的日子（可多选），黑字的才有记录</div>
        <div ref={calScrollRef} className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehaviorY: "contain", touchAction: "pan-y", padding: "0 16px 10px" }}>
          {renderCalendarBody(key => setDelSelected(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; }), delSelected)}
        </div>
        <div style={{ padding: "10px 16px calc(14px + env(safe-area-inset-bottom, 0px))", flexShrink: 0, borderTop: `1px solid ${COLORS.divider}` }}>
          <button className="ghost" disabled={delSelected.size === 0} onClick={doDeleteDates} style={{ width: "100%", padding: "12px", border: "none", borderRadius: 14, background: delSelected.size ? COLORS.danger : COLORS.divider, color: delSelected.size ? "#fff" : COLORS.placeholder, cursor: delSelected.size ? "pointer" : "default", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>{delSelected.size ? `删除选中的 ${delSelected.size} 天` : "还没有选中日期"}</button>
        </div>
      </div>}
      {showChatSearch && <div style={{ position: "fixed", inset: 0, zIndex: 550, display: "flex", flexDirection: "column", background: theme === "custom" ? COLORS._solidBg : COLORS.bg, paddingTop: "calc(10px + env(safe-area-inset-top, 0px))" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 14px 10px", flexShrink: 0 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: COLORS.cardBg, borderRadius: 10, padding: "9px 12px", ...skInset }}>
            <span style={{ color: COLORS.placeholder, display: "flex", flexShrink: 0 }}><Icon size={16}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon></span>
            <input autoFocus value={chatSearchQ} onChange={e => setChatSearchQ(e.target.value)} placeholder="搜索" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 15, color: COLORS.text, fontFamily: "inherit" }} />
            {chatSearchQ && <button className="flat ghost" onClick={() => setChatSearchQ("")} style={{ width: 18, height: 18, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.25)", color: "#fff", cursor: "pointer", fontSize: 10, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>✕</button>}
          </div>
          <button className="flat ghost" onClick={closeChatSearch} style={{ border: "none", background: "transparent", color: COLORS.accent, cursor: "pointer", fontSize: 15, padding: "6px 10px", fontFamily: "inherit", flexShrink: 0 }}>取消</button>
        </div>
        {(chatSearchType || chatSearchDate) && !showCalendar && <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "0 16px 10px", flexShrink: 0 }}>
          {chatSearchType && <span style={{ fontSize: 12, color: "#fff", background: COLORS.accent, padding: "3px 12px", borderRadius: 12 }}>{chatSearchType === "image" ? "图片" : "链接"}</span>}
          {chatSearchDate && <span style={{ fontSize: 12, color: "#fff", background: COLORS.accent, padding: "3px 12px", borderRadius: 12 }}>{chatSearchDate}</span>}
          <button className="flat ghost" onClick={() => { setChatSearchType(""); setChatSearchDate(""); }} style={{ border: "none", background: "transparent", color: COLORS.textSecondary, cursor: "pointer", fontSize: 12, padding: "3px 6px", fontFamily: "inherit" }}>清除筛选</button>
        </div>}
        {showCalendar ? (
          <div ref={calScrollRef} className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehaviorY: "contain", touchAction: "pan-y", padding: "0 16px calc(24px + env(safe-area-inset-bottom, 0px))" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "2px 0 4px", position: "sticky", top: 0, background: theme === "custom" ? COLORS._solidBg : COLORS.bg, zIndex: 2 }}>
              <button className="flat ghost" onClick={() => setShowCalendar(false)} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "transparent", color: COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={19}><polyline points="15 18 9 12 15 6" /></Icon></button>
              <span style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 600, color: COLORS.text }}>按日期查找</span>
              <span style={{ width: 36 }} />
            </div>
            {renderCalendarBody(key => { setChatSearchDate(key); setShowCalendar(false); }, null)}
          </div>
        ) : chatSearchResults === null ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "14vh" }}>
            <div style={{ fontSize: 14, color: COLORS.placeholder, marginBottom: 30 }}>快速搜索聊天内容</div>
            <div style={{ display: "flex", alignItems: "center" }}>
              {[{ k: "date", l: "日期" }, { k: "image", l: "图片" }, { k: "link", l: "链接" }].map((c, i) => (<span key={c.k} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && <span style={{ width: 1, height: 17, background: COLORS.divider, margin: "0 26px" }} />}
                <button className="flat ghost" onClick={() => { if (c.k === "date") openCalendar(); else setChatSearchType(c.k); }} style={{ border: "none", background: "transparent", color: COLORS.accent, cursor: "pointer", fontSize: 16, padding: "4px 2px", fontFamily: "inherit" }}>{c.l}</button>
              </span>))}
            </div>
          </div>
        ) : (
          <div className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehaviorY: "contain", touchAction: "pan-y", padding: "0 14px calc(20px + env(safe-area-inset-bottom, 0px))" }}>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, padding: "2px 4px 8px" }}>搜到 {chatSearchResults.length} 条{chatSearchResults.length >= 100 ? "（只显示最近100条）" : ""}</div>
            {chatSearchResults.length === 0 ? <div style={{ padding: "20px 4px", fontSize: 13, color: COLORS.placeholder, textAlign: "center" }}>没有找到相关消息</div> : chatSearchResults.map(r => (
              <div key={r.id} onClick={() => jumpToMsg(r)} style={{ padding: "10px 13px", borderRadius: 12, cursor: "pointer", background: COLORS.cardBg, marginBottom: 8, ...skCard }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: COLORS.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{r.session_name || "对话" + r.session_id}</span>
                  <span style={{ fontSize: 11, color: COLORS.placeholder, flexShrink: 0 }}>{formatTime(r.created_at)}</span>
                </div>
                <div style={{ fontSize: 13.5, color: COLORS.text, lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflowWrap: "anywhere" }}>{r.msg_type === "image" ? "🖼 [图片消息]" : r.snippet}</div>
              </div>
            ))}
          </div>
        )}
      </div>}
      {showSettings && settingsData && <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", flexDirection: "column", background: theme === "custom" ? COLORS._solidBg : COLORS.bg, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div style={{ width: "100%", maxWidth: 680, margin: "0 auto", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "calc(8px + env(safe-area-inset-top, 0px)) 14px 2px", display: "flex", alignItems: "center", gap: 4, flexShrink: 0, position: "relative", zIndex: 5, background: theme === "custom" ? COLORS._solidBg : COLORS.bg }}>
            <button className="flat ghost" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: "transparent", color: COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MenuIcon /></button>
            {settingsSection !== "" && <button className="flat ghost" onClick={() => setSettingsSection("")} title="返回设置" style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: "transparent", color: COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={20}><polyline points="15 18 9 12 15 6" /></Icon></button>}
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 13, color: COLORS.textSecondary, flexShrink: 0 }}>{({ "": "设置", appearance: "外观", avatar: "头像", api: "API 连接", behavior: "对话行为与模型参数", mcp: "MCP 链接", chatmgmt: "聊天记录管理", memoryopts: "记忆", usage: "用量统计" })[settingsSection] || "设置"}</span>
          </div>
          {settingsSection === "mcp" ? <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}><McpManager /></div> : <div className="panel-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", overscrollBehaviorY: "contain", touchAction: "pan-y" }}>
            {settingsSection === "usage" && <>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>{["today","month"].map(p => <button key={p} onClick={() => { setGatewayPeriod(p); loadGatewayStats(p); }} style={{ padding:"4px 12px", borderRadius:16, border:gatewayPeriod===p?"none":`1px solid ${COLORS.divider}`, background:gatewayPeriod===p?COLORS.accent:"transparent", color:gatewayPeriod===p?"#fff":COLORS.textSecondary, fontSize:12, cursor:"pointer" }}>{p==="today"?"今日":"本月"}</button>)}</div>
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
                {(() => {
                  const s = gatewayStats.summary || {};
                  const read = s.total_cache_read || 0, write = s.total_cache_write || 0, fresh = s.total_input || 0;
                  const hitRate = (read + fresh) > 0 ? Math.round(read / (read + fresh) * 100) : 0;
                  return <div style={{ background: COLORS.bg, borderRadius: 16, padding: 16, marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 }}>Prompt 缓存</div>
                    <div style={{ display:"flex", gap: 16, flexWrap:"wrap", marginBottom: 10 }}>
                      <div><div style={{ fontSize: 12, color: COLORS.textSecondary }}>缓存命中读取</div><div style={{ fontSize: 20, fontWeight: 700, color: "#3AAF6B" }}>{read.toLocaleString()}</div></div>
                      <div><div style={{ fontSize: 12, color: COLORS.textSecondary }}>缓存写入</div><div style={{ fontSize: 20, fontWeight: 700 }}>{write.toLocaleString()}</div></div>
                      <div><div style={{ fontSize: 12, color: COLORS.textSecondary }}>命中率</div><div style={{ fontSize: 20, fontWeight: 700, color: hitRate > 50 ? "#3AAF6B" : COLORS.text }}>{hitRate}%</div></div>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, backgroundColor: (theme === "dark" || (theme === "custom" && customTheme.dark)) ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                      <div style={{ width: `${hitRate}%`, height: "100%", background: "#3AAF6B", borderRadius: 4, transition: "width 0.4s ease" }} />
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.placeholder, marginTop: 8 }}>命中缓存的输入按约 1/10 计费；绿色越多越省钱</div>
                  </div>;
                })()}
                {gatewayStats.byModel?.length > 0 && <div style={{ background: COLORS.bg, borderRadius: 16, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 }}>按模型</div>
                  {gatewayStats.byModel.map((m,i) => <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:i<gatewayStats.byModel.length-1?`1px solid ${COLORS.divider}`:"none" }}><span style={{ fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginRight: 8 }}>{m.model}</span><span style={{ fontSize:13, fontWeight:500, flexShrink:0 }}>${(m.cost||0).toFixed(4)}</span></div>)}
                </div>}
                {gatewayLogs.length > 0 && <div style={{ background: COLORS.bg, borderRadius: 16, padding: 16 }}>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 }}>最近调用</div>
                  {gatewayLogs.map((l, i) => {
                    const t = formatFullTime ? formatFullTime(l.created_at) : l.created_at;
                    const shortModel = String(l.model || "").replace(/^\[.*?\]/, "");
                    const isBg = l.session_id === "后台任务";
                    return <div key={l.id} style={{ padding: "7px 0", borderBottom: i < gatewayLogs.length-1 ? `1px solid ${COLORS.divider}` : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: COLORS.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex: 1 }}>{shortModel}</span>
                        {isBg && <span style={{ fontSize: 10, color: COLORS.accent, background: COLORS.accentLight, padding: "1px 6px", borderRadius: 6, flexShrink: 0 }}>后台</span>}
                        <span style={{ fontSize: 11, color: COLORS.placeholder, flexShrink: 0 }}>{t}</span>
                      </div>
                      <div style={{ display: "flex", gap: 10, fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>
                        <span>入 {(l.input_tokens||0).toLocaleString()}</span>
                        <span>出 {(l.output_tokens||0).toLocaleString()}</span>
                        {(l.cache_read_tokens||0) > 0 && <span style={{ color: "#3AAF6B" }}>⚡缓存 {(l.cache_read_tokens).toLocaleString()}</span>}
                        {(l.cache_write_tokens||0) > 0 && <span>写缓存 {(l.cache_write_tokens).toLocaleString()}</span>}
                        <span style={{ marginLeft: "auto" }}>${(l.cost_usd||0).toFixed(5)}</span>
                      </div>
                    </div>;
                  })}
                </div>}
              </>) : <div style={{ textAlign:"center", color:COLORS.placeholder, fontSize:13, padding:"40px 0" }}>加载中...</div>}
            </>}
            {["", "appearance", "avatar", "api", "behavior", "chatmgmt", "memoryopts"].includes(settingsSection) && (() => {
              const secTitle = { fontSize: 12, fontWeight: 600, color: COLORS.placeholder, letterSpacing: "0.05em", padding: "4px 4px 8px", textTransform: "uppercase", display: "none" };
              const listCard = { background: COLORS.bg, borderRadius: 14, overflow: "hidden", marginBottom: 20, ...skCard };
              const row = { padding: "12px 14px", borderBottom: `1px solid ${COLORS.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 };
              const rowLast = { ...row, borderBottom: "none" };
              const rowCol = { padding: "12px 14px", borderBottom: `1px solid ${COLORS.divider}` };
              const lbl = { fontSize: 14, color: COLORS.text };
              const hint = { fontSize: 12, color: COLORS.placeholder, marginTop: 2 };
              const rowInput = { border: "none", outline: "none", background: "transparent", color: COLORS.text, fontSize: 14, textAlign: "right", flex: 1, minWidth: 0, fontFamily: "inherit" };
              const Toggle = ({ on, onChange }) => (
                <button onClick={onChange} style={{ width: 46, height: 28, borderRadius: 14, border: "none", cursor: "pointer", background: on ? COLORS.accent : COLORS.divider, position: "relative", flexShrink: 0, transition: "background 0.2s", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.18)" }}>
                  <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </button>
              );
              return <>
                {settingsSection === "" && (() => {
                  // 设置根菜单：功能 / 通用 两组
                  const MENU = [
                    { group: "通用", items: [
                      { key: "avatar", label: "头像", icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></> },
                      { key: "appearance", label: "外观", icon: <><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996C18.956 15.398 22 12.35 22 8.5 22 4.5 17.5 2 12 2z" /></> },
                    ]},
                    { group: "功能", items: [
                      { key: "api", label: "API 连接", icon: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></> },
                      { key: "mcp", label: "MCP 链接", icon: <><path d="M9 2v6" /><path d="M15 2v6" /><path d="M6 8h12v4a6 6 0 0 1-6 6 6 6 0 0 1-6-6z" /><path d="M12 18v4" /></> },
                      { key: "behavior", label: "对话行为与模型参数", icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> },
                      { key: "chatmgmt", label: "聊天记录管理", icon: <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></> },
                      { key: "memoryopts", label: "记忆", icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></> },
                      { key: "usage", label: "用量统计", icon: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></> },
                    ]},
                  ];
                  return MENU.map(grp => <div key={grp.group}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, padding: "6px 4px 8px" }}>{grp.group}</div>
                    <div style={listCard}>
                      {grp.items.map((it, i) => (
                        <button key={it.key} className="flat ghost" onClick={() => openSettingsPage(it.key)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", border: "none", borderBottom: i < grp.items.length - 1 ? `1px solid ${COLORS.divider}` : "none", background: "transparent", color: COLORS.text, cursor: "pointer", fontSize: 14, fontFamily: "inherit", textAlign: "left" }}>
                          <span style={{ color: COLORS.textSecondary, display: "flex", flexShrink: 0 }}><Icon size={18}>{it.icon}</Icon></span>
                          <span style={{ flex: 1 }}>{it.label}</span>
                          <span style={{ color: COLORS.placeholder, display: "flex", flexShrink: 0 }}><Icon size={15}><polyline points="9 18 15 12 9 6" /></Icon></span>
                        </button>
                      ))}
                    </div>
                  </div>);
                })()}

                {settingsSection === "appearance" && <>
                <div style={listCard}>
                  <div style={rowCol}>
                    <div style={{ ...lbl, marginBottom: 10 }}>主题</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {Object.entries(THEMES).filter(([key]) => key !== "dark").map(([key, t]) => (
                        <button key={key} onClick={() => changeTheme(key)} style={{ width: 68, padding: "10px 0 8px", borderRadius: 12, cursor: "pointer", border: theme === key ? `2px solid ${t.accent}` : `1px solid ${COLORS.divider}`, background: t.bg, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, ...skCard }}>
                          <span style={{ width: 22, height: 22, borderRadius: "50%", background: t.accent, display: "block" }} />
                          <span style={{ fontSize: 11, color: t.text }}>{t.label}</span>
                        </button>
                      ))}
                      <button onClick={() => changeTheme("custom")} style={{ width: 68, padding: "10px 0 8px", borderRadius: 12, cursor: "pointer", border: theme === "custom" ? `2px solid ${customTheme.accent}` : `1px solid ${COLORS.divider}`, background: customTheme.dark ? "#262624" : "#F5F4EE", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
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
                        {wallpaper && <button onClick={() => { setWallpaper(""); fetch(API + "/settings/1", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wallpaper: "" }) }).catch(() => {}); }} style={{ padding: "6px 12px", borderRadius: 16, border: `1px solid ${COLORS.divider}`, background: "transparent", color: COLORS.danger, cursor: "pointer", fontSize: 13 }}>移除</button>}
                        <button onClick={() => wallpaperInputRef.current && wallpaperInputRef.current.click()} style={{ padding: "6px 14px", borderRadius: 16, border: "none", background: COLORS.accent, color: "#fff", cursor: "pointer", fontSize: 13 }}>{wallpaper ? "更换" : "上传"}</button>
                      </div>
                    </div>
                    {wallpaper && <img src={wallpaper} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 10 }} />}
                  </div>
                  <div style={row}>
                    <div><div style={lbl}>磨砂气泡</div><div style={hint}>半透明磨砂玻璃质感，透出壁纸又有细边框</div></div>
                    <Toggle on={transparentBubble} onChange={toggleBubble} />
                  </div>
                  <div style={rowLast}>
                    <div style={{ flexShrink: 0 }}><div style={lbl}>气泡选择</div><div style={hint}>你的消息气泡底色</div></div>
                    <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {["#F8E1E7", "#EFE3F9", "#FBF3D8", "#F2FCE5", "#ECF5FC"].map(c => (
                        <button key={c} className="flat ghost" onClick={() => { setBubbleColor(c); pushAppearance({ bubbleColor: c }); }} title={c} style={{ width: 26, height: 26, borderRadius: "50%", border: bubbleColor === c ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.divider}`, background: c, cursor: "pointer", padding: 0, flexShrink: 0 }} />
                      ))}
                      <label title="自定义颜色" style={{ position: "relative", width: 26, height: 26, borderRadius: "50%", flexShrink: 0, cursor: "pointer", background: "conic-gradient(#F8E1E7,#FBF3D8,#F2FCE5,#ECF5FC,#EFE3F9,#F8E1E7)", border: `1px solid ${COLORS.divider}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ width: 11, height: 11, borderRadius: "50%", background: COLORS.cardBg }} />
                        <input type="color" value={bubbleColor || "#F8E1E7"} onChange={e => { setBubbleColor(e.target.value); pushAppearance({ bubbleColor: e.target.value }); }} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", padding: 0, border: "none" }} />
                      </label>
                    </div>
                  </div>
                </div></>}

                {settingsSection === "avatar" && (() => {
                  const preview = (src, letter) => <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, overflow: "hidden", background: COLORS.accentLight, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.10)" }}>
                    {src ? <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <span style={{ fontFamily: "'Snell Roundhand', 'Brush Script MT', cursive", fontStyle: "italic", fontSize: 21, color: COLORS.accent }}>{letter}</span>}
                  </div>;
                  const btns = (src, who, inputRef) => <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {src && <button className="ghost" onClick={() => removeAvatar(who)} style={{ padding: "6px 12px", borderRadius: 16, border: `1px solid ${COLORS.divider}`, background: "transparent", color: COLORS.danger, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>移除</button>}
                    <button className="ghost" onClick={() => inputRef.current && inputRef.current.click()} style={{ padding: "6px 14px", borderRadius: 16, border: "none", background: COLORS.accent, color: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>{src ? "更换" : "上传"}</button>
                  </div>;
                  return <>
                    <input ref={avatarAiInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePickAvatar("ai")} />
                    <input ref={avatarUserInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePickAvatar("user")} />
                    <div style={listCard}>
                      <div style={row}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                          {preview(avatarAi, "C")}
                          <div><div style={lbl}>Cael 的头像</div><div style={hint}>显示在他的气泡左边</div></div>
                        </div>
                        {btns(avatarAi, "ai", avatarAiInputRef)}
                      </div>
                      <div style={rowLast}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                          {preview(avatarUser, "J")}
                          <div><div style={lbl}>我的头像</div><div style={hint}>显示在你的气泡右边</div></div>
                        </div>
                        {btns(avatarUser, "user", avatarUserInputRef)}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.placeholder, padding: "0 4px 8px", marginTop: -12 }}>💡 上传后自动裁成正方形并云同步，另一台设备打开也一样。没上传时显示默认字母。</div>
                  </>;
                })()}

                {settingsSection === "api" && (() => {
                  const eyeBtn = (shown, toggle) => <button className="flat" onClick={toggle} title={shown ? "隐藏" : "显示"} style={{ border: "none", background: "transparent", cursor: "pointer", color: COLORS.textSecondary, padding: 4, display: "flex", flexShrink: 0 }}>
                    <Icon size={17}>{shown ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}</Icon>
                  </button>;
                  const chanBtns = (ch) => (<>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <button className="ghost" onClick={() => saveApi(ch)} style={{ flex: 1, padding: "11px", border: `1px solid ${COLORS.divider}`, borderRadius: 14, background: "transparent", color: COLORS.text, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>保存</button>
                      <button className="ghost" disabled={apiTest[ch] && apiTest[ch].loading} onClick={() => testApi(ch)} style={{ flex: 1, padding: "11px", border: "none", borderRadius: 14, background: COLORS.accent, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, ...skRaised }}>{apiTest[ch] && apiTest[ch].loading ? "测试中..." : "测试连接"}</button>
                    </div>
                    {apiTest[ch] && !apiTest[ch].loading && (
                      <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 12, fontSize: 13, lineHeight: 1.6, background: (apiTest[ch].ok || apiTest[ch].saved) ? "rgba(58,175,107,0.12)" : "rgba(192,57,43,0.10)", color: (apiTest[ch].ok || apiTest[ch].saved) ? "#2E8B57" : "#C0392B", ...skCard }}>
                        {apiTest[ch].saved ? "✓ 已保存" : apiTest[ch].ok ? <>✓ 连接成功！模型：{apiTest[ch].model}</> : <>✗ 没通过：{apiTest[ch].error}{apiTest[ch].model ? <><br />（测试的模型：{apiTest[ch].model}）</> : null}</>}
                        {(apiTest[ch].warnings || []).map((w, i) => <div key={i} style={{ color: "#B8860B", marginTop: 4 }}>⚠ {w}</div>)}
                      </div>
                    )}
                  </>);
                  const isActiveChan = (ch) => (ch.model || "") === (settingsData.model || "") && (ch.api_base_url || "") === (settingsData.api_base_url || "");
                  const chanInput = { width: "100%", boxSizing: "border-box", border: `1px solid ${COLORS.divider}`, borderRadius: 10, padding: "9px 12px", fontSize: 13.5, outline: "none", background: COLORS.input, color: COLORS.text, fontFamily: "inherit", marginBottom: 8 };
                  return <>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, padding: "0 4px 8px" }}>我的渠道（一键切换）</div>
                <div style={listCard}>
                  {channels.length === 0 && !chanForm && <div style={{ padding: "14px", fontSize: 13, color: COLORS.placeholder, textAlign: "center" }}>还没有保存的渠道，点下面「添加渠道」存几个，崩了一键切换</div>}
                  {channels.map((ch, i) => {
                    const active = isActiveChan(ch);
                    const t = chTest && chTest.id === ch.id ? chTest : null;
                    return <div key={ch.id} style={i < channels.length - 1 || chanForm ? row : rowLast}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 14, color: COLORS.text, fontWeight: active ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.name}</span>
                          {active && <span style={{ fontSize: 10, color: "#fff", background: "#3AAF6B", padding: "1px 7px", borderRadius: 8, flexShrink: 0 }}>使用中</span>}
                        </div>
                        <div style={{ fontSize: 11, color: COLORS.placeholder, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{ch.model || "（默认模型）"}</div>
                        {t && !t.loading && <div style={{ fontSize: 11, marginTop: 3, color: t.ok ? "#2E8B57" : "#C0392B" }}>{t.ok ? "✓ 连接正常" : "✗ " + (t.error || "").slice(0, 40)}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 5, flexShrink: 0, alignItems: "center" }}>
                        <button className="flat ghost" onClick={() => testChannel(ch)} title="测试" style={{ padding: "5px 9px", borderRadius: 12, border: `1px solid ${COLORS.divider}`, background: "transparent", color: COLORS.textSecondary, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>{t && t.loading ? "…" : "测试"}</button>
                        {!active && <button className="ghost" onClick={() => activateChannel(ch)} style={{ padding: "5px 12px", borderRadius: 12, border: "none", background: COLORS.accent, color: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>使用</button>}
                        <button className="flat ghost" onClick={() => setChanForm({ id: ch.id, name: ch.name, api_base_url: ch.api_base_url || "", api_key: ch.api_key || "", model: ch.model || "" })} title="编辑" style={{ width: 26, height: 26, borderRadius: 8, border: "none", background: "transparent", color: COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}><EditIcon /></button>
                        <button className="flat ghost" onClick={() => delChannel(ch.id)} title="删除" style={{ width: 26, height: 26, borderRadius: 8, border: "none", background: "transparent", color: COLORS.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}><Icon size={14}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Icon></button>
                      </div>
                    </div>;
                  })}
                  {chanForm && <div style={{ ...rowCol, borderBottom: "none" }}>
                    <input value={chanForm.name} onChange={e => setChanForm({ ...chanForm, name: e.target.value })} placeholder="渠道名字（如：酒酿opus）" style={chanInput} />
                    <input value={chanForm.api_base_url} onChange={e => setChanForm({ ...chanForm, api_base_url: e.target.value })} placeholder="API 地址（留空=服务器默认）" style={chanInput} />
                    <input value={chanForm.api_key} onChange={e => setChanForm({ ...chanForm, api_key: e.target.value })} placeholder="API Key（sk- 开头，留空=沿用当前）" style={chanInput} />
                    <input value={chanForm.model} onChange={e => setChanForm({ ...chanForm, model: e.target.value })} placeholder="模型名（如 [可颂-反重力-0.4]claude-opus-4-6-thinking）" style={{ ...chanInput, marginBottom: 10 }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="ghost" onClick={() => setChanForm(null)} style={{ flex: 1, padding: "9px", borderRadius: 12, border: `1px solid ${COLORS.divider}`, background: "transparent", color: COLORS.textSecondary, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>取消</button>
                      <button className="ghost" onClick={saveChannel} style={{ flex: 1, padding: "9px", borderRadius: 12, border: "none", background: COLORS.accent, color: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>{chanForm.id ? "保存修改" : "添加"}</button>
                    </div>
                  </div>}
                </div>
                {!chanForm && <button className="ghost" onClick={() => setChanForm({ name: "", api_base_url: settingsData.api_base_url || "", api_key: "", model: "" })} style={{ width: "100%", padding: "11px", border: `1px dashed ${COLORS.divider}`, borderRadius: 14, background: "transparent", color: COLORS.accent, cursor: "pointer", fontSize: 13, fontFamily: "inherit", marginBottom: 8 }}>+ 添加渠道</button>}
                <div style={{ fontSize: 12, color: COLORS.placeholder, padding: "0 4px 20px" }}>💡 同一家 API 换模型，「地址」和「Key」留空即可（自动沿用服务器默认）；只有换别家 API 才需要填。</div>

                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, padding: "8px 4px 8px" }}>便宜渠道（后台任务）</div>
                <div style={listCard}>
                  <div style={row}>
                    <div style={{ ...lbl, flexShrink: 0 }}>API 地址</div>
                    <input type="text" value={settingsData.cheap_api_base_url || ""} placeholder="留空=同主力" onChange={e => setSettingsData({ ...settingsData, cheap_api_base_url: e.target.value })} style={rowInput} />
                  </div>
                  <div style={row}>
                    <div style={{ ...lbl, flexShrink: 0 }}>API Key</div>
                    <input type={showCheapKey ? "text" : "password"} value={settingsData.cheap_api_key || ""} placeholder="sk- 开头，留空=用主力" onChange={e => setSettingsData({ ...settingsData, cheap_api_key: e.target.value })} style={rowInput} />
                    {eyeBtn(showCheapKey, () => setShowCheapKey(v => !v))}
                  </div>
                  <div style={rowLast}>
                    <div style={{ ...lbl, flexShrink: 0 }}>模型</div>
                    <input type="text" value={settingsData.cheap_model || ""} placeholder="如 claude-sonnet-4-6" onChange={e => setSettingsData({ ...settingsData, cheap_model: e.target.value })} style={rowInput} />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: COLORS.placeholder, padding: "0 4px 12px", marginTop: -12 }}>💡 摘要压缩、自动记忆等后台任务用，省主力额度。留空=跟主力共用。</div>
                {chanBtns("cheap")}
                <div style={{ height: 16 }} /></>;
                })()}

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
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, padding: "0 4px 8px" }}>模型参数</div>
                <div style={listCard}>
                  <div style={rowCol}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={lbl}>模型温度</span><span style={{ ...lbl, color: COLORS.accent }}>{settingsData.temperature}</span></div>
                    <input type="range" min="0" max="2" step="0.1" value={settingsData.temperature} onChange={e => setSettingsData({ ...settingsData, temperature: parseFloat(e.target.value) })} onMouseUp={e => saveSetting({ temperature: parseFloat(e.target.value) })} onTouchEnd={e => saveSetting({ temperature: parseFloat(e.target.value) })} style={{ width: "100%", accentColor: COLORS.accent }} />
                  </div>
                  <div style={rowCol}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={lbl}>上下文轮数</span><span style={{ ...lbl, color: COLORS.accent }}>{settingsData.max_context_rounds || 10} 轮</span></div>
                    <input type="range" min="1" max="50" step="1" value={settingsData.max_context_rounds || 10} onChange={e => setSettingsData({ ...settingsData, max_context_rounds: parseInt(e.target.value) })} onMouseUp={e => saveSetting({ max_context_rounds: parseInt(e.target.value) })} onTouchEnd={e => saveSetting({ max_context_rounds: parseInt(e.target.value) })} style={{ width: "100%", accentColor: COLORS.accent }} />
                  </div>
                  <div style={{ ...rowCol, borderBottom: "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={lbl}>最大回复 tokens</span><span style={{ ...lbl, color: COLORS.accent }}>{settingsData.max_reply_tokens || 2000}</span></div>
                    <input type="range" min="256" max="8192" step="128" value={settingsData.max_reply_tokens || 2000} onChange={e => setSettingsData({ ...settingsData, max_reply_tokens: parseInt(e.target.value) })} onMouseUp={e => saveSetting({ max_reply_tokens: parseInt(e.target.value) })} onTouchEnd={e => saveSetting({ max_reply_tokens: parseInt(e.target.value) })} style={{ width: "100%", accentColor: COLORS.accent }} />
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, padding: "0 4px 8px" }}>System Prompt</div>
                <div style={{ ...listCard, padding: "6px 10px", marginBottom: 10 }}>
                  <textarea value={settingsData.system_prompt || ""} onChange={e => setSettingsData({ ...settingsData, system_prompt: e.target.value })} rows={9} placeholder={"写下 Cael 是谁、说话风格、你们的关系、他该记得的事……\n留空则用默认的「你是Cael。」"} style={{ width: "100%", border: "none", outline: "none", resize: "vertical", fontSize: 14, lineHeight: 1.7, background: "transparent", color: COLORS.text, fontFamily: "inherit", boxSizing: "border-box", minHeight: 150 }} />
                </div>
                <button className="ghost" onClick={() => { saveSetting({ system_prompt: settingsData.system_prompt || "" }); setPromptSaved(true); setTimeout(() => setPromptSaved(false), 2000); }} style={{ width: "100%", padding: "11px", border: "none", borderRadius: 14, background: promptSaved ? "#3AAF6B" : COLORS.accent, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, marginBottom: 8, fontFamily: "inherit", ...skRaised }}>{promptSaved ? "✓ 已保存，下一条消息生效" : "保存"}</button>
                <div style={{ fontSize: 12, color: COLORS.placeholder, padding: "0 4px 14px" }}>💡 这段话每次对话都会垫在 Cael 的脑海最底层，改完点保存，下一条消息立刻生效。</div></>}

                {settingsSection === "chatmgmt" && <>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, padding: "0 4px 8px" }}>导入与导出</div>
                <div style={listCard}>
                  <div style={row}>
                    <div><div style={lbl}>导出聊天记录</div><div style={hint}>下载全部对话</div></div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button className="ghost" onClick={() => exportChat("json")} style={{ padding: "6px 14px", borderRadius: 16, border: "none", background: COLORS.accent, color: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>.json</button>
                      <button className="ghost" onClick={() => exportChat("md")} style={{ padding: "6px 14px", borderRadius: 16, border: `1px solid ${COLORS.divider}`, background: "transparent", color: COLORS.text, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>.md</button>
                    </div>
                  </div>
                  <div style={rowLast}>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={lbl}>导入聊天记录</div><div style={hint}>.json 或 .md 都行，DeepSeek 清洗后进入审阅区，你改删满意再上传到对话或备份</div></div>
                    <input ref={importInputRef} type="file" accept=".json,.md,.markdown,.txt,application/json,text/markdown,text/plain" style={{ display: "none" }} onChange={doImport} />
                    <button className="ghost" onClick={() => importInputRef.current && importInputRef.current.click()} style={{ padding: "6px 14px", borderRadius: 16, border: "none", background: COLORS.accent, color: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit", flexShrink: 0 }}>选择文件</button>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, padding: "0 4px 8px" }}>备份</div>
                <div style={listCard}>
                  <div style={row}>
                    <div><div style={lbl}>云端备份</div><div style={hint}>在服务器上给整个数据库拍个快照</div></div>
                    <button className="ghost" onClick={doBackup} style={{ padding: "6px 14px", borderRadius: 16, border: "none", background: COLORS.accent, color: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit", flexShrink: 0 }}>备份到云端</button>
                  </div>
                  <div style={rowLast}>
                    <div><div style={lbl}>本地备份</div><div style={hint}>把数据库下载到你的设备，自己保管</div></div>
                    <button className="ghost" onClick={doLocalBackup} style={{ padding: "6px 14px", borderRadius: 16, border: `1px solid ${COLORS.divider}`, background: "transparent", color: COLORS.text, cursor: "pointer", fontSize: 13, fontFamily: "inherit", flexShrink: 0 }}>下载到本地</button>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, padding: "0 4px 8px" }}>恢复</div>
                <div style={listCard}>
                  <div style={manageBackups.length > 0 ? row : rowLast}>
                    <div><div style={lbl}>从本地文件恢复</div><div style={hint}>选择之前下载的 .db 备份文件</div></div>
                    <input ref={localRestoreRef} type="file" accept=".db,application/octet-stream" style={{ display: "none" }} onChange={doLocalRestore} />
                    <button className="ghost" onClick={() => localRestoreRef.current && localRestoreRef.current.click()} style={{ padding: "6px 14px", borderRadius: 16, border: `1px solid ${COLORS.divider}`, background: "transparent", color: COLORS.text, cursor: "pointer", fontSize: 13, fontFamily: "inherit", flexShrink: 0 }}>选择文件</button>
                  </div>
                  {manageBackups.length === 0 ? null : <div style={{ ...rowCol, borderBottom: "none", paddingBottom: 4 }}><div style={{ fontSize: 11, color: COLORS.placeholder }}>云端备份</div></div>}
                  {manageBackups.map((b, i) => (
                    <div key={b.file} style={i < manageBackups.length - 1 ? row : rowLast}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.file.replace(/^plutocael-/, "").replace(/\.db$/, "")}</div>
                        <div style={hint}>{(b.size / 1024 / 1024).toFixed(1)} MB</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button className="ghost" onClick={() => doRestore(b.file)} style={{ padding: "5px 12px", borderRadius: 14, border: `1px solid ${COLORS.divider}`, background: "transparent", color: COLORS.accent, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>恢复</button>
                        <button className="ghost" onClick={() => doDeleteBackup(b.file)} title="删除备份" style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "rgba(0,0,0,0.05)", color: COLORS.danger, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}><Icon size={14}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Icon></button>
                      </div>
                    </div>
                  ))}
                </div>
                {manageMsg && <div style={{ padding: "10px 14px", borderRadius: 12, fontSize: 13, lineHeight: 1.6, marginBottom: 12, background: manageMsg.startsWith("✓") ? "rgba(58,175,107,0.12)" : "rgba(0,0,0,0.05)", color: manageMsg.startsWith("✓") ? "#2E8B57" : COLORS.textSecondary, display: "flex", alignItems: "center", gap: 10, ...skCard }}>
                  <span style={{ flex: 1, minWidth: 0 }}>{manageMsg}</span>
                  {importRunning && <button className="ghost" onClick={cancelImport} style={{ padding: "5px 14px", borderRadius: 14, border: "none", background: COLORS.danger, color: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit", flexShrink: 0 }}>中断</button>}
                </div>}
                <div style={{ fontSize: 12, color: COLORS.placeholder, padding: "0 4px 8px" }}>💡 恢复会把当前数据先自动快照一份再覆盖，不怕手滑。导入不覆盖现有对话，只追加。</div>
                </>}

                {settingsSection === "memoryopts" && <>
                <div style={listCard}>
                  <div style={row}>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={lbl}>参考历史聊天记录</div><div style={hint}>启用后，Cael 会参考最近的聊天记录来提供更有上下文的回应；关闭则每条消息独立回答</div></div>
                    <Toggle on={settingsData.use_history !== 0} onChange={() => saveSetting({ use_history: settingsData.use_history === 0 ? 1 : 0 })} />
                  </div>
                  <div style={row}>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={lbl}>时间提醒</div><div style={hint}>在间隔较大的消息前自动插入时间提醒，帮 Cael 理解对话间隔了多久</div></div>
                    <Toggle on={settingsData.time_hint !== 0} onChange={() => saveSetting({ time_hint: settingsData.time_hint === 0 ? 1 : 0 })} />
                  </div>
                  <div style={rowLast}>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={lbl}>日期分隔标记</div><div style={hint}>在跨天的对话里插入日期标记，让 Cael 知道"这是新的一天"</div></div>
                    <Toggle on={settingsData.date_mark !== 0} onChange={() => saveSetting({ date_mark: settingsData.date_mark === 0 ? 1 : 0 })} />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: COLORS.placeholder, padding: "0 4px 12px" }}>💡 这三个开关影响的是发给 Cael 的上下文，改动即刻生效。</div>

                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, padding: "0 4px 8px" }}>滚动上下文管理</div>
                <div style={listCard}>
                  <div style={settingsData.ctx_manage !== 0 ? row : rowLast}>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={lbl}>启用滚动管理</div><div style={hint}>把对话分成"摘要区+冻结区+活跃区"，控制体积、稳定请求前缀以吃满缓存省钱；聊得越久越明显</div></div>
                    <Toggle on={settingsData.ctx_manage !== 0} onChange={() => saveSetting({ ctx_manage: settingsData.ctx_manage === 0 ? 1 : 0 })} />
                  </div>
                  {settingsData.ctx_manage !== 0 && <>
                  <div style={rowCol}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={lbl}>轮换阈值</span><span style={{ ...lbl, color: COLORS.accent }}>{settingsData.ctx_active_rounds || 8} 轮</span></div>
                    <input type="range" min="3" max="30" step="1" value={settingsData.ctx_active_rounds || 8} onChange={e => setSettingsData({ ...settingsData, ctx_active_rounds: parseInt(e.target.value) })} onMouseUp={e => saveSetting({ ctx_active_rounds: parseInt(e.target.value) })} onTouchEnd={e => saveSetting({ ctx_active_rounds: parseInt(e.target.value) })} style={{ width: "100%", accentColor: COLORS.accent }} />
                    <div style={hint}>活跃区累积到这么多轮对话就冻结成稳定前缀</div>
                  </div>
                  <div style={{ ...rowCol, borderBottom: "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={lbl}>保留摘要块</span><span style={{ ...lbl, color: COLORS.accent }}>{settingsData.ctx_summary_keep || 3} 块</span></div>
                    <input type="range" min="1" max="8" step="1" value={settingsData.ctx_summary_keep || 3} onChange={e => setSettingsData({ ...settingsData, ctx_summary_keep: parseInt(e.target.value) })} onMouseUp={e => saveSetting({ ctx_summary_keep: parseInt(e.target.value) })} onTouchEnd={e => saveSetting({ ctx_summary_keep: parseInt(e.target.value) })} style={{ width: "100%", accentColor: COLORS.accent }} />
                    <div style={hint}>更早的对话压成摘要，最多留这么多块，超了丢最旧的</div>
                  </div>
                  </>}
                </div>
                <div style={{ fontSize: 12, color: COLORS.placeholder, padding: "0 4px 8px" }}>💡 摘要用便宜渠道后台生成，不占聊天额度。原始消息不会被删，聊天界面照常能看到全部。</div>
                </>}
              </>;
            })()}
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
