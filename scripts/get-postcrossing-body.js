/**
 * 读取 Postcrossing 邮件正文 / Read Postcrossing email body
 * 用法 / Usage: 
 *   单封 / Single:  node scripts/get-postcrossing-body.js --uid <UID> [--folder <path>]
 *   批量 / Batch:   node scripts/get-postcrossing-body.js --uids <UID1,UID2,UID3> [--folder <path>]
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
let uidArg = null;
let uidsArg = null;
let folder = 'INBOX';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--uid' && args[i + 1]) {
    uidArg = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--uids' && args[i + 1]) {
    uidsArg = args[i + 1];
    i++;
  } else if (args[i] === '--folder' && args[i + 1]) {
    folder = args[i + 1];
    i++;
  }
}

// 从环境变量读取语言设置（由 imap-config.js 加载 .env_postcrossing）
const lang = process.env.LANG || 'en';

const i18n = {
  zh: {
    usage: '用法: node get-postcrossing-body.js --uid <UID> [--folder <文件夹路径>]\n       node get-postcrossing-body.js --uids <UID1,UID2,UID3> [--folder <文件夹路径>]',
    email: '邮箱',
    server: '服务器',
    noUids: '错误: 请提供 UID，例如: --uid 123 或 --uids 123,124,125',
    openFolderFailed: '打开文件夹失败',
    fetchError: '获取邮件失败',
    parseError: '解析失败',
    completed: '完成',
    total: '共',
    emails: '封邮件',
    success: '成功',
    failed: '失败',
    fetching: '正在批量获取邮件',
    progress: '进度',
  },
  en: {
    usage: 'Usage: node get-postcrossing-body.js --uid <UID> [--folder <path>]\n       node get-postcrossing-body.js --uids <UID1,UID2,UID3> [--folder <path>]',
    email: 'Email',
    server: 'Server',
    noUids: 'Error: Please provide UID, e.g.: --uid 123 or --uids 123,124,125',
    openFolderFailed: 'Failed to open folder',
    fetchError: 'Failed to fetch emails',
    parseError: 'Parse error',
    completed: 'Completed',
    total: 'Total',
    emails: 'emails',
    success: 'success',
    failed: 'failed',
    fetching: 'Fetching emails in batch',
    progress: 'Progress',
  },
};
const t = i18n[lang] || i18n.en;

// 解析 UID 参数
let uids = [];
if (uidArg) {
  uids = [uidArg];
} else if (uidsArg) {
  uids = uidsArg.split(',').map(u => parseInt(u.trim(), 10)).filter(u => !isNaN(u));
}

if (uids.length === 0) {
  console.error(t.usage);
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
console.log(`📨 ${t.total}: ${uids.length} ${t.emails}`);
if (uids.length > 1) {
  console.log(`⏳ ${t.fetching}...\n`);
} else {
  console.log('');
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

// ── 批量获取邮件正文（Batch Mode）────────────────────────
function fetchEmailsBatch(imap, uids) {
  return new Promise((resolve, reject) => {
    imap.openBox(folder, true, (err) => {
      if (err) {
        console.error(`${t.openFolderFailed} "${folder}":`, err.message);
        imap.end();
        reject(err);
        return;
      }

      const fetch = imap.fetch(uids, { bodies: '' });
      const results = [];
      let completedCount = 0;

      fetch.on('message', (msg, seqno) => {
        let uid = null;
        
        msg.once('attributes', (attrs) => {
          uid = attrs.uid;
        });

        msg.on('body', (stream) => {
          simpleParser(stream, (parseErr, parsed) => {
            completedCount++;
            
            if (parseErr) {
              console.error(`  ✗ [${completedCount}/${uids.length}] UID ${uid}: ${t.parseError}`);
              results.push({
                uid,
                error: parseErr.message,
                subject: '(Error)',
                from: '(Error)',
                date: null,
                body: `(Failed to parse: ${parseErr.message})`,
              });
            } else {
              const text = parsed.text?.trim() || (parsed.html ? htmlToText(parsed.html) : '');
              console.log(`  ✓ [${completedCount}/${uids.length}] UID ${uid}: ${parsed.subject || '(No subject)'}`);
              results.push({
                uid,
                subject: parsed.subject || '(No subject)',
                from: parsed.from?.text || '(Unknown)',
                date: parsed.date,
                body: text || '(No body)',
              });
            }
          });
        });
      });

      fetch.once('error', (err) => {
        console.error(`${t.fetchError}:`, err.message);
        imap.end();
        reject(err);
      });

      fetch.once('end', () => {
        // 等待所有解析完成
        const waitInterval = setInterval(() => {
          if (completedCount >= uids.length) {
            clearInterval(waitInterval);
            // 按 UID 排序
            results.sort((a, b) => a.uid - b.uid);
            resolve(results);
          }
        }, 100);
        
        // 超时保护：最多等待 60 秒
        setTimeout(() => {
          clearInterval(waitInterval);
          results.sort((a, b) => a.uid - b.uid);
          resolve(results);
        }, 60000);
      });
    });
  });
}

// ── IMAP 连接并批量获取 ───────────────────────────────
const imap = new Imap(imapOptions);

imap.once('ready', () => {
  fetchEmailsBatch(imap, uids)
    .then(results => {
      const successCount = results.filter(r => !r.error).length;
      const failedCount = results.filter(r => r.error).length;

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

      console.log('\n' + JSON.stringify(output, null, 2));
      console.log(`\n✅ ${t.completed}: ${successCount} ${t.success}, ${failedCount} ${t.failed}`);
      
      imap.end();
    })
    .catch(err => {
      console.error(`${t.fetchError}:`, err.message);
      imap.end();
      process.exit(1);
    });
});

imap.once('error', (err) => {
  console.error('IMAP Error:', err.message);
  process.exit(1);
});

imap.connect();
