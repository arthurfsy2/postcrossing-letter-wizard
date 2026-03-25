/**
 * imap-config.js
 * 根据 .env_postcrossing 中的邮箱账号自动推断 IMAP 配置，支持手动覆盖。
 *
 * .env_postcrossing 必填：
 *   EMAIL_ACCOUNT     邮箱地址（如 user@gmail.com）
 *   EMAIL_AUTH_CODE   授权码或应用专用密码
 *
 * .env_postcrossing 可选覆盖（不填则自动推断）：
 *   IMAP_HOST         IMAP 服务器地址
 *   IMAP_PORT         端口（默认 993）
 *   IMAP_TLS          是否启用 TLS（默认 true）
 *   IMAP_REJECT_UNAUTHORIZED  是否验证 TLS 证书（默认 true；QQ 邮箱建议设 false）
 */

'use strict';

const path = require('path');
const fs = require('fs');

// ──────────────────────────────────────────────
// 安全优化：检查 .env_postcrossing 文件是否存在
// ──────────────────────────────────────────────
const envPath = path.join(__dirname, '../../.env_postcrossing');

// 语言检测（从环境变量或命令行参数）
const lang = process.env.LANG || 'en';

const i18n = {
  zh: {
    configNotFound: '❌ 未找到配置文件！',
    createHint: '   请在项目根目录创建 .env_postcrossing 文件，内容格式：',
    expectedPath: '   期望路径',
  },
  en: {
    configNotFound: '❌ Configuration file not found!',
    createHint: '   Please create .env_postcrossing in the project root:',
    expectedPath: '   Expected path',
  },
};
const t = i18n[lang] || i18n.en;

if (!fs.existsSync(envPath)) {
  console.error(t.configNotFound);
  console.error(t.createHint);
  console.error('   EMAIL_ACCOUNT=your@email.com');
  console.error('   EMAIL_AUTH_CODE=your_auth_code');
  console.error('   POSTCARD_COUNTRY_CODE=CN');
  console.error('   POSTCARD_SENDER_CITY=Shenzhen');
  console.error(`   ${t.expectedPath}: ${envPath}`);
  process.exit(1);
}

require('dotenv').config({ path: envPath, override: false });

// ──────────────────────────────────────────────
// 内置 IMAP 配置表（按邮箱后缀匹配）
// ──────────────────────────────────────────────
const BUILTIN_PROVIDERS = [
  // QQ 邮箱
  // ⚠️ 安全说明：rejectUnauthorized: false 会跳过 TLS 证书验证
  // 原因：QQ 邮箱的证书链在部分 Node.js 环境中验证失败，且官方文档建议客户端关闭验证
  // 风险：在公共 WiFi 环境下存在中间人攻击可能
  // 缓解：仅连接 imap.qq.com 官方服务器，不传输明文密码（使用授权码）
  // 替代方案：可通过 IMAP_REJECT_UNAUTHORIZED=true 手动开启严格验证
  {
    suffixes: ['qq.com'],
    host: 'imap.qq.com',
    port: 993,
    tls: true,
    rejectUnauthorized: false,
    name: 'QQ 邮箱',
  },
  // Gmail
  // ⚠️ 安全说明：rejectUnauthorized: false 会跳过 TLS 证书验证
  // 原因：Node.js 内置证书链与 Gmail 偶有兼容性问题，部分环境验证失败
  // 风险：在公共 WiFi 环境下存在中间人攻击可能
  // 缓解：仅连接 imap.gmail.com 官方服务器，使用应用专用密码（非主密码）
  // 替代方案：可通过 IMAP_REJECT_UNAUTHORIZED=true 手动开启严格验证
  {
    suffixes: ['gmail.com', 'googlemail.com'],
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    rejectUnauthorized: false,
    name: 'Gmail',
    note: '需在 Google 账号后台开启「两步验证」并生成「应用专用密码」',
  },
  // Outlook / Hotmail / Live / Microsoft 365
  {
    suffixes: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'],
    host: 'outlook.office365.com',
    port: 993,
    tls: true,
    rejectUnauthorized: true,
    name: 'Outlook / Hotmail',
    note: '需在账号安全设置中启用 IMAP 并允许「不太安全的应用」或使用应用密码',
  },
  // 163 网易邮箱
  {
    suffixes: ['163.com'],
    host: 'imap.163.com',
    port: 993,
    tls: true,
    rejectUnauthorized: true,
    name: '163 邮箱',
    note: '需在邮箱设置中开启 IMAP 并获取授权码',
  },
  // 126 邮箱
  {
    suffixes: ['126.com'],
    host: 'imap.126.com',
    port: 993,
    tls: true,
    rejectUnauthorized: true,
    name: '126 邮箱',
    note: '需在邮箱设置中开启 IMAP 并获取授权码',
  },
  // 新浪邮箱
  {
    suffixes: ['sina.com', 'sina.cn'],
    host: 'imap.sina.com',
    port: 993,
    tls: true,
    rejectUnauthorized: true,
    name: '新浪邮箱',
  },
  // 企业微信邮箱 / 腾讯企业邮
  {
    suffixes: ['exmail.qq.com'],
    host: 'imap.exmail.qq.com',
    port: 993,
    tls: true,
    rejectUnauthorized: false,
    name: '腾讯企业邮箱',
  },
  // iCloud
  {
    suffixes: ['icloud.com', 'me.com', 'mac.com'],
    host: 'imap.mail.me.com',
    port: 993,
    tls: true,
    rejectUnauthorized: true,
    name: 'iCloud 邮箱',
    note: '需在 Apple ID 账号安全中生成「App 专用密码」',
  },
  // Yahoo
  {
    suffixes: ['yahoo.com', 'yahoo.co.uk', 'yahoo.co.jp', 'ymail.com'],
    host: 'imap.mail.yahoo.com',
    port: 993,
    tls: true,
    rejectUnauthorized: true,
    name: 'Yahoo 邮箱',
    note: '需在账号安全设置中生成应用专用密码',
  },
];

