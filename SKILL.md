---
name: postcrossing-letter-wizard
description: "Postcrossing Letter Wizard - Reads Postcrossing address emails via IMAP (supports QQ Mail, Gmail, Outlook, 163, and more), analyzes recipient profiles and preferences, saves structured analysis locally, collects sender's personal context, and uses AI to generate concise personalized English postcard messages (with Chinese translation) saved to the user's workspace."
description_zh: "Postcrossing内容建议大师 - 通过IMAP自动读取收件人地址邮件（支持QQ邮箱、Gmail、Outlook、163等多种邮箱），分析收片喜好并保存到本地，结合用户个人素材，用AI生成精简个性化的英文明信片正文（附中文对照），所有文件保存至用户workspace。"
description_en: "Postcrossing Letter Wizard - Read recipient info via IMAP (QQ Mail, Gmail, Outlook, 163, and more), analyze preferences, save analysis locally, collect sender context, and generate concise personalized postcard messages with Chinese translation saved to user's workspace."
version: 1.1.0
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
---

## 何时使用 / When to Use

当用户说以下任意一种时，使用本 skill（中英文均可）：

**中文触发词：**
- "帮我生成明信片内容"
- "写一封明信片寄信内容"
- "根据地址生成 Postcrossing 信件"
- "自动写明信片"
- "给 Postcrossing 用户写信"
- "Postcrossing 内容建议"

**English triggers:**
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

