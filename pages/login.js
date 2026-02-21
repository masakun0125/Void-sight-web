import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Login() {
  const { status } = useSession();
  const router = useRouter();
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') router.push('/dashboard');
  }, [status]);

  return (
    <>
      <Head>
        <title>VØID Sight</title>
        <link rel="icon" href="/voidsight.png" />
      </Head>
      <div style={S.root}>
        <div style={S.gridH} />
        <div style={S.gridV} />

        <div style={S.scanWrap}>
          <div style={S.scanLine} />
        </div>

        <div style={S.card}>
          <div style={S.logoWrap}>
            <img src="/voidsight.png" alt="VOID SIGHT" style={{ height: 36, objectFit: 'contain' }} />
          </div>
          <p style={S.logoSub}>CLOUD DASHBOARD</p>

          <div style={S.sep} />

          <p style={S.body}>
            Discordアカウントでログインして、<br />
            overlay設定を管理できます。
          </p>

          <button
            style={{ ...S.btn, ...(hover ? S.btnHover : {}) }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}
          >
            <DiscordIcon />
            <span>Discordでログイン</span>
          </button>

          <p style={S.note}>
            <span style={{ color: 'var(--acid)' }}>●</span>
            {' '}サーバーメンバーは追加機能が利用可能
          </p>
        </div>

        <Corner pos="tl" />
        <Corner pos="tr" />
        <Corner pos="bl" />
        <Corner pos="br" />
      </div>
    </>
  );
}

function Corner({ pos }) {
  const isTop = pos.startsWith('t');
  const isLeft = pos.endsWith('l');
  return (
    <div style={{
      position: 'fixed',
      top:    isTop  ? 20 : 'auto',
      bottom: !isTop ? 20 : 'auto',
      left:   isLeft ? 20 : 'auto',
      right:  !isLeft ? 20 : 'auto',
      width: 20, height: 20,
      borderTop:    isTop  ? '1px solid var(--border2)' : 'none',
      borderBottom: !isTop ? '1px solid var(--border2)' : 'none',
      borderLeft:   isLeft ? '1px solid var(--border2)' : 'none',
      borderRight:  !isLeft ? '1px solid var(--border2)' : 'none',
    }} />
  );
}

function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054A19.9 19.9 0 0 0 5.1 20.571a.077.077 0 0 0 .084-.026c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 5.007-2.527.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  );
}

const S = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  gridH: {
    position: 'fixed', inset: 0, zIndex: 0,
    backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px)',
    backgroundSize: '100% 80px',
    opacity: 0.5,
  },
  gridV: {
    position: 'fixed', inset: 0, zIndex: 0,
    backgroundImage: 'linear-gradient(90deg, var(--border) 1px, transparent 1px)',
    backgroundSize: '80px 100%',
    opacity: 0.5,
  },
  scanWrap: {
    position: 'fixed', inset: 0, zIndex: 1, overflow: 'hidden', pointerEvents: 'none',
  },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: '40px',
    background: 'linear-gradient(180deg, transparent, rgba(181,242,61,0.03), transparent)',
    animation: 'scan 6s linear infinite',
  },
  card: {
    position: 'relative', zIndex: 2,
    background: 'var(--panel)',
    border: '1px solid var(--border2)',
    padding: '2.5rem 2.5rem 2rem',
    width: '100%', maxWidth: 400,
    animation: 'fadeUp 0.4s ease',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '0.5rem',
  },
  logoSub: {
    fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--dim)',
    letterSpacing: '0.2em', marginBottom: '1.5rem', textAlign: 'center',
  },
  sep: {
    height: 1, background: 'var(--border2)', marginBottom: '1.5rem',
  },
  body: {
    fontSize: '0.9rem', color: 'var(--mid)', lineHeight: 1.7, marginBottom: '1.75rem',
  },
  btn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
    width: '100%', padding: '0.8rem',
    background: '#5865F2', color: '#fff', border: 'none',
    fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.02em',
    transition: 'all 0.15s', cursor: 'pointer',
  },
  btnHover: { background: '#4752C4', transform: 'translateY(-1px)' },
  note: {
    marginTop: '1rem', fontSize: '0.75rem',
    color: 'var(--dim)', fontFamily: 'var(--mono)', textAlign: 'center',
  },
};
