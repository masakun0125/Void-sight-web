import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';

const MC_CSS = {
  '§a':'#4ade80','§e':'#facc15','§6':'#f97316',
  '§c':'#ff4d6d','§9':'#60a5fa','§d':'#e879f9',
  '§b':'#22d3ee','§f':'#f8fafc','§7':'#8888a8',
};
const COLOR_OPTS = [
  { code:'§a', css:'#4ade80', label:'緑' },
  { code:'§e', css:'#facc15', label:'黄' },
  { code:'§6', css:'#f97316', label:'橙' },
  { code:'§c', css:'#ff4d6d', label:'赤' },
  { code:'§9', css:'#60a5fa', label:'青' },
  { code:'§b', css:'#22d3ee', label:'水' },
  { code:'§d', css:'#e879f9', label:'紫' },
  { code:'§7', css:'#8888a8', label:'灰' },
];

const DEFAULT_CFG = {
  tabFormat: 1,
  tabFormatCustom: '{rank} {stars} {name} | {fkdr} {tag}',
  nickDetect: true,
  autoWho: false,
  autoGl: false,
  autoGlMsg: 'gl',
  autoGg: false,
  autoGgMsg: 'gg',
  sniperAlert: { minFkdr: 5, minStars: 200 },
  colorThresholds: {
    fkdr:[{min:0,color:'§a'},{min:2,color:'§e'},{min:5,color:'§6'},{min:10,color:'§c'}],
    wlr: [{min:0,color:'§a'},{min:1,color:'§e'},{min:3,color:'§6'},{min:7, color:'§c'}],
    kdr: [{min:0,color:'§a'},{min:2,color:'§e'},{min:5,color:'§6'},{min:10,color:'§c'}],
  },
  tags:{}, blacklist:[], friends:[],
};

const TABS = [
  { id:'display',  label:'Display' },
  { id:'auto',     label:'Auto' },
  { id:'alert',    label:'Sniper Alert' },
  { id:'colors',   label:'Colors' },
  { id:'tags',     label:'Tags & Lists', memberOnly: true },
  { id:'token',    label:'Local Token' },
];

const FREE_THEMES = ['default', 'midnight'];
const ALL_THEMES = [
  { id:'default',  label:'Default',  accent:'#b5f23d', bg:'#070709' },
  { id:'midnight', label:'Midnight', accent:'#a78bfa', bg:'#06061a' },
  { id:'blood',    label:'Blood',    accent:'#ff4d6d', bg:'#0a0608', premium: true },
  { id:'ghost',    label:'Ghost',    accent:'#f0f0f5', bg:'#111114', premium: true },
  { id:'gold',     label:'Gold',     accent:'#facc15', bg:'#080700', premium: true },
  { id:'custom',   label:'Custom',   accent:null,      bg:null,      premium: true },
];

const FONTS = [
  { id:'inter',     label:'Inter',          css:"'Inter', system-ui, sans-serif" },
  { id:'jetbrains', label:'JetBrains Mono', css:"'JetBrains Mono', monospace" },
  { id:'orbitron',  label:'Orbitron',       css:"'Orbitron', sans-serif" },
  { id:'rajdhani',  label:'Rajdhani',       css:"'Rajdhani', sans-serif" },
  { id:'exo2',      label:'Exo 2',          css:"'Exo 2', sans-serif" },
];

