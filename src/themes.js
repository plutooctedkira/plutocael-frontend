// 主题调色板与自定义主题工具。App 和 AuthGate 共用（口令页也要跟随主题）
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

export { THEMES, DEFAULT_CUSTOM, buildCustomColors };