```
Step 1: Environment Setup（环境初始化）
  ├─ 1.1 检测 LANG 语言设置
  │    ├─ 已配置 → 直接使用
  │    └─ 未配置 → 询问用户语言偏好（English/中文）→ 写入 LANG
  │
  ├─ 1.2 检测邮箱凭证 EMAIL_ACCOUNT / EMAIL_AUTH_CODE
  │    ├─ 已配置 → 直接使用
  │    └─ 未配置 → 引导用户填写并保存到 .env_postcrossing
  │
  ├─ 1.3 检测 POSTCARD_COUNTRY_CODE / POSTCARD_SENDER_CITY
  │    ├─ 已配置 → 直接使用
  │    └─ 未配置 → 询问用户并写入 .env_postcrossing
  │
  ├─ 1.4 邮件搜索配置（文件夹、日期范围）
  │    ├─ 询问文件夹名称（如 Postcrossing_sent）
  │    └─ 询问日期范围（今天/全部历史/指定日期）
  │
  ├─ 1.5 文件夹路径处理（通过 list-folders.js 确定完整路径）
  │
  └─ 1.6 读取邮件（search-postcrossing.js + get-postcrossing-body.js）
       ↓
Step 2: 解析收件人信息（姓名、国家、兴趣、特殊要求）
       ↓
Step 3: 保存收片喜好分析（Save Recipient Analysis）
  ├─ 检测 {date}_recipient-analysis.md 是否已存在
  │   ├─ 有新增 ID → 追加到原文件
  │   └─ 无新增 ID → 复用原文件
  └─ 不存在 → 创建新文件
       ↓
Step 4: 收集用户内容模板（Collect User Template）
  ├─ 检测 user-content-template.md 是否已存在
  │   ├─ 已有 → 直接使用
  │   └─ 没有 → 等待用户提供素材并保存
  └─ 更新使用记录
       ↓
Step 5: 生成明信片正文（Generate Postcard Content）
  ├─ 5.1 生成规范（语言、字数、格式、真实性原则）
  ├─ 5.2 增量检测与生成
  ├─ 5.3 核心策略：通用内容 × 收件人喜好 智能匹配
  ├─ 5.4 Prompt 模板
  ├─ 5.5 批量生成流程
  └─ 5.6 手绘提示（如收件人要求手写）
       ↓
  保存到 {date}_postcard-content.md，更新使用记录
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
| `LANG` | 输出语言设置（`en`=英文, `zh`=中文） | `en`（默认）、`zh` |

### 内置支持的邮箱（自动推断，无需额外配置）

| 邮箱服务商 | 后缀 | 授权码申请 |
|-----------|------|-----------|
| QQ 邮箱 | `@qq.com` | [设置 → 账户 → 开启 IMAP → 生成授权码](https://service.mail.qq.com/detail/0/310) |
| Gmail | `@gmail.com` | [开启两步验证](https://myaccount.google.com/security) → [生成应用专用密码](https://myaccount.google.com/apppasswords) |
| Outlook / Hotmail | `@outlook.com`、`@hotmail.com`、`@live.com` | [账户安全 → 应用密码](https://account.microsoft.com/security) |
| 163 邮箱 | `@163.com` | [设置 → POP3/IMAP → 开启 → 生成授权码](https://help.mail.163.com/faqDetail.do?code=d7a5dc8471cd0c0e8b4b8f4b3e5b88f) |
| 126 邮箱 | `@126.com` | [设置 → POP3/IMAP → 开启 → 生成授权码](https://help.mail.126.com/) |
| 新浪邮箱 | `@sina.com`、`@sina.cn` | 设置 → 客户端授权密码 |
| 腾讯企业邮箱 | `@exmail.qq.com` | 管理后台 → 邮箱设置 → 开启 IMAP |
| iCloud | `@icloud.com`、`@me.com` | [appleid.apple.com → 安全 → 应用专用密码](https://appleid.apple.com/account/manage)（[说明](https://support.apple.com/zh-cn/102654)） |
| Yahoo | `@yahoo.com` 等 | [账户安全 → 应用程序密码](https://login.yahoo.com/account/security)（[说明](https://help.yahoo.com/kb/generate-third-party-passwords-sln15241.html)） |

### 可选：手动覆盖 IMAP 配置（企业邮箱 / 自建邮件服务器）

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `IMAP_HOST` | IMAP 服务器地址 | 按邮箱后缀自动推断 |
| `IMAP_PORT` | IMAP 端口 | `993` |
| `IMAP_TLS` | 是否启用 TLS | `true` |
| `IMAP_REJECT_UNAUTHORIZED` | 是否验证 TLS 证书（QQ 建议 `false`） | 按邮箱内置配置 |

所有配置从 `.env_postcrossing` 文件或系统环境变量读取，**绝不硬编码**到脚本中。

---

## 安装

```bash
cd postcrossing-letter-wizard
npm install
```

---

## 执行流程

### Step 1：环境初始化（Environment Setup）

> 📋 **模板引用**：创建 `.env_postcrossing` 配置文件时，**必须参考** `.env.example` 的格式和变量说明，确保包含所有必需的环境变量。

#### 1.1 语言偏好设置（Language Preference）

**首先检测 `.env_postcrossing` 中 `LANG` 是否已配置：**

```
检测路径：{user_workspace}/.env_postcrossing
检测内容：LANG 是否存在且非空
```

- **已配置** → 直接使用当前设置（`en` 或 `zh`），告知用户：「✅ Language set to {en/zh}」
- **未配置** → 询问用户：

> 「Welcome! Please select your preferred output language:
> - **A. English** - All output files will be in English
> - **B. 中文** - 所有输出文件为中文」

根据用户选择，在 `.env_postcrossing` 中添加：
```bash
LANG=en  # 或 LANG=zh
```

**规则：**
- 首次使用**必须询问用户**选择语言，不得预设默认值
- 一旦设置，整个运行周期内锁定该语言
- 所有脚本通过读取 `.env_postcrossing` 中的 `LANG` 变量确定输出语言
- 用户可在 `.env_postcrossing` 中手动修改 `LANG` 值来切换语言

---

#### 1.2 邮箱凭证配置（Email Credentials）

**检测 `.env_postcrossing` 是否已配置邮箱信息：**

```
检测路径：{user_workspace}/.env_postcrossing
检测内容：EMAIL_ACCOUNT 和 EMAIL_AUTH_CODE 是否均存在且非空
```

- **已存在** → 直接告知用户「✅ Email credentials detected ({email_address}), continuing…」
- **不存在** → 引导用户填写：

> 「First-time setup requires email credentials. Please provide your email address (e.g., `xxx@qq.com`, `you@gmail.com`).
>
> Credentials will only be saved to the local `.env_postcrossing` file and will not be shared externally.」

用户填写邮箱地址后，**根据邮箱后缀，给出对应的授权码申请指引**（见下方「各邮箱授权码申请指引」），然后等待用户提供授权码，再一起写入 `.env_postcrossing`。

> ⚠️ **Auth code ≠ Login password**. It is an independent password generated by the email provider specifically for third-party clients, which can be revoked at any time for better security.

---

#### 1.3 国家编码与城市配置（Country & City Settings）

**检测 `.env_postcrossing` 中 `POSTCARD_COUNTRY_CODE` 是否已配置：**

- **已配置** → 直接使用，跳过询问
- **未配置** → 询问用户：
  > 「你的 Postcrossing 账户注册的国家编码是什么？（例如 `CN`、`US`、`DE`）」

用户确认后，**写入 `.env_postcrossing` 文件**（如 `POSTCARD_COUNTRY_CODE=CN`），后续直接复用。
此编码用于搜索邮件主题（格式：`Postcrossing Postcard ID: {CODE}-XXXXXXX`）。

---

**检测 `.env_postcrossing` 中 `POSTCARD_SENDER_CITY` 是否已配置：**

- **已配置** → **直接使用**，无需每次询问确认（用户若要修改，直接编辑 `.env_postcrossing` 文件，或在对话中说「改成 XX」）
- **未配置** → 询问用户：
  > 「明信片正文开头会写"Greetings from ___"，请告诉我你想填写的城市名（英文，如 `Shenzhen`、`Beijing`）」

用户确认后，**写入 `.env_postcrossing` 文件**（`POSTCARD_SENDER_CITY=Shenzhen`），后续直接复用。

> 💡 城市名也用于固定开头的气温/天气估算（AI 根据城市 + 月份推断），无需用户额外提供。

---

**各邮箱授权码申请指引（AI 根据邮箱后缀动态选择并展示对应部分）：**

---

**QQ 邮箱（@qq.com）**
1. 打开 QQ 邮箱网页版 → 顶部「设置」→「账户」
2. 找到「IMAP/SMTP 服务」，点击「开启」
3. 按提示用手机短信验证后，系统自动生成一串 **16 位授权码**（如 `abcdefghijklmnop`），复制备用
4. 官方说明：https://service.mail.qq.com/detail/0/310

---

**Gmail（@gmail.com / @googlemail.com）**
1. 前提：需开启「两步验证」→ https://myaccount.google.com/security
2. 开启两步验证后，访问「应用专用密码」页面：https://myaccount.google.com/apppasswords
3. 「选择应用」填 `邮件`，「选择设备」填 `其他（自定义名称）`，填入任意名称（如 `Postcrossing`）
4. 点击「生成」，得到一串 **16 位应用专用密码**（含空格，输入时去掉空格）
5. 官方说明：https://support.google.com/accounts/answer/185833

---

**Outlook / Hotmail（@outlook.com / @hotmail.com / @live.com）**
1. 访问 Microsoft 账户安全中心：https://account.microsoft.com/security
2. 「高级安全选项」→「应用密码」→「创建新的应用密码」
3. 复制生成的应用密码（若账号未开启两步验证，则可直接使用登录密码，但建议开启）
4. 官方说明：https://support.microsoft.com/zh-cn/account-billing/如何使用应用密码-9fadbe9b-7b3e-43b8-8d4b-8f4b3e3d8978

---

**163 邮箱（@163.com）**
1. 登录 163 邮箱网页版 → 右上角「设置」→「POP3/SMTP/IMAP」
2. 开启「IMAP/SMTP 服务」
3. 点击「授权密码管理」→「新增授权密码」，按短信验证后生成授权码
4. 官方说明：https://help.mail.163.com/faqDetail.do?code=d7a5dc8471cd0c0e8b4b8f4b3e5b88f

---

**126 邮箱（@126.com）**
1. 登录 126 邮箱网页版 → 「设置」→「POP3/SMTP/IMAP」
2. 开启「IMAP/SMTP 服务」，按提示生成授权码
3. 官方说明：https://help.mail.126.com/

---

**iCloud（@icloud.com / @me.com / @mac.com）**
1. 访问 Apple ID 账户页面：https://appleid.apple.com/account/manage
2. 「安全」→「应用专用密码」→「+」生成
3. 填入描述（如 `Postcrossing`），生成后复制（仅显示一次）
4. 官方说明：https://support.apple.com/zh-cn/102654

---

**Yahoo（@yahoo.com 等）**
1. 访问 Yahoo 账户安全页面：https://login.yahoo.com/account/security
2. 「应用程序密码」→「生成应用程序密码」，选择「其他应用」
3. 复制生成的密码
4. 官方说明：https://help.yahoo.com/kb/generate-third-party-passwords-sln15241.html

---

**自动从邮箱读取 Postcrossing 邮件：**

```bash
# 1. 搜索 {user_folder_name} 文件夹中的邮件
#    {folder_path} 为 list-folders.js 输出的完整路径（运行时动态确定）
#    默认：当天（系统当前日期）的所有符合条件邮件
#    搜索关键词中的国家编码使用 POSTCARD_COUNTRY_CODE（从 .env_postcrossing 读取）
node scripts/search-postcrossing.js --folder "{folder_path}" --limit 10
# 输出：UID、主题、发件人、日期

