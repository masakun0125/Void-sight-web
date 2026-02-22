import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import supabase from '../../lib/supabase';

const MEMBER_ROLE = process.env.DISCORD_MEMBER_ROLE || 'Member';
const ROLE_GATED_KEYS = ['tags', 'blacklist', 'friends'];

export default async function handler(req, res) {
  let discordId = null;
  let userRoles = [];

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
      const { data: u } = await supabase
        .from('users')
        .select('roles')
        .eq('discord_id', discordId)
        .single();
      userRoles = u?.roles || [];
    }
  }

  if (!discordId) {
    const session = await getServerSession(req, res, authOptions);
    if (session?.discordId) {
      discordId = session.discordId;
      userRoles = session.roles || [];
    }
  }

  if (!discordId) return res.status(401).json({ error: 'Unauthorized' });

  const isMember = userRoles.includes(MEMBER_ROLE);

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('users')
      .select('config, roles, premium')
      .eq('discord_id', discordId)
      .single();

    if (error || !data) return res.status(404).json({ error: 'User not found' });

    const isPremium = data.premium ?? false;

    return res.status(200).json({
      ...data.config,
      _meta: { isMember, isPremium, roles: userRoles },
    });
  }

  if (req.method === 'POST') {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object')
      return res.status(400).json({ error: 'Invalid body' });

    // ※ gatedキーが含まれていても403にせず、sanitize()内でMember以外は除外する

    const { data: current } = await supabase
      .from('users')
      .select('config, premium')
      .eq('discord_id', discordId)
      .single();

    const isPremium = current?.premium ?? false;
    const merged = deepMerge(current?.config || {}, sanitize(incoming, isMember, isPremium));

    const { error } = await supabase
      .from('users')
      .update({ config: merged, updated_at: new Date().toISOString() })
      .eq('discord_id', discordId);

    if (error) return res.status(500).json({ error: 'DB error' });

    return res.status(200).json({
      ...merged,
      _meta: { isMember, isPremium, roles: userRoles },
    });
  }

  return res.status(405).end();
}

function sanitize(obj, isMember, isPremium) {
  console.log('sanitize input:', JSON.stringify(obj).slice(0, 200));
  console.log('isMember:', isMember, 'isPremium:', isPremium);
  const allowed = ['tabFormat', 'tabFormatCustom', 'sniperAlert', 'colorThresholds', 'nickDetect', 'style', 'autoWho', 'autoGl', 'autoGlMsg', 'autoGg', 'autoGgMsg'];
  if (isMember) allowed.push('tags', 'blacklist', 'friends');

  const out = {};
  for (const k of allowed) {
    if (k in obj) out[k] = obj[k];
  }

  if (out.style && typeof out.style === 'object') {
    const s = out.style;
    const validFreeThemes = ['default', 'midnight'];
    out.style = {
      theme: validFreeThemes.includes(s.theme)
        ? s.theme
        : (isPremium ? s.theme : 'default'),
      font: isPremium ? (s.font || 'inter') : 'inter',
      ...(isPremium && {
        customBgStart:     s.customBgStart     || '#070709',
        customBgEnd:       s.customBgEnd       || '#070709',
        customAccentStart: s.customAccentStart || '#b5f23d',
        customAccentEnd:   s.customAccentEnd   || '#b5f23d',
        gradientBg:        s.gradientBg        || false,
        gradientAccent:    s.gradientAccent    || false,
      }),
    };
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
