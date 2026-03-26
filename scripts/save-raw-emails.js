/**
 * 保存原始邮件内容为 Markdown 和 JSON / Save raw emails to Markdown and JSON
 * 用法 / Usage:
 *   node scripts/save-raw-emails.js --uids <UID1,UID2,UID3> --folder <path> --date <YYYY-MM-DD>
 */

'use strict';

const fs = require('fs');
const path = require('path');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { resolveImapConfig } = require('./imap-config');

// ── 工作区根目录（用户 workspace 根目录）──────────────
// 使用 process.cwd() 确保输出文件保存到用户 workspace，而非 skill 安装目录
// 这样在 VPS 部署时，输出路径与用户本地开发环境一致
const WORKSPACE_ROOT = process.cwd();

// ── 解析命令行参数 ──────────────────────────────
const args = process.argv.slice(2);
let uidsArg = null;
let folder = 'INBOX';
let date = new Date().toISOString().split('T')[0];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--uids' && args[i + 1]) {
    uidsArg = args[i + 1];
    i++;
  } else if (args[i] === '--folder' && args[i + 1]) {
    folder = args[i + 1];
    i++;
  } else if (args[i] === '--date' && args[i + 1]) {
    date = args[i + 1];
    i++;
  }
}

if (!uidsArg) {
  console.error('用法：node save-raw-emails.js --uids <UID1,UID2,UID3> --folder <路径> --date <YYYY-MM-DD>');
  process.exit(1);
}

const uids = uidsArg.split(',').map(u => parseInt(u.trim(), 10));

// ── 获取邮件正文 ──────────────────────────────
async function fetchEmail(imap, uid) {
  return new Promise((resolve, reject) => {
    const fetch = imap.fetch(uid, { bodies: '' });
    let emailData = '';

    fetch.on('message', (msg) => {
      msg.on('body', (stream) => {
        stream.on('data', (chunk) => {
          emailData += chunk.toString('utf-8');
        });
      });

      msg.once('end', async () => {
        try {
          const parsed = await simpleParser(emailData);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    fetch.once('error', reject);
  });
}

// ── 提取 Postcard ID ──────────────────────────────
function extractPostcardId(subject) {
  // 匹配任意国家的 Postcard ID，格式如 CN-4222993, US-1234567, DE-987654
  const match = subject.match(/[A-Z]{2}-\d+/i);
  return match ? match[0] : 'Unknown';
}

// ── 格式化邮件为 Markdown ──────────────────────────────
function formatEmail(email, index) {
  const subject = email.subject || '';
  const postcardId = extractPostcardId(subject);
  const text = email.text || '';
  const from = email.from ? email.from.text : 'Unknown';
  const emailDate = email.date ? email.date.toISOString() : 'Unknown';

  return `
## ${index + 1}. Postcard ID: ${postcardId}

**Subject:** ${subject}
**From:** ${from}
**Date:** ${emailDate}

### Raw Content

\`\`\`
${text}
\`\`\`

---
`;
}

// ── 生成 JSON 数据 ──────────────────────────────
function generateJSON(emails) {
  return {
    date: date,
    total: emails.length,
    emails: emails.map(({ uid, email }, index) => ({
      index: index + 1,
      uid: uid,
      postcard_id: extractPostcardId(email.subject || ''),
      subject: email.subject || '',
      from: email.from ? email.from.text : 'Unknown',
      date: email.date ? email.date.toISOString() : 'Unknown',
      text: email.text || ''
      // 注意：不包含 html 字段，避免 JSON 文件过大（html 字段通常是 text 的 10 倍大小）
    }))
  };
}

// ── 生成 Markdown 文件 ──────────────────────────────
function generateMarkdown(emails, date, folder) {
  const uidList = emails.map(e => e.uid).join(', ');

  let content = `---
date: "${date}"
total: ${emails.length}
folder: "${folder}"
uids: [${uidList}]
---

# Raw Emails - ${date}

> 原始邮件内容，用于排查和参考
> - 生成日期：${date}
> - 邮件数量：${emails.length}
> - 来源文件夹：${folder}

`;

  emails.forEach(({ email }, index) => {
    content += formatEmail(email, index);
  });

  return content;
}

// ── 主流程 ──────────────────────────────
async function main() {
  const config = resolveImapConfig();
  const imap = new Imap(config.imapOptions);

  await new Promise((resolve, reject) => {
    imap.once('ready', () => {
      imap.openBox(folder, true, (err) => {
        if (err) {
          reject(err);
          return;
        }

        console.log(`⏳ 正在获取 ${uids.length} 封邮件...`);
        const emails = [];
        let completed = 0;

        uids.forEach((uid) => {
          fetchEmail(imap, uid)
            .then(email => {
              emails.push({ uid, email });
              completed++;
              console.log(`  [${completed}/${uids.length}] UID ${uid} ✓`);

              if (completed === uids.length) {
                imap.end();

                // 按 UID 排序
                emails.sort((a, b) => uids.indexOf(a.uid) - uids.indexOf(b.uid));

                // 生成 Markdown 和 JSON 数据
                const markdownContent = generateMarkdown(emails, date, folder);
                const jsonData = generateJSON(emails);

                // 保存到日期子文件夹
                const outputDir = path.join(WORKSPACE_ROOT, 'postcrossing_content', date);
                if (!fs.existsSync(outputDir)) {
                  fs.mkdirSync(outputDir, { recursive: true });
                }

                // 保存 Markdown 文件
                const markdownPath = path.join(outputDir, `${date}_raw-emails.md`);
                fs.writeFileSync(markdownPath, markdownContent, 'utf-8');
                console.log(`\n✅ 已保存：${markdownPath}`);

                // 保存 JSON 文件
                const jsonPath = path.join(outputDir, `${date}_raw-emails.json`);
                fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');
                console.log(`✅ 已保存：${jsonPath}`);

                resolve({ markdownPath, jsonPath });
              }
            })
            .catch(err => {
              console.error(`  ✗ UID ${uid} 失败:`, err.message);
              completed++;
              if (completed === uids.length) {
                imap.end();
              }
            });
        });
      });
    });

    imap.once('error', reject);
    imap.connect();
  });
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('错误:', err);
    process.exit(1);
  });
