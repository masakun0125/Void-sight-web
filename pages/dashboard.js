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
  nickDetect: true,
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
  { id:'alert',    label:'Sniper Alert' },
  { id:'colors',   label:'Colors' },
  { id:'tags',     label:'Tags & Lists', memberOnly: true },
  { id:'token',    label:'Local Token' },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cfg, setCfg]         = useState(null);
  const [isMember, setMember] = useState(false);
  const [activeTab, setTab]   = useState('display');
  const [saveState, setSave]  = useState('idle'); // idle | saving | saved | error
  const [token, setToken]     = useState('');
  const [genning, setGenning] = useState(false);
  const [tagForm, setTagForm] = useState({ name:'', tag:'' });
  const [blForm,  setBlForm]  = useState('');
  const [frForm,  setFrForm]  = useState('');
  const saveTimer = useRef(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated')   load();
  }, [status]);

  async function load() {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) { router.push('/login'); return; }
      const data = await res.json();
      const { _meta, ...rest } = data;
      setCfg({ ...DEFAULT_CFG, ...rest });
      setMember(_meta?.isMember ?? false);
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

  // 設定変更 + 自動保存 (debounce)
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

  async function genToken() {
    setGenning(true);
    try {
      const r = await fetch('/api/token/generate', { method: 'POST' });
      const d = await r.json();
      if (d.token) setToken(d.token);
    } finally { setGenning(false); }
  }

  if (status !== 'authenticated' || !cfg) return <Loading />;

  const visibleTabs = TABS.filter(t => !t.memberOnly || isMember);

  return (
    <>
      <Head><title>VØID Sight – Dashboard</title></Head>
      <div style={S.root}>

        {/* ヘッダー */}
        <header style={S.header}>
          <div style={S.hInner}>
            <div style={S.hLogo}>
              <span style={{ color:'var(--voidL)' }}>VØ</span>
              <span style={{ color:'var(--acid)' }}>ID</span>
              <span style={{ color:'var(--dim)', fontFamily:'var(--mono)', fontSize:'0.75rem', marginLeft:6 }}>SIGHT</span>
            </div>
            <div style={S.hRight}>
              {/* ロールバッジ */}
              {isMember && (
                <span style={S.memberBadge}>
                  <span style={{ color:'var(--acid)' }}>✦</span> Member
                </span>
              )}
              {/* 保存状態 */}
              <span style={{ ...S.saveIndicator, ...(saveState !== 'idle' ? S.saveVisible : {}) }}>
                {saveState === 'saving' && <><Spinner /> Saving</>}
                {saveState === 'saved'  && <><span style={{color:'var(--acid)'}}>✓</span> Saved</>}
                {saveState === 'error'  && <span style={{color:'var(--red)'}}>✕ Error</span>}
              </span>
              {session.user?.image && <img src={session.user.image} alt="" style={S.avatar} />}
              <span style={S.uname}>{session.user?.name}</span>
              <button style={S.logoutBtn} onClick={() => signOut({ callbackUrl: '/login' })}>
                Logout
              </button>
            </div>
          </div>
        </header>

        <main style={S.main}>
          {/* タブ */}
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
            {/* 非メンバーにはロック表示 */}
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
              <Section title="TAB_FORMAT" desc="BedWarsのタブ表示フォーマット">
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
                <label style={S.checkRow}>
                  <input type="checkbox" checked={cfg.nickDetect}
                    onChange={e => update('nickDetect', e.target.checked)}
                    style={{ accentColor:'var(--acid)', width:14, height:14 }} />
                  <span style={{ marginLeft:8 }}>Nick Detection</span>
                  <span style={S.hint}>ニックの可能性があるプレイヤーを §d[NICK?] で表示</span>
                </label>
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

            {/* ── Tags & Lists (Member only) ── */}
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

// ── サブコンポーネント ──────────────────────────────────────
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

// ── スタイル ─────────────────────────────────────────────────
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
  hLogo: { fontFamily:'var(--sans)', fontWeight:800, fontSize:'1.3rem', letterSpacing:'-0.02em' },
  hRight: { display:'flex', alignItems:'center', gap:10 },
  memberBadge: {
    fontFamily:'var(--mono)', fontSize:'0.65rem', letterSpacing:'0.1em',
    padding:'0.2rem 0.6rem', border:'1px solid rgba(181,242,61,0.3)',
    color:'var(--acid)', borderRadius:2,
  },
  saveIndicator: {
    fontFamily:'var(--mono)', fontSize:'0.7rem', color:'var(--mid)',
    display:'flex', alignItems:'center', gap:4,
    opacity:0, transition:'opacity 0.2s',
  },
  saveVisible: { opacity:1 },
  avatar: { width:26, height:26, borderRadius:'50%', border:'1px solid var(--border2)' },
  uname: { fontFamily:'var(--mono)', fontSize:'0.75rem', color:'var(--mid)' },
  logoutBtn: {
    background:'transparent', border:'1px solid var(--border2)',
    color:'var(--dim)', padding:'0.2rem 0.6rem', borderRadius:2, fontSize:'0.75rem',
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
