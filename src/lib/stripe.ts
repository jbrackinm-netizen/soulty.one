import Stripe from 'stripe';

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
}

export const PLANS = {
  council_basic: {
    name: 'Council Basic',
    price_id: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
    amount: 2900,
    features: ['Council Dashboard', 'Projects & Tasks', 'Document Vault', 'Meeting Notes'],
  },
  nexus_pro: {
    name: 'Nexus Pro',
    price_id: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    amount: 9900,
    features: ['Everything in Basic', 'Nexus Brain AI', 'Multi-model Council', 'DIY Vision Scanner', 'Priority Support'],
  },
  diy_vision: {
    name: 'DIY Vision Add-on',
    price_id: process.env.STRIPE_DIY_PRICE_ID || 'price_diy',
    amount: 4900,
    features: ['AI Image Scanner', 'Parts Identification', 'Material Estimation', 'Pro Request Queue'],
  },
} as const;
