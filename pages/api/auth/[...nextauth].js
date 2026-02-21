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
