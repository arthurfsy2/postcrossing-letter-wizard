---
name: postcrossing-letter-wizard
description: "Postcrossing Letter Wizard - Reads Postcrossing address emails via IMAP (supports QQ Mail, Gmail, Outlook, 163, and more), analyzes recipient profiles and preferences, saves structured analysis locally, collects sender's personal context, and uses AI to generate concise personalized English postcard messages (with Chinese translation) saved to the user's workspace."
description_zh: "Postcrossing 内容建议大师 - 通过 IMAP 自动读取收件人地址邮件（支持 QQ 邮箱、Gmail、Outlook、163 等多种邮箱），分析收片喜好并保存到本地，结合用户个人素材，用 AI 生成精简个性化的英文明信片正文（附中文对照），所有文件保存至用户 workspace。"
description_en: "Postcrossing Letter Wizard - Read recipient info via IMAP (QQ Mail, Gmail, Outlook, 163, and more), analyze preferences, save analysis locally, collect sender context, and generate concise personalized postcard messages with Chinese translation saved to user's workspace."
version: 2.0.0
author: WorkBuddy
tags:
  - postcrossing
  - postcard
  - letter
  - qq-email
  - ai-writing
  - content-generation
allowed-tools: Read, Write, Bash
env:
  - EMAIL_ACCOUNT
  - EMAIL_AUTH_CODE
  - POSTCARD_COUNTRY_CODE
  - POSTCARD_SENDER_CITY
  - LANG
notes:
  - "邮箱支持：根据邮箱后缀自动匹配 IMAP 配置，内置支持 QQ / Gmail / Outlook / 163 / 126 / iCloud / Yahoo / 新浪 / 腾讯企业邮箱。其他邮箱可通过 IMAP_HOST 等环境变量手动覆盖。"
  - "📁 输出文件保存至用户 workspace 的 postcrossing_content/ 目录，与 skill 安装路径无关。"
  - "📚 详细文档：见 docs/ 目录，每个步骤有独立文档说明。"
---

## 何时使用 / When to Use

当用户说以下任意一种时，使用本 skill（中英文均可）：

**中文触发词**：
- "帮我生成明信片内容"
- "写一封明信片寄信内容"
- "根据地址生成 Postcrossing 信件"
- "自动写明信片"
- "给 Postcrossing 用户写信"
- "Postcrossing 内容建议"

**English triggers**:
- "Help me generate postcard content"
- "Write a postcard letter"
- "Generate Postcrossing letter from address"
- "Auto-write postcard"
- "Write to a Postcrossing user"
- "Postcrossing content suggestion"

---

# Postcrossing 内容建议大师

## 功能概览

本 skill 是 **Postcrossing 玩家的智能写作助手**，完成以下自动化流程：

**详细文档**：每个步骤的详细说明见 `docs/` 目录。

```
Step 1: Environment Setup（环境初始化）
  ├─ 1.1 检测 LANG 语言设置
  ├─ 1.2 检测邮箱凭证 EMAIL_ACCOUNT / EMAIL_AUTH_CODE
  ├─ 1.3 检测 POSTCARD_COUNTRY_CODE / POSTCARD_SENDER_CITY
  ├─ 1.4 邮件搜索配置（文件夹、日期范围）
  ├─ 1.5 文件夹路径处理（通过 list-folders.js 确定完整路径）
  └─ 1.6 读取邮件（search-postcrossing.js + get-postcrossing-body.js）
       ↓
Step 2: 解析收件人信息（姓名、国家、兴趣、特殊要求）
       ↓
Step 2.5: 保存原始邮件内容（Save Raw Emails）
  ├─ 调用 save-raw-emails.js 脚本
  ├─ 保存到 {date}/{date}_raw-emails.md
  └─ 用户确认后再进入下一步
       ↓
Step 3: 保存收片喜好分析（Save Recipient Analysis）
  ├─ 检测 {date}_recipient-analysis.md 是否已存在
  ├─ 有新增 ID → 追加到原文件
  └─ 无新增 ID → 复用原文件
       ↓
Step 4: 收集用户内容模板（Collect User Template）
  ├─ 检测 user-content-template.md 是否已存在
  ├─ 已有 → 直接使用
  └─ 没有 → 等待用户提供素材并保存（支持从博客/笔记导入）
       ↓
Step 5: 生成明信片正文（Generate Postcard Content）
  ├─ 5.1 生成规范（语言、字数、格式、真实性原则）
  ├─ 5.2 增量检测与生成
  ├─ 5.3 核心策略：通用内容 × 收件人喜好 智能匹配
  ├─ 5.4 Prompt 模板
  ├─ 5.5 批量生成流程
  ├─ 5.6 手绘提示（如收件人要求手写）
  └─ 5.7 HTML 打印版生成（A4 排版，含剪切线，手写偏好标记）
       ↓
  保存到 {date}/{date}_postcard-content.md，更新使用记录
       ↓
Step 6: 发送邮件备份（可选，Send Email Backup）
  ├─ 压缩所有文件为 zip
  ├─ 发送到用户邮箱
  └─ 用户确认后流程结束
```

