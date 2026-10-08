import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/campus/app-shell";
import { Avatar } from "@/components/campus/bits";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { feedQuery, timeAgo } from "@/lib/social";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({ meta: [{ title: "Feed — Campus" }, { name: "description", content: "Updates from students at your college." }] }),
  component: Feed,
});

function Feed() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(feedQuery);
  const [body, setBody] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["feed"] });
  const onError = () => toast.error("Something went wrong. Try again.");

  const post = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("posts").insert({ body: body.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setBody(""); refresh(); },
    onError,
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-extrabold">Feed</h1>
        <p className="mt-1 text-muted-foreground">Only students at your college see these. No ads, no algorithm — newest first.</p>
        <div className="mt-6 rounded-2xl bg-card p-4 shadow-card">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={3}
            placeholder="Share something with your campus…" className="resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" />
          <div className="mt-2 flex justify-end">
            <Button disabled={!body.trim() || post.isPending} onClick={() => post.mutate()}>Post</Button>
          </div>
        </div>
        {isLoading && <div className="mt-6 h-32 animate-pulse rounded-2xl bg-muted" />}
        {!isLoading && data.length === 0 && <p className="mt-8 text-center text-muted-foreground">Nothing here yet — be the first to post.</p>}
        <div className="mt-6 space-y-4">
          {data.map((p) => <PostCard key={p.id} p={p} refresh={refresh} onError={onError} />)}
        </div>
      </div>
    </AppShell>
  );
}

type P = Awaited<ReturnType<NonNullable<typeof feedQuery.queryFn>>>[number];

function PostCard({ p, refresh, onError }: { p: P; refresh: () => void; onError: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const like = useMutation({
    mutationFn: async () => {
      const { error } = p.liked
        ? await supabase.from("post_likes").delete().eq("post_id", p.id).eq("user_id", (await supabase.auth.getUser()).data.user!.id)
        : await supabase.from("post_likes").insert({ post_id: p.id });
      if (error) throw error;
    },
    onSuccess: refresh, onError,
  });
  const comment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("post_comments").insert({ post_id: p.id, body: text.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setText(""); refresh(); }, onError,
  });
  const remove = useMutation({
    mutationFn: async ({ table, id }: { table: "posts" | "post_comments"; id: string }) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh, onError,
  });

  return (
    <article className="rounded-2xl bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <Author a={p.author} />
        <span className="ml-auto text-xs text-muted-foreground">{timeAgo(p.created_at)}</span>
        {p.mine && (
          <button aria-label="Delete post" onClick={() => remove.mutate({ table: "posts", id: p.id })} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{p.body}</p>
      <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
        <button onClick={() => like.mutate()} className={`flex items-center gap-1.5 ${p.liked ? "text-primary" : "hover:text-foreground"}`}>
          <Heart className={`size-4 ${p.liked ? "fill-current" : ""}`} /> {p.post_likes.length}
        </button>
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 hover:text-foreground">
          <MessageSquare className="size-4" /> {p.comments.length}
        </button>
      </div>
      {open && (
        <div className="mt-4 space-y-3 border-t pt-4">
          {p.comments.map((c) => (
            <div key={c.id} className="flex gap-2 text-sm">
              <Avatar name={c.author?.full_name ?? "?"} size="sm" />
              <div className="flex-1 rounded-xl bg-secondary px-3 py-2">
                <span className="font-semibold">{c.author?.full_name ?? "Student"}</span>{" "}
                <span className="whitespace-pre-wrap">{c.body}</span>
              </div>
              {c.mine && <button aria-label="Delete comment" onClick={() => remove.mutate({ table: "post_comments", id: c.id })} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>}
            </div>
          ))}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) comment.mutate(); }}>
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Write a comment…"
              className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <Button size="sm" disabled={!text.trim() || comment.isPending}>Reply</Button>
          </form>
        </div>
      )}
    </article>
  );
}

export function Author({ a }: { a?: undefined | { full_name: string; username: string; branch: string | null } }) {
  if (!a) return <span className="text-sm text-muted-foreground">Student</span>;
  return (
    <Link to="/u/$username" params={{ username: a.username }} className="flex items-center gap-3">
      <Avatar name={a.full_name} size="sm" />
      <span>
        <span className="block text-sm font-semibold leading-tight">{a.full_name}</span>
        <span className="block text-xs text-muted-foreground">@{a.username}{a.branch ? ` · ${a.branch}` : ""}</span>
      </span>
    </Link>
  );
}
