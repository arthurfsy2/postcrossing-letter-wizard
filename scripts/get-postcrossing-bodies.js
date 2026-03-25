/**
 * 批量并行读取 Postcrossing 邮件正文 / Batch read Postcrossing email bodies in parallel
 * 用法 / Usage: node scripts/get-postcrossing-bodies.js --uids <UID1,UID2,UID3> [--folder <path>]
 *
 * 支持并发读取多封邮件，显著提升性能
 * Supports concurrent reading of multiple emails for better performance
 */

'use strict';

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { resolveImapConfig } = require('./imap-config');

// ── 解析命令行参数 / Parse CLI arguments ──────────────────────────────
const args = process.argv.slice(2);
let uidsArg = null;
let folder = 'INBOX';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--uids' && args[i + 1]) {
    uidsArg = args[i + 1];
    i++;
  } else if (args[i] === '--folder' && args[i + 1]) {
    folder = args[i + 1];
    i++;
  }
}

// 从环境变量读取语言设置
const lang = process.env.LANG || 'en';

const i18n = {
  zh: {
    usage: '用法: node get-postcrossing-bodies.js --uids <UID1,UID2,UID3> [--folder <文件夹路径>]',
    email: '邮箱',
    server: '服务器',
    noUids: '错误: 请提供 UID 列表，例如: --uids 100,101,102',
    openFolderFailed: '打开文件夹失败',
    fetchError: '获取邮件失败',
    parseError: '解析失败',
    completed: '完成',
    total: '共',
    emails: '封邮件',
    success: '成功',
    failed: '失败',
  },
  en: {
    usage: 'Usage: node get-postcrossing-bodies.js --uids <UID1,UID2,UID3> [--folder <path>]',
    email: 'Email',
    server: 'Server',
    noUids: 'Error: Please provide UID list, e.g.: --uids 100,101,102',
    openFolderFailed: 'Failed to open folder',
    fetchError: 'Failed to fetch emails',
    parseError: 'Parse error',
    completed: 'Completed',
    total: 'Total',
    emails: 'emails',
    success: 'success',
    failed: 'failed',
  },
};
const t = i18n[lang] || i18n.en;

if (!uidsArg) {
  console.error(t.usage);
  console.error(t.noUids);
  process.exit(1);
}

const uids = uidsArg.split(',').map(u => parseInt(u.trim(), 10)).filter(u => !isNaN(u));
if (uids.length === 0) {
  console.error(t.noUids);
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
console.log(`🔗 ${t.server}: ${meta.host}:${meta.port}`);
console.log(`📨 ${t.total}: ${uids.length} ${t.emails}\n`);

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

// ── 并行获取单封邮件 ───────────────────────────────
function fetchSingleEmail(imap, uid) {
  return new Promise((resolve, reject) => {
    const fetch = imap.fetch(uid, { bodies: '' });
    let emailData = null;

    fetch.on('message', (msg) => {
      msg.on('body', (stream) => {
        simpleParser(stream, (parseErr, parsed) => {
          if (parseErr) {
            reject(parseErr);
            return;
          }
          const text = parsed.text?.trim() || (parsed.html ? htmlToText(parsed.html) : '');
          emailData = {
            uid,
            subject: parsed.subject || '(No subject)',
            from: parsed.from?.text || '(Unknown)',
            date: parsed.date,
            body: text || '(No body)',
          };
        });
      });
    });

    fetch.once('error', (err) => reject(err));
    fetch.once('end', () => {
      if (emailData) {
        resolve(emailData);
      } else {
        reject(new Error(`No data for UID ${uid}`));
      }
    });
  });
}

// ── IMAP 连接并批量获取 ───────────────────────────────
const imap = new Imap(imapOptions);

imap.once('ready', () => {
  imap.openBox(folder, true, (err) => {
    if (err) {
      console.error(`${t.openFolderFailed} "${folder}":`, err.message);
      imap.end();
      process.exit(1);
    }

    // 并行获取所有邮件
    const fetchPromises = uids.map(uid => 
      fetchSingleEmail(imap, uid).catch(err => ({
        uid,
        error: err.message,
        subject: '(Error)',
        from: '(Error)',
        date: null,
        body: `(Failed to fetch: ${err.message})`,
      }))
    );

    Promise.all(fetchPromises).then(results => {
      const successCount = results.filter(r => !r.error).length;
      const failedCount = results.filter(r => r.error).length;

      // 按 UID 排序输出
      results.sort((a, b) => a.uid - b.uid);

      // 输出 JSON 格式结果
      const output = {
        meta: {
          account: meta.account,
          provider: meta.providerName,
          folder,
          total: uids.length,
          success: successCount,
          failed: failedCount,
        },
        emails: results,
      };

      console.log(JSON.stringify(output, null, 2));
      console.log(`\n✅ ${t.completed}: ${successCount} ${t.success}, ${failedCount} ${t.failed}`);
      
      imap.end();
    }).catch(err => {
      console.error(`${t.fetchError}:`, err.message);
      imap.end();
      process.exit(1);
    });
  });
});

imap.once('error', (err) => {
  console.error('IMAP Error:', err.message);
  process.exit(1);
});

imap.connect();