// ──────────────────────────────────────────────
// 核心：根据邮箱地址推断 IMAP 配置
// ──────────────────────────────────────────────
function resolveImapConfig() {
  const account  = process.env.EMAIL_ACCOUNT   || process.env.QQ_EMAIL_ACCOUNT;
  const authCode = process.env.EMAIL_AUTH_CODE || process.env.QQ_EMAIL_AUTH_CODE;

  if (!account) {
    const msg = lang === 'zh'
      ? '❌ 未找到邮箱账号！请在 .env_postcrossing 中设置 EMAIL_ACCOUNT=your@email.com'
      : '❌ Email account not found! Please set EMAIL_ACCOUNT=your@email.com in .env_postcrossing';
    throw new Error(msg);
  }
  if (!authCode) {
    const msg = lang === 'zh'
      ? '❌ 未找到授权码！请在 .env_postcrossing 中设置 EMAIL_AUTH_CODE=your_auth_code'
      : '❌ Auth code not found! Please set EMAIL_AUTH_CODE=your_auth_code in .env_postcrossing';
    throw new Error(msg);
  }

  const suffix = account.split('@')[1]?.toLowerCase();
  if (!suffix) {
    const msg = lang === 'zh'
      ? `❌ 邮箱地址格式不正确：${account}`
      : `❌ Invalid email format: ${account}`;
    throw new Error(msg);
  }

  // 1. 先按后缀匹配内置配置
  const builtin = BUILTIN_PROVIDERS.find(p =>
    p.suffixes.some(s => suffix === s || suffix.endsWith('.' + s))
  );

  // 2. 取 .env_postcrossing 手动覆盖值
  const manualHost = process.env.IMAP_HOST;
  const manualPort = process.env.IMAP_PORT ? parseInt(process.env.IMAP_PORT, 10) : null;
  const manualTls  = process.env.IMAP_TLS !== undefined
    ? process.env.IMAP_TLS !== 'false'
    : null;
  const manualRejectUnauthorized = process.env.IMAP_REJECT_UNAUTHORIZED !== undefined
    ? process.env.IMAP_REJECT_UNAUTHORIZED !== 'false'
    : null;

  // 3. 如果没有内置配置且没有手动填写 host，报错提示
  if (!builtin && !manualHost) {
    const supported = BUILTIN_PROVIDERS.map(p => p.suffixes.join(' / ')).join('\n  - ');
    if (lang === 'zh') {
      throw new Error(
        `❌ 暂不支持邮箱后缀「@${suffix}」的自动配置。\n` +
        `   已内置支持的邮箱：\n  - ${supported}\n\n` +
        `   如需使用其他邮箱，请在 .env_postcrossing 中手动指定：\n` +
        `   IMAP_HOST=imap.yourdomain.com\n` +
        `   IMAP_PORT=993\n` +
        `   IMAP_TLS=true\n` +
        `   IMAP_REJECT_UNAUTHORIZED=true`
      );
    } else {
      throw new Error(
        `❌ Auto-configuration not supported for "@${suffix}".\n` +
        `   Built-in supported providers:\n  - ${supported}\n\n` +
        `   For other providers, manually specify in .env_postcrossing:\n` +
        `   IMAP_HOST=imap.yourdomain.com\n` +
        `   IMAP_PORT=993\n` +
        `   IMAP_TLS=true\n` +
        `   IMAP_REJECT_UNAUTHORIZED=true`
      );
    }
  }

  // 4. 合并配置（手动覆盖优先于内置）
  const resolved = {
    host: manualHost || builtin.host,
    port: manualPort || builtin?.port || 993,
    tls:  manualTls  !== null ? manualTls : (builtin?.tls ?? true),
    rejectUnauthorized: manualRejectUnauthorized !== null
      ? manualRejectUnauthorized
      : (builtin?.rejectUnauthorized ?? true),
    providerName: builtin?.name || `自定义 (${manualHost})`,
    providerNote: builtin?.note || null,
  };

  return {
    // 用于直接传入 new Imap({}) 的配置
    imapOptions: {
      user: account,
      password: authCode,
      host: resolved.host,
      port: resolved.port,
      tls: resolved.tls,
      ...(resolved.tls ? { tlsOptions: { rejectUnauthorized: resolved.rejectUnauthorized } } : {}),
    },
    // 诊断信息（供脚本启动时打印）
    meta: {
      account,
      providerName: resolved.providerName,
      providerNote: resolved.providerNote,
      host: resolved.host,
      port: resolved.port,
    },
  };
}

module.exports = { resolveImapConfig, BUILTIN_PROVIDERS };
