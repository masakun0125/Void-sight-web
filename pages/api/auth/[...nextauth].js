import NextAuth from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import supabase from '../../../lib/supabase';

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId:     process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: {
        params: { scope: 'identify email guilds' },
      },
    }),
  ],

  callbacks: {
    async signIn({ profile }) {
      const discordId = profile.id;
      console.log('signIn called for:', discordId);

      const { data: existing, error: selErr } = await supabase
        .from('users')
        .select('id')
        .eq('discord_id', discordId)
        .single();

      console.log('existing:', existing, 'selErr:', selErr);

      if (!existing) {
        const { error: insErr } = await supabase.from('users').insert({
          discord_id:   discordId,
          discord_name: profile.username,
          avatar:       profile.avatar,
          roles:        [],
          config:       defaultConfig(),
        });
        console.log('insert error:', insErr);
      } else {
        const { error: updErr } = await supabase.from('users').update({
          discord_name: profile.username,
          avatar:       profile.avatar,
        }).eq('discord_id', discordId);
        console.log('update error:', updErr);
      }

      return true;
    },

    async session({ session, token }) {
      session.discordId = token.sub;

      const { data } = await supabase
        .from('users')
        .select('roles')
        .eq('discord_id', token.sub)
        .single();

      session.roles = data?.roles || [];
      return session;
    },

    async jwt({ token, profile }) {
      if (profile) token.sub = profile.id;
      return token;
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },
};

export default NextAuth(authOptions);

function defaultConfig() {
  return {
    tabFormat: 1,
    nickDetect: true,
    sniperAlert: { minFkdr: 5, minStars: 200 },
    colorThresholds: {
      fkdr: [{ min: 0, color: '§a' }, { min: 2, color: '§e' }, { min: 5, color: '§6' }, { min: 10, color: '§c' }],
      wlr:  [{ min: 0, color: '§a' }, { min: 1, color: '§e' }, { min: 3, color: '§6' }, { min: 7,  color: '§c' }],
      kdr:  [{ min: 0, color: '§a' }, { min: 2, color: '§e' }, { min: 5, color: '§6' }, { min: 10, color: '§c' }],
    },
    tags:      {},
    blacklist: [],
    friends:   [],
  };
}
