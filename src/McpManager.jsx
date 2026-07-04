import { useState, useEffect } from "react";
import { Card, Tag, Switch, Button, Modal, Input, Space, App, Select, Spin } from "antd";
import { ApiOutlined, EditOutlined, ReloadOutlined, PlusOutlined, PlayCircleOutlined, ArrowLeftOutlined, MenuOutlined } from "@ant-design/icons";
import mcpService from "./services/mcpService";

/**
 * MCP 管理页面 —— 通过 mcpService 调用后端 API，支持 loading 状态
 */
export default function McpManager({ onMenu, onBack }) {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ url: "", tools: 0, memories: 0, connected: false, checking: true });
  const [memList, setMemList] = useState([]);

  const [addOpen, setAddOpen] = useState(false);
  const [newServer, setNewServer] = useState({ name: "", url: "", command: "", args: "", env: "" });

  const [callOpen, setCallOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState("");
  const [toolArgs, setToolArgs] = useState("{}");
  const [toolResult, setToolResult] = useState("");

  const { message } = App.useApp();

  // 从后端加载 MCP 配置列表
  const load = async () => {
    setLoading(true);
    try {
      const [statusData, serverList, toolsList, memories] = await Promise.all([
        mcpService.fetchStatus().catch(() => null),
        mcpService.fetchServerList().catch(() => []),
        mcpService.fetchTools().catch(() => []),
        mcpService.fetchMemories().catch(() => [])
      ]);
      const connected = statusData && statusData.url && toolsList.length > 0;

      // 合并 mcp_config.json 和实时工具数据
      const merged = serverList.length > 0
        ? serverList.map(s => ({
            ...s,
            tools: toolsList.filter(t => s.tools ? s.tools.includes(t.name) : false).length > 0
              ? toolsList.filter(t => s.tools.includes(t.name)).map(t => t.name)
              : s.tools || []
          }))
        : toolsList.length > 0
          ? [{
              id: 1, name: "远程 MCP 服务器", status: "deployed",
              deployedAt: new Date().toLocaleString("zh-CN"),
              tools: toolsList.map(t => t.name)
            }]
          : [];

      setServers(merged);
      setMemList(Array.isArray(memories) ? memories : []);
      setStats({
        url: serverList[0]?.url || statusData?.url || "https://mcp.plutocael.icu/mcp",
        tools: toolsList.length,
        memories: memories.length,
        connected,
        checking: false
      });
    } catch (e) {
      message.error("加载失败");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAddServer = () => {
    if (!newServer.name.trim()) return;
    setServers(prev => [{
      id: Date.now(), name: newServer.name,
      status: "deployed", deployedAt: new Date().toLocaleString("zh-CN"),
      tools: [], command: newServer.command, args: newServer.args, env: newServer.env
    }, ...prev]);
    setAddOpen(false);
    setNewServer({ name: "", url: "", command: "", args: "", env: "" });
    message.success("已添加");
  };

  const handleCallTool = async () => {
    if (!selectedTool) return;
    let args;
    try { args = JSON.parse(toolArgs); } catch (e) { setToolResult("JSON 格式错误"); return; }
    setToolResult("执行中...");
    try {
      const data = await mcpService.callTool(selectedTool, args);
      setToolResult(data.success ? data.output : data.error || "未知错误");
    } catch (e) { setToolResult("请求失败: " + e.message); }
  };

  return (
    <App>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid #E5E1D8" }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => onBack && onBack()} size="small" title="返回聊天" />
        <span className="text-[15px] font-medium flex-1">MCP 记忆</span>
        <Button type="text" icon={<MenuOutlined />} onClick={() => onMenu && onMenu()} size="small" title="菜单" />
      </div>
      <div className="p-4 max-w-lg mx-auto overflow-y-auto" style={{ overscrollBehaviorY: "contain", touchAction: "pan-y", height: "calc(100vh - 170px)" }}>
        <Card size="small" className="mb-4 shadow-sm rounded-xl">
          <div className="flex flex-wrap gap-4 text-sm">
            <div><Tag color={stats.checking ? "default" : stats.connected ? "green" : "red"} className="text-xs">{stats.checking ? "检测中..." : stats.connected ? "● 已连接" : "○ 未连接"}</Tag></div>
            <div><span className="text-gray-400">服务器: </span><span className="font-medium">{stats.url || "未连接"}</span></div>
            <div><span className="text-gray-400">工具数: </span><span className="font-medium">{stats.tools}</span></div>
            <div><span className="text-gray-400">记忆数: </span><span className="font-medium">{stats.memories}</span></div>
          </div>
        </Card>

        <div className="flex gap-2 mb-4 flex-wrap">
          <Button type="primary" icon={<ReloadOutlined />} onClick={load} loading={loading} size="small">刷新</Button>
          <Button icon={<PlusOutlined />} onClick={() => setAddOpen(true)} size="small">添加</Button>
          <Button icon={<PlayCircleOutlined />} onClick={() => setCallOpen(true)} size="small">调用工具</Button>
          <Button icon={<ApiOutlined />} onClick={() => window.open("https://mcp.plutocael.icu/memories/", "_blank")} size="small">记忆库网页</Button>
        </div>

        <Spin spinning={loading}>
          {servers.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400 text-sm">暂无 MCP 服务器</div>
          )}
          {servers.map(mcp => (
            <Card key={mcp.id} size="small"
              title={<Space><ApiOutlined style={{ color: "#1677ff" }} /><span className="text-sm font-medium">{mcp.name}</span><Tag color="blue">已连接</Tag></Space>}
              extra={<Switch checked={mcp.status !== "stopped"} size="small" />}
              actions={[
                <Button key="call" type="text" size="small" icon={<PlayCircleOutlined />} onClick={() => { setCallOpen(true); setSelectedTool(""); setToolArgs("{}"); setToolResult(""); }}>调用</Button>,
                <Button key="edit" type="text" size="small" icon={<EditOutlined />} onClick={() => { setNewServer({ name: mcp.name, command: mcp.command || "", args: mcp.args || "", env: mcp.env || "" }); setAddOpen(true); }}>编辑</Button>
              ]}
              className="mb-3 shadow-sm rounded-xl"
            >
              <div className="text-xs text-gray-400 mb-2">部署时间：{mcp.deployedAt}</div>
              {mcp.tools?.length > 0 && <div className="flex flex-wrap gap-1">{mcp.tools.map(t => <Tag key={t} className="text-[11px]">{t}</Tag>)}</div>}
            </Card>
          ))}
        </Spin>

        {memList.length > 0 && <div className="mt-2">
          <div className="text-sm font-medium mb-2 px-1">记忆库内容（{memList.length} 条）</div>
          {memList.map((m, i) => (
            <Card key={i} size="small" className="mb-2 rounded-xl">
              <div className="flex items-start gap-2">
                {m.importance != null && <Tag color="orange" className="text-[11px] shrink-0">{"★".repeat(Math.max(1, Math.min(5, m.importance || 1)))}</Tag>}
                <div className="min-w-0 flex-1">
                  {m.title && <div className="text-sm font-medium mb-1">{m.title}</div>}
                  <div className="text-xs text-gray-600 whitespace-pre-wrap break-words" style={{ lineHeight: 1.6 }}>{(m.content || "").slice(0, 300)}{(m.content || "").length > 300 ? "…" : ""}</div>
                  {m.layer && <Tag className="text-[10px] mt-1">{m.layer}</Tag>}
                </div>
              </div>
            </Card>
          ))}
        </div>}

        <Modal title={newServer.name ? `编辑 ${newServer.name}` : "添加 MCP 服务器"} open={addOpen} onOk={handleAddServer} onCancel={() => { setAddOpen(false); setNewServer({ name: "", url: "", command: "", args: "", env: "" }); }} okText="保存" cancelText="取消" destroyOnClose>
          <div className="flex flex-col gap-3 pt-2">
            <div><label className="text-sm text-gray-500 block mb-1">名称</label><Input value={newServer.name} onChange={e => setNewServer({ ...newServer, name: e.target.value })} placeholder="服务器名称" /></div>
            <div><label className="text-sm text-gray-500 block mb-1">MCP URL</label><Input value={newServer.url} onChange={e => setNewServer({ ...newServer, url: e.target.value })} placeholder="https://..." /></div>
            <div><label className="text-sm text-gray-500 block mb-1">Command</label><Input value={newServer.command} onChange={e => setNewServer({ ...newServer, command: e.target.value })} placeholder="node mcp-server.js" /></div>
            <div><label className="text-sm text-gray-500 block mb-1">参数</label><Input value={newServer.args} onChange={e => setNewServer({ ...newServer, args: e.target.value })} placeholder="--port 3000" /></div>
            <div><label className="text-sm text-gray-500 block mb-1">环境变量</label><Input.TextArea value={newServer.env} onChange={e => setNewServer({ ...newServer, env: e.target.value })} rows={2} placeholder="KEY=value" /></div>
          </div>
        </Modal>

        <Modal title="调用 MCP 工具" open={callOpen} onCancel={() => setCallOpen(false)} footer={null} destroyOnClose width={420}>
          <div className="flex flex-col gap-3 pt-2">
            <div><label className="text-sm text-gray-500 block mb-1">工具</label>
              <Select value={selectedTool} onChange={v => { setSelectedTool(v); setToolArgs("{}"); setToolResult(""); }} style={{ width: "100%" }} placeholder="选择工具" showSearch>
                {servers.flatMap(s => s.tools || []).filter((v, i, a) => a.indexOf(v) === i).map(t => <Select.Option key={t} value={t}>{t}</Select.Option>)}
                {servers.flatMap(s => s.tools || []).length === 0 && <Select.Option value="memory_list">memory_list</Select.Option>}
              </Select>
            </div>
            <div><label className="text-sm text-gray-500 block mb-1">参数 (JSON)</label>
              <Input.TextArea value={toolArgs} onChange={e => setToolArgs(e.target.value)} rows={3} placeholder='{"limit": 10}' className="font-mono text-xs" />
            </div>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleCallTool} block>执行</Button>
            {toolResult && <Card size="small" className="mt-2 bg-gray-50"><pre className="text-xs whitespace-pre-wrap break-all m-0 font-mono text-gray-700">{toolResult}</pre></Card>}
          </div>
        </Modal>
      </div>
    </App>
  );
}