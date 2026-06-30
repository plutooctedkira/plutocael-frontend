const API = "https://api.plutocael.icu/api";

const mcpService = {
  /**
   * 获取所有 MCP 服务器列表（从 mcp_config.json）
   * @returns {Promise<Array>} 服务器配置数组
   */
  fetchServerList: async () => {
    const res = await fetch(API + "/mcp/list");
    if (!res.ok) throw new Error("获取列表失败");
    const data = await res.json();
    return data.data || [];
  },

  /**
   * 获取远程 MCP 服务器上的可用工具
   * @returns {Promise<Array>} 工具列表
   */
  fetchTools: async () => {
    const res = await fetch(API + "/mcp/tools");
    if (!res.ok) throw new Error("获取工具失败");
    const data = await res.json();
    return data.tools || [];
  },

  /**
   * 调用 MCP 工具
   * @param {string} toolName - 工具名称（如 memory_list）
   * @param {Object} args - 调用参数
   * @returns {Promise<Object>} 调用结果 { success, output/error }
   */
  callTool: async (toolName, args = {}) => {
    const res = await fetch(API + "/mcp/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: toolName, args }),
    });
    if (!res.ok) throw new Error("调用失败");
    return await res.json();
  },

  /**
   * 获取 MCP 记忆列表
   * @param {number} limit - 返回数量
   * @returns {Promise<Array>} 记忆数组
   */
  fetchMemories: async (limit = 20) => {
    const res = await fetch(API + "/mcp/memories?limit=" + limit);
    if (!res.ok) throw new Error("获取记忆失败");
    const data = await res.json();
    return data.data || [];
  },

  /**
   * 获取 MCP 连接状态
   * @returns {Promise<Object>} { url, tools, memories }
   */
  fetchStatus: async () => {
    const res = await fetch(API + "/mcp/status");
    if (!res.ok) throw new Error("获取状态失败");
    return await res.json();
  },
};

export default mcpService;