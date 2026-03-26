# Step 1 双模式配置（Dual-Mode Configuration）

> 📋 **对应 SKILL.md 章节**：执行流程 → Step 1 → 双模式配置  
> **优先级**：中  
> **完成时间**：2026-03-26

---

## 功能说明

在 Step 1 提供两种配置方式，兼顾技术用户和普通用户的需求。

---

## 两种模式对比

| 模式 | 适用用户 | 体验 | 优点 |
|------|---------|------|------|
| **手动配置** | 技术用户、老用户 | 快速、灵活 | 直接编辑文件，跳过引导 |
| **引导配置** | 新用户、非技术用户 | 友好、无门槛 | 逐步回答问题，自动创建文件 |

---

## 前置检测

**检测**：`.env_postcrossing` 是否存在

### 情况 A：已存在

询问用户：
```
✅ 检测到现有配置文件 .env_postcrossing

请选择：
- A. 使用现有配置 → 跳过 Step 1，直接进入 Step 2
- B. 重新配置 → 删除原文件，重新开始
```

### 情况 B：不存在

进入配置方式选择：
```
Step 1: 环境初始化

请选择配置方式：

A. 🔧 手动配置（推荐技术用户）
   - 直接编辑 .env_postcrossing 文件
   - 快速完成，跳过引导
   - 参考模板：.env.example

B. 📝 引导配置（推荐普通用户）
   - 逐步回答问题
   - 自动创建配置文件
   - 友好无门槛

请回复 A 或 B：
```

---

## 模式 A：手动配置

**提供快速复制模板**：
```
请创建 .env_postcrossing 文件，内容如下（复制 .env.example 并修改）：

# 必填变量
EMAIL_ACCOUNT=your@email.com
EMAIL_AUTH_CODE=your_auth_code
POSTCARD_COUNTRY_CODE=CN
POSTCARD_SENDER_CITY=YourCity
LANG=en

# 可选变量
POSTCROSSING_FOLDER=Postcrossing_sent
POSTCROSSING_DATE=2026-01-29

编辑完成后回复"已完成"，我将验证配置。
```

**用户回复"已完成"后**：
1. 检查 `.env_postcrossing` 是否存在
2. 验证必填变量是否齐全
3. 如有缺失，提示用户补充
4. 验证通过后进入 Step 2

---

## 模式 B：引导配置

逐步询问用户以下问题：

### 1. 语言偏好设置

检测 `LANG` 是否已配置：
- **已配置** → 直接使用
- **未配置** → 询问用户选择 English 或 中文

### 2. 邮箱凭证配置

检测 `EMAIL_ACCOUNT` 和 `EMAIL_AUTH_CODE` 是否已配置：
- **已配置** → 直接使用
- **未配置** → 引导用户填写，根据邮箱后缀给出授权码申请指引

### 3. 国家编码与城市配置

检测 `POSTCARD_COUNTRY_CODE` 和 `POSTCARD_SENDER_CITY` 是否已配置：
- **已配置** → 直接使用
- **未配置** → 询问用户并写入 `.env_postcrossing`

---

## 配置验证（引导模式完成后）

```
✅ 配置文件已创建：.env_postcrossing

配置摘要：
- 邮箱：{EMAIL_ACCOUNT}
- 国家：{POSTCARD_COUNTRY_CODE}
- 城市：{POSTCARD_SENDER_CITY}
- 语言：{LANG}

请确认配置无误：
- 继续 → 进入 Step 2：搜索邮件
- 修改 → 返回修改某项配置
```

---

## 规则

1. **首次使用必须询问用户**选择语言，不得预设默认值
2. **一旦设置，整个运行周期内锁定该语言**
3. **所有脚本通过读取** `.env_postcrossing` **中的** `LANG` **变量确定输出语言**
4. **用户可在** `.env_postcrossing` **中手动修改** `LANG` **值来切换语言**

---

## 相关文件

- **配置文件**：`{user_workspace}/.env_postcrossing`
- **配置模板**：`{skill_path}/.env.example`
- **IMAP 配置脚本**：`{skill_path}/scripts/imap-config.js`
