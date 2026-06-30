import { useState } from "react";
import { Card, Tag, Switch, Button, Modal, Input, Space, App } from "antd";
import {
  ApiOutlined,
  EditOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const statusColorMap = {
  running: "green",
  stopped: "red",
  deployed: "blue",
};

/**
 * MCP 服务器卡片组件
 * @param {Object} mcp - MCP 服务器数据 { id, name, status, deployedAt, tools, command, args, env }
 * @param {Function} onToggle - 切换开关回调 (id, checked) => void
 * @param {Function} onRedeploy - 重新部署回调 (id) => void
 * @param {Function} onEdit - 编辑保存回调 (id, updatedData) => void
 */
function McpCard({ mcp, onToggle, onRedeploy, onEdit }) {
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const { message } = App.useApp();

  const handleToggle = (checked) => {
    console.log(`[MCP] ${mcp.name} 状态切换:`, checked ? "启用" : "停用");
    if (onToggle) onToggle(mcp.id, checked);
  };

  const openEditModal = () => {
    setEditData({
      command: mcp.command || "",
      args: mcp.args || "",
      env: mcp.env || "",
    });
    setOpen(true);
  };

  const handleSave = () => {
    console.log(`[MCP] ${mcp.name} 配置编辑保存:`, editData);
    if (onEdit) onEdit(mcp.id, editData);
    setOpen(false);
    message.success(`${mcp.name} 配置已更新`);
  };

  return (
    <>
      <Card
        size="small"
        title={
          <Space>
            <ApiOutlined style={{ color: "#1677ff" }} />
            <span className="text-sm font-medium truncate max-w-32">
              {mcp.name}
            </span>
            <Tag color={statusColorMap[mcp.status] || "default"}>
              {mcp.status === "deployed" ? "已部署" : mcp.status}
            </Tag>
          </Space>
        }
        extra={
          <Switch
            checked={mcp.status === "running"}
            onChange={handleToggle}
            size="small"
          />
        }
        actions={[
          <Button
            key="redeploy"
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => {
              if (onRedeploy) onRedeploy(mcp.id);
            }}
          >
            重新部署
          </Button>,
          <Button
            key="edit"
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={openEditModal}
          >
            编辑
          </Button>,
        ]}
        className="mb-3 shadow-sm rounded-xl"
      >
        <div className="text-xs text-gray-400 mb-2">
          部署时间：{mcp.deployedAt || "未知"}
        </div>
        {mcp.tools && mcp.tools.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {mcp.tools.map((tool) => (
              <Tag key={tool} className="text-[11px] px-1.5 py-0 m-0">
                {tool}
              </Tag>
            ))}
          </div>
        )}
      </Card>

      <Modal
        title={`编辑 ${mcp.name}`}
        open={open}
        onOk={handleSave}
        onCancel={() => setOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
        className="rounded-2xl"
      >
        <div className="flex flex-col gap-4 pt-2">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Command</label>
            <Input
              value={editData.command}
              onChange={(e) =>
                setEditData({ ...editData, command: e.target.value })
              }
              placeholder="例如: node server.js"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">参数</label>
            <Input
              value={editData.args}
              onChange={(e) =>
                setEditData({ ...editData, args: e.target.value })
              }
              placeholder="例如: --port 3000"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">环境变量</label>
            <Input.TextArea
              value={editData.env}
              onChange={(e) =>
                setEditData({ ...editData, env: e.target.value })
              }
              rows={3}
              placeholder="例如: KEY=value"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

/**
 * MCP 管理器页面
 */
export default function McpManager() {
  const [servers, setServers] = useState([
    {
      id: 1,
      name: "mcp-server",
      status: "deployed",
      deployedAt: "2026-06-23 20:02",
      tools: ["create_document", "copy_document", "search_memory"],
      command: "node mcp-server.js",
      args: "--config /etc/mcp/config.json",
      env: "NODE_ENV=production\nLOG_LEVEL=info",
    },
    {
      id: 2,
      name: "memory-service",
      status: "running",
      deployedAt: "2026-06-20 14:30",
      tools: ["memory_list", "memory_search"],
      command: "python memory.py",
      args: "",
      env: "API_KEY=sk-xxx",
    },
  ]);

  const handleToggle = (id, checked) => {
    setServers((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: checked ? "running" : "stopped" }
          : s
      )
    );
  };

  const handleRedeploy = (id) => {
    console.log(`[MCP] 重新部署: ${id}`);
  };

  const handleEdit = (id, updated) => {
    setServers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, command: updated.command, args: updated.args, env: updated.env } : s))
    );
  };

  return (
    <App>
      <div className="p-4 max-w-lg mx-auto min-h-screen bg-[#FAFAF8]">
        <h2 className="text-lg font-semibold mb-4 text-[#1A1A1A]">
          MCP 服务器管理
        </h2>
        {servers.map((mcp) => (
          <McpCard
            key={mcp.id}
            mcp={mcp}
            onToggle={handleToggle}
            onRedeploy={handleRedeploy}
            onEdit={handleEdit}
          />
        ))}
      </div>
    </App>
  );
}