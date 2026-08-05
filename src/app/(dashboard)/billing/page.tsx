'use client';
import { useState } from 'react';
import { PLANS } from '@/lib/stripe';
import { CheckCircle, Zap, Eye, CreditCard } from 'lucide-react';

const planIcons = { council_basic: CreditCard, nexus_pro: Zap, diy_vision: Eye };

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function subscribe(planKey: string) {
    setLoading(planKey);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey, customerEmail: 'jbrackinm@gmail.com' }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-gray-500 mt-1">Choose the plan that powers your council</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(PLANS).map(([key, plan]) => {
          const Icon = planIcons[key as keyof typeof planIcons];
          const isPro = key === 'nexus_pro';
          return (
            <div key={key} className={`rounded-2xl border-2 p-6 flex flex-col ${isPro ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
              {isPro && <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Most Popular</div>}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${isPro ? 'bg-blue-500' : 'bg-gray-100'}`}>
                  <Icon className={`w-5 h-5 ${isPro ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">${(plan.amount / 100).toFixed(0)}</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => subscribe(key)}
                disabled={!!loading}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  isPro
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-900 text-white hover:bg-gray-700'
                } disabled:opacity-50`}
              >
                {loading === key ? 'Redirecting...' : 'Get Started'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-xl text-sm text-gray-500 text-center">
        Payments secured by Stripe · Cancel anytime · No contracts
      </div>
    </div>
  );
}
