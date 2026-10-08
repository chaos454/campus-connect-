import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/campus/app-shell";
import { Avatar } from "@/components/campus/bits";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { connectionsQuery } from "@/lib/campus";
import { inboxQuery, threadQuery, timeAgo } from "@/lib/social";

export const Route = createFileRoute("/_authenticated/messages")({
  validateSearch: (s: Record<string, unknown>) => ({ with: typeof s['with'] === "string" ? s['with'] : undefined }),
  head: () => ({ meta: [{ title: "Messages — Campus" }, { name: "description", content: "Chat with your connections." }] }),
  component: Messages,
});

type Conn = { status: string; id: string; full_name: string; username: string; branch: string | null };

function Messages() {
  const { with: other } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: conns = [] } = useQuery(connectionsQuery);
  const { data: inbox } = useQuery(inboxQuery);
  const friends = (conns as Conn[]).filter((c) => c.status === "accepted")
    .sort((a, b) => (inbox?.get(b.id)?.created_at ?? "").localeCompare(inbox?.get(a.id)?.created_at ?? ""));
  const active = friends.find((f) => f.id === other);

  useEffect(() => {
    const ch = supabase.channel("messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        qc.invalidateQueries({ queryKey: ["thread"] });
        qc.invalidateQueries({ queryKey: ["inbox"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return (
    <AppShell>
      <h1 className="text-3xl font-extrabold">Messages</h1>
      <div className="mt-6 grid h-[calc(100vh-14rem)] min-h-[420px] overflow-hidden rounded-2xl bg-card shadow-card md:grid-cols-[280px_1fr]">
        <div className={`overflow-y-auto border-r ${active ? "hidden md:block" : ""}`}>
          {friends.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">You can message people once you're connected. <Link to="/discover" className="font-semibold text-primary">Find classmates →</Link></p>
          )}
          {friends.map((f) => {
            const last = inbox?.get(f.id);
            return (
              <button key={f.id} onClick={() => navigate({ to: "/messages", search: { with: f.id } })}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary ${f.id === other ? "bg-secondary" : ""}`}>
                <Avatar name={f.full_name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{f.full_name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{last ? last.body : "Say hi 👋"}</span>
                </span>
                {last && <span className="text-[10px] text-muted-foreground">{timeAgo(last.created_at)}</span>}
              </button>
            );
          })}
        </div>
        {active ? <Thread key={active.id} friend={active} /> : (
          <div className="hidden items-center justify-center text-sm text-muted-foreground md:flex">Pick a conversation</div>
        )}
      </div>
    </AppShell>
  );
}

function Thread({ friend }: { friend: Conn }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery(threadQuery(friend.id));
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [data.length]);

  const send = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from("messages").insert({ recipient_id: friend.id, body });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["thread", friend.id] }); qc.invalidateQueries({ queryKey: ["inbox"] }); },
    onError: () => toast.error("Message didn't send. Try again."),
  });

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Link to="/messages" search={{ with: undefined }} className="md:hidden" aria-label="Back"><ArrowLeft className="size-4" /></Link>
        <Link to="/u/$username" params={{ username: friend.username }} className="flex items-center gap-3">
          <Avatar name={friend.full_name} size="sm" />
          <span className="text-sm font-semibold">{friend.full_name}</span>
        </Link>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {data.length === 0 && <p className="text-center text-sm text-muted-foreground">No messages yet.</p>}
        {data.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? "justify-end" : ""}`}>
            <div className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${m.mine ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{m.body}</div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form className="flex gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); const b = text.trim(); if (!b) return; setText(""); send.mutate(b); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} placeholder="Type a message…"
          className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <Button size="icon" aria-label="Send" disabled={!text.trim()}><Send className="size-4" /></Button>
      </form>
    </div>
  );
}
