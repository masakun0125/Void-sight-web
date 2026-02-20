import NextAuth from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import supabase from '../../../lib/supabase';

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId:     process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      // guilds スコープを追加してサーバー情報も取得
      authorization: {
        params: { scope: 'identify email guilds' },
      },
    }),
  ],

  callbacks: {
    async signIn({ profile }) {
      const discordId = profile.id;

      // ユーザーが存在しなければ自動作成（誰でもログインOK）
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('discord_id', discordId)
        .single();

      if (!existing) {
        await supabase.from('users').insert({
          discord_id:   discordId,
          discord_name: profile.username,
          avatar:       profile.avatar,
          roles:        [],           // Botが後から同期
          config:       defaultConfig(),
        });
      } else {
        // 名前・アバターを最新に更新
        await supabase.from('users').update({
          discord_name: profile.username,
          avatar:       profile.avatar,
        }).eq('discord_id', discordId);
      }

      return true;
    },

    async session({ session, token }) {
      session.discordId = token.sub;

      // DBからロール情報を取得してセッションに含める
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
