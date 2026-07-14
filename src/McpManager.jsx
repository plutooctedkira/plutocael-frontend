import { useState, useEffect } from "react";
import { Card, Tag, Switch, Button, Modal, Input, App, Select, Spin, Popconfirm } from "antd";
import { ApiOutlined, ReloadOutlined, PlusOutlined, PlayCircleOutlined, DeleteOutlined, ThunderboltOutlined } from "@ant-design/icons";

const API = import.meta.env.VITE_API_BASE || "/api";

/**
 * MCP 链接管理 —— 添加/启停/删除/测试外部 MCP 服务器
 * 所有启用服务器的工具会聚合注入 Cael 的聊天
 */
export default function McpManager() {
  const [servers, setServers] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null=新增，否则为编辑的server
  const [form, setForm] = useState({ name: "", url: "" });
  const [testResults, setTestResults] = useState({}); // serverId -> {ok, tools/error, loading}
  const [callOpen, setCallOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState("");
  const [toolArgs, setToolArgs] = useState("{}");
  const [toolResult, setToolResult] = useState("");
  const { message } = App.useApp();

  const load = async () => {
    setLoading(true);
    try {
      const [sv, tl] = await Promise.all([
        fetch(API + "/mcp/servers").then(r => r.json()).catch(() => ({ data: [] })),
        fetch(API + "/mcp/tools").then(r => r.json()).catch(() => ({ tools: [] })),
      ]);
      setServers(sv.data || []);
      setTools(tl.tools || []);
    } catch (e) { message.error("加载失败"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveServer = async () => {
    if (!form.name.trim() || !form.url.trim()) { message.warning("名称和 URL 都要填"); return; }
    try {
      if (editing) {
        await fetch(API + "/mcp/servers/" + editing.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        message.success("已更新");
      } else {
        const r = await fetch(API + "/mcp/servers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }).then(x => x.json());
        if (r.error) { message.error(r.error); return; }
        message.success("已添加");
      }
      setAddOpen(false); setEditing(null); setForm({ name: "", url: "" });
      load();
    } catch (e) { message.error("保存失败: " + e.message); }
  };

  const toggleServer = async (s) => {
    // 乐观更新，开关立刻有反馈
    setServers(prev => prev.map(x => x.id === s.id ? { ...x, enabled: s.enabled ? 0 : 1 } : x));
    try {
      await fetch(API + "/mcp/servers/" + s.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: s.enabled ? 0 : 1 }) });
      load();
    } catch (e) { message.error("操作失败"); load(); }
  };

  const deleteServer = async (s) => {
    try {
      await fetch(API + "/mcp/servers/" + s.id, { method: "DELETE" });
      message.success("已删除"); load();
    } catch (e) { message.error("删除失败"); }
  };

  const runTest = async (s) => {
    setTestResults(prev => ({ ...prev, [s.id]: { loading: true } }));
    try {
      const r = await fetch(API + "/mcp/servers/" + s.id + "/test", { method: "POST" }).then(x => x.json());
      setTestResults(prev => ({ ...prev, [s.id]: r }));
    } catch (e) { setTestResults(prev => ({ ...prev, [s.id]: { ok: false, error: e.message } })); }
  };

  const handleCallTool = async () => {
    if (!selectedTool) return;
    let args;
    try { args = JSON.parse(toolArgs); } catch (e) { setToolResult("JSON 格式错误"); return; }
    setToolResult("执行中...");
    try {
      const data = await fetch(API + "/mcp/call", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: selectedTool, args }) }).then(r => r.json());
      setToolResult(data.success ? data.output : data.error || "未知错误");
    } catch (e) { setToolResult("请求失败: " + e.message); }
  };

  const enabledCount = servers.filter(s => s.enabled).length;

  return (
    <App>
      <div className="p-4 max-w-lg mx-auto w-full" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", overscrollBehaviorY: "contain", touchAction: "pan-y", boxSizing: "border-box" }}>

        <Card size="small" className="mb-4 rounded-xl" style={{ boxShadow: "0 2px 5px rgba(0,0,0,0.14), 0 6px 14px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)" }}>
          <div className="flex flex-wrap gap-4 text-sm items-center">
            <Tag color={enabledCount > 0 ? "green" : "default"} className="text-xs">{enabledCount > 0 ? `● ${enabledCount} 个已启用` : "○ 无启用服务器"}</Tag>
            <div><span className="text-gray-400">服务器: </span><span className="font-medium">{servers.length}</span></div>
            <div><span className="text-gray-400">聚合工具: </span><span className="font-medium">{tools.length}</span></div>
          </div>
        </Card>

        <div className="flex gap-2 mb-4 flex-wrap">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setForm({ name: "", url: "" }); setAddOpen(true); }} size="small">添加服务器</Button>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading} size="small">刷新</Button>
          <Button icon={<PlayCircleOutlined />} onClick={() => { setCallOpen(true); setSelectedTool(""); setToolArgs("{}"); setToolResult(""); }} size="small">调用工具</Button>
        </div>

        <Spin spinning={loading}>
          {servers.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400 text-sm">还没有 MCP 服务器，点「添加服务器」接入一个</div>
          )}
          {servers.map(s => {
            const t = testResults[s.id];
            const serverTools = tools.filter(x => x.serverId === s.id);
            return (
              <Card key={s.id} size="small" className="mb-3 rounded-xl" style={{ boxShadow: "0 2px 5px rgba(0,0,0,0.14), 0 6px 14px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)" }}
                title={<span className="flex items-center gap-2"><ApiOutlined style={{ color: s.enabled ? "#3AAF6B" : "#aaa" }} /><span className="text-sm font-medium">{s.name}</span>{s.enabled ? <Tag color="green" className="text-[11px]">启用</Tag> : <Tag className="text-[11px]">停用</Tag>}</span>}
                extra={<Switch checked={!!s.enabled} onChange={() => toggleServer(s)} size="small" />}
              >
                <div className="text-xs text-gray-400 mb-2 break-all">{s.url}</div>
                {serverTools.length > 0 && <div className="flex flex-wrap gap-1 mb-2">{serverTools.map(x => <Tag key={x.name} className="text-[11px]">{x.name}</Tag>)}</div>}
                {t && !t.loading && (t.ok
                  ? <div className="text-xs mb-2" style={{ color: "#3AAF6B" }}>✓ 连接成功，{(t.tools || []).length} 个工具{t.tools && t.tools.length > 0 ? "：" + t.tools.slice(0, 6).join("、") + (t.tools.length > 6 ? "…" : "") : ""}</div>
                  : <div className="text-xs mb-2 break-all" style={{ color: "#C0392B" }}>✗ 连接失败：{t.error}</div>)}
                <div className="flex gap-2">
                  <Button size="small" icon={<ThunderboltOutlined />} loading={t && t.loading} onClick={() => runTest(s)}>测试</Button>
                  <Button size="small" onClick={() => { setEditing(s); setForm({ name: s.name, url: s.url }); setAddOpen(true); }}>编辑</Button>
                  <Popconfirm title="确定删除这个服务器？" okText="删除" cancelText="取消" onConfirm={() => deleteServer(s)}>
                    <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
                  </Popconfirm>
                </div>
              </Card>
            );
          })}
        </Spin>

        <div className="text-xs text-gray-400 mt-4 leading-relaxed">
          💡 启用的服务器工具会全部聚合给 Cael 聊天使用。URL 填完整的 MCP 端点，鉴权参数直接拼在 URL 里，例如：<br />
          <code className="text-[11px]">https://xxx.com/mcp?api_key=你的key</code>
        </div>

        <Modal title={editing ? `编辑 ${editing.name}` : "添加 MCP 服务器"} open={addOpen} onOk={saveServer} onCancel={() => { setAddOpen(false); setEditing(null); }} okText="保存" cancelText="取消" destroyOnClose>
          <div className="flex flex-col gap-3 pt-2">
            <div><label className="text-sm text-gray-500 block mb-1">名称</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="比如：外接记忆库" /></div>
            <div><label className="text-sm text-gray-500 block mb-1">MCP URL（含鉴权参数）</label><Input.TextArea value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} rows={2} placeholder="https://xxx.com/mcp?api_key=..." /></div>
          </div>
        </Modal>

        <Modal title="调用 MCP 工具" open={callOpen} onCancel={() => setCallOpen(false)} footer={null} destroyOnClose width={420}>
          <div className="flex flex-col gap-3 pt-2">
            <div><label className="text-sm text-gray-500 block mb-1">工具</label>
              <Select value={selectedTool} onChange={v => { setSelectedTool(v); setToolArgs("{}"); setToolResult(""); }} style={{ width: "100%" }} placeholder="选择工具" showSearch>
                {tools.map(t => <Select.Option key={t.name} value={t.name}>{t.name}{t.server ? `（${t.server}）` : ""}</Select.Option>)}
              </Select>
            </div>
            <div><label className="text-sm text-gray-500 block mb-1">参数 (JSON)</label>
              <Input.TextArea value={toolArgs} onChange={e => setToolArgs(e.target.value)} rows={3} placeholder='{"limit": 10}' className="font-mono text-xs" />
            </div>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleCallTool} block>执行</Button>
            {toolResult && <Card size="small" className="mt-2 bg-gray-50" style={{ boxShadow: "0 2px 5px rgba(0,0,0,0.14), 0 6px 14px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)" }}><pre className="text-xs whitespace-pre-wrap break-all m-0 font-mono text-gray-700">{toolResult}</pre></Card>}
          </div>
        </Modal>
      </div>
    </App>
  );
}
