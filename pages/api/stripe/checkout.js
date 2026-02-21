import Stripe from 'stripe';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import supabase from '../../../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.discordId) return res.status(401).json({ error: 'Unauthorized' });

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
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard`,
  });

  return res.status(200).json({ url: checkoutSession.url });
}
