/**
 * 列出邮箱所有文件夹 / List all mail folders
 * 用法: node scripts/list-folders.js
 *
 * 邮箱账号/授权码从 .env 读取，IMAP 服务器按邮箱后缀自动推断。
 * 语言设置从 .env_postcrossing 的 LANG 变量读取（en/zh），默认 en。
 * 支持的邮箱见 scripts/imap-config.js 中的 BUILTIN_PROVIDERS。
 */

'use strict';

const Imap = require('imap');
const { resolveImapConfig } = require('./imap-config');

// 从环境变量读取语言设置（由 imap-config.js 加载 .env_postcrossing）
const lang = process.env.LANG || 'en';

const i18n = {
  zh: {
    email: '邮箱',
    server: '服务器',
    allFolders: '所有邮件文件夹',
    connectionClosed: '连接已关闭',
    fetchError: '获取文件夹失败',
  },
  en: {
    email: 'Email',
    server: 'Server',
    allFolders: 'All Mail Folders',
    connectionClosed: 'Connection closed',
    fetchError: 'Failed to fetch folders',
  },
};
const t = i18n[lang] || i18n.en;

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

function flattenBoxes(boxes, prefix, delimiter) {
  const result = [];
  for (const name of Object.keys(boxes)) {
    const sep = boxes[name].delimiter || delimiter || '/';
    const fullName = prefix ? `${prefix}${sep}${name}` : name;
    result.push(fullName);
    if (boxes[name].children) {
      result.push(...flattenBoxes(boxes[name].children, fullName, sep));
    }
  }
  return result;
}

const imap = new Imap(imapOptions);

imap.once('ready', () => {
  imap.getBoxes((err, boxes) => {
    if (err) { console.error(`${t.fetchError}:`, err.message); imap.end(); return; }
    const folders = flattenBoxes(boxes, '', '.');
    console.log(`=== ${t.allFolders} ===`);
    folders.forEach(f => console.log(f));
    imap.end();
  });
});

imap.once('error', (err) => console.error('IMAP Error:', err.message));
imap.once('end', () => console.log(`\n${t.connectionClosed}`));
imap.connect();
