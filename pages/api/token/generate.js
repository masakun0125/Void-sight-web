// POST /api/token/generate

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.discordId) return res.status(401).json({ error: 'Unauthorized' });

  const discordId = session.discordId;
  const token = uuidv4();

  await supabase.from('user_tokens').delete().eq('discord_id', discordId);
  const { error } = await supabase.from('user_tokens').insert({
    discord_id: discordId,
    token,
    created_at: new Date().toISOString(),
  });

  if (error) return res.status(500).json({ error: 'DB error' });
  return res.status(200).json({ token });
}
