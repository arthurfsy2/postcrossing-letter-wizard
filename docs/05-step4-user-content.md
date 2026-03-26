# Step 4: 收集用户内容模板（Collect User Template）

> 📋 **对应 SKILL.md 章节**：执行流程 → Step 4  
> **优先级**：高  
> **完成时间**：2026-03-26（博客/笔记导入功能）

---

## 功能说明

收集用户个人素材，用于生成个性化明信片内容。支持两种素材来源：
- A. 手动输入
- B. 从博客/笔记导入（新增）

**输出路径**：`{user_workspace}/postcrossing_content/user-content-template.md`（固定文件名，跨批次复用）

---

## 模板引用

**必须严格参考**：`templates/user-content-template.md`

**格式要求**：
- frontmatter 字段（last_updated）
- User Input 区块
- Usage History 区块

---

## 操作流程

### 首先询问用户

```
Analysis saved ✅ Continue to generate postcard content?
- YES → Check user content template
- NO → 流程结束，提醒用户可随时重新触发
```

### 检测用户内容模板文件

**检测路径**：`{user_workspace}/postcrossing_content/user-content-template.md`

#### 情况 A：已有模板文件

直接读取并使用，无需每次向用户确认。

**主动询问的情况**：
- 用户在对话中明确说「我想更新模板」/「换一份」/「重新填写」
- 用户提到模板里描述的近况已过时（如超过 30 天且用户有新内容要补充）

**告知用户**：
```
✅ User content template loaded (last updated: {last_updated})
```

若用户想修改：
```
Say "update template" to add new content, or "replace template" to start fresh.
```

#### 情况 B：没有模板文件（首次使用）

**提供两种素材收集方式**：
```
📝 收集个人素材（用于生成个性化明信片内容）

请选择素材来源：

A. ✍️ 手动输入（推荐普通用户）
   - 直接分享近期生活、爱好、职业等
   - AI 会引导提供必要信息

B. 📁 从博客/笔记导入（推荐有写作习惯的用户）
   - 提供本地博客文件路径或 GitHub 链接
   - AI 自动分析提取个人风格和素材
   - 限制：最多 10 个文件，每文件 ≤3000 字符

请回复 A 或 B：
```

---

## 模式 A：手动输入

**提示用户输入**：
```
To make the postcard content authentic and warm, please share some recent personal details (AI will match and polish based on each recipient's preferences), such as:
- Interesting or memorable recent events
- Your hobbies, lifestyle
- Your occupation, family, friends background
- Weather and seasonal feelings in your city
- Anything you'd like to write on a postcard

This will be saved as a local "User Content Template" file for reuse next time.
```

> ⚠️ **AI must NOT auto-write or complete template content.** Only save content explicitly provided by the user, store verbatim without polishing, adding, or filling in.

---

## 模式 B：博客/笔记导入（功能 3）

**支持的路径类型**：

| 类型 | 示例 | 说明 |
|------|------|------|
| 单文件 | `D:\web\blog\src\Arthur\2024\travel-japan.md` | 导入特定文章 |
| 文件夹 | `D:\web\blog\src\Arthur\锻炼记录\` | 导入该文件夹下所有 md 文件 |
| 多个路径 | 逗号分隔的多个文件/文件夹 | 批量导入 |
| GitHub 文件 | `https://github.com/user/repo/blob/main/post.md` | 读取特定文件 |
| GitHub 文件夹 | `https://github.com/user/repo/tree/main/posts/` | 读取该目录下文件列表，让用户选择 |

**实现流程**：

1. **用户提供路径**（如 `D:\web\blog\src\Arthur\锻炼记录\`）

2. **AI 扫描路径**，列出找到的 `.md` 文件：
   ```
   📂 找到以下文件：
   - 2024/running-habits.md (2.1 KB)
   - 2024/hiking-adventures.md (1.8 KB)
   - 2023/food-diary.md (3.2 KB)
   
   共 3 个文件，总大小 7.1 KB
   
   请选择：
   - 全部导入 → 读取所有文件
   - 选择文件 → 手动选择部分文件
   - 取消 → 返回手动输入模式
   ```

3. **用户确认或选择具体文件**

4. **AI 读取并分析选中的文件**，提取：
   - 个人兴趣爱好
   - 生活方式
   - 职业背景
   - 语言风格
   - 近期经历

5. **生成素材摘要**，询问用户：
   ```
   📊 已分析你的博客内容，提取以下素材：
   
   **兴趣爱好**：跑步、徒步、美食探店
   **生活方式**：规律作息，周末户外运动
   **职业**：软件工程师，喜欢技术分享
   **近期经历**：上个月完成了半程马拉松
   
   是否满意？
   - 确认 → 保存到 user-content-template.md
   - 修改 → 手动调整或补充
   - 重新选择 → 返回文件选择
   ```

6. **保存到 `user-content-template.md`**

**限制规则**：
- 单次导入最多 **10 个文件**
- 单个文件最多 **3000 字符**（超出部分截断）
- 总大小不超过 **50 KB**
- 只读取 `.md` 格式文件

> ⚠️ **强制等待**：必须等待用户确认素材后，才能进入 Step 5。

---

## 文件格式

**Frontmatter**：
```yaml
---
last_updated: "2026-01-29"
---
```

**正文结构**：
```markdown
# User Content Template

---

## User Input

{user_input_content}

---

## Usage History

- 2026-01-29：Generated 10 postcards（Linked：2026-01-29_recipient-analysis.md）
- 2026-01-30：Added 5 postcards（Batch 2，total 15，Linked：2026-01-30_recipient-analysis.md）
```

**使用记录追加规则**：

| Situation | Append Format |
|-----------|---------------|
| First generation | `- {date}：Generated {N} postcards（Linked：{date}_recipient-analysis.md）` |
| Same day incremental | `- {date}：Added {M} postcards（Batch 2，total {N+M}，Linked：{date}_recipient-analysis.md）` |
| Same day regeneration | `- {date}：Regenerated {N} postcards（overwrote previous file）` |
| Different day | `- {date}：Generated {N} postcards（Linked：{date}_recipient-analysis.md）` |

> ✅ 保存完成后，告知用户文件路径，然后进入 Step 5。

---

## Step 4 完成后的确认点

```
📝 个人素材已保存到 user-content-template.md

确认素材足够后，请回复：
- 继续 → 进入 Step 5：生成明信片内容
- 补充 → 继续添加更多个人素材
```

> ⚠️ **强制等待**：必须等待用户确认素材足够后，才能进入 Step 5。

---

## 相关文件

- **模板**：`{skill_path}/templates/user-content-template.md`
- **输出路径**：`{user_workspace}/postcrossing_content/`（固定文件名，更新 in place）
