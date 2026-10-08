import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Compass, Users, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/campus/bits";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus — Find your people on campus" },
      { name: "description", content: "A private network verified by your college email. Discover classmates, teammates and communities. Free and ad-free." },
      { property: "og:title", content: "Campus — Find your people on campus" },
      { property: "og:description", content: "A private network verified by your college email. Free and ad-free." },
    ],
  }),
  component: Landing,
});

const NODES = [
  { label: "AI/ML Club", sub: "32 people", x: "8%", y: "18%" },
  { label: "Hackathon", sub: "3 open roles", x: "70%", y: "10%" },
  { label: "Study group", sub: "Linear Algebra", x: "4%", y: "70%" },
  { label: "Friends", sub: "4 mutuals", x: "72%", y: "72%" },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
          <Button asChild variant="ink"><Link to="/auth" search={{ mode: "signup" }}>Join your campus</Link></Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-10 md:grid-cols-[1.1fr_1fr] md:pt-20">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <ShieldCheck className="size-3.5" /> Verified with your college email
          </span>
          <h1 className="mt-6 text-5xl font-extrabold leading-[1.02] md:text-7xl">
            Your college.<br />Your people.<br /><span className="text-primary">Your network.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            A private digital layer of your campus. Find classmates who share your interests, teammates for the next hackathon, and people worth knowing.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>Find your people</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/auth">I have an account</Link></Button>
          </div>
        </div>

        <div className="relative aspect-square rounded-3xl bg-card grid-paper shadow-card">
          <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" aria-hidden>
            {[[20, 24], [80, 16], [16, 76], [82, 78]].map(([x, y], i) => (
              <line key={i} x1="50" y1="50" x2={x} y2={y} stroke="var(--primary)" strokeWidth="0.35" strokeDasharray="1.2 1.2" />
            ))}
          </svg>
          <div className="absolute left-1/2 top-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-lg font-extrabold text-primary-foreground ring-8 ring-accent">
            YOU
          </div>
          {NODES.map((n, i) => (
            <div key={n.label} className="animate-rise absolute rounded-xl bg-background px-3 py-2 shadow-card" style={{ left: n.x, top: n.y, animationDelay: `${150 + i * 100}ms` }}>
              <div className="text-sm font-semibold">{n.label}</div>
              <div className="font-mono text-[11px] text-muted-foreground">{n.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink py-20 text-ink-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-3">
          {[
            { icon: ShieldCheck, t: "Only your college", d: "Sign up with your official college email. Everyone you see is a verified student from your campus." },
            { icon: Compass, t: "Discover by interest", d: "Search by branch, year or interest. People who share what you care about show up first." },
            { icon: Users, t: "Connect with intent", d: "Say what you're looking for — study group, hackathon team, co-founder, or just friends." },
          ].map((f) => (
            <div key={f.t}>
              <f.icon className="size-6 text-primary" />
              <h3 className="mt-4 text-xl font-bold">{f.t}</h3>
              <p className="mt-2 text-sm opacity-70">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border bg-card p-8 md:flex-row md:items-center md:p-12">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Ban className="size-4" /> No ads. Ever.</div>
            <h2 className="mt-2 text-3xl font-extrabold">Free for students. No sponsored posts, no tracking, no junk.</h2>
          </div>
          <Button asChild size="lg" variant="ink"><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-muted-foreground">© {new Date().getFullYear()} Campus · Built for students</footer>
    </div>
  );
}
