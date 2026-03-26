# Step 2: 搜索邮件（Search for Postcrossing Emails）

> 📋 **对应 SKILL.md 章节**：执行流程 → Step 2

---

## 功能说明

Step 2 负责搜索符合条件的 Postcrossing 地址邮件。

---

## 操作流程

### 2.1 邮件搜索配置

**询问文件夹名称**：
- 用户只需提供最后一级文件夹名称（如 `Postcrossing_sent`）
- 通过 `list-folders.js` 脚本查找完整路径

**询问日期范围**：
```
请问你想处理哪些邮件？
- A. 今天的（{系统当前日期}）
- B. 全部历史（所有日期）
- C. 指定日期（请告诉我日期，格式 YYYY-MM-DD）
```

### 2.2 文件夹路径处理

**操作步骤**：
```bash
# 1. 列出所有文件夹
node scripts/list-folders.js

# 2. 从输出中匹配用户提供的名称，确定完整路径
# 例如：用户说 "Postcrossing_sent" → 实际路径 "其他文件夹/Postcrossing_sent"
```

### 2.3 搜索邮件

**脚本调用**：
```bash
# 搜索指定文件夹中的邮件
node scripts/search-postcrossing.js --folder "{folder_path}" --limit 10

# 自定义日期
node scripts/search-postcrossing.js --folder "{folder_path}" --date YYYY-MM-DD --limit 10
```

**输出**：UID、主题、发件人、日期

---

## 脚本说明

| 脚本 | 用途 | 说明 |
|------|------|------|
| `list-folders.js` | 列出所有邮件文件夹 | 确定完整路径 |
| `search-postcrossing.js` | 搜索 Postcrossing 邮件 | 返回 UID 列表 |
| `get-postcrossing-body.js` | 读取邮件正文 | 支持单封或批量获取 |

**邮件主题格式**：`Postcrossing Postcard ID: {POSTCARD_COUNTRY_CODE}-XXXXXXX`

---

## 相关文件

- **脚本路径**：`{skill_path}/scripts/`
- **IMAP 配置**：`{skill_path}/scripts/imap-config.js`
- **配置文件**：`{user_workspace}/.env_postcrossing`
