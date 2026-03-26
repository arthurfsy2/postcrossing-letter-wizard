# 流程中断恢复机制（Recovery Mechanism）

> 📋 **对应 SKILL.md 章节**：执行流程 → 流程恢复机制  
> **优先级**：高  
> **完成时间**：2026-03-26

---

## 功能说明

通过检测已生成的文件自动推断进度，支持中断后恢复。

**触发时机**：每次启动 skill 时，首先执行前置检测。

---

## 实现逻辑

### 前置检测

**扫描路径**：`{user_workspace}/postcrossing_content/`

**检测文件与进度对应关系**：

| 检测条件 | 说明 | 对应步骤 |
|----------|------|----------|
| `.env_postcrossing` 不存在 | 需要配置邮箱 | Step 1 |
| `{date}_raw-emails.md` 不存在 | 需要获取原始邮件 | Step 2.5 |
| `{date}_recipient-analysis.md` 不存在 | 需要分析收件人 | Step 3 |
| `user-content-template.md` 不存在 | 需要收集用户素材 | Step 4 |
| `{date}_postcard-content.md` 不存在 | 需要生成内容 | Step 5 |

### 恢复流程

当检测到未完成的流程时，告知用户：

```
🔄 检测到未完成的流程（上次做到 Step X: {step_name}）

建议从以下位置继续：
A. 📍 断点继续（Step X: {具体任务}）
B. 🔄 重新选择日期（回到 Step 2）
C. 🆕 全新开始（重置所有）

请回复 A、B 或 C：
```

### 用户选择处理

**A. 断点继续** → 从缺失的步骤继续，复用已有文件

**B. 重新选择** → 回到 Step 2，重新搜索邮件

**C. 全新开始** → 清空 `postcrossing_content/` 目录（需用户二次确认）

> ⚠️ **强制检测**：每次 skill 启动时必须执行此检测，不得跳过。

---

## 示例场景

### 场景 1：Step 3 中断

**检测结果**：
- `.env_postcrossing` ✅ 存在
- `{date}_raw-emails.md` ✅ 存在
- `{date}_recipient-analysis.md` ❌ 不存在

**恢复提示**：
```
🔄 检测到未完成的流程（上次做到 Step 3: 分析收件人）

建议从以下位置继续：
A. 📍 断点继续（Step 3: 分析 2026-01-29 的 10 封邮件）
B. 🔄 重新选择日期（回到 Step 2）
C. 🆕 全新开始（重置所有）

请回复 A、B 或 C：
```

### 场景 2：Step 5 中断

**检测结果**：
- `.env_postcrossing` ✅ 存在
- `{date}_raw-emails.md` ✅ 存在
- `{date}_recipient-analysis.md` ✅ 存在
- `user-content-template.md` ✅ 存在
- `{date}_postcard-content.md` ❌ 不存在

**恢复提示**：
```
🔄 检测到未完成的流程（上次做到 Step 5: 生成明信片内容）

建议从以下位置继续：
A. 📍 断点继续（Step 5: 为 2026-01-29 的 10 位收件人生成明信片内容）
B. 🔄 重新选择日期（回到 Step 2）
C. 🆕 全新开始（重置所有）

请回复 A、B 或 C：
```

---

## 相关文件

- **检测路径**：`{user_workspace}/postcrossing_content/`
- **配置文件**：`{user_workspace}/.env_postcrossing`
