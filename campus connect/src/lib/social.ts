import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Person = { id: string; full_name: string; username: string; branch: string | null; year: number | null };
export type GroupKind = "community" | "project" | "study";

export async function myId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? "";
}

export async function people(ids: string[]) {
  const uniq = [...new Set(ids)];
  if (!uniq.length) return new Map<string, Person>();
  const { data } = await supabase.rpc("campus_people", { _ids: uniq });
  return new Map((data ?? []).map((p) => [p.id, p as Person]));
}

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString();
}

export const feedQuery = queryOptions({
  queryKey: ["feed"],
  queryFn: async () => {
    const me = await myId();
    const { data, error } = await supabase
      .from("posts")
      .select("id, body, created_at, author_id, post_likes(user_id), post_comments(id, body, created_at, author_id)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    const rows = data ?? [];
    const map = await people(rows.flatMap((r) => [r.author_id, ...r.post_comments.map((c) => c.author_id)]));
    return rows.map((r) => ({
      ...r,
      author: map.get(r.author_id),
      liked: r.post_likes.some((l) => l.user_id === me),
      mine: r.author_id === me,
      comments: [...r.post_comments]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((c) => ({ ...c, author: map.get(c.author_id), mine: c.author_id === me })),
    }));
  },
});

export const groupsQuery = (kind: GroupKind) =>
  queryOptions({
    queryKey: ["groups", kind],
    queryFn: async () => {
      const me = await myId();
      const { data, error } = await supabase
        .from("groups")
        .select("id, name, description, tags, created_by, created_at, group_members(user_id)")
        .eq("kind", kind)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const map = await people(rows.flatMap((r) => [r.created_by, ...r.group_members.map((m) => m.user_id)]));
      return rows.map((r) => ({
        ...r,
        owner: map.get(r.created_by),
        members: r.group_members.map((m) => map.get(m.user_id)).filter(Boolean) as Person[],
        joined: r.group_members.some((m) => m.user_id === me),
        mine: r.created_by === me,
      }));
    },
  });

export const eventsQuery = queryOptions({
  queryKey: ["events"],
  queryFn: async () => {
    const me = await myId();
    const since = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
    const { data, error } = await supabase
      .from("events")
      .select("id, title, description, location, starts_at, created_by, event_rsvps(user_id)")
      .gte("starts_at", since)
      .order("starts_at");
    if (error) throw error;
    const rows = data ?? [];
    const map = await people(rows.map((r) => r.created_by));
    return rows.map((r) => ({
      ...r,
      host: map.get(r.created_by),
      going: r.event_rsvps.length,
      rsvped: r.event_rsvps.some((x) => x.user_id === me),
      mine: r.created_by === me,
    }));
  },
});

export const threadQuery = (other: string) =>
  queryOptions({
    queryKey: ["thread", other],
    queryFn: async () => {
      const me = await myId();
      const { data, error } = await supabase
        .from("messages")
        .select("id, body, created_at, sender_id")
        .or(`and(sender_id.eq.${me},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${me})`)
        .order("created_at")
        .limit(500);
      if (error) throw error;
      return (data ?? []).map((m) => ({ ...m, mine: m.sender_id === me }));
    },
  });

export const inboxQuery = queryOptions({
  queryKey: ["inbox"],
  queryFn: async () => {
    const me = await myId();
    const { data } = await supabase
      .from("messages")
      .select("body, created_at, sender_id, recipient_id")
      .order("created_at", { ascending: false })
      .limit(300);
    const last = new Map<string, { body: string; created_at: string }>();
    for (const m of data ?? []) {
      const other = m.sender_id === me ? m.recipient_id : m.sender_id;
      if (!last.has(other)) last.set(other, m);
    }
    return last;
  },
});