#    自定义日期：仅搜索某一天的邮件
node scripts/search-postcrossing.js --folder "{folder_path}" --date YYYY-MM-DD --limit 10

# 2. 读取指定邮件正文
node scripts/get-postcrossing-body.js --uid <UID> --folder "{folder_path}"
# 输出：完整邮件正文（含地址、自我介绍等）
```

**解析邮件内容提取字段：**
- 从正文解析：`Username`、`Name`、`Country`、`Address`、`About the recipient`
- 提取特殊要求：如 "Please put the date, temperature and weather on your card"

---

#### 1.4 邮件搜索配置（Mail Search Configuration）

**Postcrossing 邮件是否已设置自动分类到指定文件夹？**
- **是** → 请用户提供文件夹名称（只需最后一级名称，如 `Postcrossing_sent`）
- **否** → 在收件箱（INBOX）中全局搜索主题含 `Postcrossing Postcard ID` 的邮件

---

**搜索日期范围（必须主动询问，不默认）：**

确认文件夹后，**必须明确询问用户**搜索范围：

> 「请问你想处理哪些邮件？
> - **A. 今天的**（{系统当前日期}）
> - **B. 全部历史**（所有日期）
> - **C. 指定日期**（请告诉我日期，格式 YYYY-MM-DD）」

根据用户选择对应传参：
- 选 **A（今天）** → 脚本加 `--date {today}` 参数（使用系统当前日期）
- 选 **B（全部历史）** → 脚本**不加** `--date` 参数
- 选 **C（指定日期）** → 脚本加 `--date YYYY-MM-DD` 参数（使用用户提供的日期）

---

#### 1.5 文件夹路径处理（Folder Path Resolution）

用户通常只知道最后一级文件夹名称（如 `Postcrossing_sent`），实际完整路径可能是 `{parent_folder}/{user_folder_name}`（如 `其他文件夹/Postcrossing_sent`）、`INBOX/Postcrossing` 等。

**操作步骤**：

```bash
# 1. 列出所有文件夹，找到包含用户提供的名称的完整路径
node scripts/list-folders.js

# 2. 从输出中匹配用户提供的名称，确定完整路径
# 例如：用户说 "{user_folder_name}" → 实际路径 "{folder_path}"（由 list-folders.js 输出确定）
```

---

#### 1.6 读取邮件步骤（Read Email Steps）

确认完整文件夹路径后：

```bash
# 1. 列出该文件夹中最近的邮件（默认搜索主题含 "Postcrossing Postcard ID" 的邮件）
#    - 默认：搜索当天（系统当前日期）的所有符合条件邮件
#    - {folder_path} 为 list-folders.js 输出的完整路径，如 "其他文件夹/{user_folder_name}"
node scripts/search-postcrossing.js --folder "{folder_path}" --limit 10

