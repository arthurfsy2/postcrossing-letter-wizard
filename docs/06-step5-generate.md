# Step 5: 生成明信片正文（Generate Postcard Content）

> 📋 **对应 SKILL.md 章节**：执行流程 → Step 5  
> **优先级**：高

---

## 功能说明

综合 Step 3 的收件人喜好分析 + Step 4 的用户内容模板，逐一生成明信片正文。

**输出路径**：`{user_workspace}/postcrossing_content/{date}/{date}_postcard-content.md`

---

## 模板引用

**必须严格参考**：`templates/postcard-content-template.md`

**格式要求**：
- frontmatter 字段（date, total, generated_ids, last_updated）
- 固定开头行格式（日期/气温/天气）
- 英文 + 中文对照格式

---

## 生成规范

| 规范项 | 要求 |
|--------|------|
| **语言** | 英文，每封下方附**中文对照翻译**供用户核对 |
| **字数** | **60～90 词**（明信片背面空间有限，宁短勿长） |
| **语气** | 温暖、真诚、个人化，精炼不啰嗦 |
| **结构** | 固定开头信息行 → 问候 → 简短自我介绍（1 句）→ 个性化内容（2 句）→ 祝愿 + 签名 |
| **开头格式** | 固定开头行（日期/气温/天气）**全部使用英文** |

---

## ⚠️ 内容真实性原则（核心约束，不可违反）

**生成正文时，所有内容必须基于用户通用内容模板中已明确写出的事实，严禁编造任何未经用户确认的经历、行为或状态。**

| ❌ 禁止 | ✅ 允许 |
|---------|---------|
| "我最近刚看了龙猫" — 用户从未提及看过龙猫 | "我听说龙猫是适合家庭一起看的动画" |
| "我上周去爬山了" — 用户未提及 | "我平时喜欢骑行和跑步" — 用户模板中已有 |
| "我女儿很喜欢你推荐的东西" — 用户未说 | "家里新添了小宝宝" — 用户模板中已有 |
| 任何以"我最近…""我正在…""我刚刚…"开头但并非来自用户模板的内容 | 基于用户模板中明确信息的延伸和表达 |

**匹配点的处理原则**：
- 若收件人喜好与用户模板中某项内容**确实有交集** → 自然融入，直接呼应
- 若收件人喜好与用户模板**没有直接关联** → 使用「收件人介绍了 X，用户表示对此感兴趣/祝福」的间接表达，**不要强行编造关联**

---

## 固定开头格式

每封明信片正文**开头第一行**固定为以下格式的信息行（在称呼 `Dear…` 之前）：

```
{Mon} {Day}, {Year}   {temp}°C {weather_emoji}
```

**示例**：`Jan 29, 2026   15°C 🌤️`

- **日期**：使用**今天的系统日期**（即用户实际寄出明信片的日期，不是 Postcrossing 地址邮件的收到日期）
- **气温**：根据 `POSTCARD_SENDER_CITY`（从 `.env_postcrossing` 读取）+ **今天日期**所在月份推断
- **天气 emoji**：用单个 emoji 表示当天天气（☀️晴 / 🌤️多云 / 🌥️阴 / 🌧️雨 / ❄️雪 / 🌫️雾）
- **中文对照**：中文版保留完全相同的这行（格式一致）

> 💡 此固定开头满足了大多数 Postcrossing 玩家「希望了解寄件方当地天气/日期」的期待，无需等待收件人特别要求。

---

## 增量检测与生成

**生成前先检测同名正文文件是否已存在**：

**检测路径**：`{user_workspace}/postcrossing_content/{date}_postcard-content.md`

### 已存在

读取文件 frontmatter 中的 `generated_ids` 列表，与本次待生成的 ID 对比：

**有新增 ID**（来自 Step 3 刚追加的新批次）→ 直接追加，无需询问

**全部已生成**（无新增 ID）→ 告知用户并确认：
```
`{date}_postcard-content.md` already exists with N postcards. Regenerating will **overwrite** the file. Continue?
- A. Continue（Overwrite）
- B. Cancel（Keep existing file）
```

### 不存在

直接创建并生成

---

## 核心策略：通用内容 × 收件人喜好 智能匹配

在生成每封明信片时，AI 需主动检查用户的通用内容中是否存在与该收件人背景/喜好相关联的元素：

| 匹配类型 | 示例 |
|----------|------|
| **职业共鸣** | 收件人是老师/医生，用户通用内容中提到"我妈妈是老师/医生"→ 加入这个关联，说"我的妈妈也是…"，亲切感倍增 |
| **兴趣交集** | 收件人喜欢宫崎骏，用户通用内容提到最近看了某部动画 → 可以顺势推荐或共鸣 |
| **地域关联** | 收件人来自某个城市/国家，用户通用内容提到去过那里或对那里有了解 → 自然融入 |
| **季节/天气** | 收件人要求写日期/天气，结合用户通用内容中的季节感受 → 丰富细节 |
| **无关联时** | 使用通用内容中的一段话作为自然引言，再聚焦到收件人喜好上 |

---

## HTML 批量打印版（功能 10 & 11）

**生成时机**：Step 5 完成后，用户选择打印时。

> 📋 **模板引用**：使用 `templates/print-html-template.html`，脚本自动填充。

**HTML 特点**：
- A4 纸张排版，适合标准打印机
- CSS 虚线剪切线，方便裁剪
- 智能手写偏好检测：偏好手写的收件人用红色边框 + 🖐️ 标记

**智能手写偏好检测**：
1. **扫描 `recipient-analysis.md`**，查找关键词：
   - 英文：`handwritten`, `handwriting`, `write by hand`, `hand-written`
   - 中文：`手写`, `亲笔`, `手写的`

2. **标记偏好手写的收件人**：
   ```
   ⚠️ 注意：以下收片人明确表示偏好手写内容
   - CN-XXXXXXX ({Name}): "I enjoy handwritten postcards"
   - CN-XXXXXXX ({Name}): "Please write by hand"
   
   建议：这些明信片请手写，其余可打印
   ```

3. **HTML 中高亮标记**：
   - 偏好手写：红色边框 + 🖐️ 标记 + 浅红色背景
   - 无特殊要求：正常显示

**文件保存**：`{user_workspace}/postcrossing_content/{date}/{date}_print.html`

**脚本调用**：
```bash
node scripts/generate-print-html.js --date {YYYY-MM-DD} --output {output.html}
```

**用户选择后的处理**：
```
用户选择打印 → 生成 HTML 文件 → 告知用户：

🖨️ HTML 打印版已生成：{date}_print.html

特点：
- A4 纸张排版，可直接打印
- 虚线剪切线，方便裁剪
- 红色边框标记建议手写的收件人

操作建议：
1. 用浏览器打开 HTML 文件预览
2. 使用 A4 纸打印
3. 沿虚线剪下每条内容
4. 手写红色标记的明信片，其余可粘贴

是否需要发送邮件备份？（Step 6）
- 是 → 进入 Step 6
- 否 → 流程结束
```

> ✅ **实现方式**：使用模板文件 + 脚本生成（`scripts/generate-print-html.js`）。Token 消耗从 ~10K 降至 ~1K（节省 90%）。

---

## 相关文件

- **模板**：
  - `{skill_path}/templates/postcard-content-template.md`
  - `{skill_path}/templates/print-html-template.html`
- **脚本**：`{skill_path}/scripts/generate-print-html.js`
- **输出路径**：`{user_workspace}/postcrossing_content/{date}/`
