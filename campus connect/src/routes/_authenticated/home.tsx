import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/campus/app-shell";
import { StudentCard } from "@/components/campus/bits";
import { connectionsQuery, meQuery, studentsQuery } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Home — Campus" }] }),
  component: Home,
});

function Home() {
  const { data: me } = useQuery(meQuery);
  const { data: students = [] } = useQuery(studentsQuery(""));
  const { data: conns = [] } = useQuery(connectionsQuery);
  const pending = conns.filter((c) => c.status === "pending" && c.incoming).length;
  const friends = conns.filter((c) => c.status === "accepted").length;
  const college = me?.profile?.colleges as { name: string } | null | undefined;
  return (
    <AppShell>
      <h1 className="text-3xl font-extrabold">Hey {me?.profile?.full_name.split(" ")[0]} 👋</h1>
      <p className="mt-2 text-muted-foreground">{college?.name}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Connections" value={friends} to="/connections" />
        <Stat label="Requests waiting" value={pending} to="/connections" />
        <Stat label="Classmates here" value={students.length} to="/discover" />
      </div>
      <div className="mt-10 flex items-end justify-between">
        <h2 className="text-xl font-bold">People you might click with</h2>
        <Link to="/discover" className="text-sm font-semibold text-primary">See all →</Link>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {students.slice(0, 6).map((s) => <StudentCard key={s.id} s={s} />)}
      </div>
      {students.length === 0 && <p className="mt-4 text-muted-foreground">You're one of the first here — invite your friends!</p>}
    </AppShell>
  );
}

function Stat({ label, value, to }: { label: string; value: number; to: "/connections" | "/discover" }) {
  return (
    <Link to={to} className="rounded-2xl bg-card p-5 shadow-card transition-transform hover:-translate-y-0.5">
      <div className="text-3xl font-extrabold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </Link>
  );
}