#    - 自定义日期：加 --date 参数，仅搜索指定日期的邮件
node scripts/search-postcrossing.js --folder "{folder_path}" --date YYYY-MM-DD --limit 10

# 2. 读取指定邮件正文（UID 从搜索结果获取）
#    - 单封读取（旧方式，串行）
node scripts/get-postcrossing-body.js --uid <UID> --folder "{folder_path}"

#    - 批量并行读取（新方式，推荐）/ Batch parallel reading (new, recommended)
#    - 支持同时获取多封邮件，显著提升性能
node scripts/get-postcrossing-bodies.js --uids <UID1,UID2,UID3,...> --folder "{folder_path}"
#    输出：JSON 格式，包含所有邮件的完整正文
```

邮件主题格式：`Postcrossing Postcard ID: {POSTCARD_COUNTRY_CODE}-XXXXXXX`（`{POSTCARD_COUNTRY_CODE}` 从 `.env_postcrossing` 读取）

邮件正文包含的字段：
| 字段 | 说明 |
|------|------|
| `postcard_id` | CN-XXXXXXXX 等 |
| `username` | 收件人用户名 |
| `name` | 收件人姓名 |
| `pronouns` | 性别代词（如 he/him, she/her）|
| `country` | 国家 |
| `city/province` | 城市/省份 |
| `address` | 完整邮寄地址（多行）|
| `languages` | 语言 |
| `sent/received` | Postcrossing 资历（已寄/已收数量）|
| `profile_url` | 个人主页 |
| `about` | 收件人自我介绍（含兴趣、偏好、特殊要求）|

### Step 2：解析收件人信息（Parse Recipient Info）

逐一读取 Step 1 搜索到的符合条件邮件，对每封邮件的 `About the recipient` 及全文进行分析，提炼以下维度：

| 维度 | 提取内容 | 示例 |
|------|----------|------|
| **卡片类型偏好** | 收件人希望收到什么类型的明信片 | 风景卡、手绘卡、猫咪主题、本地特色等 |
| **内容偏好** | 希望寄信人写什么内容 | 当地天气/日期、个人介绍、当地有趣的事等 |
| **语言偏好** | 希望用哪种语言书写 | 英文、母语、任意语言等 |
| **特殊要求** | 明确提出的附加请求 | 请写上日期、温度、邮寄城市等 |
| **个人兴趣** | 收件人自身的爱好、职业、家庭等背景信息 | 画画、养猫、有孙子孙女、喜欢旅行等 |
| **Postcrossing 资历** | 已寄/已收数量，判断是否为老玩家 | 已收 500+，对明信片有丰富审美经验 |

**分析完成后，输出结构化摘要（每封邮件一条）：**

```
[{postcard_id}] {name}（{country}）
- 卡片偏好：{card_preference}
- 内容偏好：{content_preference}
- 特殊要求：{special_requests}
- 个人亮点：{personal_highlights}
- Postcrossing 资历：已寄 {sent} / 已收 {received}
```

> 💡 如果收到多封邮件，逐一列出摘要，供用户确认后再进入下一步生成正文。

### Step 3：保存收片喜好分析（Save Recipient Analysis）

将 Step 2 的分析结果保存为本地 Markdown 文件，供后续查阅、积累。

> 📋 **模板引用**：创建此文件时，**必须严格参考** `templates/recipient-analysis-template.md` 的格式，包括 frontmatter 字段、表格结构、区块标题等，确保格式一致性。

**文件命名规则：**

```
{date}_recipient-analysis.md
```

> 示例：`2026-01-29_recipient-analysis.md`
> **保存路径**：**用户的 workspace 根目录**下的 `postcrossing_content/` 文件夹（不存在时自动创建）
>
> ⚠️ **重要**：`postcrossing_content/` 目录必须创建在用户当前工作的项目 workspace 根目录下，**不是** skill 本身的安装路径。
> 在保存前，先确认用户的 workspace 路径（即当前对话的工作目录 `cwd`），将文件写入 `{user_workspace}/postcrossing_content/`。

**保存前先检测同名文件是否已存在（增量处理逻辑）：**

```
检测路径：{user_workspace}/postcrossing_content/{date}_recipient-analysis.md
```

- **已存在** → 读取 frontmatter 中的 `processed_ids` 列表，与本次搜索到的邮件 ID 进行对比：
  - 计算出**新增 ID**（本次搜索到但不在 `processed_ids` 中的）
  - **有新增 ID** → 告知用户：
    > 「已找到 `{date}_recipient-analysis.md`（已处理 {N} 位），本次新增 {M} 个 ID：{new_ids_list}。是否继续分析并追加？
    > - **A. 继续** → 只分析新增 ID，追加到原文件
    > - **B. 取消** → 保留原文件，进入 Step 4」
  - **无新增 ID**（全部已处理）→ 直接告知用户：
    > 「当天所有 {N} 封邮件均已分析，无新增内容，直接复用原文件。」→ 进入 Step 4
- **不存在** → 正常执行分析并创建新文件

**文件格式（含 frontmatter + 增量追加结构）：**

```markdown
---
date: {YYYY-MM-DD}
total: {total_count}
processed_ids:
  - {postcard_id_1}
  - {postcard_id_2}
  - ...（每次追加时同步更新此列表和 total）
last_updated: {YYYY-MM-DD HH:MM}
---

