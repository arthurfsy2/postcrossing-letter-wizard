/**
 * 分析收件人信息 / Analyze Recipient Preferences
 * 用法 / Usage:
 *   node scripts/analyze-recipients.js --date 2026-01-29
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── 工作区根目录 ──────────────────────────────
const WORKSPACE_ROOT = process.cwd();

// ── 解析命令行参数 ──────────────────────────────
const args = process.argv.slice(2);
let date = new Date().toISOString().split('T')[0];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--date' && args[i + 1]) {
    date = args[i + 1];
    i++;
  }
}

// ── 读取 JSON 数据 ──────────────────────────────
const jsonPath = path.join(WORKSPACE_ROOT, 'postcrossing_content', date, `${date}_raw-emails.json`);

if (!fs.existsSync(jsonPath)) {
  console.error(`❌ JSON file not found: ${jsonPath}`);
  console.log('Please run save-raw-emails.js first.');
  process.exit(1);
}

const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// ── 分析收件人信息 ──────────────────────────────
function analyzeRecipient(email) {
  const text = email.text || '';
  
  // 提取基本信息
  const postcardId = email.postcard_id;
  
  // 从文本中提取收件人姓名
  const nameMatch = text.match(/(?:will go to\.\.\.\n\n|Username: )([A-Za-z0-9\s]+?)(?: in |$|\n)/);
  const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
  
  // 提取国家
  const countryMatch = text.match(/in ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s+\d+ km/);
  const country = countryMatch ? countryMatch[1] : 'Unknown';
  
  // 提取 Sent/Received 数量
  const sentMatch = text.match(/Sent:\s*(\d+)/);
  const receivedMatch = text.match(/Received:\s*(\d+)/);
  const sent = sentMatch ? parseInt(sentMatch[1]) : 0;
  const received = receivedMatch ? parseInt(receivedMatch[1]) : 0;
  
  // 提取关于收件人的描述
  const aboutMatch = text.match(/About the recipient:[\s\S]*?"([\s\S]*?)"[\s\S]*?To learn more/);
  const about = aboutMatch ? aboutMatch[1].trim() : '';
  
  // 简单分析兴趣偏好
  const interests = [];
  if (/crochet|plants|reading|art/i.test(about)) interests.push('crafts, art, reading');
  if (/stationery|paper|pen/i.test(about)) interests.push('stationery, paper crafts');
  if (/Disney|Halloween|Harry Potter|movie/i.test(about)) interests.push('Disney, movies, Halloween');
  if (/bridge|Marvel|Spider/i.test(about)) interests.push('architecture, Marvel movies');
  if (/family|store|shop/i.test(about)) interests.push('family business, local culture');
  
  // 简单分析卡片偏好
  const cardPrefs = [];
  if (/view|landmark|city/i.test(about)) cardPrefs.push('scenic views');
  if (/shaped postcard/i.test(about)) cardPrefs.push('shaped postcards');
  if (/no AI/i.test(about)) cardPrefs.push('no AI-generated cards');
  if (/bridge|building/i.test(about)) cardPrefs.push('architecture, bridges');
  if (/Marvel|superhero/i.test(about)) cardPrefs.push('Marvel superheroes');
  
  return {
    postcardId,
    name,
    country,
    cardPreference: cardPrefs.join('; ') || 'any',
    contentPreference: interests.join('; ') || 'personal stories',
    languagePreference: 'English',
    specialRequests: /date|weather/i.test(about) ? 'mention date/weather' : 'none',
    personalHighlights: interests.slice(0, 2).join(', '),
    postcrossingExperience: `Sent ${sent} / Received ${received}`
  };
}

// ── 生成 Markdown ──────────────────────────────
function generateMarkdown(recipients, date) {
  const timestamp = new Date().toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  }).replace(/\//g, '-');
  
  let content = `---
date: "${date}"
total: ${recipients.length}
processed_ids: [${recipients.map(r => `"${r.postcardId}"`).join(', ')}]
last_updated: ${timestamp}
---

# Recipient Preference Analysis — ${date}（Total ${recipients.length} recipients）

---

## Batch 1（${recipients.length} recipients, ${timestamp}）

`;

  recipients.forEach((r, index) => {
    content += `### ${index + 1}. [${r.postcardId}] ${r.name}（${r.country}）

| Dimension | Content |
|-----------|---------|
| Card Preference | ${r.cardPreference} |
| Content Preference | ${r.contentPreference} |
| Language Preference | ${r.languagePreference} |
| Special Requests | ${r.specialRequests} |
| Personal Highlights | ${r.personalHighlights} |
| Postcrossing Experience | ${r.postcrossingExperience} |

---

`;
  });

  content += `## 使用说明

### 用途
本文件包含收件人的偏好分析，用于：
1. Step 5 生成个性化明信片内容
2. 匹配用户素材与收件人兴趣
3. 识别特殊要求（如手写偏好、卡片类型）

### 下一步
确认分析结果无误后，继续 Step 4：收集用户内容模板

AI 将读取本文件，为每位收件人生成个性化的英文明信片正文。

---

## 注意事项

- 本文件由 \`analyze-recipients.js\` 脚本自动生成
- 文件位置：\`postcrossing_content/${date}/${date}_recipient-analysis.md\`
- 增量处理：新增批次时会追加到文件末尾
`;

  return content;
}

// ── 主流程 ──────────────────────────────
console.log(`⏳ 正在分析 ${jsonData.emails.length} 封邮件...`);

const recipients = jsonData.emails.map(email => analyzeRecipient(email));

const markdownContent = generateMarkdown(recipients, date);

// 保存到日期子文件夹
const outputDir = path.join(WORKSPACE_ROOT, 'postcrossing_content', date);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, `${date}_recipient-analysis.md`);
fs.writeFileSync(outputPath, markdownContent, 'utf-8');

console.log(`✅ 已保存：${outputPath}`);
console.log(`📊 分析了 ${recipients.length} 位收件人`);

// 显示摘要
console.log('\n📋 收件人摘要:');
recipients.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r.name} (${r.country}) - ${r.postcardId}`);
});
