# Step 2.5: 保存原始邮件内容（Save Raw Emails）

> 📋 **对应 SKILL.md 章节**：执行流程 → Step 2.5  
> **优先级**：高  
> **完成时间**：2026-03-26

---

## 功能说明

将原始邮件内容保存为 Markdown 文件，方便用户排查和参考。

**输出路径**：`{user_workspace}/postcrossing_content/{date}/{date}_raw-emails.md`

---

## 脚本调用

```bash
node scripts/save-raw-emails.js --uids {UID1,UID2,UID3} --folder "{folder_path}" --date {YYYY-MM-DD}
```

**参数说明**：
- `--uids`：邮件 UID 列表（逗号分隔）
- `--folder`：邮件文件夹完整路径
- `--date`：日期（用于文件名和文件夹名）

---

## 输出文件结构

```
postcrossing_content/
├── 2026-03-26/
│   └── 2026-03-26_raw-emails.md   ← 本步骤生成
├── 2026-01-29/
│   └── 2026-01-29_raw-emails.md
└── user-content-template.md       ← 全局模板，不在日期文件夹
```

---

## 文件格式

**模板引用**：`templates/raw-emails-template.md`

**Frontmatter**：
```yaml
---
date: "2026-03-26"
total: 10
folder: "其他文件夹/Postcrossing_sent"
uids: [211, 212, 213, ...]
---
```

**正文结构**：
- 每封邮件一个章节
- 包含完整邮件正文
- 包含 Postcard ID、Subject、From、Date 等元数据

---

## Step 2.5 完成后的确认点

```
📧 已保存 N 封原始邮件到 {date}/{date}_raw-emails.md

查看文件确认内容无误后，请回复：
- 继续 → 进入 Step 3：分析收件人
- 修改 → 重新选择邮件或日期范围
```

> ⚠️ **强制等待**：必须等待用户确认后，才能进入 Step 3。

---

## 相关文件

- **脚本**：`{skill_path}/scripts/save-raw-emails.js`
- **模板**：`{skill_path}/templates/raw-emails-template.md`
- **输出路径**：`{user_workspace}/postcrossing_content/{date}/`
