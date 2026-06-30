import { useState, useEffect } from "react";
import { Card, Tag, Switch, Button, Modal, Input, Space, App, Select } from "antd";
import { ApiOutlined, EditOutlined, ReloadOutlined, PlusOutlined, PlayCircleOutlined } from "@ant-design/icons";

const API = "https://api.plutocael.icu/api";

/**
 * MCP 管理页面 —— 从后端 /api/mcp 拉数据，支持列表工具和调用工具
 */
export default function McpManager() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ url: "", tools: 0, memories: 0 });

  // --- 添加服务器 Modal ---
  const [addOpen, setAddOpen] = useState(false);
  const [newServer, setNewServer] = useState({ name: "", url: "", command: "", args: "", env: "" });

  // --- 调用工具面板 ---
  const [callOpen, setCallOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState("");
  const [toolArgs, setToolArgs] = useState("{}");
  const [toolResult, setToolResult] = useState("");

  const { message } = App.useApp();

  // 从后端加载 MCP 状态
  const load = async () => {
    setLoading(true);
    try {
      const [statusRes, toolsRes, memRes] = await Promise.all([
        fetch(API + "/mcp/status").then(r => r.json()).catch(() => ({ url: "" })),
        fetch(API + "/mcp/tools").then(r => r.json()).catch(() => ({ tools: [] })),
        fetch(API + "/mcp/memories").then(r => r.json()).catch(() => ({ data: [] }))
      ]);
      setStats({ url: statusRes.url || "", tools: toolsRes.tools?.length || 0, memories: memRes.data?.length || 0 });

      // 工具列表作为虚拟"服务器卡片"展示
      const names = new Set(toolsRes.tools?.map(t => t.name.split('_')[0]) || []);
      const cardList = [];
      let idx = 1;
      for (const n of names) {
        cardList.push({
          id: idx++,
          name: n,
          status: "deployed",
          deployedAt: new Date().toLocaleString("zh-CN"),
          tools: toolsRes.tools?.filter(t => t.name.startsWith(n)).map(t => t.name) || []
        });
      }
      if (cardList.length === 0 && statusRes.url) {
        cardList.push({
          id: 1, name: "远程 MCP 服务器", status: "deployed",
          deployedAt: new Date().toLocaleString("zh-CN"),
          tools: toolsRes.tools?.map(t => t.name) || []
        });
      }
      setServers(cardList);
    } catch (e) { message.error("加载失败"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // 新增服务器
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

  // 调用工具
  const handleCallTool = async () => {
    if (!selectedTool) return;
    let args;
    try { args = JSON.parse(toolArgs); } catch (e) { setToolResult("JSON 格式错误"); return; }
    setToolResult("执行中...");
    try {
      const res = await fetch(API + "/mcp/call", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: selectedTool, args })
      });
      const data = await res.json();
      setToolResult(data.success ? data.output : data.error || "未知错误");
    } catch (e) { setToolResult("请求失败: " + e.message); }
  };

  return (
    <App>
      <div className="p-4 max-w-lg mx-auto min-h-screen bg-[#FAFAF8]" style={{ overscrollBehaviorY: "contain", touchAction: "pan-y" }}>
        {/* 状态栏 */}
        <Card size="small" className="mb-4 shadow-sm rounded-xl">
          <div className="flex flex-wrap gap-4 text-sm">
            <div><span className="text-gray-400">服务器: </span><span className="font-medium">{stats.url || "未连接"}</span></div>
            <div><span className="text-gray-400">工具数: </span><span className="font-medium">{stats.tools}</span></div>
            <div><span className="text-gray-400">记忆数: </span><span className="font-medium">{stats.memories}</span></div>
          </div>
        </Card>

        <div className="flex gap-2 mb-4">
          <Button type="primary" icon={<ReloadOutlined />} onClick={load} loading={loading} size="small">刷新</Button>
          <Button icon={<PlusOutlined />} onClick={() => setAddOpen(true)} size="small">添加</Button>
          <Button icon={<PlayCircleOutlined />} onClick={() => setCallOpen(true)} size="small">调用工具</Button>
        </div>

        {servers.map(mcp => (
          <Card key={mcp.id} size="small"
            title={<Space><ApiOutlined style={{ color: "#1677ff" }} /><span className="text-sm font-medium">{mcp.name}</span><Tag color="blue">已连接</Tag></Space>}
            extra={<Switch checked={true} size="small" />}
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

        {/* 添加/编辑 Modal */}
        <Modal title={newServer.name ? `编辑 ${newServer.name}` : "添加 MCP 服务器"} open={addOpen} onOk={newServer.name ? handleAddServer : handleAddServer} onCancel={() => { setAddOpen(false); setNewServer({ name: "", url: "", command: "", args: "", env: "" }); }} okText="保存" cancelText="取消" destroyOnClose>
          <div className="flex flex-col gap-3 pt-2">
            <div><label className="text-sm text-gray-500 block mb-1">名称</label><Input value={newServer.name} onChange={e => setNewServer({ ...newServer, name: e.target.value })} placeholder="服务器名称" /></div>
            <div><label className="text-sm text-gray-500 block mb-1">MCP URL</label><Input value={newServer.url} onChange={e => setNewServer({ ...newServer, url: e.target.value })} placeholder="https://..." /></div>
            <div><label className="text-sm text-gray-500 block mb-1">Command</label><Input value={newServer.command} onChange={e => setNewServer({ ...newServer, command: e.target.value })} placeholder="node mcp-server.js" /></div>
            <div><label className="text-sm text-gray-500 block mb-1">参数</label><Input value={newServer.args} onChange={e => setNewServer({ ...newServer, args: e.target.value })} placeholder="--port 3000" /></div>
            <div><label className="text-sm text-gray-500 block mb-1">环境变量</label><Input.TextArea value={newServer.env} onChange={e => setNewServer({ ...newServer, env: e.target.value })} rows={2} placeholder="KEY=value" /></div>
          </div>
        </Modal>

        {/* 工具调用 Modal */}
        <Modal title="调用 MCP 工具" open={callOpen} onCancel={() => setCallOpen(false)} footer={null} destroyOnClose width={420}>
          <div className="flex flex-col gap-3 pt-2">
            <div><label className="text-sm text-gray-500 block mb-1">工具</label>
              <Select value={selectedTool} onChange={v => { setSelectedTool(v); setToolArgs("{}"); setToolResult(""); }} style={{ width: "100%" }} placeholder="选择工具" showSearch>
                {stats.tools > 0 ? servers.flatMap(s => s.tools || []).filter((v, i, a) => a.indexOf(v) === i).map(t => <Select.Option key={t} value={t}>{t}</Select.Option>) : <Select.Option value="memory_list">memory_list</Select.Option>}
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