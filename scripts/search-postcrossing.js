/**
 * 搜索 Postcrossing 地址邮件 / Search Postcrossing address emails
 *
 * 用法 / Usage:
 *   node scripts/search-postcrossing.js [选项 / options]
 *
 * 选项 / Options：
 *   --folder <路径/path>          邮件文件夹 / Mail folder（默认 INBOX；Gmail 建议用 [Gmail]/All Mail）
 *   --date <YYYY-MM-DD>           仅搜索指定日期 / Search specific date only；不传则搜索全部历史 / omit to search all history
 *   --limit <数量/n>              最多显示几封 / Max results（默认 10，0 表示不限制 / 0 = unlimited）
 *   --subject-keyword <词/keyword> 自定义搜索关键词 / Custom search keyword（覆盖内置格式列表 / overrides built-in keywords）
 *
 * 语言设置从 .env_postcrossing 的 LANG 变量读取（en/zh），默认 en。
 *
 * 关于主题格式兼容性 / Subject format compatibility：
 *   Postcrossing 不同时期 / 不同语言版本的主题格式可能不同，例如：
 *     新格式（QQ 邮箱注册）："Postcrossing Postcard ID: CN-XXXXXXX"
 *     老格式（Gmail 注册）： "Postcrossing - PostcardID: CN-XXXXXXX"
 *   如果搜索结果为 0，可能是格式变化了。
 *   解决方法：在邮箱中找到一封真实的地址邮件，把主题里一段独特的文字
 *   通过 --subject-keyword 传进来，例如：
 *     node scripts/search-postcrossing.js --subject-keyword "Postcard"
 *
 * 邮箱账号/授权码从 .env 读取，IMAP 服务器按邮箱后缀自动推断。
 * Email credentials read from .env, IMAP server auto-detected from email suffix.
 */

'use strict';

const Imap = require('imap');
const { resolveImapConfig } = require('./imap-config');

// ── 解析命令行参数 / Parse CLI arguments ──────────────────────────────
const args = process.argv.slice(2);
let folder          = 'INBOX';
let limit           = 10;
let dateArg         = null;   // null = 搜全部 / search all
let subjectKeyword  = null;   // null = 用内置关键词列表 / use built-in keywords

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--folder' && args[i + 1]) {
    folder = args[i + 1]; i++;
  } else if (args[i] === '--limit' && args[i + 1]) {
    limit = parseInt(args[i + 1], 10); i++;
  } else if (args[i] === '--date' && args[i + 1]) {
    dateArg = args[i + 1]; i++;
  } else if (args[i] === '--subject-keyword' && args[i + 1]) {
    subjectKeyword = args[i + 1]; i++;
  }
}

// 从环境变量读取语言设置（由 imap-config.js 加载 .env_postcrossing）
const lang = process.env.LANG || 'en';

