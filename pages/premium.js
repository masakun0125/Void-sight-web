import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';

const PLANS = [
  {
    id: '30d',
    label: '30日',
    price: 300,
    per: '月額',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_30D,
    badge: null,
  },
  {
    id: '90d',
    label: '90日',
    price: 800,
    per: '3ヶ月',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_90D,
    badge: '11% OFF',
  },
  {
    id: '180d',
    label: '180日',
    price: 1500,
    per: '6ヶ月',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_180D,
    badge: '17% OFF',
  },
  {
    id: '1y',
    label: '1年',
    price: 2800,
    per: '年額',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_1Y,
    badge: '22% OFF',
    popular: true,
  },
];

const FEATURES = [
  'クラウド設定同期（複数PC対応）',
  'カスタムカラーテーマ',
  '統計の履歴保存',
  'オーバーレイのカスタムレイアウト',
];

export default function Premium() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState('1y');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);

  async function handleCheckout() {
    setLoading(true);
    try {
      const plan = PLANS.find(p => p.id === selected);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  }

  if (status !== 'authenticated') return null;

  const selectedPlan = PLANS.find(p => p.id === selected);

  return (
    <>
      <Head>
        <title>VØID Sight – Premium</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <div style={S.root}>
        <div style={S.gridH} />
        <div style={S.gridV} />

        <div style={S.container}>
          <div style={S.header}>
            <img src="/voidsight.png" alt="VOID SIGHT" style={{ height: 28, objectFit: 'contain', marginBottom: '1.5rem' }} />
            <h1 style={S.title}>
              <span style={{ color: '#facc15' }}>★</span> Premium
            </h1>
            <p style={S.subtitle}>VOID Sightをフル活用しよう</p>
          </div>

          <div style={S.featuresBox}>
            {FEATURES.map(f => (
              <div key={f} style={S.featureRow}>
                <span style={{ color: '#facc15' }}>✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>

          <div style={S.plans}>
            {PLANS.map(plan => (
              <div
                key={plan.id}
                style={{
                  ...S.planCard,
                  ...(selected === plan.id ? S.planSelected : {}),
                  ...(plan.popular ? S.planPopular : {}),
                }}
                onClick={() => setSelected(plan.id)}
              >
                {plan.popular && (
                  <div style={S.popularLabel}>人気</div>
                )}
                {plan.badge && (
                  <div style={S.badge}>{plan.badge}</div>
                )}
                <p style={S.planLabel}>{plan.label}</p>
                <p style={S.planPrice}>¥{plan.price.toLocaleString()}</p>
                <p style={S.planPer}>{plan.per}</p>
              </div>
            ))}
          </div>

          <button
            style={{ ...S.buyBtn, opacity: loading ? 0.6 : 1 }}
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? '処理中...' : `¥${selectedPlan.price.toLocaleString()} で${selectedPlan.label}プランを購入`}
          </button>

          <p style={S.note}>
            クレジットカードで安全に決済されます。いつでもキャンセル可能です。
          </p>

          <button style={S.backBtn} onClick={() => router.push('/dashboard')}>
            ← ダッシュボードに戻る
          </button>
        </div>
      </div>
    </>
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
    padding: '2rem 1rem',
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
  container: {
    position: 'relative', zIndex: 2,
    background: 'var(--panel)',
    border: '1px solid var(--border2)',
    borderRadius: 4,
    padding: '2.5rem',
    width: '100%',
    maxWidth: 560,
    animation: 'fadeUp 0.3s ease',
  },
  header: { textAlign: 'center', marginBottom: '1.5rem' },
  title: {
    fontFamily: 'var(--sans)', fontWeight: 800, fontSize: '2rem',
    letterSpacing: '-0.02em', marginBottom: '0.3rem',
  },
  subtitle: {
    fontFamily: 'var(--mono)', fontSize: '0.7rem',
    color: 'var(--dim)', letterSpacing: '0.15em',
  },
  featuresBox: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 3, padding: '1rem 1.25rem',
    marginBottom: '1.5rem',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  featureRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: '0.88rem', color: 'var(--mid)',
  },
  plans: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8, marginBottom: '1.25rem',
  },
  planCard: {
    position: 'relative',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 3, padding: '0.75rem 0.5rem',
    textAlign: 'center', cursor: 'pointer',
    transition: 'all 0.12s',
  },
  planSelected: {
    border: '1px solid #facc15',
    background: 'rgba(250,204,21,0.05)',
  },
  planPopular: {
    border: '1px solid rgba(250,204,21,0.4)',
  },
  popularLabel: {
    position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
    background: '#facc15', color: '#000',
    fontFamily: 'var(--mono)', fontSize: '0.6rem', fontWeight: 700,
    padding: '0.1rem 0.5rem', borderRadius: 2,
    whiteSpace: 'nowrap',
  },
  badge: {
    fontFamily: 'var(--mono)', fontSize: '0.6rem',
    color: '#facc15', marginBottom: 4,
  },
  planLabel: {
    fontFamily: 'var(--mono)', fontSize: '0.75rem',
    color: 'var(--dim)', marginBottom: 4,
  },
  planPrice: {
    fontFamily: 'var(--sans)', fontWeight: 800, fontSize: '1.1rem',
    color: 'var(--text)',
  },
  planPer: {
    fontFamily: 'var(--mono)', fontSize: '0.6rem',
    color: 'var(--dim)', marginTop: 2,
  },
  buyBtn: {
    width: '100%', padding: '0.8rem',
    background: 'linear-gradient(135deg, #facc15, #f97316)',
    border: 'none', borderRadius: 2,
    color: '#000', fontWeight: 800, fontSize: '0.95rem',
    letterSpacing: '0.03em', cursor: 'pointer',
    transition: 'opacity 0.15s', marginBottom: '0.75rem',
  },
  note: {
    fontFamily: 'var(--mono)', fontSize: '0.65rem',
    color: 'var(--dim)', textAlign: 'center',
    marginBottom: '1rem',
  },
  backBtn: {
    background: 'transparent', border: 'none',
    color: 'var(--dim)', fontFamily: 'var(--mono)',
    fontSize: '0.75rem', cursor: 'pointer',
    display: 'block', margin: '0 auto',
  },
};