**本 skill 自包含所有必要脚本**，安装即可使用。

---

## 所需环境变量

### 必填

| 变量 | 说明 | 示例 |
|------|------|------|
| `EMAIL_ACCOUNT` | 邮箱账号（脚本根据后缀自动推断 IMAP 服务器） | `user@gmail.com`、`xxx@qq.com` |
| `EMAIL_AUTH_CODE` | 邮箱授权码或应用专用密码（非登录密码） | `abcdefghijklmnop` |
| `POSTCARD_COUNTRY_CODE` | Postcrossing 国家 2 位编码（用于搜索邮件主题） | `CN`、`US`、`DE` |
| `POSTCARD_SENDER_CITY` | 寄信城市名（用于正文中的 "Greetings from ___"） | `Shenzhen`、`Beijing` |
| `LANG` | 输出语言设置（`en`=英文，`zh`=中文） | `en`（默认）、`zh` |

### 内置支持的邮箱（自动推断，无需额外配置）

| 邮箱服务商 | 后缀 |
|-----------|------|
| QQ 邮箱 | `@qq.com` |
| Gmail | `@gmail.com` |
| Outlook / Hotmail | `@outlook.com`、`@hotmail.com`、`@live.com` |
| 163 邮箱 | `@163.com` |
| 126 邮箱 | `@126.com` |
| 新浪邮箱 | `@sina.com`、`@sina.cn` |
| 腾讯企业邮箱 | `@exmail.qq.com` |
| iCloud | `@icloud.com`、`@me.com` |
| Yahoo | `@yahoo.com` 等 |

> 📚 **详细说明**：各邮箱授权码申请指引见原文档或官方文档。

### 可选：手动覆盖 IMAP 配置（企业邮箱 / 自建邮件服务器）

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `IMAP_HOST` | IMAP 服务器地址 | 按邮箱后缀自动推断 |
| `IMAP_PORT` | IMAP 端口 | `993` |
| `IMAP_TLS` | 是否启用 TLS | `true` |
| `IMAP_REJECT_UNAUTHORIZED` | 是否验证 TLS 证书（QQ 建议 `false`） | 按邮箱内置配置 |

---

## 执行流程

> 📚 **详细说明**：每个步骤的详细操作见 `docs/` 目录中的对应文档。

### 🔄 流程恢复机制（中断恢复）

**每次启动 skill 时，首先执行前置检测**：

**扫描路径**：`{user_workspace}/postcrossing_content/`

**检测文件与进度对应关系**：

| 检测条件 | 说明 | 对应步骤 |
|----------|------|----------|
| `.env_postcrossing` 不存在 | 需要配置邮箱 | Step 1 |
| `{date}_raw-emails.md` 不存在 | 需要获取原始邮件 | Step 2.5 |
| `{date}_recipient-analysis.md` 不存在 | 需要分析收件人 | Step 3 |
| `user-content-template.md` 不存在 | 需要收集用户素材 | Step 4 |
| `{date}_postcard-content.md` 不存在 | 需要生成内容 | Step 5 |

**恢复流程**：

当检测到未完成的流程时，告知用户：
```
🔄 检测到未完成的流程（上次做到 Step X: {step_name}）

建议从以下位置继续：
A. 📍 断点继续（Step X: {具体任务}）
B. 🔄 重新选择日期（回到 Step 2）
C. 🆕 全新开始（重置所有）

请回复 A、B 或 C：
```

> ⚠️ **强制检测**：每次 skill 启动时必须执行此检测，不得跳过。

> 📚 **详细文档**：`docs/08-recovery-mechanism.md`

---

### Step 1：环境初始化（Environment Setup）

> 📋 **模板引用**：创建 `.env_postcrossing` 配置文件时，**必须参考** `.env.example` 的格式和变量说明。

**前置检测**：检测 `.env_postcrossing` 是否存在

- **已存在** → 询问"使用现有配置？"→ 是则跳过 Step 1
- **不存在** → 进入配置方式选择：
  - A. 🔧 手动配置（推荐技术用户）
  - B. 📝 引导配置（推荐普通用户）

> 📚 **详细文档**：`docs/01-step1-setup.md`（含双模式配置说明）

---

### Step 2：搜索邮件（Search for Postcrossing Emails）

使用 `search-postcrossing.js` 脚本搜索符合条件的邮件。

**脚本调用**：
```bash
# 搜索指定文件夹中的邮件
node scripts/search-postcrossing.js --folder "{folder_path}" --limit 10

# 自定义日期
node scripts/search-postcrossing.js --folder "{folder_path}" --date YYYY-MM-DD --limit 10
```

