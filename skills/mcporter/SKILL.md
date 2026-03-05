---
name: mcporter
description: "IN: MCP工具名及业务参数 | DO: 路由调用外部MCP服务器(HTTP/Stdio) | EFFECT: 触发对应MCP工具的副作用或读写操作 | OUT: JSON或Raw格式的执行结果"
homepage: http://mcporter.dev
metadata:
  {
    "openclaw":
      {
        "emoji": "📦",
        "requires": { "bins": ["mcporter"] },
        "install":
          [
            {
              "id": "node",
              "kind": "node",
              "package": "mcporter",
              "bins": ["mcporter"],
              "label": "Install mcporter (node)",
            },
          ],
      },
  }
---

# MCPorter 根路由中心 (SNL 函数体)

`mcporter` 是调用一切外部 MCP (Model Context Protocol) 服务的网关调度器。
所有的具体 MCP 调用（如 `github`, `linear` 等）都是它的子节点。

## 1. PRE-CONDITIONS (传参拦截)

- **强类型守卫**:
  - ASSERT: 如果待调用的 MCP Tool 需要 `number`、`boolean` 或 `array` 类型的参数。
  - OR ELSE (必须拦截): **绝对禁止使用 `key=value` 的简写模式！**（CLI 会默认将数字转为字符串导致目标服务 Zod 校验崩溃）。
  - RESOLVE: 必须切换为 JSON payload 注入模式: `--args '{"key": 5}'`。
- **环境探活**:
  - IF 不确定服务器包含哪些工具 -> EXEC `mcporter list <server> --json`
  - IF 不确定工具的具体入参 -> EXEC `mcporter list <server> --schema`

## 2. EXECUTION (调用策略)

- LET [TOOL_NAME] = 目标工具 (如 `github.search_repositories`)
- MATCH [传参复杂度]:
  - CASE "全字符串简单参数":
    - EXEC `mcporter call [TOOL_NAME] arg1=value1 arg2=value2 --output json`
  - CASE "包含数字/布尔/复杂对象":
    - EXEC `mcporter call [TOOL_NAME] --args '{"arg1": 123, "arg2": true}' --output json`
  - CASE "未经配置的临时 Stdio 服务":
    - EXEC `mcporter call --stdio "bun run ./server.ts" [TOOL_NAME] --args '...'`

## 3. POST-CONDITIONS

- ASSERT: `mcporter` 返回的不是 "-32603: Invalid input"（弱类型转换错误）。
- IF 返回编码字符串 (如 file contents 的 base64):
  - 必须使用 JS 或 `base64 -d` 进一步处理解析。

## 4. RETURN

- OUT: 提供给后续逻辑解析的标准化 JSON。
