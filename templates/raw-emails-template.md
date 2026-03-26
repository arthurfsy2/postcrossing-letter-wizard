---
date: "{YYYY-MM-DD}"
total: {邮件数量}
folder: "{邮件文件夹路径}"
uids: [{UID1, UID2, UID3}]
---

# Raw Emails - {YYYY-MM-DD}

> 原始邮件内容，用于排查和参考
> - 生成日期：{YYYY-MM-DD}
> - 邮件数量：{邮件数量}
> - 来源文件夹：{邮件文件夹路径}

---

## 1. Postcard ID: {CN-XXXXXXX}

**Subject:** {邮件主题}
**From:** {发件人}
**Date:** {ISO 日期时间}

### Raw Content

```
{完整的邮件正文内容}
```

---

## 2. Postcard ID: {CN-XXXXXXX}

**Subject:** {邮件主题}
**From:** {发件人}
**Date:** {ISO 日期时间}

### Raw Content

```
{完整的邮件正文内容}
```

---

## 使用说明

### 用途
本文件包含原始邮件内容，用于：
1. 排查邮件是否为期望的 Postcrossing 地址邮件
2. 验证 UID 与 Postcard ID 的对应关系
3. 作为 Step 3 分析收件人的输入参考

### 下一步
确认邮件内容无误后，继续 Step 3：分析收件人

AI 将读取本文件，提取每位收件人的：
- 姓名
- 国家/城市
- 兴趣爱好
- 特殊要求（如手写偏好）

并生成 `{date}_recipient-analysis.md` 文件。

---

## 注意事项

- 本文件由 `save-raw-emails.js` 脚本自动生成
- 文件位置：`postcrossing_content/{YYYY-MM-DD}/{YYYY-MM-DD}_raw-emails.md`
- 不要手动修改本文件（仅供排查参考）