**输出**：UID、主题、发件人、日期

> 📚 **详细文档**：`docs/02-step2-search.md`

---

### Step 2.5：保存原始邮件内容（Save Raw Emails）

将原始邮件内容保存为 Markdown 文件，方便用户排查和参考。

> 📋 **模板引用**：`templates/raw-emails-template.md`

**文件命名规则**：`{date}_raw-emails.md`

**保存路径**：`{user_workspace}/postcrossing_content/{date}/`（日期子文件夹）

**脚本调用**：
```bash
node scripts/save-raw-emails.js --uids {UID1,UID2,UID3} --folder "{folder_path}" --date {YYYY-MM-DD}
```

**Step 2.5 完成后的确认点**：
```
📧 已保存 N 封原始邮件到 {date}/{date}_raw-emails.md

查看文件确认内容无误后，请回复：
- 继续 → 进入 Step 3：分析收件人
- 修改 → 重新选择邮件或日期范围
```

> ⚠️ **强制等待**：必须等待用户确认后，才能进入 Step 3。

> 📚 **详细文档**：`docs/03-step2.5-raw-emails.md`

---

### Step 3：保存收片喜好分析（Save Recipient Analysis）

将 Step 2 的分析结果保存为本地 Markdown 文件，供后续查阅、积累。

> 📋 **模板引用**：`templates/recipient-analysis-template.md`

**文件命名规则**：`{date}_recipient-analysis.md`

**保存路径**：`{user_workspace}/postcrossing_content/`

**增量处理逻辑**：
- **已存在** → 读取 frontmatter 中的 `processed_ids` 列表，计算新增 ID
  - 有新增 ID → 追加到原文件
  - 无新增 ID → 复用原文件
- **不存在** → 创建新文件

> 📚 **详细文档**：`docs/04-step3-analysis.md`

---

### Step 4：收集用户内容模板（Collect User Template）

> 📋 **模板引用**：`templates/user-content-template.md`

**检测路径**：`{user_workspace}/postcrossing_content/user-content-template.md`

**情况 A：已有模板文件** → 直接读取并使用

**情况 B：没有模板文件**（首次使用）→ **提供两种素材收集方式**：
- A. ✍️ 手动输入（推荐普通用户）
- B. 📁 从博客/笔记导入（推荐有写作习惯的用户，支持本地路径和 GitHub）

> 📚 **详细文档**：`docs/05-step4-user-content.md`（含博客/笔记导入说明）

---

### Step 5：生成明信片正文（Generate Postcard Content）

综合 Step 3 的收件人喜好分析 + Step 4 的用户内容模板，逐一生成明信片正文。

> 📋 **模板引用**：`templates/postcard-content-template.md`

**生成规范**：
- **语言**：英文，每封下方附**中文对照翻译**
- **字数**：**60～90 词**（明信片背面空间有限，宁短勿长）
- **语气**：温暖、真诚、个人化
- **结构**：固定开头信息行 → 问候 → 简短自我介绍 → 个性化内容 → 祝愿 + 签名
- **开头格式**：`{Mon} {Day}, {Year}   {temp}°C {weather_emoji}`（使用今天系统日期）

**⚠️ 内容真实性原则**（核心约束，不可违反）：
- 所有内容必须基于用户通用内容模板中已明确写出的事实
- **严禁编造**任何未经用户确认的经历、行为或状态

**HTML 批量打印版**（功能 10 & 11）：
- **时机**：Step 5 完成后，用户选择打印时
- **模板**：`templates/print-html-template.html`
- **脚本**：`scripts/generate-print-html.js`
- **特点**：A4 排版，含剪切线，智能手写偏好标记（红色边框 + 🖐️）

> 📚 **详细文档**：`docs/06-step5-generate.md`（含 HTML 打印版说明）

---

### Step 6：发送邮件备份（可选，Send Email Backup）

**触发条件**：Step 5 完成后，询问用户是否需要发送邮件备份。

**实现逻辑**：
1. 询问用户是否需要发送
2. 压缩文件：`{date}_raw-emails.md` + `{date}_recipient-analysis.md` + `{date}_postcard-content.md` → `{date}_postcrossing-package.zip`
3. 使用 `nodemailer` 发送，复用 `.env_postcrossing` 配置

**邮件内容**：
- **主题**：`Postcrossing 明信片内容 - {date}`
- **正文**：简要说明和文件列表
- **附件**：压缩包

> 📚 **详细文档**：`docs/07-step6-email-backup.md`

---

## 输出文件与模板

本 skill 生成以下文件，保存到 `{user_workspace}/postcrossing_content/` 目录：

