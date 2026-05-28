const steps = [
  { n: '01', title: 'Register your tenant', body: 'Sign up with your business name and an owner account. Your tenant is created atomically — no half-built workspaces.' },
  { n: '02', title: 'Add products and stock', body: 'Set price, category, current stock, and a reorder level. Reorder alerts surface when stock dips below threshold.' },
  { n: '03', title: 'Invite cashiers, start selling', body: 'Cashiers log in, ring up transactions, and stock decrements automatically. Owners see real-time totals on the dashboard.' },
];

export default function HowItWorks() {
  return (
    <section className="border-y border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
            From sign-up to first sale in minutes.
          </h2>
          <p className="mt-3 text-base text-gray-600">
            No setup wizard you can't escape. No required integrations. Three steps.
          </p>
        </div>

        <ol className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <li key={s.n} className="rounded-lg border border-gray-200 bg-white p-6">
              <span className="text-xs font-semibold text-primary-700">{s.n}</span>
              <h3 className="mt-2 text-base font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
