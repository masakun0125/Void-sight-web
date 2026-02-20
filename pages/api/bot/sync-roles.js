// POST /api/bot/sync-roles
// Discord Botが呼び出す専用エンドポイント
// body: { secret, members: [{ discordId, roles: ['RoleName', ...] }] }

import supabase from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Bot専用のシークレットで認証（環境変数で設定）
  const { secret, members } = req.body;
  if (!secret || secret !== process.env.BOT_SYNC_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!Array.isArray(members)) {
    return res.status(400).json({ error: 'Invalid body' });
  }

  // バッチでupsert
  const updates = members.map(m => ({
    discord_id: m.discordId,
    roles:      m.roles || [],
    synced_at:  new Date().toISOString(),
  }));

  // discord_idが既存なら roles を更新、なければ何もしない
  // (ユーザー作成はsignIn時のみ行う)
  for (const u of updates) {
    await supabase
      .from('users')
      .update({ roles: u.roles, synced_at: u.synced_at })
      .eq('discord_id', u.discord_id);
  }

  return res.status(200).json({ ok: true, synced: updates.length });
}
