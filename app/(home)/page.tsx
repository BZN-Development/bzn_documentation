import Link from 'next/link';

const features = [
  {
    title: 'No big player object',
    text: 'No PlayerData blob synced on every change. Each module sends its own small piece of data, only to the player it belongs to, only when it changes.',
  },
  {
    title: 'No polling',
    text: 'Hunger and thirst are anchors the client computes from its own clock. Salary is time on duty times a rate, paid in one transaction per group. Saves are batched and spread over time.',
  },
  {
    title: 'Money you can trust',
    text: 'Every money operation is one database transaction with its statement line. A balance can never go negative, not even with a thousand requests at the same moment.',
  },
  {
    title: 'Crash-safe',
    text: 'No position saved before a confirmed spawn, a starter kit claimed before it is given, salary lowered in the database before it is paid.',
  },
  {
    title: 'Extend without forking',
    text: 'Before-hooks to add rules, after-hooks to react, spawn providers for housing and jail. Config is overrides only, in its own resource.',
  },
  {
    title: 'Replaceable parts',
    text: 'The database, the inventory, the library and the game itself sit behind adapters. A new one is a new provider file, not a rewrite.',
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-16">
      <h1 className="text-5xl font-bold tracking-tight text-fd-primary">bzn</h1>
      <p className="mt-4 text-2xl font-semibold">A modular, performance-first FiveM framework</p>
      <p className="mt-2 text-fd-muted-foreground">
        Small core, switchable modules, built on ox_lib and ox_inventory.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/docs/getting-started"
          className="rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground"
        >
          Get started
        </Link>
        <Link href="/docs/using-bzn" className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-fd-accent">
          Using bzn from your resource
        </Link>
        <a
          href="https://github.com/BZN-Development/bzn_core"
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-fd-accent"
        >
          GitHub
        </a>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-xl border bg-fd-card p-5">
            <h2 className="font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm text-fd-muted-foreground">{feature.text}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
