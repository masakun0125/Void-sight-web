import Stripe from 'stripe';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import supabase from '../../../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.discordId) return res.status(401).json({ error: 'Unauthorized' });

  const { priceId } = req.body;
  const resolvedPriceId = priceId || process.env.STRIPE_PRICE_30D;

  console.log('priceId from body:', priceId);
  console.log('resolvedPriceId:', resolvedPriceId);

  const VALID_PRICES = [
    process.env.STRIPE_PRICE_30D,
    process.env.STRIPE_PRICE_90D,
    process.env.STRIPE_PRICE_180D,
    process.env.STRIPE_PRICE_1Y,
  ];

  console.log('VALID_PRICES:', VALID_PRICES);

  if (!VALID_PRICES.includes(resolvedPriceId)) {
    return res.status(400).json({ error: 'Invalid price ID', resolvedPriceId, VALID_PRICES });
  }

  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id, discord_name')
    .eq('discord_id', session.discordId)
    .single();

  let customerId = user?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: user?.discord_name,
      metadata: { discord_id: session.discordId },
    });
    customerId = customer.id;
    await supabase.from('users')
      .update({ stripe_customer_id: customerId })
      .eq('discord_id', session.discordId);
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: resolvedPriceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/premium`,
  });

  return res.status(200).json({ url: checkoutSession.url });
}
