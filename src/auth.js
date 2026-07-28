// 访问口令：存在本地，每个发往后端的请求自动带上 x-pluto-auth 头
// 用全局 fetch 包装而不是改 85 个调用点；流式聊天也走 fetch，所以一样覆盖得到
const KEY = "pluto_token";
const API = import.meta.env.VITE_API_BASE || "/api";

export const getToken = () => localStorage.getItem(KEY) || "";
export const setToken = (t) => { if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY); };
export const clearToken = () => localStorage.removeItem(KEY);

// 后端有没有开口令（没开的话前端不弹输入框）
export async function authRequired() {
  try { const r = await fetch(API + "/auth").then(x => x.json()); return !!r.required; }
  catch (e) { return false; } // 网络不通时不拦着，交给正常的错误提示
}

// 验口令；对了就存下来
export async function login(password) {
  const r = await fetch(API + "/auth", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!r.ok) return false;
  setToken(password);
  return true;
}

// 401 时清掉本地口令并通知 App 重新弹输入框
const onExpired = new Set();
export const onAuthExpired = (fn) => { onExpired.add(fn); return () => onExpired.delete(fn); };

export function installAuthFetch() {
  const raw = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : (input && input.url) || "";
    const isApi = url.startsWith(API) || url.startsWith("/api");
    const token = getToken();
    if (isApi && token) {
      const headers = new Headers(init.headers || (typeof input !== "string" && input.headers) || {});
      headers.set("x-pluto-auth", token);
      init = { ...init, headers };
    }
    const res = await raw(input, init);
    if (isApi && res.status === 401) { clearToken(); onExpired.forEach(fn => fn()); }
    return res;
  };
}
