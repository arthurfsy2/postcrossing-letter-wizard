/**
 * Generate HTML Print Version from Raw Emails JSON
 * 从原始邮件 JSON 生成 HTML 打印版
 * 
 * Usage:
 *   node scripts/generate-print-html.js --date 2026-03-26 --output print.html
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── 解析命令行参数 ──────────────────────────────
const args = process.argv.slice(2);
let date = new Date().toISOString().split('T')[0];
let outputFile = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--date' && args[i + 1]) {
    date = args[i + 1];
    i++;
  } else if (args[i] === '--output' && args[i + 1]) {
    outputFile = args[i + 1];
    i++;
  }
}

if (!outputFile) {
  console.error('Usage: node generate-print-html.js --date <YYYY-MM-DD> --output <output.html>');
  process.exit(1);
}

// ── 工作区根目录（用户 workspace 根目录）──────────────
// 使用 process.cwd() 确保输出文件保存到用户 workspace，而非 skill 安装目录
// 这样在 VPS 部署时，输出路径与用户本地开发环境一致
const WORKSPACE_ROOT = process.cwd();

// ── 读取 JSON 数据文件 ──────────────────────────────
const jsonPath = path.join(WORKSPACE_ROOT, 'postcrossing_content', date, `${date}_raw-emails.json`);

if (!fs.existsSync(jsonPath)) {
  console.error(`Error: JSON file not found: ${jsonPath}`);
  console.log('Please run save-raw-emails.js first to generate the JSON file.');
  process.exit(1);
}

const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// ── 生成 HTML ──────────────────────────────
const html = generateHTML(jsonData);

// ── 保存 HTML 文件 ──────────────────────────────
fs.writeFileSync(outputFile, html, 'utf-8');
console.log(`✅ HTML 打印版已生成：${outputFile}`);
console.log(`   共 ${jsonData.emails.length} 封邮件`);

// ── 从 text 中提取收件人姓名 ──────────────────────────────
function extractRecipientName(text) {
  // 匹配模式："will go to...\n\n{username} in {country}" 
  const match = text.match(/will go to\.\.\.\s*\n\s*\n\s*(\w+)\s+(in|,)/);
  if (match && match[1]) {
    return match[1];
  }
  
  // 备用模式："or {name}), in" 
  const match2 = text.match(/or\s+(\w+)\),\s*in/);
  if (match2 && match2[1]) {
    return match2[1];
  }
  
  return 'Unknown';
}

// ── 生成 HTML 函数 ──────────────────────────────
function generateHTML(data) {
  const emails = data.emails;
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Postcrossing Postcards - ${data.date}</title>
  <style>
    @page { size: A4; margin: 2cm; }
    body {
      font-family: "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { text-align: center; color: #2c3e50; margin-bottom: 30px; }
    .postcard {
      border: 1px solid #ccc;
      padding: 20px;
      margin: 20px 0;
      page-break-inside: avoid;
      background: #fff;
    }
    .postcard h2 { margin-top: 0; color: #34495e; font-size: 18px; }
    .postcard pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: "Courier New", monospace;
      font-size: 12px;
      line-height: 1.5;
      background: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
    }
    .metadata {
      font-size: 12px;
      color: #666;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #eee;
    }
    .cut-line {
      border-top: 3px dashed #999;
      margin: 30px 0;
      position: relative;
    }
    .cut-line::after {
      content: "✂️ 沿虚线剪下";
      position: absolute;
      top: -12px;
      right: 20px;
      background: white;
      padding: 0 10px;
      color: #666;
      font-size: 12px;
    }
    @media print {
      body { padding: 0; }
      .cut-line::after { display: none; }
    }
  </style>
</head>
<body>
  <h1>Postcrossing Postcards - ${data.date}</h1>
  
`;

  emails.forEach((email, index) => {
    const recipientName = extractRecipientName(email.text);
    
    html += `  <div class="postcard">
    <h2>To: ${escapeHtml(recipientName)} (${email.postcard_id})</h2>
    <pre>${escapeHtml(email.text.substring(0, 500))}${email.text.length > 500 ? '...' : ''}</pre>
    
    <div class="metadata">
      <strong>Postcard ID:</strong> ${escapeHtml(email.postcard_id)} | 
      <strong>UID:</strong> ${email.uid} |
      <strong>Date:</strong> ${email.date ? new Date(email.date).toLocaleDateString() : 'Unknown'}
    </div>
  </div>
  
`;

    if (index < emails.length - 1) {
      html += `  <div class="cut-line"></div>
  
`;
    }
  });

  html += `  <script>
    console.log('💡 Tip: Use Ctrl+P (Cmd+P on Mac) to print this page on A4 paper.');
  </script>
</body>
</html>`;

  return html;
}

// ── HTML 转义 ──────────────────────────────
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
