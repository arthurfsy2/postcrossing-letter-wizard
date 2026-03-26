# Postcrossing Letter Wizard - 详细文档索引

> 📋 **主文档**：`../SKILL.md`（流程索引）  
> 📁 **模板目录**：`../templates/`  
> 📜 **脚本目录**：`../scripts/`

---

## 📚 文档结构

本目录包含 Skill 各步骤的详细文档，SKILL.md 只保留流程索引。

---

## 📖 执行流程文档

| 序号 | 文档 | 说明 | 优先级 |
|:---:|------|------|:------:|
| 1 | [01-step1-setup.md](./01-step1-setup.md) | Step 1: 环境初始化（含双模式配置）| 🔴 高 |
| 2 | [02-step2-search.md](./02-step2-search.md) | Step 2: 搜索邮件 | 🔴 高 |
| 3 | [03-step2.5-raw-emails.md](./03-step2.5-raw-emails.md) | Step 2.5: 保存原始邮件内容 | 🔴 高 |
| 4 | [04-step3-analysis.md](./04-step3-analysis.md) | Step 3: 保存收片喜好分析 | 🔴 高 |
| 5 | [05-step4-user-content.md](./05-step4-user-content.md) | Step 4: 收集用户内容模板（含博客导入）| 🔴 高 |
| 6 | [06-step5-generate.md](./06-step5-generate.md) | Step 5: 生成明信片正文（含 HTML 打印）| 🔴 高 |
| 7 | [07-step6-email-backup.md](./07-step6-email-backup.md) | Step 6: 发送邮件备份 | 🟡 中 |

---

## 🔧 功能机制文档

| 序号 | 文档 | 说明 | 优先级 |
|:---:|------|------|:------:|
| 8 | [08-recovery-mechanism.md](./08-recovery-mechanism.md) | 流程中断恢复机制 | 🔴 高 |
| 9 | [09-confirm-strategy.md](./09-confirm-strategy.md) | 每步确认策略 | 🟡 中 |
| 10 | [10-dual-mode-config.md](./10-dual-mode-config.md) | Step 1 双模式配置 | 🟡 中 |
| 11 | [11-time-estimation.md](./11-time-estimation.md) | 步骤预计时间提示 | 🟢 低 |

---

## ✅ 已完成功能清单（2026-03-26 更新）

| 序号 | 功能 | 优先级 | 完成时间 | 对应文档 |
|:---:|------|:------:|:--------:|---------|
| 1 | `{date}_raw-emails.md` 模板 + 日期子文件夹 | 高 | 2026-03-26 | [03-step2.5-raw-emails.md](./03-step2.5-raw-emails.md) |
| 2 | 流程中断恢复机制 | 高 | 2026-03-26 | [08-recovery-mechanism.md](./08-recovery-mechanism.md) |
| 3 | Step 4 博客/笔记导入 | 高 | 2026-03-26 | [05-step4-user-content.md](./05-step4-user-content.md) |
| 5 | Step 6 发送邮件备份 | 中 | 2026-03-26 | [07-step6-email-backup.md](./07-step6-email-backup.md) |
| 7 | 每步确认策略 | 中 | 2026-03-26 | [09-confirm-strategy.md](./09-confirm-strategy.md) |
| 8 | Step 1 双模式配置 | 中 | 2026-03-26 | [10-dual-mode-config.md](./10-dual-mode-config.md) |
| 9 | 步骤预计时间提示 | 低 | 2026-03-26 | [11-time-estimation.md](./11-time-estimation.md) |
| 10 & 11 | HTML 批量打印版 + 手写检测 | 中高 | 2026-03-26 | [06-step5-generate.md](./06-step5-generate.md) |

---

## 📁 文件结构总览

```
postcrossing-letter-wizard/
├── SKILL.md                    # 主文档：流程索引（~200 行）
├── docs/                       # 详细文档目录（本目录）
│   ├── README.md               # 本文档（索引）
│   ├── 01-step1-setup.md       # Step 1 详细文档
│   ├── 02-step2-search.md      # Step 2 详细文档
│   ├── 03-step2.5-raw-emails.md
│   ├── 04-step3-analysis.md
│   ├── 05-step4-user-content.md
│   ├── 06-step5-generate.md
│   ├── 07-step6-email-backup.md
│   ├── 08-recovery-mechanism.md
│   ├── 09-confirm-strategy.md
│   ├── 10-dual-mode-config.md
│   └── 11-time-estimation.md
├── templates/                  # 模板文件
│   ├── raw-emails-template.md
│   ├── recipient-analysis-template.md
│   ├── user-content-template.md
│   ├── postcard-content-template.md
│   └── print-html-template.html
└── scripts/                    # 脚本文件
    ├── imap-config.js
    ├── list-folders.js
    ├── search-postcrossing.js
    ├── get-postcrossing-body.js
    ├── save-raw-emails.js
    └── generate-print-html.js
```

---

## 🔗 使用指南

**AI 参考流程**：
1. 读取 `SKILL.md` 了解整体流程
2. 需要详细步骤说明时，参考对应 `docs/*.md` 文档
3. 需要模板格式时，参考 `templates/*.md` 文件
4. 需要调用脚本时，参考 `scripts/*.js` 文件

**优势**：
- ✅ SKILL.md 精简到 ~200 行，易于读取和修改
- ✅ 详细内容分散到独立文档，结构清晰
- ✅ 模板内容独立管理，不混在流程说明中
- ✅ 修改某个步骤时，只需更新对应文档

---

## 📝 更新记录

| 日期 | 更新内容 | 对应文档 |
|------|---------|---------|
| 2026-03-26 | 创建 docs 目录，拆分详细文档 | 所有文档 |
| 2026-03-26 | 添加 Step 2.5、Step 6、HTML 打印等功能 | 对应文档 |
