import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/campus/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { eventsQuery } from "@/lib/social";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({ meta: [{ title: "Events — Campus" }, { name: "description", content: "Upcoming events at your college." }] }),
  component: Events,
});

function Events() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(eventsQuery);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", description: "", location: "", when: "" });
  const refresh = () => qc.invalidateQueries({ queryKey: ["events"] });
  const onError = () => toast.error("Something went wrong. Try again.");

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("events").insert({
        title: f.title.trim(), description: f.description.trim() || null, location: f.location.trim() || null,
        starts_at: new Date(f.when).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => { setF({ title: "", description: "", location: "", when: "" }); setOpen(false); refresh(); toast.success("Event posted"); },
    onError,
  });
  const rsvp = useMutation({
    mutationFn: async ({ id, on }: { id: string; on: boolean }) => {
      const uid = (await supabase.auth.getUser()).data.user!.id;
      const { error } = on
        ? await supabase.from("event_rsvps").delete().eq("event_id", id).eq("user_id", uid)
        : await supabase.from("event_rsvps").insert({ event_id: id });
      if (error) throw error;
    },
    onSuccess: refresh, onError,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh, onError,
  });

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Events</h1>
          <p className="mt-1 text-muted-foreground">What's happening on campus.</p>
        </div>
        <Button onClick={() => setOpen(!open)}><Plus className="size-4" /> New event</Button>
      </div>

      {open && (
        <form className="mt-6 grid gap-3 rounded-2xl bg-card p-5 shadow-card" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <Input required minLength={2} maxLength={120} placeholder="Event title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input required type="datetime-local" value={f.when} onChange={(e) => setF({ ...f, when: e.target.value })} />
            <Input placeholder="Where? e.g. Main auditorium" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
          </div>
          <Textarea rows={3} maxLength={2000} placeholder="Details" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={create.isPending}>Post event</Button>
          </div>
        </form>
      )}

      {isLoading && <div className="mt-6 h-32 animate-pulse rounded-2xl bg-muted" />}
      {!isLoading && data.length === 0 && <p className="mt-8 text-muted-foreground">No upcoming events. Post one!</p>}
      <div className="mt-6 space-y-3">
        {data.map((e) => {
          const d = new Date(e.starts_at);
          return (
            <div key={e.id} className="flex gap-4 rounded-2xl bg-card p-5 shadow-card">
              <div className="w-16 shrink-0 rounded-xl bg-primary/10 py-2 text-center text-primary">
                <div className="font-mono text-[10px] uppercase">{d.toLocaleDateString(undefined, { month: "short" })}</div>
                <div className="text-2xl font-extrabold leading-none">{d.getDate()}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <h3 className="flex-1 font-bold">{e.title}</h3>
                  {e.mine && <button aria-label="Delete event" onClick={() => confirm("Delete this event?") && remove.mutate(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {d.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}
                  {e.location && <span className="ml-2 inline-flex items-center gap-1"><MapPin className="size-3.5" />{e.location}</span>}
                </p>
                {e.description && <p className="mt-2 whitespace-pre-wrap text-sm">{e.description}</p>}
                <div className="mt-3 flex items-center gap-3">
                  <Button size="sm" variant={e.rsvped ? "outline" : "default"} onClick={() => rsvp.mutate({ id: e.id, on: e.rsvped })}>
                    {e.rsvped ? "Going ✓" : "I'm going"}
                  </Button>
                  <span className="text-xs text-muted-foreground">{e.going} going{e.host ? ` · by ${e.host.full_name}` : ""}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
