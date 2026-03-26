/**
 * Send Email Backup - 发送邮件备份
 * 
 * Usage:
 *   node scripts/send-email-backup.js --date 2026-01-29
 */

'use strict';

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const archiver = require('archiver');
const { resolveImapConfig } = require('./imap-config');

// ── 解析命令行参数 ──────────────────────────────
const args = process.argv.slice(2);
let date = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--date' && args[i + 1]) {
    date = args[i + 1];
    i++;
  }
}

if (!date) {
  console.error('Usage: node send-email-backup.js --date <YYYY-MM-DD>');
  process.exit(1);
}

// ── 获取配置 ──────────────────────────────
const config = resolveImapConfig();
const emailAccount = process.env.EMAIL_ACCOUNT;
// 使用 process.cwd() 确保输出文件保存到用户 workspace，而非 skill 安装目录
const WORKSPACE_ROOT = process.cwd();
const dateDir = path.join(WORKSPACE_ROOT, 'postcrossing_content', date);
const zipPath = path.join(dateDir, `${date}_postcrossing-package.zip`);

// ── 压缩文件 ──────────────────────────────
async function createZip() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`✅ 压缩包已创建：${zipPath}`);
      console.log(`   大小：${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
      resolve(zipPath);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // 添加文件到压缩包
    const files = [
      `${date}_raw-emails.md`,
      `${date}_recipient-analysis.md`,
      `${date}_postcard-content.md`,
      `${date}_print.html`
    ];

    files.forEach(file => {
      const filePath = path.join(dateDir, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file });
        console.log(`  ✓ 添加：${file}`);
      } else {
        console.log(`  ✗ 跳过（文件不存在）: ${file}`);
      }
    });

    archive.finalize();
  });
}

// ── 发送邮件 ──────────────────────────────
async function sendEmail() {
  // SMTP 配置（从 IMAP 配置推断）
  const smtpConfig = {
    host: config.imapOptions.host.replace('imap', 'smtp'),
    port: 465,
    secure: true,
    auth: {
      user: emailAccount,
      pass: process.env.EMAIL_AUTH_CODE
    }
  };

  const transporter = nodemailer.createTransport(smtpConfig);

  const mailOptions = {
    from: `"Postcrossing Letter Wizard" <${emailAccount}>`,
    to: emailAccount,
    subject: `Postcrossing 明信片内容 - ${date}`,
    text: `你好！

这是 ${date} 生成的 Postcrossing 明信片内容，包含以下文件：
- ${date}_raw-emails.md：原始邮件内容
- ${date}_recipient-analysis.md：收件人分析
- ${date}_postcard-content.md：生成的明信片正文
- ${date}_print.html：HTML 批量打印版（A4 排版，含剪切线）

请解压后查看。

---
由 Postcrossing Letter Wizard 自动生成
`,
    attachments: [
      {
        filename: `${date}_postcrossing-package.zip`,
        path: zipPath
      }
    ]
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        console.log(`✅ 邮件已发送到 ${emailAccount}`);
        console.log(`   Message ID: ${info.messageId}`);
        resolve(info);
      }
    });
  });
}

// ── 主流程 ──────────────────────────────
async function main() {
  console.log(`\n📦 开始发送邮件备份 - ${date}\n`);
  
  // 1. 压缩文件
  console.log('Step 1: 压缩文件...');
  await createZip();
  
  // 2. 发送邮件
  console.log('\nStep 2: 发送邮件...');
  await sendEmail();
  
  console.log('\n✅ 流程已全部完成！🎉\n');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('错误:', err);
    process.exit(1);
  });
