# Step 6: 发送邮件备份（Send Email Backup）

> 📋 **对应 SKILL.md 章节**：执行流程 → Step 6  
> **优先级**：中  
> **完成时间**：2026-03-26

---

## 功能说明

将生成的所有内容压缩成 zip 文件，发送到用户自己的邮箱。

**触发条件**：Step 5 完成后，询问用户是否需要发送邮件备份。

---

## 实现逻辑

### 1. 询问用户

```
✉️ 所有内容已生成完毕！

是否需要将文件打包发送到你的邮箱（{EMAIL_ACCOUNT}）？

- A. 是 → 发送压缩包
- B. 否 → 流程结束

请回复 A 或 B：
```

### 2. 用户选择后执行

**压缩文件**：
- 文件列表：`{date}_raw-emails.md` + `{date}_recipient-analysis.md` + `{date}_postcard-content.md`
- 压缩包名：`{date}_postcrossing-package.zip`
- 压缩包路径：`{user_workspace}/postcrossing_content/{date}/{date}_postcrossing-package.zip`

**发送邮件**：
- 使用 `nodemailer` 库（已在 package.json 中）
- 复用 `.env_postcrossing` 中的邮箱配置（`EMAIL_ACCOUNT` 和 `EMAIL_AUTH_CODE`）
- 自己发送给自己
- 邮件正文提供简要说明和使用提示

### 3. 邮件内容模板

**主题**：`Postcrossing 明信片内容 - {date}`

**正文**：
```
你好！

这是 {date} 生成的 Postcrossing 明信片内容，包含以下文件：
- {date}_raw-emails.md：原始邮件内容
- {date}_recipient-analysis.md：收件人分析
- {date}_postcard-content.md：生成的明信片正文

请解压后查看。

---
由 Postcrossing Letter Wizard 自动生成
```

---

## 技术实现

**使用库**：
- `archiver`：压缩文件
- `nodemailer`：SMTP 发送邮件

**SMTP 配置**：
- 复用 IMAP 配置（大多数邮箱的 SMTP 和 IMAP 授权码相同）
- SMTP 服务器地址（如果和 IMAP 不同）：
  - QQ 邮箱 SMTP：`smtp.qq.com:465` 或 `smtp.qq.com:587`
  - Gmail SMTP：`smtp.gmail.com:465` 或 `smtp.gmail.com:587`

---

## Step 6 完成后的确认点

```
✅ 邮件已发送到 {EMAIL_ACCOUNT}

压缩包包含：
- {date}_raw-emails.md
- {date}_recipient-analysis.md
- {date}_postcard-content.md

流程已全部完成！🎉
```

---

## 相关文件

- **脚本依赖**：`{skill_path}/package.json`（含 `nodemailer` 和 `archiver`）
- **配置文件**：`{user_workspace}/.env_postcrossing`
- **压缩包路径**：`{user_workspace}/postcrossing_content/{date}/`
