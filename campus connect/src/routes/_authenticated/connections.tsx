import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/campus/app-shell";
import { Avatar } from "@/components/campus/bits";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { connectionsQuery, yearLabel } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/connections")({
  head: () => ({ meta: [{ title: "Connections — Campus" }] }),
  component: Connections,
});

type Row = { connection_id: string; status: string; incoming: boolean; id: string; full_name: string; username: string; branch: string | null; year: number | null };

function Connections() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(connectionsQuery);
  const rows = data as Row[];
  const act = useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      const { error } = accept
        ? await supabase.from("connections").update({ status: "accepted" }).eq("id", id)
        : await supabase.from("connections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(),
    onError: () => toast.error("Something went wrong. Try again."),
  });

  const groups = [
    { title: "Requests for you", items: rows.filter((r) => r.status === "pending" && r.incoming) },
    { title: "Your connections", items: rows.filter((r) => r.status === "accepted") },
    { title: "Sent requests", items: rows.filter((r) => r.status === "pending" && !r.incoming) },
  ];

  return (
    <AppShell>
      <h1 className="text-3xl font-extrabold">Connections</h1>
      {isLoading && <div className="mt-6 h-32 animate-pulse rounded-2xl bg-muted" />}
      {!isLoading && rows.length === 0 && (
        <p className="mt-6 text-muted-foreground">No connections yet. <Link to="/discover" className="font-semibold text-primary">Find classmates →</Link></p>
      )}
      {groups.filter((g) => g.items.length).map((g) => (
        <section key={g.title} className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{g.title} · {g.items.length}</h2>
          <div className="mt-3 divide-y rounded-2xl bg-card shadow-card">
            {g.items.map((r) => (
              <div key={r.connection_id} className="flex items-center gap-3 p-4">
                <Link to="/u/$username" params={{ username: r.username }} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={r.full_name} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{r.full_name}</div>
                    <div className="truncate text-xs text-muted-foreground">{[r.branch, yearLabel(r.year)].filter(Boolean).join(" · ")}</div>
                  </div>
                </Link>
                {r.status === "pending" && r.incoming && <Button size="sm" onClick={() => act.mutate({ id: r.connection_id, accept: true })}>Accept</Button>}
                <Button size="sm" variant="ghost" onClick={() => act.mutate({ id: r.connection_id, accept: false })}>
                  {r.status === "accepted" ? "Remove" : r.incoming ? "Decline" : "Cancel"}
                </Button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </AppShell>
  );
}
