# Step 3: 保存收片喜好分析（Save Recipient Analysis）

> 📋 **对应 SKILL.md 章节**：执行流程 → Step 3  
> **优先级**：高

---

## 功能说明

将 Step 2 的分析结果保存为本地 Markdown 文件，供后续查阅、积累。

**输出路径**：`{user_workspace}/postcrossing_content/{date}_recipient-analysis.md`

---

## 模板引用

**必须严格参考**：`templates/recipient-analysis-template.md`

**格式要求**：
- frontmatter 字段（date, total, processed_ids, last_updated）
- 表格结构（Card Preference, Content Preference 等）
- 区块标题格式

---

## 增量处理逻辑

### 检测同名文件是否已存在

**检测路径**：`{user_workspace}/postcrossing_content/{date}_recipient-analysis.md`

### 情况 A：已存在

读取 frontmatter 中的 `processed_ids` 列表，与本次搜索到的邮件 ID 对比：

**有新增 ID**：
```
已找到 {date}_recipient-analysis.md（已处理 N 位），本次新增 M 个 ID：{new_ids_list}。是否继续分析并追加？
- A. 继续 → 只分析新增 ID，追加到原文件
- B. 取消 → 保留原文件，进入 Step 4
```

**无新增 ID**：
```
当天所有 N 封邮件均已分析，无新增内容，直接复用原文件。
```

### 情况 B：不存在

正常执行分析并创建新文件

---

## 文件格式

**Frontmatter**：
```yaml
---
date: "2026-01-29"
total: 10
processed_ids:
  - CN-XXXXXXX
  - CN-XXXXXXX
  - ...
last_updated: "2026-01-29 15:30"
---
```

**正文结构**：
```markdown
# Recipient Preference Analysis — 2026-01-29（Total 10 recipients）

---

## Batch 1（10 recipients，2026-01-29 15:30）

### 1. [CN-XXXXXXX] {Recipient_Name}（{Country}）

| Dimension | Content |
|-----------|---------|
| Card Preference | {card_preference} |
| Content Preference | {content_preference} |
| Language Preference | {language_preference} |
| Special Requests | {special_requests} |
| Personal Highlights | {personal_highlights} |
| Postcrossing Experience | Sent 9 / Received 8 |

---
```

> ⚠️ **追加规则**：每次追加新批次时，同步更新 frontmatter 的 `total`、`processed_ids`（追加新 ID）和 `last_updated`。

> ✅ **processed_ids 自动提取**：从文件正文中已写入的区块自动提取（从每个 `### N. [{postcard_id}]` 标题行中解析 ID），不得手动填写。

---

## Step 3 完成后的确认点

```
📊 已分析 N 位收件人，保存到 {date}/{date}_recipient-analysis.md

查看文件确认内容无误后，请回复：
- 继续 → 进入 Step 4：收集用户素材
- 修改 → 重新分析或调整偏好
```

> ⚠️ **强制等待**：必须等待用户确认后，才能进入 Step 4。

---

## 相关文件

- **模板**：`{skill_path}/templates/recipient-analysis-template.md`
- **输出路径**：`{user_workspace}/postcrossing_content/`
