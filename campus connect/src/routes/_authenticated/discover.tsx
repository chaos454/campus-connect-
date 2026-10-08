import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/campus/app-shell";
import { StudentCard } from "@/components/campus/bits";
import { Input } from "@/components/ui/input";
import { studentsQuery } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — Campus" }] }),
  component: Discover,
});

function Discover() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 300); return () => clearTimeout(t); }, [q]);
  const { data, isLoading } = useQuery(studentsQuery(debounced));
  return (
    <AppShell>
      <h1 className="text-3xl font-extrabold">Discover</h1>
      <p className="mt-2 text-muted-foreground">Students at your college, best matches first.</p>
      <div className="relative mt-6 max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, branch or interest" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && [0, 1, 2].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />)}
        {data?.map((s) => <StudentCard key={s.id} s={s} />)}
      </div>
      {data && data.length === 0 && <p className="mt-10 text-center text-muted-foreground">No students found yet. Invite your friends!</p>}
    </AppShell>
  );
}
