// GET  /api/config  → 設定取得（ロール情報も返す）
// POST /api/config  → 設定保存（ロール制限あり）
// 認証: Bearerトークン（ローカルVØID）またはセッション（Web）

import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import supabase from '../../lib/supabase';

// 環境変数からロール名を取得（未設定時はデフォルト）
const MEMBER_ROLE = process.env.DISCORD_MEMBER_ROLE || 'Member';

// ロールが必要な設定キー
const ROLE_GATED_KEYS = ['tags', 'blacklist', 'friends'];

export default async function handler(req, res) {
  // ── 認証 ────────────────────────────────────────────────
  let discordId = null;
  let userRoles = [];

  // 1. Bearerトークン（ローカルVØID Sight）
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const { data: tokenRow } = await supabase
      .from('user_tokens')
      .select('discord_id')
      .eq('token', token)
      .single();
    if (tokenRow) {
      discordId = tokenRow.discord_id;
      // ロール取得
      const { data: u } = await supabase
        .from('users')
        .select('roles')
        .eq('discord_id', discordId)
        .single();
      userRoles = u?.roles || [];
    }
  }

  // 2. セッション（Webダッシュボード）
  if (!discordId) {
    const session = await getServerSession(req, res, authOptions);
    if (session?.discordId) {
      discordId  = session.discordId;
      userRoles  = session.roles || [];
    }
  }

  if (!discordId) return res.status(401).json({ error: 'Unauthorized' });

  const isMember = userRoles.includes(MEMBER_ROLE);

  // ── GET ─────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('users')
      .select('config, roles')
      .eq('discord_id', discordId)
      .single();

    if (error || !data) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json({
      ...data.config,
      _meta: { isMember, roles: userRoles },
    });
  }

  // ── POST ────────────────────────────────────────────────
  if (req.method === 'POST') {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object')
      return res.status(400).json({ error: 'Invalid body' });

    // ロールが必要なキーを非メンバーが送ってきたら403
    const hasGatedKey = ROLE_GATED_KEYS.some(k => k in incoming);
    if (hasGatedKey && !isMember) {
      return res.status(403).json({ error: `Role "${MEMBER_ROLE}" required` });
    }

    const { data: current } = await supabase
      .from('users')
      .select('config')
      .eq('discord_id', discordId)
      .single();

    const merged = deepMerge(current?.config || {}, sanitize(incoming, isMember));

    const { error } = await supabase
      .from('users')
      .update({ config: merged, updated_at: new Date().toISOString() })
      .eq('discord_id', discordId);

    if (error) return res.status(500).json({ error: 'DB error' });

    return res.status(200).json({
      ...merged,
      _meta: { isMember, roles: userRoles },
    });
  }

  return res.status(405).end();
}

function sanitize(obj, isMember) {
  // 全員が変更できる項目
  const allowed = ['tabFormat', 'sniperAlert', 'colorThresholds', 'nickDetect'];
  // メンバーのみ変更できる項目
  if (isMember) allowed.push(...ROLE_GATED_KEYS);

  const out = {};
  for (const k of allowed) {
    if (k in obj) out[k] = obj[k];
  }
  return out;
}

function deepMerge(base, override) {
  const result = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof base[k] === 'object') {
      result[k] = deepMerge(base[k], v);
    } else {
      result[k] = v;
    }
  }
  return result;
}