# Recipient Preference Analysis — {date}（Total {count} recipients）

---

## Batch 1（{N} recipients，{timestamp}）

### 1. [{postcard_id}] {name}（{country}）

| Dimension | Content |
|-----------|---------|
| Card Preference | {card_preference} |
| Content Preference | {content_preference} |
| Language Preference | {language_preference} |
| Special Requests | {special_requests} |
| Personal Highlights | {personal_highlights} |
| Postcrossing Experience | Sent {sent} / Received {received} |

---

### 2. ...（Continue with same format）

---

## Batch 2（{M} recipients，{timestamp}）（Append when adding new batch）

### {N+1}. [{new_postcard_id}] {name}（{country}）

...（Same format）
```

> ⚠️ **追加规则**：每次追加新批次时，须同步更新 frontmatter 的 `total`、`processed_ids`（追加新 ID）和 `last_updated`，正文标题中的 "Total {count} recipients" 也同步更新。

> ⚠️ **`processed_ids` 自动提取规则**：frontmatter 中的 `processed_ids` 列表**必须从文件正文中已写入的区块自动提取**（即从每个 `### N. [{postcard_id}]` 标题行中解析 ID），**不得手动填写**。这样可确保 frontmatter 与正文内容始终完全对应，避免人工遗漏或错填。

> ✅ 保存完成后，告知用户文件路径，并展示文件中收录的收件人总数量。

---

### Step 4：收集用户内容模板（Collect User Template）

> 📋 **模板引用**：创建此文件时，**必须严格参考** `templates/user-content-template.md` 的格式，包括 frontmatter 字段、User Input 区块、Usage History 区块等，不得改变结构。

**首先询问用户：**

> 「Analysis saved ✅ Continue to generate postcard content?」
> - **YES** → Check user content template
> - **NO** → 流程结束，提醒用户可随时重新触发

**若用户选择 YES，先检查是否已有用户内容模板文件：**

```
检测路径：{user_workspace}/postcrossing_content/user-content-template.md（固定文件名，只有一个）
```

**情况 A：已有模板文件** → 直接读取并使用，无需每次向用户确认。只在以下情况主动询问：
- 用户在对话中明确说「我想更新模板」/「换一份」/「重新填写」
- 用户提到模板里描述的近况已过时（如超过 30 天且用户有新内容要补充）

> 告知用户一行即可（不展示完整模板）：「✅ User content template loaded (last updated: {last_updated})」然后进入 Step 5。
>
> 若用户想修改，告知：「Say "update template" to add new content, or "replace template" to start fresh.」

**情况 B：没有模板文件（首次使用或 workspace 为新的）** → **必须停下来等待用户输入，不得跳过此步骤继续生成正文。**

> ⛔ **强制等待**：在用户提供个人素材并保存为 `user-content-template.md` 之前，**禁止进入 Step 5**，不得生成任何明信片正文，哪怕用户说"直接生成"也不行——应告知用户需要先提供素材。

提示用户输入：

