import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "./app-shell";
import { Avatar } from "./bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { groupsQuery, type GroupKind } from "@/lib/social";

const COPY: Record<GroupKind, { title: string; sub: string; noun: string; join: string; tagHint: string }> = {
  community: { title: "Communities", sub: "Clubs, societies and interest groups at your college.", noun: "community", join: "Join", tagHint: "Tags, e.g. coding, music" },
  project: { title: "Projects", sub: "Find teammates for side projects, hackathons and startups.", noun: "project", join: "I'm in", tagHint: "Skills needed, e.g. React, design" },
  study: { title: "Study Groups", sub: "Find people studying the same subject.", noun: "study group", join: "Join", tagHint: "Subjects, e.g. DSA, Calculus" },
};

export function GroupsPage({ kind }: { kind: GroupKind }) {
  const c = COPY[kind];
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(groupsQuery(kind));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", tags: "" });
  const [q, setQ] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["groups", kind] });
  const onError = () => toast.error("Something went wrong. Try again.");

  const create = useMutation({
    mutationFn: async () => {
      const { data: g, error } = await supabase.from("groups").insert({
        kind, name: form.name.trim(), description: form.description.trim() || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8),
      }).select("id").single();
      if (error) throw error;
      await supabase.from("group_members").insert({ group_id: g.id });
    },
    onSuccess: () => { setForm({ name: "", description: "", tags: "" }); setOpen(false); refresh(); toast.success(`Your ${c.noun} is live`); },
    onError,
  });
  const toggle = useMutation({
    mutationFn: async ({ id, joined }: { id: string; joined: boolean }) => {
      const uid = (await supabase.auth.getUser()).data.user!.id;
      const { error } = joined
        ? await supabase.from("group_members").delete().eq("group_id", id).eq("user_id", uid)
        : await supabase.from("group_members").insert({ group_id: id });
      if (error) throw error;
    },
    onSuccess: refresh, onError,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh, onError,
  });

  const s = q.toLowerCase();
  const list = data.filter((g) => !s || g.name.toLowerCase().includes(s) || g.tags.some((t) => t.toLowerCase().includes(s)) || (g.description ?? "").toLowerCase().includes(s));

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">{c.title}</h1>
          <p className="mt-1 text-muted-foreground">{c.sub}</p>
        </div>
        <Button onClick={() => setOpen(!open)}><Plus className="size-4" /> New {c.noun}</Button>
      </div>

      {open && (
        <form className="mt-6 grid gap-3 rounded-2xl bg-card p-5 shadow-card" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <Input required minLength={2} maxLength={80} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Textarea maxLength={1000} rows={3} placeholder="What's it about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input placeholder={c.tagHint} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={create.isPending}>Create</Button>
          </div>
        </form>
      )}

      <Input className="mt-6 max-w-sm" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      {isLoading && <div className="mt-6 h-32 animate-pulse rounded-2xl bg-muted" />}
      {!isLoading && list.length === 0 && <p className="mt-8 text-muted-foreground">No {c.title.toLowerCase()} yet. Start the first one!</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {list.map((g) => (
          <div key={g.id} className="flex flex-col rounded-2xl bg-card p-5 shadow-card">
            <div className="flex items-start gap-2">
              <h3 className="flex-1 text-lg font-bold">{g.name}</h3>
              {g.mine && <button aria-label="Delete" onClick={() => confirm(`Delete this ${c.noun}?`) && remove.mutate(g.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>}
            </div>
            {g.description && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{g.description}</p>}
            {g.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {g.tags.map((t) => <span key={t} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">{t}</span>)}
              </div>
            )}
            <div className="mt-auto flex items-center gap-3 pt-4">
              <div className="flex -space-x-2">
                {g.members.slice(0, 4).map((m) => <Avatar key={m.id} name={m.full_name} size="sm" />)}
              </div>
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3.5" /> {g.members.length}</span>
              <Button size="sm" className="ml-auto" variant={g.joined ? "outline" : "default"} disabled={toggle.isPending}
                onClick={() => toggle.mutate({ id: g.id, joined: g.joined })}>
                {g.joined ? "Leave" : c.join}
              </Button>
            </div>
            {g.owner && <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Started by {g.owner.full_name}</p>}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