const DEFAULT_STYLE = {
  theme: 'default',
  font: 'inter',
  customBgStart:     '#070709',
  customBgEnd:       '#070709',
  customAccentStart: '#b5f23d',
  customAccentEnd:   '#b5f23d',
  gradientBg:      false,
  gradientAccent:  false,
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cfg, setCfg]             = useState(null);
  const [isMember, setMember]     = useState(false);
  const [isPremium, setPremium]   = useState(false);
  const [activeTab, setTab]       = useState('display');
  const [saveState, setSave]      = useState('idle');
  const [token, setToken]         = useState('');
  const [genning, setGenning]     = useState(false);
  const [tagForm, setTagForm]     = useState({ name:'', tag:'' });
  const [blForm,  setBlForm]      = useState('');
  const [frForm,  setFrForm]      = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [styleOpen,   setStyleOpen]   = useState(false);
  const [style, setStyle]             = useState(DEFAULT_STYLE);
  const saveTimer   = useRef(null);
  const profileRef  = useRef(null);
  const styleRef    = useRef(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated')   load();
  }, [status]);

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (styleRef.current   && !styleRef.current.contains(e.target))   setStyleOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (router.query.upgraded === 'true') {
      load();
      router.replace('/dashboard');
    }
  }, [router.query]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', style.theme);
    root.style.setProperty('--sans', FONTS.find(f => f.id === style.font)?.css || FONTS[0].css);
    if (style.theme === 'custom') {
      root.style.setProperty('--custom-bg-start',     style.customBgStart);
      root.style.setProperty('--custom-bg-end',       style.gradientBg ? style.customBgEnd : style.customBgStart);
      root.style.setProperty('--custom-accent-start', style.customAccentStart);
      root.style.setProperty('--custom-accent-end',   style.gradientAccent ? style.customAccentEnd : style.customAccentStart);
    }
    if (style.gradientBg && style.theme !== 'custom') {
      root.style.setProperty('--bg-end', style.customBgEnd);
    }
  }, [style]);

  async function load() {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) { router.push('/login'); return; }
      const data = await res.json();
      const { _meta, ...rest } = data;
      setCfg({ ...DEFAULT_CFG, ...rest });
      setMember(_meta?.isMember ?? false);
      setPremium(_meta?.isPremium ?? false);
      if (rest.style) setStyle({ ...DEFAULT_STYLE, ...rest.style });
    } catch { setCfg(DEFAULT_CFG); }
  }

  const save = useCallback(async (nextCfg) => {
    setSave('saving');
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextCfg || cfg),
      });
      if (!res.ok) {
        const e = await res.json();
        console.error(e.error);
        setSave('error');
        setTimeout(() => setSave('idle'), 2000);
        return;
      }
      setSave('saved');
      setTimeout(() => setSave('idle'), 1800);
    } catch {
      setSave('error');
      setTimeout(() => setSave('idle'), 2000);
    }
  }, [cfg]);

  function update(path, value) {
    const next = JSON.parse(JSON.stringify(cfg));
    const keys = path.split('.');
    let obj = next;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    setCfg(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(next), 800);
  }

  function updateStyle(key, value) {
    const next = { ...style, [key]: value };
    setStyle(next);
    const nextCfg = { ...cfg, style: next };
    setCfg(nextCfg);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(nextCfg), 800);
  }

  async function genToken() {
    setGenning(true);
    try {
      const r = await fetch('/api/token/generate', { method: 'POST' });
      const d = await r.json();
      if (d.token) setToken(d.token);
    } finally { setGenning(false); }
  }

  function handleUpgrade() {
    router.push('/premium');
  }

  if (status !== 'authenticated' || !cfg) return <Loading />;

  const visibleTabs = TABS.filter(t => !t.memberOnly || isMember);

  return (
    <>
      <Head>
        <title>VØID Sight – Dashboard</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <div style={S.root}>

        <header style={S.header}>
          <div style={S.hInner}>
            <div style={S.hLogo}>
              <img src="/voidsight.png" alt="VOID SIGHT" style={{ height:28, objectFit:'contain' }} />
            </div>
            <div style={S.hRight}>
              {isMember && (
                <span style={S.memberBadge}>
                  <span style={{ color:'var(--acid)' }}>✦</span> Member
                </span>
              )}
              {isPremium && (
                <span style={S.premiumBadge}>★ Premium</span>
              )}
              <span style={{ ...S.saveIndicator, ...(saveState !== 'idle' ? S.saveVisible : {}) }}>
                {saveState === 'saving' && <><Spinner /> Saving</>}
                {saveState === 'saved'  && <><span style={{color:'var(--acid)'}}>✓</span> Saved</>}
                {saveState === 'error'  && <span style={{color:'var(--red)'}}>✕ Error</span>}
              </span>

              <div style={{ position:'relative' }} ref={styleRef}>
                <button
                  style={S.iconBtn}
                  onClick={() => { setStyleOpen(v => !v); setProfileOpen(false); }}
                  title="スタイル設定"
                >
                  ⚙
                </button>

                {styleOpen && (
                  <div style={S.stylePanel}>
                    <p style={S.panelTitle}>STYLE</p>

                    <p style={S.panelLabel}>THEME</p>
                    <div style={S.themeGrid}>
                      {ALL_THEMES.map(t => {
                        const locked = t.premium && !isPremium;
                        return (
                          <div
                            key={t.id}
                            style={{
                              ...S.themeChip,
                              ...(style.theme === t.id ? S.themeChipActive : {}),
                              ...(locked ? S.themeChipLocked : {}),
                            }}
                            onClick={() => {
                              if (locked) { router.push('/premium'); return; }
                              updateStyle('theme', t.id);
                            }}
                          >
                            {t.accent && (
                              <span style={{
                                display:'inline-block', width:10, height:10,
                                borderRadius:'50%', background:t.accent, marginRight:4,
                              }} />
                            )}
                            {t.label}
                            {locked && <span style={{ marginLeft:4, fontSize:'0.6rem' }}>🔒</span>}
                          </div>
                        );
                      })}
                    </div>

                    {isPremium && style.theme === 'custom' && (
                      <>
                        <div style={S.panelDivider} />
                        <p style={S.panelLabel}>BACKGROUND</p>
                        <div style={S.colorRow}>
                          <input type="color" value={style.customBgStart}
                            onChange={e => updateStyle('customBgStart', e.target.value)}
                            style={S.colorPicker} />
                          <label style={S.toggleRow}>
                            <input type="checkbox" checked={style.gradientBg}
                              onChange={e => updateStyle('gradientBg', e.target.checked)}
                              style={{ accentColor:'var(--acid)' }} />
                            <span style={{ fontSize:'0.75rem', color:'var(--mid)', marginLeft:6 }}>グラデーション</span>
                          </label>
                          {style.gradientBg && (
                            <input type="color" value={style.customBgEnd}
                              onChange={e => updateStyle('customBgEnd', e.target.value)}
                              style={S.colorPicker} />
                          )}
                        </div>

                        <p style={S.panelLabel}>ACCENT</p>
                        <div style={S.colorRow}>
                          <input type="color" value={style.customAccentStart}
                            onChange={e => updateStyle('customAccentStart', e.target.value)}
                            style={S.colorPicker} />
                          <label style={S.toggleRow}>
                            <input type="checkbox" checked={style.gradientAccent}
                              onChange={e => updateStyle('gradientAccent', e.target.checked)}
                              style={{ accentColor:'var(--acid)' }} />
                            <span style={{ fontSize:'0.75rem', color:'var(--mid)', marginLeft:6 }}>グラデーション</span>
                          </label>
                          {style.gradientAccent && (
                            <input type="color" value={style.customAccentEnd}
                              onChange={e => updateStyle('customAccentEnd', e.target.value)}
                              style={S.colorPicker} />
                          )}
                        </div>
                      </>
                    )}

                    {isPremium && (
                      <>
                        <div style={S.panelDivider} />
                        <p style={S.panelLabel}>FONT</p>
                        <div style={S.fontList}>
                          {FONTS.map(f => (
                            <div
                              key={f.id}
                              style={{
                                ...S.fontChip,
                                ...(style.font === f.id ? S.fontChipActive : {}),
                                fontFamily: f.css,
                              }}
                              onClick={() => updateStyle('font', f.id)}
                            >
                              {f.label}
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {!isPremium && (
                      <>
                        <div style={S.panelDivider} />
                        <button style={S.upgradeMini} onClick={() => router.push('/premium')}>
                          ★ Premiumでさらにカスタマイズ
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div style={{ position:'relative' }} ref={profileRef}>
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    style={{ ...S.avatar, cursor:'pointer' }}
                    onClick={() => { setProfileOpen(v => !v); setStyleOpen(false); }}
                  />
                )}

                {profileOpen && (
                  <div style={S.profilePanel}>
                    <div style={S.profileTop}>
                      {session.user?.image && (
                        <img src={session.user.image} alt="" style={S.profileAvatar} />
                      )}
                      <div>
                        <p style={S.profileName}>{session.user?.name}</p>
                        <div style={{ display:'flex', gap:4, marginTop:4, flexWrap:'wrap' }}>
                          {isMember && (
                            <span style={S.memberBadge}>
                              <span style={{ color:'var(--acid)' }}>✦</span> Member
                            </span>
                          )}
                          {isPremium && (
                            <span style={S.premiumBadge}>★ Premium</span>
                          )}
                          {!isMember && !isPremium && (
                            <span style={S.freeBadge}>Free</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={S.profileDivider} />

                    {!isPremium && (
                      <button style={S.upgradeBtn} onClick={handleUpgrade}>
                        ★ Premiumにアップグレード
                        <span style={S.upgradePrize}>月額300円〜</span>
                      </button>
                    )}

                    <button
                      style={S.logoutBtnPanel}
                      onClick={() => signOut({ callbackUrl: '/login' })}
                    >
                      ログアウト
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main style={S.main}>
          <nav style={S.tabNav}>
            {visibleTabs.map(t => (
              <button
                key={t.id}
                style={{ ...S.tabBtn, ...(activeTab === t.id ? S.tabActive : {}) }}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.memberOnly && <span style={S.memberDot}>✦</span>}
              </button>
            ))}
            {!isMember && (
              <div style={S.lockedTab}>
                <span style={{ color:'var(--dim)' }}>🔒</span> Tags & Lists
                <span style={S.lockHint}>サーバーメンバー限定</span>
              </div>
            )}
          </nav>

          <div style={S.panel}>

            {/* ── Display ── */}
            {activeTab === 'display' && (
              <Section title="DISPLAY" desc="オーバーレイの表示設定">
                <p style={S.subSectionLabel}>TAB_FORMAT</p>
                {[
                  { n:1, label:'{rank} {stars} {name} | {fkdr} {tag}' },
                  { n:2, label:'{stars} {name} | {fkdr} {tag}' },
                  { n:3, label:'{name} {fkdr}' },
                ].map(p => (
                  <label key={p.n} style={{ ...S.radioRow, ...(cfg.tabFormat===p.n ? S.radioRowActive:{}) }}>
                    <input type="radio" name="fmt" checked={cfg.tabFormat===p.n}
                      onChange={() => update('tabFormat', p.n)}
                      style={{ accentColor:'var(--acid)' }} />
                    <span style={S.radioN}>{p.n}</span>
                    <code style={S.code}>{p.label}</code>
                  </label>
                ))}

                {isPremium && (
                  <div style={{ marginTop:'0.75rem' }}>
                    <label style={{ ...S.radioRow, ...(cfg.tabFormat===0 ? S.radioRowActive:{}) }}>
                      <input type="radio" name="fmt" checked={cfg.tabFormat===0}
                        onChange={() => update('tabFormat', 0)}
                        style={{ accentColor:'var(--acid)' }} />
                      <span style={S.radioN}>✦</span>
                      <span style={{ fontSize:'0.78rem', color:'var(--mid)' }}>カスタム</span>
                    </label>
                    {cfg.tabFormat === 0 && (
                      <input
                        style={{ ...S.txtIn, marginTop:6, fontFamily:'var(--mono)', fontSize:'0.8rem' }}
                        value={cfg.tabFormatCustom || ''}
                        placeholder="{rank} {stars} {name} | {fkdr} {tag}"
                        onChange={e => update('tabFormatCustom', e.target.value)}
                      />
                    )}
                  </div>
                )}

                {!isPremium && (
                  <p style={{ ...S.hint, marginTop:'0.5rem' }}>
                    <span style={{ color:'#facc15' }}>★</span> Premiumでカスタム書式が使えます
                  </p>
                )}

                <div style={{ marginTop:'1rem' }}>
                  <label style={S.checkRow}>
                    <input type="checkbox" checked={cfg.nickDetect}
                      onChange={e => update('nickDetect', e.target.checked)}
                      style={{ accentColor:'var(--acid)', width:14, height:14 }} />
                    <span style={{ marginLeft:8 }}>Nick Detection</span>
                    <span style={S.hint}>ニックの可能性があるプレイヤーを §d[NICK?] で表示</span>
                  </label>
                </div>
              </Section>
            )}

            {/* ── Auto ── */}
            {activeTab === 'auto' && (
              <Section title="AUTO" desc="自動コマンド・メッセージの設定">

                {/* Auto WHO */}
                <div style={S.autoRow}>
                  <div style={S.autoLeft}>
                    <p style={S.autoLabel}>AUTO_WHO</p>
                    <p style={S.autoDesc}>ゲーム開始時に /who を自動実行</p>
                  </div>
                  <Toggle
                    checked={cfg.autoWho}
                    onChange={v => update('autoWho', v)}
                  />
                </div>

                <div style={S.autoDivider} />

                {/* Auto GL */}
                <div style={S.autoRow}>
                  <div style={S.autoLeft}>
                    <p style={S.autoLabel}>AUTO_GL</p>
                    <p style={S.autoDesc}>ゲーム開始時に自動でメッセージを送信</p>
                  </div>
                  <Toggle
                    checked={cfg.autoGl}
                    onChange={v => update('autoGl', v)}
                  />
                </div>
                {cfg.autoGl && (
                  <div style={S.autoMsgBox}>
                    <label style={S.autoMsgLabel}>MESSAGE</label>
                    {isPremium ? (
                      <input
                        style={S.txtIn}
                        value={cfg.autoGlMsg || 'gl'}
                        onChange={e => update('autoGlMsg', e.target.value)}
                        placeholder="gl"
                      />
                    ) : (
                      <div style={S.autoMsgLocked}>
                        <code style={S.code}>gl</code>
                        <span style={S.premiumHint}>
                          <span style={{ color:'#facc15' }}>★</span> Premiumでカスタマイズ可能
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div style={S.autoDivider} />

                {/* Auto GG */}
                <div style={S.autoRow}>
                  <div style={S.autoLeft}>
                    <p style={S.autoLabel}>AUTO_GG</p>
                    <p style={S.autoDesc}>ゲーム終了時に自動でメッセージを送信</p>
                  </div>
                  <Toggle
                    checked={cfg.autoGg}
                    onChange={v => update('autoGg', v)}
                  />
                </div>
                {cfg.autoGg && (
                  <div style={S.autoMsgBox}>
                    <label style={S.autoMsgLabel}>MESSAGE</label>
                    {isPremium ? (
                      <input
                        style={S.txtIn}
                        value={cfg.autoGgMsg || 'gg'}
                        onChange={e => update('autoGgMsg', e.target.value)}
                        placeholder="gg"
                      />
                    ) : (
                      <div style={S.autoMsgLocked}>
                        <code style={S.code}>gg</code>
                        <span style={S.premiumHint}>
                          <span style={{ color:'#facc15' }}>★</span> Premiumでカスタマイズ可能
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </Section>
            )}

            {/* ── Sniper Alert ── */}
            {activeTab === 'alert' && (
              <Section title="SNIPER_ALERT" desc="強プレイヤーが入ったときにチャットで通知する閾値">
                <div style={S.row2}>
                  <FieldGroup label="MIN_FKDR">
                    <input style={S.numIn} type="number" min="0" step="0.1"
                      value={cfg.sniperAlert.minFkdr}
                      onChange={e => update('sniperAlert.minFkdr', parseFloat(e.target.value)||0)} />
                  </FieldGroup>
                  <FieldGroup label="MIN_STARS">
                    <input style={S.numIn} type="number" min="0" step="1"
                      value={cfg.sniperAlert.minStars}
                      onChange={e => update('sniperAlert.minStars', parseInt(e.target.value)||0)} />
                  </FieldGroup>
                </div>
                <p style={S.desc2}>
                  FKDR ≥ {cfg.sniperAlert.minFkdr} または Stars ≥ {cfg.sniperAlert.minStars} のとき警告
                </p>
              </Section>
            )}

            {/* ── Colors ── */}
            {activeTab === 'colors' && (
              <Section title="COLOR_THRESHOLDS" desc="統計値の範囲に応じた色設定">
                {['fkdr','wlr','kdr'].map(stat => (
                  <div key={stat} style={{ marginBottom:'1.75rem' }}>
                    <p style={S.statLabel}>{stat.toUpperCase()}</p>
                    {cfg.colorThresholds[stat].map((row, i) => (
                      <div key={i} style={S.thRow}>
                        <span style={S.thIdx}>#{i+1}</span>
                        <span style={S.thLabel}>min</span>
                        <input style={S.thInput} type="number" min="0" step="0.1"
                          value={row.min}
                          onChange={e => {
                            const next = JSON.parse(JSON.stringify(cfg));
                            next.colorThresholds[stat][i].min = parseFloat(e.target.value)||0;
                            setCfg(next);
                            clearTimeout(saveTimer.current);
                            saveTimer.current = setTimeout(() => save(next), 800);
                          }} />
                        <div style={S.swatches}>
                          {COLOR_OPTS.map(opt => (
                            <button key={opt.code} title={opt.label}
                              style={{
                                ...S.swatch,
                                background: opt.css,
                                boxShadow: row.color===opt.code ? `0 0 0 2px var(--bg), 0 0 0 3px ${opt.css}` : 'none',
                              }}
                              onClick={() => {
                                const next = JSON.parse(JSON.stringify(cfg));
                                next.colorThresholds[stat][i].color = opt.code;
                                setCfg(next);
                                clearTimeout(saveTimer.current);
                                saveTimer.current = setTimeout(() => save(next), 800);
                              }} />
                          ))}
                        </div>
                        <span style={{ fontFamily:'var(--mono)', fontSize:'0.75rem', color: MC_CSS[row.color]||'#fff' }}>
                          {row.color}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </Section>
            )}

            {/* ── Tags & Lists ── */}
            {activeTab === 'tags' && isMember && (
              <Section title="TAGS_AND_LISTS" desc="プレイヤーへのタグ・BL・フレンド管理">
                <SubSection title="TAGS">
                  <div style={S.addRow}>
                    <input style={S.txtIn} placeholder="Player" value={tagForm.name}
                      onChange={e => setTagForm(p=>({...p, name:e.target.value}))} />
                    <input style={{...S.txtIn, maxWidth:120}} placeholder="Tag" value={tagForm.tag}
                      onChange={e => setTagForm(p=>({...p, tag:e.target.value}))} />
                    <AddBtn onClick={() => {
                      if (!tagForm.name||!tagForm.tag) return;
                      const next = JSON.parse(JSON.stringify(cfg));
                      next.tags[tagForm.name] = tagForm.tag;
                      setCfg(next);
                      setTagForm({name:'',tag:''});
                      clearTimeout(saveTimer.current);
                      saveTimer.current = setTimeout(() => save(next), 800);
                    }} />
                  </div>
                  <ListBox>
                    {Object.entries(cfg.tags).length === 0
                      ? <Empty />
                      : Object.entries(cfg.tags).map(([name, tag]) => (
                        <ListItem key={name}
                          badge={`[${tag}]`} badgeColor="var(--voidL)"
                          name={name}
                          onRemove={() => {
                            const next = JSON.parse(JSON.stringify(cfg));
                            delete next.tags[name];
                            setCfg(next);
                            clearTimeout(saveTimer.current);
                            saveTimer.current = setTimeout(() => save(next), 800);
                          }} />
                      ))
                    }
                  </ListBox>
                </SubSection>

                <SubSection title="BLACKLIST">
                  <div style={S.addRow}>
                    <input style={S.txtIn} placeholder="Player" value={blForm}
                      onChange={e => setBlForm(e.target.value)} />
                    <AddBtn onClick={() => {
                      if (!blForm.trim()) return;
                      const next = JSON.parse(JSON.stringify(cfg));
                      next.blacklist = [...new Set([...(next.blacklist||[]),blForm.trim()])];
                      setCfg(next); setBlForm('');
                      clearTimeout(saveTimer.current);
                      saveTimer.current = setTimeout(() => save(next), 800);
                    }} />
                  </div>
                  <ListBox>
                    {(cfg.blacklist||[]).length===0 ? <Empty /> :
                      (cfg.blacklist||[]).map(name=>(
                        <ListItem key={name} badge="BL" badgeColor="var(--red)" name={name}
                          onRemove={() => {
                            const next=JSON.parse(JSON.stringify(cfg));
                            next.blacklist=next.blacklist.filter(x=>x!==name);
                            setCfg(next);
                            clearTimeout(saveTimer.current);
                            saveTimer.current=setTimeout(()=>save(next),800);
                          }} />
                      ))
                    }
                  </ListBox>
                </SubSection>

                <SubSection title="FRIENDS">
                  <div style={S.addRow}>
                    <input style={S.txtIn} placeholder="Player" value={frForm}
                      onChange={e => setFrForm(e.target.value)} />
                    <AddBtn onClick={() => {
                      if (!frForm.trim()) return;
                      const next = JSON.parse(JSON.stringify(cfg));
                      next.friends = [...new Set([...(next.friends||[]),frForm.trim()])];
                      setCfg(next); setFrForm('');
                      clearTimeout(saveTimer.current);
                      saveTimer.current = setTimeout(() => save(next), 800);
                    }} />
                  </div>
                  <ListBox>
                    {(cfg.friends||[]).length===0 ? <Empty /> :
                      (cfg.friends||[]).map(name=>(
                        <ListItem key={name} badge="♥" badgeColor="var(--acid)" name={name}
                          onRemove={() => {
                            const next=JSON.parse(JSON.stringify(cfg));
                            next.friends=next.friends.filter(x=>x!==name);
                            setCfg(next);
                            clearTimeout(saveTimer.current);
                            saveTimer.current=setTimeout(()=>save(next),800);
                          }} />
                      ))
                    }
                  </ListBox>
                </SubSection>
              </Section>
            )}

            {/* ── Token ── */}
            {activeTab === 'token' && (
              <Section title="LOCAL_TOKEN" desc="VØID SightのローカルクライアントとWebを接続するトークン">
                <p style={S.desc2}>
                  トークンを生成して <code style={S.inlineCode}>config.json</code> の{' '}
                  <code style={S.inlineCode}>cloudToken</code> に設定すると、<br/>
                  起動時に自動でクラウド設定をsyncします。
                </p>
                <button style={{ ...S.genBtn, opacity: genning ? 0.6 : 1 }}
                  onClick={genToken} disabled={genning}>
                  {genning ? '生成中...' : 'トークンを生成'}
                </button>
                {token && (
                  <div style={S.tokenBox}>
                    <p style={S.tokenLabel}>TOKEN <span style={{color:'var(--red)'}}>（再表示不可）</span></p>
                    <div style={S.tokenRow}>
                      <code style={S.tokenVal}>{token}</code>
                      <button style={S.copyBtn}
                        onClick={() => navigator.clipboard.writeText(token)}>
                        Copy
                      </button>
                    </div>
                    <p style={S.desc2}>
                      config.jsonに追記:{' '}
                      <code style={S.inlineCode}>"cloudToken": "{token}"</code>
                    </p>
                  </div>
                )}
              </Section>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

function Loading() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ fontFamily:'var(--mono)', color:'var(--dim)', fontSize:'0.8rem',
        animation:'pulse 1.2s ease infinite' }}>LOADING...</p>
    </div>
  );
}
function Spinner() {
  return <span style={{ display:'inline-block', animation:'pulse 0.8s linear infinite' }}>◌</span>;
}
function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width:44, height:24, borderRadius:12, cursor:'pointer',
        background: checked ? 'var(--acid)' : 'var(--border2)',
        position:'relative', transition:'background 0.2s', flexShrink:0,
      }}
    >
      <div style={{
        position:'absolute', top:3, left: checked ? 23 : 3,
        width:18, height:18, borderRadius:'50%',
        background:'#fff', transition:'left 0.2s',
      }} />
    </div>
  );
}
function Section({ title, desc, children }) {
  return (
    <div style={{ animation:'fadeUp 0.25s ease' }}>
      <p style={{ fontFamily:'var(--mono)', fontSize:'0.65rem', letterSpacing:'0.2em',
        color:'var(--acid)', marginBottom:'0.2rem' }}>{title}</p>
      {desc && <p style={{ fontSize:'0.85rem', color:'var(--mid)', marginBottom:'1.25rem' }}>{desc}</p>}
      {children}
    </div>
  );
}
function SubSection({ title, children }) {
  return (
    <div style={{ marginBottom:'1.5rem' }}>
      <p style={{ fontFamily:'var(--mono)', fontSize:'0.6rem', color:'var(--dim)',
        letterSpacing:'0.15em', marginBottom:'0.6rem' }}>{title}</p>
      {children}
    </div>
  );
}
function FieldGroup({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
      <label style={{ fontFamily:'var(--mono)', fontSize:'0.65rem', color:'var(--dim)',
        letterSpacing:'0.1em' }}>{label}</label>
      {children}
    </div>
  );
}
function ListBox({ children }) {
  return <div style={{ display:'flex', flexDirection:'column', gap:3,
    maxHeight:200, overflowY:'auto' }}>{children}</div>;
}
function ListItem({ name, badge, badgeColor, onRemove }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0.35rem 0.5rem',
      background:'var(--surface)', borderRadius:'var(--r)' }}>
      <span style={{ fontFamily:'var(--mono)', fontSize:'0.82rem', flex:1 }}>{name}</span>
      <span style={{ fontFamily:'var(--mono)', fontSize:'0.7rem', padding:'0.1rem 0.4rem',
        background:'rgba(255,255,255,0.05)', color:badgeColor, borderRadius:2 }}>{badge}</span>
      <button style={{ background:'none', border:'none', color:'var(--dim)', fontSize:'1rem',
        lineHeight:1, cursor:'pointer' }} onClick={onRemove}>×</button>
    </div>
  );
}
function AddBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background:'var(--border2)', border:'none',
      color:'var(--text)', padding:'0.45rem 1rem', borderRadius:'var(--r)',
      fontSize:'0.85rem', fontWeight:700, whiteSpace:'nowrap' }}>+ Add</button>
  );
}
function Empty() {
  return <p style={{ fontFamily:'var(--mono)', fontSize:'0.72rem',
    color:'var(--dim)', padding:'0.4rem 0.5rem' }}>No entries</p>;
}

const S = {
  root: { minHeight:'100vh' },
  header: {
    position:'sticky', top:0, zIndex:100,
    borderBottom:'1px solid var(--border)',
    background:'rgba(7,7,9,0.85)', backdropFilter:'blur(12px)',
  },
  hInner: {
    maxWidth:960, margin:'0 auto', padding:'0 1.5rem',
    height:52, display:'flex', alignItems:'center', justifyContent:'space-between',
  },
  hLogo: { display:'flex', alignItems:'center' },
  hRight: { display:'flex', alignItems:'center', gap:10 },
  memberBadge: {
    fontFamily:'var(--mono)', fontSize:'0.65rem', letterSpacing:'0.1em',
    padding:'0.2rem 0.6rem', border:'1px solid rgba(181,242,61,0.3)',
    color:'var(--acid)', borderRadius:2,
  },
  premiumBadge: {
    fontFamily:'var(--mono)', fontSize:'0.65rem', letterSpacing:'0.1em',
    padding:'0.2rem 0.6rem', border:'1px solid rgba(250,204,21,0.4)',
    color:'#facc15', borderRadius:2,
  },
  freeBadge: {
    fontFamily:'var(--mono)', fontSize:'0.65rem', letterSpacing:'0.1em',
    padding:'0.2rem 0.6rem', border:'1px solid var(--border)',
    color:'var(--dim)', borderRadius:2,
  },
  saveIndicator: {
    fontFamily:'var(--mono)', fontSize:'0.7rem', color:'var(--mid)',
    display:'flex', alignItems:'center', gap:4,
    opacity:0, transition:'opacity 0.2s',
  },
  saveVisible: { opacity:1 },
  avatar: { width:26, height:26, borderRadius:'50%', border:'1px solid var(--border2)' },
  iconBtn: {
    background:'transparent', border:'1px solid var(--border)',
    color:'var(--dim)', width:28, height:28, borderRadius:2,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:'0.9rem', transition:'all 0.12s',
  },
  stylePanel: {
    position:'absolute', top:'calc(100% + 10px)', right:0,
    background:'var(--panel)', border:'1px solid var(--border2)',
    borderRadius:4, padding:'1rem', minWidth:260, zIndex:200,
    boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
    animation:'fadeUp 0.15s ease',
    maxHeight:'80vh', overflowY:'auto',
  },
  panelTitle: {
    fontFamily:'var(--mono)', fontSize:'0.65rem', letterSpacing:'0.2em',
    color:'var(--acid)', marginBottom:'0.75rem',
  },
  panelLabel: {
    fontFamily:'var(--mono)', fontSize:'0.6rem', color:'var(--dim)',
    letterSpacing:'0.15em', marginBottom:'0.4rem', marginTop:'0.5rem',
  },
  panelDivider: { height:1, background:'var(--border)', margin:'0.75rem 0' },
  themeGrid: { display:'flex', flexWrap:'wrap', gap:4, marginBottom:'0.25rem' },
  themeChip: {
    fontFamily:'var(--mono)', fontSize:'0.7rem',
    padding:'0.3rem 0.6rem', border:'1px solid var(--border)',
    borderRadius:2, cursor:'pointer', color:'var(--mid)',
    display:'flex', alignItems:'center',
    transition:'all 0.1s',
  },
  themeChipActive: { border:'1px solid var(--acid)', color:'var(--text)' },
  themeChipLocked: { opacity:0.5 },
  colorRow: { display:'flex', alignItems:'center', gap:8, marginBottom:'0.5rem', flexWrap:'wrap' },
  colorPicker: { width:32, height:28, border:'none', background:'none', cursor:'pointer', padding:0 },
  toggleRow: { display:'flex', alignItems:'center', cursor:'pointer' },
  fontList: { display:'flex', flexDirection:'column', gap:3 },
  fontChip: {
    padding:'0.35rem 0.6rem', border:'1px solid var(--border)',
    borderRadius:2, cursor:'pointer', fontSize:'0.82rem', color:'var(--mid)',
    transition:'all 0.1s',
  },
  fontChipActive: { border:'1px solid var(--acid)', color:'var(--text)' },
  upgradeMini: {
    width:'100%', padding:'0.5rem',
    background:'linear-gradient(135deg, #facc15, #f97316)',
    border:'none', borderRadius:2, color:'#000',
    fontWeight:700, fontSize:'0.75rem', cursor:'pointer',
  },
  profilePanel: {
    position:'absolute', top:'calc(100% + 10px)', right:0,
    background:'var(--panel)', border:'1px solid var(--border2)',
    borderRadius:4, padding:'1rem', minWidth:220, zIndex:200,
    boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
    animation:'fadeUp 0.15s ease',
  },
  profileTop: { display:'flex', alignItems:'center', gap:10, marginBottom:'0.75rem' },
  profileAvatar: { width:40, height:40, borderRadius:'50%', border:'1px solid var(--border2)' },
  profileName: { fontFamily:'var(--mono)', fontSize:'0.85rem', color:'var(--text)', fontWeight:700 },
  profileDivider: { height:1, background:'var(--border)', marginBottom:'0.75rem' },
  upgradeBtn: {
    width:'100%', padding:'0.6rem 1rem',
    background:'linear-gradient(135deg, #facc15, #f97316)',
    border:'none', borderRadius:2, color:'#000',
    fontWeight:700, fontSize:'0.82rem', letterSpacing:'0.05em',
    cursor:'pointer', marginBottom:'0.5rem',
    display:'flex', alignItems:'center', justifyContent:'space-between',
    transition:'opacity 0.15s',
  },
  upgradePrize: { fontSize:'0.7rem', fontFamily:'var(--mono)', opacity:0.8 },
  logoutBtnPanel: {
    width:'100%', padding:'0.5rem 1rem',
    background:'transparent', border:'1px solid var(--border)',
    color:'var(--dim)', borderRadius:2, fontSize:'0.8rem',
    cursor:'pointer', textAlign:'left',
  },
  main: { maxWidth:960, margin:'0 auto', padding:'2rem 1.5rem' },
  tabNav: { display:'flex', gap:3, marginBottom:'1.25rem', flexWrap:'wrap', alignItems:'center' },
  tabBtn: {
    background:'transparent', border:'1px solid var(--border)',
    color:'var(--dim)', padding:'0.45rem 1rem', borderRadius:2,
    fontSize:'0.82rem', fontWeight:700, letterSpacing:'0.03em',
    display:'flex', alignItems:'center', gap:4,
    transition:'all 0.12s',
  },
  tabActive: { background:'var(--surface)', border:'1px solid var(--border2)', color:'var(--text)' },
  memberDot: { color:'var(--acid)', fontSize:'0.6rem' },
  lockedTab: {
    fontFamily:'var(--mono)', fontSize:'0.75rem', color:'var(--dim)',
    padding:'0.45rem 1rem', border:'1px dashed var(--border)',
    borderRadius:2, display:'flex', alignItems:'center', gap:6,
  },
  lockHint: { fontSize:'0.65rem', color:'var(--dim)', marginLeft:4 },
  panel: {
    background:'var(--panel)', border:'1px solid var(--border)',
    borderRadius:4, padding:'2rem',
  },
  subSectionLabel: {
    fontFamily:'var(--mono)', fontSize:'0.6rem', color:'var(--dim)',
    letterSpacing:'0.15em', marginBottom:'0.6rem',
  },
  autoRow: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'0.5rem 0',
  },
  autoLeft: { flex:1 },
  autoLabel: {
    fontFamily:'var(--mono)', fontSize:'0.75rem', color:'var(--text)',
    letterSpacing:'0.1em', marginBottom:2,
  },
  autoDesc: { fontSize:'0.78rem', color:'var(--dim)' },
  autoDivider: { height:1, background:'var(--border)', margin:'0.75rem 0' },
  autoMsgBox: {
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:3, padding:'0.75rem', marginBottom:'0.5rem',
  },
  autoMsgLabel: {
    fontFamily:'var(--mono)', fontSize:'0.6rem', color:'var(--dim)',
    letterSpacing:'0.15em', display:'block', marginBottom:'0.4rem',
  },
  autoMsgLocked: { display:'flex', alignItems:'center', gap:8 },
  premiumHint: { fontSize:'0.72rem', color:'var(--dim)', fontFamily:'var(--mono)' },
  radioRow: {
    display:'flex', alignItems:'center', gap:10,
    padding:'0.55rem 0.75rem', marginBottom:4,
    borderRadius:2, cursor:'pointer',
    border:'1px solid transparent', transition:'border-color 0.12s',
  },
  radioRowActive: { border:'1px solid var(--border2)', background:'var(--surface)' },
  radioN: { fontFamily:'var(--mono)', color:'var(--acid)', fontSize:'0.7rem', minWidth:14 },
  code: {
    fontFamily:'var(--mono)', fontSize:'0.78rem', color:'var(--mid)',
    background:'var(--surface)', padding:'0.2rem 0.5rem', borderRadius:2,
  },
  checkRow: { display:'flex', alignItems:'center', marginTop:'0.75rem', cursor:'pointer' },
  hint: { fontFamily:'var(--mono)', fontSize:'0.65rem', color:'var(--dim)', marginLeft:12 },
  row2: { display:'flex', gap:'1.5rem', flexWrap:'wrap', marginBottom:'0.75rem' },
  numIn: {
    background:'var(--surface)', border:'1px solid var(--border2)',
    color:'var(--text)', padding:'0.5rem 0.6rem', borderRadius:2, width:90,
    outline:'none',
  },
  desc2: { fontSize:'0.82rem', color:'var(--dim)', lineHeight:1.7, marginTop:'0.5rem' },
  statLabel: {
    fontFamily:'var(--mono)', fontSize:'0.65rem', color:'var(--voidL)',
    letterSpacing:'0.12em', marginBottom:'0.5rem',
  },
  thRow: { display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' },
  thIdx: { fontFamily:'var(--mono)', fontSize:'0.65rem', color:'var(--dim)', minWidth:20 },
  thLabel: { fontFamily:'var(--mono)', fontSize:'0.65rem', color:'var(--dim)' },
  thInput: {
    background:'var(--surface)', border:'1px solid var(--border2)',
    color:'var(--text)', padding:'0.35rem 0.5rem', borderRadius:2, width:65, outline:'none',
  },
  swatches: { display:'flex', gap:3 },
  swatch: { width:18, height:18, borderRadius:2, border:'none', cursor:'pointer', transition:'box-shadow 0.1s' },
  addRow: { display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' },
  txtIn: {
    background:'var(--surface)', border:'1px solid var(--border2)',
    color:'var(--text)', padding:'0.45rem 0.6rem', borderRadius:2,
    fontSize:'0.82rem', outline:'none', flex:1, minWidth:120,
  },
  inlineCode: { fontFamily:'var(--mono)', color:'var(--acid)', fontSize:'0.8rem' },
  genBtn: {
    background:'var(--void)', color:'#fff', border:'none',
    padding:'0.65rem 1.5rem', borderRadius:2,
    fontSize:'0.9rem', fontWeight:700, letterSpacing:'0.05em',
    marginTop:'1rem', transition:'opacity 0.15s',
  },
  tokenBox: {
    marginTop:'1.25rem', background:'var(--surface)',
    border:'1px solid var(--border2)', borderRadius:3, padding:'1rem',
  },
  tokenLabel: { fontFamily:'var(--mono)', fontSize:'0.65rem', color:'var(--dim)', marginBottom:6 },
  tokenRow: { display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 },
  tokenVal: {
    fontFamily:'var(--mono)', fontSize:'0.78rem', color:'var(--cyan)',
    wordBreak:'break-all', flex:1,
  },
  copyBtn: {
    background:'var(--border2)', border:'none', color:'var(--text)',
    padding:'0.3rem 0.7rem', borderRadius:2, fontSize:'0.75rem',
    whiteSpace:'nowrap', cursor:'pointer',
  },
};