> 「To make the postcard content authentic and warm, please share some recent personal details (AI will match and polish based on each recipient's preferences), such as:
> - Interesting or memorable recent events
> - Your hobbies, lifestyle
> - Your occupation, family, friends background
> - Weather and seasonal feelings in your city
> - Anything you'd like to write on a postcard
>
> This will be saved as a local "User Content Template" file for reuse next time.」

**将用户输入的内容保存为本地文件：**

> ⚠️ **AI must NOT auto-write or complete template content.** Only save content explicitly provided by the user, store verbatim without polishing, adding, or filling in. If user hasn't provided content, must wait and cannot generate placeholder or example content.

```
File name: user-content-template.md（fixed name, single file, update in place）
Save path: {user_workspace}/postcrossing_content/ folder（same directory as Step 4 analysis file）
```

**文件格式（含 frontmatter，每次使用后更新 `last_updated`）：**

```markdown
---
last_updated: {YYYY-MM-DD}
---

# User Content Template

---

## User Input

{user_input_content}

---

## Usage History

- {YYYY-MM-DD}：Generated {N} postcards（Linked：{date}_recipient-analysis.md）
- {YYYY-MM-DD}：...（Append after each use, do not overwrite）
```

**使用记录追加规则：**

| Situation | Append Format |
|-----------|---------------|
| First generation | `- {date}：Generated {N} postcards（Linked：{date}_recipient-analysis.md）` |
| Same day incremental | `- {date}：Added {M} postcards（Batch 2，total {N+M}，Linked：{date}_recipient-analysis.md）` |
| Same day regeneration | `- {date}：Regenerated {N} postcards（overwrote previous file）` |
| Different day | `- {date}：Generated {N} postcards（Linked：{date}_recipient-analysis.md）` |

> ✅ 保存完成后，告知用户文件路径，然后进入 Step 5。

---

### Step 5：生成明信片正文（Generate Postcard Content）

综合 Step 3 的收件人喜好分析 + Step 4 的用户内容模板，逐一生成明信片正文。

> 📋 **模板引用**：保存生成的正文时，**必须严格参考** `templates/postcard-content-template.md` 的格式，包括 frontmatter 字段、固定开头行格式、英文+中文对照格式等，确保输出一致性。

#### 5.1 生成规范（Generation Guidelines）

AI 生成的明信片正文需满足以下规范：

| 规范项 | 要求 |
|--------|------|
| **语言** | 英文，每封下方附**中文对照翻译**供用户核对 |
| **字数** | **60～90 词**（明信片背面空间有限，宁短勿长） |
| **语气** | 温暖、真诚、个人化，精炼不啰嗦 |
| **结构** | 固定开头信息行 → 问候 → 简短自我介绍（1句）→ 个性化内容（2句）→ 祝愿+签名 |
| **开头格式** | 固定开头行（日期/气温/天气）**全部使用英文**，天气描述用英语单词（如 Sunny、Overcast），气温前加 `~` 表示估算 |

**⚠️ 内容真实性原则（核心约束，不可违反）：**

生成正文时，**所有内容必须基于用户通用内容模板中已明确写出的事实，严禁编造任何未经用户确认的经历、行为或状态。**

| ❌ 禁止 | ✅ 允许 |
|---------|---------|
| "我最近刚看了龙猫" — 用户从未提及看过龙猫 | "我听说龙猫是适合家庭一起看的动画" |
| "我上周去爬山了" — 用户未提及 | "我平时喜欢骑行和跑步" — 用户模板中已有 |
| "我女儿很喜欢你推荐的东西" — 用户未说 | "家里新添了小宝宝" — 用户模板中已有 |
| 任何以"我最近…""我正在…""我刚刚…"开头但并非来自用户模板的内容 | 基于用户模板中明确信息的延伸和表达 |

**匹配点的处理原则：**
- 若收件人喜好与用户模板中某项内容**确实有交集**→ 自然融入，直接呼应
- 若收件人喜好与用户模板**没有直接关联**→ 使用「收件人介绍了 X，用户表示对此感兴趣/祝福」的间接表达，**不要强行编造关联**
- 可以说"听说你喜欢 X，听起来很有趣！"，但不能说"我也很喜欢 X"（除非用户模板中确有此内容）

**📌 正文固定开头格式（每封必须包含，无论收件人是否有特殊要求）：**

每封明信片正文**开头第一行**固定为以下格式的信息行（在称呼 `Dear…` 之前）：

```
{Mon} {Day}, {Year}   {temp}°C {weather_emoji}
```

示例：`Jan 29, 2026   15°C 🌤️`

- **日期**：使用**今天的系统日期**（即用户实际寄出明信片的日期，不是 Postcrossing 地址邮件的收到日期）。若用户明确说明寄出日期不同，以用户说的为准。
- **气温**：根据 `POSTCARD_SENDER_CITY`（从 `.env_postcrossing` 读取）+ **今天日期**所在月份推断；若用户通用模板中有更准确数据则优先使用
- **天气 emoji**：用单个 emoji 表示当天天气（☀️晴 / 🌤️多云 / 🌥️阴 / 🌧️雨 / ❄️雪 / 🌫️雾）
- **中文对照**：中文版保留完全相同的这行（格式一致）

> 💡 此固定开头满足了大多数 Postcrossing 玩家「希望了解寄件方当地天气/日期」的期待，无需等待收件人特别要求。

**示例输出格式**：

```
【英文】
Jan 29, 2026   15°C 🌤️

Dear {recipient_name},

Greetings from Shenzhen! I'm {sender_name}, an IT analyst enjoying a career break
with a newborn at home. I heard you love {interests} — {personalized_content}.
Wishing you joy and {positive_trait} days ahead!

Warm regards, {sender_name}

【中文对照】
Jan 29, 2026   15°C 🌤️

亲爱的{收件人名}，

来自深圳的问候！我是{寄件人名}，一名IT分析师，正在享受有新生儿相伴的育儿假期。
听说你喜欢{兴趣}——{个性化内容}。祝你快乐，{美好}的每一天！

温暖的祝福，{寄件人名}
```

---

#### 5.2 增量检测与生成（Incremental Generation）

**生成前先检测同名正文文件是否已存在：**

```
检测路径：{user_workspace}/postcrossing_content/{date}_postcard-content.md
```

- **已存在** → 读取文件 frontmatter 中的 `generated_ids` 列表，与本次待生成的 ID 对比：
  - **有新增 ID**（来自 Step 3 刚追加的新批次）→ 直接追加，无需询问
  - **全部已生成**（无新增 ID）→ 告知用户并确认：
    > 「`{date}_postcard-content.md` already exists with {N} postcards. Regenerating will **overwrite** the file. Continue?
    > - **A. Continue**（Overwrite）
    > - **B. Cancel**（Keep existing file）」
- **不存在** → 直接创建并生成

**正文文件格式（含 frontmatter + 增量追加结构）：**

```markdown
---
date: {YYYY-MM-DD}
total: {total_count}
generated_ids:
  - {postcard_id_1}
  - {postcard_id_2}
  - ...（每次追加时同步更新此列表和 total）
last_updated: {YYYY-MM-DD HH:MM}
---

# Postcard Messages — {date}（{count} postcards）

---

## Batch 1（{N} postcards，{timestamp}）

### [{postcard_id}] {name}（{country}）

Match: {matched_element or "No direct match, use universal greeting"}

【English】
...

【Chinese Translation】（Only for LANG=zh users）
...

---

## Batch 2（{M} postcards，{timestamp}）（Append when adding new batch）

...
```

> ⚠️ **追加规则**：每次追加新批次时，同步更新 frontmatter 的 `total`、`generated_ids`（追加新 ID）和 `last_updated`，正文标题"共 {数量} 封"也同步更新。

#### 5.3 核心策略：通用内容 × 收件人喜好 智能匹配

在生成每封明信片时，AI 需主动检查用户的通用内容中是否存在与该收件人背景/喜好相关联的元素：

| 匹配类型 | 示例 |
|----------|------|
| **职业共鸣** | 收件人是老师/医生，用户通用内容中提到"我妈妈是老师/医生"→ 加入这个关联，说"我的妈妈也是…"，亲切感倍增 |
| **兴趣交集** | 收件人喜欢宫崎骏，用户通用内容提到最近看了某部动画 → 可以顺势推荐或共鸣 |
| **地域关联** | 收件人来自某个城市/国家，用户通用内容提到去过那里或对那里有了解 → 自然融入 |
| **季节/天气** | 收件人要求写日期/天气，结合用户通用内容中的季节感受 → 丰富细节 |
| **无关联时** | 使用通用内容中的一段话作为自然引言，再聚焦到收件人喜好上 |

#### 5.4 Prompt 模板（Step 5 Prompt Template）

```
You are helping write a warm and personalized postcard message for a Postcrossing recipient.

Recipient info:
- Name: {name}
- Country: {country}
- City: {city}
- Card preference: {card_preference}
- Content preference: {content_preference}
- Special requests: {special_requests}
- Personal highlights: {personal_highlights}
- Postcrossing experience: sent {sent} / received {received}

Sender's personal context (user-provided template):
{user_template_content}

Matching instruction:
- Carefully check if any element in the sender's context connects with the recipient's background, profession, interests, or special requests.
- If a connection exists, naturally weave it into the message (e.g., "My mom is also a teacher, so I deeply respect...").
- If no direct connection, use the sender's context as a warm self-introduction and then pivot to what the recipient enjoys.
- Do NOT force connections that feel unnatural.

IMPORTANT - Fixed opening line (MANDATORY for every postcard, no exceptions):
- The VERY FIRST line of every postcard must be in this exact format:
  {Mon} {Day}, {Year}   {temp}°C {weather_emoji}
- Example: Jan 29, 2026   15°C 🌤️
- Place this line BEFORE "Dear {name},"
- This applies to ALL postcards regardless of whether the recipient requests it.
- Use a single weather emoji only (☀️ sunny / 🌤️ partly cloudy / 🌥️ overcast / 🌧️ rain / ❄️ snow / 🌫️ fog).
- No label icons (no 📅, no 🌡️). Just date, temperature, weather emoji — clean and minimal.
- City for temperature estimation: use POSTCARD_SENDER_CITY from .env_postcrossing (e.g. "Shenzhen"). Estimate based on city + month.
- In the postcard greeting body, use "Greetings from {POSTCARD_SENDER_CITY}!" consistently.

IMPORTANT - Content truthfulness (NEVER violate):
- Only include sender experiences and facts that are EXPLICITLY stated in the sender's personal context above.
- NEVER invent experiences, recent activities, or behaviors not mentioned in the context.
- For recipient interests not matching any sender context: use "I heard you love X — it sounds wonderful!" style phrasing.
- NEVER write "I also love X" or "I recently did X" unless explicitly in the sender's context.

IMPORTANT - Length and style:
- Write a SHORT postcard message: **strictly 60-90 words** (postcards have limited space!), NOT counting the opening info line.
- After writing, **self-check word count**. If over 90 words, trim immediately. If under 60 words, expand slightly. Do NOT output without verifying word count.
- Be concise and warm. Cut any filler phrases. Every sentence should add value.
- Keep polite but NOT verbose. No need for long paragraphs.

Write the message in English only. The Chinese translation will be added separately.
```

#### 5.5 批量生成流程（Batch Generation Process）

```
FOR each recipient in analysis file:
  1. 读取收件人喜好摘要
  2. 比对用户通用内容，判断匹配点（只使用模板中已有的事实，不编造）
  3. 构造 prompt 并生成正文
  4. 正文开头第一行固定为：{Mon} {Day}, {Year}   {temp}°C {weather_emoji}
     ⚠️ 日期使用今天的系统日期（寄出日期），不是 Postcrossing 地址邮件的收到日期
  5. 自检字数：正文主体必须在 60-90 词之间（不含开头信息行），超出则修剪，不足则补充
  6. 输出格式（含中文对照）：
     [postcard_id] {name}（{country}）
     匹配点：{matched_element 或 "无直接关联，使用收件人兴趣作为引言"}
     ---
     【英文】
     Jan 29, 2026   15°C 🌤️
     {generated_postcard_text_EN}
     
     【中文对照】
     Jan 29, 2026   15°C 🌤️
     {translation_CN}
     ---
END
```

#### 5.6 手绘提示（Hand-drawn Emoji Guide）

当收件人特别要求「手写」日期/温度/天气（通常说 "please write it on the card by hand"）时，额外给用户一条手绘提示（正文固定开头已自动满足此需求，无需另外生成文字版）：

```
📝 手绘提示（如收件人要求手写：请在明信片上画出以下内容）：

  {Mon} {Day}, {Year}   {temp}°C {weather_emoji}
  示例：Jan 29, 2026   15°C 🌤️

  天气 emoji 对照：
  ☀️ 晴天   ⛅ 多云   🌥️ 阴天   🌧️ 雨天   ❄️ 雪天   🌫️ 雾天

  建议在明信片空白处，用简笔画画一个小温度计和天气符号，
  配上日期数字，比文字更有趣，也更节省空间！
```

> 💡 生成完成后，询问用户是否满意，或是否需要对某封进行重新生成 / 手动调整。

---

## 输出文件与模板

本 skill 生成以下文件，保存到 `{user_workspace}/postcrossing_content/` 目录：

| 输出文件 | 对应步骤 | 模板文件（必须参考） | 说明 |
|----------|----------|---------------------|------|
| `{date}_recipient-analysis.md` | Step 3 | `templates/recipient-analysis-template.md` | 收片喜好分析，frontmatter 含 `processed_ids`，支持增量追加 |
| `user-content-template.md` | Step 4 | `templates/user-content-template.md` | 用户个人素材模板，**固定文件名**，跨批次复用 |
| `{date}_postcard-content.md` | Step 5 | `templates/postcard-content-template.md` | 生成的明信片正文（英文+中文对照），frontmatter 含 `generated_ids`，支持增量追加 |

> ⚠️ **强制引用规则（不可违反）**：
> - 创建输出文件时，**必须**以对应模板文件为基础，用实际数据填充占位符
> - **不得改变**表格列名、frontmatter 字段名、区块标题格式
> - 模板文件本身不应出现在 `postcrossing_content/` 输出目录中
> - 所有文件均保存在**用户的 workspace 根目录**下的 `postcrossing_content/` 中，与 skill 安装路径无关

脚本使用方法详见 [Step 1: 环境初始化](#step-1环境初始化environment-setup) 的 1.4-1.6 小节。

---

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| 未找到配置文件 | 请确保 `.env_postcrossing` 文件位于**项目根目录**（即 `自动生成明信片寄信内容/.env_postcrossing`，不是 skill 子目录）。文件不存在时会提示期望路径 |
| 邮箱后缀不在内置列表 | 在 `.env_postcrossing` 中手动添加 `IMAP_HOST=imap.yourdomain.com` 等覆盖配置 |
| 搜索不到邮件（国家编码问题） | 检查 `.env_postcrossing` 中 `POSTCARD_COUNTRY_CODE` 是否正确（默认 `CN`）；Postcrossing 地址邮件主题格式为 `Postcrossing Postcard ID: {CODE}-XXXXXXX` |
| 正文城市名不对 | 检查 `.env_postcrossing` 中 `POSTCARD_SENDER_CITY` 是否正确，直接修改 `.env_postcrossing` 文件中的值即可 |
| 找不到 `{user_folder_name}` 文件夹 | 运行 `node scripts/list-folders.js` 查看实际文件夹完整路径，实际路径可能带有父级文件夹前缀 |
| 搜索不到邮件 | 确认 Postcrossing 邮件已自动分类到该文件夹；检查主题是否包含 `Postcrossing Postcard ID` |
| 日期过滤无结果 | 确认 `--date` 格式为 `YYYY-MM-DD`；检查该日期是否确实有邮件 |
| 增量追加后总数不对 | 检查分析文件 frontmatter 的 `processed_ids` 列表是否正确更新，`total` 字段是否同步修改 |
| 新增 ID 未被识别 | 确认新邮件的 `postcard_id` 格式与 frontmatter 中的格式一致（如 `CN-XXXXXXX`） |
| Content lacks personalization | Provide richer user content template in Step 4, including occupation, family, recent experiences, etc. |
| analysis 目录保存位置错误 | 确认文件保存在**用户 workspace 根目录**的 `postcrossing_content/` 下，而非 skill 安装目录 |
| Cannot find previous template | Check if `user-content-template.md` exists in user's workspace `postcrossing_content/` directory (fixed filename) |
| Content too long | Step 5 target: 60-90 words. If too long, prompt AI to condense: "Please keep it under 80 words" |
| 匹配点过于牵强 | 可在 Step 5 生成后手动告知 AI 删除某个匹配，进行重新生成 |
| 中文翻译有误 | 可直接告知 AI「第X封的翻译有误，请修正」，AI 会单独重新翻译 |

---

## 安全提醒

### 凭证保护
- `.env_postcrossing` 文件已加入 `.gitignore`，**不会**被提交到版本控制
- 邮箱凭证仅用于连接 IMAP 服务器读取邮件，**不会**发送到任何外部服务
- 建议定期更换邮箱授权码/应用专用密码

### 数据本地存储
- Analysis results and user content template are saved locally in `postcrossing_content/` directory, not uploaded to any external service
- 生成内容不包含任何个人敏感信息（地址等已通过占位符处理）
- 所有示例数据使用占位符（如 `{name}`、`{country}`）而非真实信息

### TLS 证书验证说明

部分邮箱（QQ、Gmail）默认关闭 TLS 证书严格验证 (`rejectUnauthorized: false`)，原因如下：

| 邮箱 | 原因 | 风险 | 缓解措施 |
|------|------|------|---------|
| QQ 邮箱 | 官方证书链在 Node.js 中验证失败 | 公共 WiFi 下存在中间人攻击可能 | 使用授权码（非登录密码），可手动开启 `IMAP_REJECT_UNAUTHORIZED=true` |
| Gmail | Node.js 内置证书与 Gmail 偶有兼容问题 | 同上 | 使用应用专用密码（非主密码），可手动开启 `IMAP_REJECT_UNAUTHORIZED=true` |

**建议**：在可信网络环境下使用，或手动开启严格验证：
```bash
# 在 .env_postcrossing 中添加
IMAP_REJECT_UNAUTHORIZED=true
```