| 输出文件 | 对应步骤 | 模板文件（必须参考） | 说明 |
|----------|----------|---------------------|------|
| `{date}_raw-emails.md` | Step 2.5 | `templates/raw-emails-template.md` | 原始邮件内容预览，方便用户初步排查 |
| `{date}_recipient-analysis.md` | Step 3 | `templates/recipient-analysis-template.md` | 收片喜好分析，frontmatter 含 `processed_ids`，支持增量追加 |
| `user-content-template.md` | Step 4 | `templates/user-content-template.md` | 用户个人素材模板，**固定文件名**，跨批次复用 |
| `{date}_postcard-content.md` | Step 5 | `templates/postcard-content-template.md` | 生成的明信片正文（英文 + 中文对照），frontmatter 含 `generated_ids`，支持增量追加 |
| `{date}_print.html` | Step 5.7 | `templates/print-html-template.html` | HTML 批量打印版（A4 排版，含剪切线，手写偏好标记） |

> ⚠️ **强制引用规则**（不可违反）：
> - 创建输出文件时，**必须**以对应模板文件为基础，用实际数据填充占位符
> - **不得改变**表格列名、frontmatter 字段名、区块标题格式
> - 模板文件本身不应出现在 `postcrossing_content/` 输出目录中
> - 所有文件均保存在**用户的 workspace 根目录**下的 `postcrossing_content/` 中，与 skill 安装路径无关

---

## 每步确认策略

| 场景 | 策略 |
|------|------|
| **首次使用**（无 `user-content-template.md`） | 每步确认，等待用户反馈 |
| **后续使用**（有模板文件） | 询问"使用上次配置？"→ 是则全自动 |

**确认点设计**：
- Step 1: "✅ 邮箱配置已保存。确认无误请回复继续"
- Step 2.5: "📧 已保存 N 封原始邮件。确认继续分析？"
- Step 3: "📊 已分析 N 位收件人。确认继续？"
- Step 4: "📝 个人素材已保存。确认足够？"
- Step 5: "✉️ 明信片内容已生成。请选择输出格式（A. Markdown / B. HTML / C. 两者都要）"

> 📚 **详细文档**：`docs/09-confirm-strategy.md`

---

## 跨平台兼容性说明

本 skill 使用 Node.js 开发，所有脚本均使用 `path.join()` 处理路径，自动适配 Windows/macOS/Linux 系统。

**已测试环境**：
- Windows 11（主要测试环境）
- WSL Ubuntu（Linux 测试环境）

---

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| 未找到配置文件 | 请确保 `.env_postcrossing` 文件位于**项目根目录**（即 `自动生成明信片寄信内容/.env_postcrossing`，不是 skill 子目录）。文件不存在时会提示期望路径 |
| 邮箱后缀不在内置列表 | 在 `.env_postcrossing` 中手动添加 `IMAP_HOST=imap.yourdomain.com` 等覆盖配置 |
| 搜索不到邮件（国家编码问题） | 检查 `.env_postcrossing` 中 `POSTCARD_COUNTRY_CODE` 是否正确（默认 `CN`）；Postcrossing 地址邮件主题格式为 `Postcrossing Postcard ID: {CODE}-XXXXXXX` |

---

## 文档索引

**主文档**：
- `SKILL.md` - 流程索引（本文档，~300 行）

**详细文档**（`docs/` 目录）：
| 文档 | 说明 |
|------|------|
| `docs/01-step1-setup.md` | Step 1: 环境初始化（含双模式配置）|
| `docs/02-step2-search.md` | Step 2: 搜索邮件 |
| `docs/03-step2.5-raw-emails.md` | Step 2.5: 保存原始邮件内容 |
| `docs/04-step3-analysis.md` | Step 3: 保存收片喜好分析 |
| `docs/05-step4-user-content.md` | Step 4: 收集用户内容模板（含博客导入）|
| `docs/06-step5-generate.md` | Step 5: 生成明信片正文（含 HTML 打印）|
| `docs/07-step6-email-backup.md` | Step 6: 发送邮件备份 |
| `docs/08-recovery-mechanism.md` | 流程中断恢复机制 |
| `docs/09-confirm-strategy.md` | 每步确认策略 |
| `docs/10-dual-mode-config.md` | Step 1 双模式配置 |
| `docs/11-time-estimation.md` | 步骤预计时间提示 |

**模板文件**（`templates/` 目录）：
- `raw-emails-template.md`
- `recipient-analysis-template.md`
- `user-content-template.md`
- `postcard-content-template.md`
- `print-html-template.html`

**脚本文件**（`scripts/` 目录）：
- `imap-config.js`
- `list-folders.js`
- `search-postcrossing.js`
- `get-postcrossing-body.js`
- `save-raw-emails.js`
- `generate-print-html.js`

---

**版本**：2.0.0（重构版，拆分详细文档）  
**更新时间**：2026-03-26
