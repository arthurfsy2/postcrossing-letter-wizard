/**
 * 读取指定 UID 的 Postcrossing 邮件正文 / Read Postcrossing email body by UID
 * 用法 / Usage: node scripts/get-postcrossing-body.js --uid <UID> [--folder <path>]
 *
 * 邮箱账号/授权码从 .env 读取，IMAP 服务器按邮箱后缀自动推断。
 * 语言设置从 .env_postcrossing 的 LANG 变量读取（en/zh），默认 en。
 * Email credentials read from .env, IMAP server auto-detected from email suffix.
 */

'use strict';

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { resolveImapConfig } = require('./imap-config');

// ── 解析命令行参数 / Parse CLI arguments ──────────────────────────────
const args = process.argv.slice(2);
let uid    = null;
let folder = 'INBOX';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--uid' && args[i + 1]) {
    uid = parseInt(args[i + 1], 10); i++;
  } else if (args[i] === '--folder' && args[i + 1]) {
    folder = args[i + 1]; i++;
  }
}

// 从环境变量读取语言设置（由 imap-config.js 加载 .env_postcrossing）
const lang = process.env.LANG || 'en';

const i18n = {
  zh: {
    usage: '用法: node get-postcrossing-body.js --uid <UID> [--folder <文件夹路径>] [--lang <zh|en>]',
    email: '邮箱',
    server: '服务器',
    subject: '邮件主题',
    from: '发件人',
    date: '日期',
    body: '正文',
    noSubject: '(无主题)',
    unknown: '(未知)',
    noBody: '(无正文)',
    openFolderFailed: '打开文件夹失败',
    parseError: '解析失败',
  },
  en: {
    usage: 'Usage: node get-postcrossing-body.js --uid <UID> [--folder <path>] [--lang <zh|en>]',
    email: 'Email',
    server: 'Server',
    subject: 'Subject',
    from: 'From',
    date: 'Date',
    body: 'Body',
    noSubject: '(No subject)',
    unknown: '(Unknown)',
    noBody: '(No body)',
    openFolderFailed: 'Failed to open folder',
    parseError: 'Parse error',
  },
};
const t = i18n[lang] || i18n.en;

if (!uid) {
  console.error(t.usage);
  process.exit(1);
}

// ── 加载 IMAP 配置 ──────────────────────────────
let config;
try {
  config = resolveImapConfig();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const { imapOptions, meta } = config;

console.log(`📧 ${t.email}: ${meta.account} (${meta.providerName})`);
console.log(`🔗 ${t.server}: ${meta.host}:${meta.port}\n`);
if (meta.providerNote) {
  console.log(`ℹ️  ${meta.providerNote}\n`);
}

// ── HTML → 纯文本 ───────────────────────────────
function htmlToText(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── IMAP 读取正文 ───────────────────────────────
const imap = new Imap(imapOptions);

imap.once('ready', () => {
  imap.openBox(folder, true, (err) => {
    if (err) {
      console.error(`${t.openFolderFailed} "${folder}":`, err.message);
      imap.end(); return;
    }

    const fetch = imap.fetch(uid, { bodies: '' });
    fetch.on('message', (msg) => {
      msg.on('body', (stream) => {
        simpleParser(stream, (parseErr, parsed) => {
          if (parseErr) { console.error(`${t.parseError}:`, parseErr.message); return; }
          const text = parsed.text?.trim() || (parsed.html ? htmlToText(parsed.html) : '');
          console.log(`=== ${t.subject} ===`);
          console.log(parsed.subject || t.noSubject);
          console.log(`\n=== ${t.from} ===`);
          console.log(parsed.from?.text || t.unknown);
          console.log(`\n=== ${t.date} ===`);
          const dateStr = parsed.date
            ? lang === 'zh'
              ? parsed.date.toLocaleString('zh-CN')
              : parsed.date.toLocaleString('en-US')
            : t.unknown;
          console.log(dateStr);
          console.log(`\n=== ${t.body} ===`);
          console.log(text || t.noBody);
        });
      });
    });
    fetch.once('error', (e) => console.error('fetch 错误:', e.message));
    fetch.once('end', () => imap.end());
  });
});

imap.once('error', (err) => console.error('IMAP Error:', err.message));
imap.connect();
