import Link from 'next/link';
import { Check } from 'lucide-react';

const tiers = [
  {
    name: 'Starter',
    price: '$0',
    cadence: '/forever',
    blurb: 'For one shop just getting on the system.',
    cta: 'Start free',
    features: ['1 tenant, 1 shop', 'Up to 3 cashiers', 'Up to 200 products', 'Append-only transaction history', 'Stock + reorder alerts'],
    highlighted: false,
  },
  {
    name: 'Advanced',
    price: '$29',
    cadence: '/month',
    blurb: 'When your shop is humming and you need reports.',
    cta: 'Choose Advanced',
    features: ['Everything in Starter', 'Unlimited cashiers', 'Unlimited products', 'Daily/monthly sales reports', 'Cashier performance breakdown', 'CSV exports'],
    highlighted: true,
  },
  {
    name: 'Pro',
    price: '$79',
    cadence: '/month',
    blurb: 'For shops that lean hard on the data.',
    cta: 'Choose Pro',
    features: ['Everything in Advanced', 'Hourly sales breakdown', 'Slow-moving stock reports', 'Trend analysis (weekly/monthly)', 'Priority support'],
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
          Simple subscription tiers.
        </h2>
        <p className="mt-3 text-base text-gray-600">
          Stored on your tenant as <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-700">subscription_tier</code>.
          Upgrade or downgrade any time.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={
              tier.highlighted
                ? 'relative rounded-xl border-2 border-primary-600 bg-white p-7 shadow-sm'
                : 'relative rounded-xl border border-gray-200 bg-white p-7'
            }
          >
            {tier.highlighted && (
              <span className="absolute -top-3 left-7 rounded-full bg-primary-600 px-3 py-0.5 text-xs font-medium text-white">
                Most popular
              </span>
            )}
            <h3 className="text-sm font-semibold text-gray-900">{tier.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight text-gray-900">{tier.price}</span>
              <span className="text-sm text-gray-500">{tier.cadence}</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{tier.blurb}</p>

            <Link
              href="/auth/register"
              className={
                tier.highlighted
                  ? 'mt-6 block w-full rounded-md bg-primary-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-700'
                  : 'mt-6 block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-900 hover:bg-gray-50'
              }
            >
              {tier.cta}
            </Link>

            <ul className="mt-6 space-y-2.5">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
