import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react';
import Head from 'next/head';

export default function Index() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') router.push('/dashboard');
  }, [status]);

  if (status === 'loading') return null;
  if (status === 'authenticated') return null;

  return (
    <>
      <Head>
        <title>VØID Sight</title>
        <link rel="icon" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323&display=swap" rel="stylesheet" />
      </Head>
      <div style={S.root}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323&display=swap');
          :root {
            --g: #00ff41;
            --g-dim: #00b32c;
            --g-faint: rgba(0,255,65,0.06);
            --bd: #1c1c1c;
            --muted: #444;
            --text-c: #c8c8c8;
          }
          html { scroll-behavior: smooth; }
          body {
            background: #010101 !important;
            font-family: 'Share Tech Mono', monospace !important;
            cursor: none;
          }
          body::before {
            content: '';
            position: fixed;
            inset: 0;
            background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px);
            pointer-events: none;
            z-index: 9000;
          }
          .vs-cursor {
            width: 2px; height: 18px;
            background: var(--g);
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%,-50%);
            box-shadow: 0 0 8px var(--g);
            animation: blink 1s step-end infinite;
          }
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
          @keyframes appear { to { opacity: 1; } }
          @keyframes scan-move { from{top:-40px} to{top:100vh} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
          .feat-card, .dl-box, .info-cell {
            opacity: 0;
            transform: translateY(12px);
            transition: opacity 0.4s ease, transform 0.4s ease;
          }
          .feat-card.visible, .dl-box.visible, .info-cell.visible {
            opacity: 1 !important;
            transform: none !important;
          }
          .feat-card:hover { background: #0a0a0a !important; }
          .nav-link { color: var(--muted); text-decoration: none; font-size: 0.78rem; letter-spacing: 0.12em; text-transform: uppercase; transition: color 0.15s; }
          .nav-link:hover { color: var(--g); }
          .btn-dl {
            display: inline-flex; align-items: center; gap: 10px;
            padding: 10px 28px;
            font-family: 'Share Tech Mono', monospace;
            font-size: 0.82rem; letter-spacing: 0.12em; text-transform: uppercase;
            text-decoration: none; cursor: none; border: 1px solid;
            background: var(--g); color: #000; border-color: var(--g);
            box-shadow: 0 0 20px rgba(0,255,65,0.3);
            transition: all 0.15s;
          }
          .btn-dl:hover { background: rgba(0,255,65,0.8); box-shadow: 0 0 40px rgba(0,255,65,0.5); }
          .btn-ghost-link {
            display: inline-flex; align-items: center; gap: 10px;
            padding: 10px 28px;
            font-family: 'Share Tech Mono', monospace;
            font-size: 0.82rem; letter-spacing: 0.12em; text-transform: uppercase;
            text-decoration: none; cursor: none; border: 1px solid #1c1c1c;
            background: transparent; color: var(--g);
            transition: all 0.15s;
          }
          .btn-ghost-link:hover { border-color: var(--g); background: var(--g-faint); }
        `}</style>

        {/* Cursor */}
        <div className="vs-cursor" id="vs-cursor" />

        {/* Scanline overlay */}
        <div style={{ position:'fixed', inset:0, zIndex:1, overflow:'hidden', pointerEvents:'none' }}>
          <div style={{
            position:'absolute', left:0, right:0, height:40,
            background:'linear-gradient(180deg, transparent, rgba(0,255,65,0.03), transparent)',
            animation:'scan-move 6s linear infinite',
          }} />
        </div>

        {/* NAV */}
        <nav style={S.nav}>
          <div style={S.navLogo}>VØID_SIGHT</div>
          <div style={{ display:'flex', gap:32 }}>
            <a href="#features" className="nav-link">features</a>
            <a href="#download" className="nav-link">download</a>
            <a
              href="#"
              className="nav-link"
              onClick={e => { e.preventDefault(); signIn('discord', { callbackUrl: '/dashboard' }); }}
              style={{ color:'var(--g)' }}
            >
              dashboard →
            </a>
          </div>
        </nav>

        {/* HERO */}
        <section id="hero" style={S.hero}>
          <div style={S.heroGrid} />
          <div style={{ ...S.heroCorner, top:64, left:80 }}>SYS: HYPIXEL_PROXY_v1 // BEDWARS</div>
          <div style={{ ...S.heroCorner, top:64, right:80, textAlign:'right' }}>STATUS: ONLINE<br/>BUILD: STABLE</div>
          <div style={{ ...S.heroCorner, bottom:32, left:80 }}>CONN: mc.hypixel.net:25565</div>
          <div style={{ ...S.heroCorner, bottom:32, right:80 }}>_masakun_</div>

          <p style={{ color:'#444', fontSize:'0.8rem', marginBottom:16, opacity:0, animation:'appear 0s 0.2s forwards' }}>
            <span style={{ color:'var(--g)' }}>&gt; </span>initializing void_sight.exe
          </p>
          <h1 style={S.heroTitle}>VØID<br/>SIGHT</h1>
          <div style={{ ...S.heroTagline, opacity:0, animation:'appear 0s 0.8s forwards' }}>
            <span style={{ display:'block' }}>Hypixel BedWars proxy.</span>
            <span style={{ display:'block' }}>Stats injected into your <span style={{ color:'var(--g)' }}>TAB list</span> in real-time.</span>
            <span style={{ display:'block' }}>No mods. No launchers. Single <span style={{ color:'var(--g)' }}>.exe</span>.</span>
          </div>
          <div style={{ display:'flex', gap:16, opacity:0, animation:'appear 0s 1.1s forwards' }}>
            <a href="https://www.mediafire.com/file/yhb37is0nnpc90t/V%25C3%2598IDSight.zip/file"
               className="btn-dl" target="_blank" rel="noopener">
              <DownloadIcon /> download_now
            </a>
            <a href="#features" className="btn-ghost-link">view_features</a>
          </div>
        </section>

        {/* INFO BAR */}
        <div style={S.infoBar}>
          {[
            { k:'version',       v:'1.8.9' },
            { k:'platform',      v:'WIN64' },
            { k:'mods required', v:'NONE' },
            { k:'tab formats',   v:'3' },
          ].map(({ k, v }) => (
            <div key={k} className="info-cell" style={S.infoCell}>
              <div style={S.infoKey}>{k}</div>
              <div style={S.infoVal}>{v}</div>
            </div>
          ))}
        </div>

        {/* FEATURES */}
        <section id="features" style={S.section}>
          <div style={S.secLabel}>module_list</div>
          <div style={S.secTitle}>CORE <span style={{ color:'var(--g)' }}>FEATURES</span></div>
          <div style={S.featGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feat-card" style={S.featCard} data-index={`[0${i+1}]`}>
                <div style={{ position:'absolute', top:16, right:20, fontSize:'0.65rem', color:'#1c1c1c', letterSpacing:'0.1em' }}>
                  [0{i+1}]
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <div style={S.featDot} />
                  <div style={S.featName}>{f.name}</div>
                </div>
                <p style={S.featDesc} dangerouslySetInnerHTML={{ __html: f.desc }} />
                <span style={S.featTag}>{f.tag}</span>
              </div>
            ))}
          </div>
        </section>

        {/* DOWNLOAD */}
        <section id="download" style={S.section}>
          <div style={S.dlInner}>
            <div style={S.secLabel}>binary_release</div>
            <div style={S.secTitle}>DOWNLOAD</div>
            <div className="dl-box" style={S.dlBox}>
              <div style={S.dlHeader}>
                <div style={{ ...S.dlDot, background:'#ff4444' }} />
                <div style={{ ...S.dlDot, background:'#ffb000' }} />
                <div style={{ ...S.dlDot, background:'var(--g)' }} />
                <span style={S.dlTitleBar}>void_sight — release</span>
              </div>
              <div style={{ padding:32 }}>
                <div style={S.dlFileRow}>
                  <div>
                    <div style={S.dlFilename}>proxy.exe</div>
                    <div style={S.dlPlatform}>Windows 10/11 · x64</div>
                  </div>
                  <a href="https://www.mediafire.com/file/yhb37is0nnpc90t/V%25C3%2598IDSight.zip/file"
                     className="btn-dl" target="_blank" rel="noopener" style={{ whiteSpace:'nowrap' }}>
                    <DownloadIcon /> download
                  </a>
                </div>
                <div style={{ ...S.dlFileRow, borderBottom:'none', paddingBottom:0 }}>
                  <div>
                    <div style={S.dlFilename}>proxy-linux</div>
                    <div style={S.dlPlatform}>Linux · x64</div>
                  </div>
                  <span style={S.dlSoon}>coming soon</span>
                </div>
                <div style={S.dlReqs}>
                  {['Minecraft 1.8.9','Microsoft Account (Premium)','Hypixel API Key','Windows 10/11 64-bit','Internet Connection','No Node.js required'].map(r => (
                    <div key={r} style={S.dlReq}>
                      <span style={{ color:'#00b32c' }}>&gt; </span>{r}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={S.footer}>
          <div style={S.footerLogo}>VØID_SIGHT</div>
          <div style={S.footerWarn}>
            <span style={{ color:'#ff2020' }}>WARNING:</span> use on Hypixel only · never share your API key
          </div>
        </footer>

        {/* Cursor + scroll reveal script */}
        <script dangerouslySetInnerHTML={{ __html: `
          var cur = document.getElementById('vs-cursor');
          document.addEventListener('mousemove', function(e) {
            cur.style.left = e.clientX + 'px';
            cur.style.top = e.clientY + 'px';
          });
          var io = new IntersectionObserver(function(entries) {
            entries.forEach(function(e) {
              if (e.isIntersecting) e.target.classList.add('visible');
            });
          }, { threshold: 0.08 });
          document.querySelectorAll('.feat-card, .dl-box, .info-cell').forEach(function(el) {
            io.observe(el);
          });
        `}} />
      </div>
    </>
  );
}

function DownloadIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 16l-6-6h4V4h4v6h4l-6 6zm-8 4h16v-2H4v2z"/>
    </svg>
  );
}

const FEATURES = [
  {
    name: 'Live Tab Stats',
    desc: '<b>FKDR, WLR, Stars</b> and rank colors injected directly into your TAB list. Loads automatically as players join the lobby. Zero input required.',
    tag: 'AUTO',
  },
  {
    name: 'Sweaty & Snipe Alerts',
    desc: 'Chat warning fires when a player exceeds your <b>FKDR or Stars threshold</b>. <b>Snipe alert</b> triggers if that same player was in your previous game.',
    tag: 'CONFIGURABLE',
  },
  {
    name: 'Auto /who',
    desc: 'Sends <b>/who</b> automatically when the game starts. Fetches full stats for every player and optionally streams results to chat via <b>statschat</b>.',
    tag: 'AUTO',
  },
  {
    name: 'Tag System',
    desc: 'Assign <b>custom labels</b> to players. Blacklisted players appear in red, friends in green. Stored in the cloud. Member-only access control built in.',
    tag: 'MEMBER ONLY',
  },
  {
    name: '3 Tab Formats',
    desc: 'Switch layout with <b>/vs format [1-3]</b> at any time.<br/>1: rank · stars · name · fkdr · tag<br/>2: stars · name · fkdr · tag<br/>3: name · fkdr',
    tag: 'LIVE SWAP',
  },
  {
    name: 'Auto GG / Auto GL',
    desc: 'Automatically sends <b>gl</b> when the game starts and <b>gg</b> when it ends. Toggle each independently with <b>/vs autogl</b> and <b>/vs autogg</b>.',
    tag: 'CONFIGURABLE',
  },
  {
    name: 'Cloud Sync',
    desc: 'Settings sync automatically between devices via your <b>cloud token</b>. Change your config in the dashboard and it loads on next proxy start.',
    tag: 'PREMIUM',
  },
  {
    name: 'Premium Themes',
    desc: 'Customize your dashboard with <b>Blood, Ghost, Gold</b> or fully custom colors. Font selector included. Persistent across sessions.',
    tag: 'PREMIUM',
  },
];

const S = {
  root: { background:'#010101', minHeight:'100vh', color:'#c8c8c8', fontFamily:"'Share Tech Mono', monospace" },
  nav: {
    position:'fixed', top:0, left:0, right:0, zIndex:100,
    height:48, display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'0 40px', borderBottom:'1px solid #1c1c1c',
    background:'rgba(1,1,1,0.95)',
  },
  navLogo: { fontFamily:"'VT323', monospace", fontSize:'1.4rem', color:'var(--g)', letterSpacing:'0.1em', textShadow:'0 0 10px var(--g)' },
  hero: {
    minHeight:'100vh', display:'flex', flexDirection:'column', justifyContent:'center',
    padding:'80px 80px 60px', borderBottom:'1px solid #1c1c1c',
    position:'relative', overflow:'hidden',
  },
  heroGrid: {
    position:'absolute', inset:0,
    backgroundImage:'linear-gradient(rgba(0,255,65,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.03) 1px, transparent 1px)',
    backgroundSize:'48px 48px', pointerEvents:'none',
  },
  heroCorner: { position:'absolute', fontSize:'0.65rem', color:'#444', letterSpacing:'0.1em' },
  heroTitle: {
    fontFamily:"'VT323', monospace",
    fontSize:'clamp(4rem, 12vw, 9rem)',
    lineHeight:0.85,
    color:'var(--g)',
    textShadow:'0 0 20px rgba(0,255,65,0.5), 0 0 60px rgba(0,255,65,0.15)',
    marginBottom:32,
    opacity:0,
    animation:'appear 0s 0.5s forwards',
    letterSpacing:'0.05em',
  },
  heroTagline: {
    color:'#c8c8c8', fontSize:'0.9rem', lineHeight:1.9,
    maxWidth:560, marginBottom:48,
  },
  infoBar: { display:'flex', borderBottom:'1px solid #1c1c1c', background:'#050505' },
  infoCell: { flex:1, padding:'20px 32px', borderRight:'1px solid #1c1c1c' },
  infoKey: { color:'#444', fontSize:'0.68rem', letterSpacing:'0.15em', marginBottom:6, textTransform:'uppercase' },
  infoVal: { color:'var(--g)', fontFamily:"'VT323', monospace", fontSize:'1.5rem' },
  section: { padding:'80px', borderBottom:'1px solid #1c1c1c' },
  secLabel: { color:'#444', fontSize:'0.68rem', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:8 },
  secTitle: { fontFamily:"'VT323', monospace", fontSize:'2.4rem', color:'#c8c8c8', marginBottom:48, letterSpacing:'0.05em' },
  featGrid: { display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:1, background:'#1c1c1c' },
  featCard: { background:'#050505', padding:32, position:'relative' },
  featDot: { width:8, height:8, background:'var(--g)', boxShadow:'0 0 6px var(--g)', flexShrink:0 },
  featName: { color:'var(--g)', fontSize:'0.88rem', letterSpacing:'0.1em', textTransform:'uppercase' },
  featDesc: { color:'#444', fontSize:'0.82rem', lineHeight:1.8, paddingLeft:20 },
  featTag: {
    display:'inline-block', marginTop:14, marginLeft:20, padding:'2px 8px',
    border:'1px solid #1c1c1c', fontSize:'0.62rem', color:'#444',
    letterSpacing:'0.1em', textTransform:'uppercase',
  },
  dlInner: { maxWidth:720 },
  dlBox: { border:'1px solid #1c1c1c', background:'#050505', marginTop:40 },
  dlHeader: { padding:'14px 24px', borderBottom:'1px solid #1c1c1c', display:'flex', alignItems:'center', gap:10 },
  dlDot: { width:8, height:8, borderRadius:'50%' },
  dlTitleBar: { color:'#444', fontSize:'0.72rem', letterSpacing:'0.1em', marginLeft:4 },
  dlFileRow: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'16px 0', borderBottom:'1px solid #1c1c1c', gap:24,
  },
  dlFilename: { color:'#c8c8c8', fontSize:'0.9rem', marginBottom:4 },
  dlPlatform: { color:'#444', fontSize:'0.72rem', letterSpacing:'0.08em' },
  dlSoon: { fontSize:'0.68rem', letterSpacing:'0.12em', textTransform:'uppercase', padding:'3px 10px', border:'1px solid #1c1c1c', color:'#444' },
  dlReqs: { marginTop:28, paddingTop:24, borderTop:'1px solid #1c1c1c', display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 },
  dlReq: { fontSize:'0.75rem', color:'#444', letterSpacing:'0.06em' },
  footer: {
    padding:'24px 80px', display:'flex', alignItems:'center', justifyContent:'space-between',
    borderTop:'1px solid #1c1c1c', background:'#050505',
  },
  footerLogo: { fontFamily:"'VT323', monospace", fontSize:'1.2rem', color:'#00b32c' },
  footerWarn: { fontSize:'0.65rem', color:'#444', letterSpacing:'0.1em', textTransform:'uppercase' },
};