// ── 加载 IMAP 配置 / Load IMAP config ──────────────────────────────
let config;
try {
  config = resolveImapConfig();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const { imapOptions, meta } = config;

const i18n = {
  zh: {
    email: '邮箱',
    server: '服务器',
    folderOpened: '已打开',
    totalEmails: '封邮件',
    searchDate: '搜索日期',
    searchAll: '搜索全部历史邮件',
    customKeyword: '使用自定义关键词',
    noResults: '未找到 Postcrossing 地址邮件',
    possibleReason: '可能原因：Postcrossing 官方调整了邮件主题格式',
    solution: '解决方法',
    step1: '在你的邮箱中找到一封地址邮件（主题含 Postcard / CN- 等）',
    step2: '复制主题中一段独特的文字（不含卡号，避免太长）',
    step3: '用 --subject-keyword 参数传入，例如',
    noResultsForDate: '未找到当天的 Postcrossing 地址邮件',
    foundMatching: '共找到',
    matchingEmails: '封匹配邮件，显示最近',
    showingRecent: '封',
    readComplete: '读取完毕',
    openFolderFailed: '打开文件夹失败',
  },
  en: {
    email: 'Email',
    server: 'Server',
    folderOpened: 'Opened',
    totalEmails: 'emails',
    searchDate: 'Search date',
    searchAll: 'Searching all history',
    customKeyword: 'Using custom keyword',
    noResults: 'No Postcrossing address emails found',
    possibleReason: 'Possible reason: Postcrossing may have changed email subject format',
    solution: 'Solution',
    step1: 'Find an address email in your mailbox (subject contains Postcard / CN- etc.)',
    step2: 'Copy a unique phrase from the subject (without ID, keep it short)',
    step3: 'Pass it via --subject-keyword, e.g.',
    noResultsForDate: 'No Postcrossing address emails found for this date',
    foundMatching: 'Found',
    matchingEmails: 'matching emails, showing recent',
    showingRecent: '',
    readComplete: 'Read complete',
    openFolderFailed: 'Failed to open folder',
  },
};
const t = i18n[lang] || i18n.en;

console.log(`📧 ${t.email}: ${meta.account} (${meta.providerName})`);
console.log(`🔗 ${t.server}: ${meta.host}:${meta.port}\n`);
if (meta.providerNote) {
  console.log(`ℹ️  ${meta.providerNote}\n`);
}

// ── IMAP 搜索 ───────────────────────────────────
const imap = new Imap(imapOptions);

imap.once('ready', () => {
  imap.openBox(folder, true, (err, box) => {
    if (err) {
      console.error(`${t.openFolderFailed} "${folder}":`, err.message);
      imap.end(); return;
    }
    console.log(`📂 ${t.folderOpened}: ${folder} (${box.messages.total} ${t.totalEmails})`);
    if (dateArg) {
      console.log(`🔍 ${t.searchDate}: ${dateArg}\n`);
    } else {
      console.log(`🔍 ${t.searchAll}\n`);
    }

    // ── 关键词策略 / Keyword strategy ────────────────────────────────────────────────────────
    // Postcrossing 不同时期/语言的邮件主题格式可能不同，内置三种已知格式：
    //   "Postcard ID"  → 新格式：Postcrossing Postcard ID: CN-XXXXXXX
    //   "PostcardID"   → 老格式：Postcrossing - PostcardID: CN-XXXXXXX
    //   "Postcrossing" → 通用匹配：匹配所有 Postcrossing 相关邮件
    // 如果用户通过 --subject-keyword 传入自定义词，则只用该词搜一次。
    const keywords = subjectKeyword ? [subjectKeyword] : ['Postcard ID', 'PostcardID', 'Postcrossing'];
    if (subjectKeyword) {
      console.log(`🔑 ${t.customKeyword}: "${subjectKeyword}"\n`);
    }

    // 依次对每个关键词搜索，合并 UID 去重
    let pendingSearches = keywords.length;
    const allUidsSet = new Set();

    function afterSearches() {
      const allUids = [...allUidsSet];
      if (!allUids.length) {
        // ── 诊断提示 / Diagnostic hints ─────────────────────────────────────────────────────
        console.log(`\n📭 ${t.noResults}.`);
        console.log(`   ${t.possibleReason}.`);
        console.log(`   ${t.solution}:`);
        console.log(`   1. ${t.step1}`);
        console.log(`   2. ${t.step2}`);
        console.log(`   3. ${t.step3}:`);
        console.log(`        node scripts/search-postcrossing.js --subject-keyword "Postcard"`);
        imap.end(); return;
      }

      const fetch = imap.fetch(allUids, { bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)', struct: true });
      const results = [];

      fetch.on('message', (msg) => {
        let header = '';
        let uid;
        msg.on('body', (stream) => {
          stream.on('data', (chunk) => header += chunk.toString('utf8'));
        });
        msg.once('attributes', (attrs) => { uid = attrs.uid; });
        msg.once('end', () => {
          const lines   = header.split(/\r?\n/);
          const subject = lines.find(l => l.toLowerCase().startsWith('subject:')) || '';
          const from    = lines.find(l => l.toLowerCase().startsWith('from:'))    || '';
          const dateStr = lines.find(l => l.toLowerCase().startsWith('date:'))    || '';
          const dateVal = dateStr.replace(/^date:\s*/i, '').trim();
          const parsed  = new Date(dateVal);
          const dateISO = !isNaN(parsed) ? parsed.toISOString().slice(0, 10) : '';

          // 有 --date 才过滤，否则全部收录
          if (!dateArg || dateISO === dateArg) {
            results.push({ uid, subject, from, dateStr });
          }
        });
      });

      fetch.once('error', (err) => console.error('fetch error:', err));
      fetch.once('end', () => {
        if (results.length === 0) {
          const hint = dateArg ? ` ${dateArg}` : '';
          console.log(`📭 ${t.noResultsForDate}${hint}`);
          imap.end(); return;
        }
        // 按日期排序，最新的在后 / Sort by date, newest last
        results.sort((a, b) => new Date(a.dateStr.replace(/^date:\s*/i,'')) - new Date(b.dateStr.replace(/^date:\s*/i,'')));
        const show = limit > 0 ? results.slice(-limit) : results;
        console.log(`${t.foundMatching} ${results.length} ${t.matchingEmails} ${show.length}${t.showingRecent ? ' ' + t.showingRecent : ''}:\n`);
        show.forEach((r, i) => {
          console.log(`--- ${i + 1} (UID: ${r.uid}) ---`);
          console.log(r.subject);
          console.log(r.from);
          console.log(r.dateStr);
          console.log();
        });
        console.log(t.readComplete);
        imap.end();
      });
    }

    for (const kw of keywords) {
      imap.search([['SUBJECT', kw]], (err, uids) => {
        if (!err && uids) uids.forEach(u => allUidsSet.add(u));
        pendingSearches--;
        if (pendingSearches === 0) afterSearches();
      });
    }
  });
});

imap.once('error', (err) => console.error('IMAP Error:', err.message));
imap.connect();

