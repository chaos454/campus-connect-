import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/campus/app-shell";
import { Avatar, Chip } from "@/components/campus/bits";
import { ConnectButton } from "@/components/campus/connect-button";
import { Button } from "@/components/ui/button";
import { meQuery, studentQuery, yearLabel } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/u/$username")({
  head: () => ({ meta: [{ title: "Profile — Campus" }] }),
  component: Profile,
});

function Profile() {
  const { username } = Route.useParams();
  const { data: s, isLoading } = useQuery(studentQuery(username));
  const { data: me } = useQuery(meQuery);
  const isMe = me?.profile?.username === username.toLowerCase();
  return (
    <AppShell>
      {isLoading ? <div className="h-60 animate-pulse rounded-2xl bg-muted" /> : !s ? (
        <p className="text-muted-foreground">This student isn't on your campus.</p>
      ) : (
        <div className="max-w-2xl rounded-2xl bg-card p-8 shadow-card">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar name={s.full_name} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-extrabold">{s.full_name}</h1>
              <div className="font-mono text-xs text-muted-foreground">@{s.username}</div>
              <div className="mt-1 text-sm text-muted-foreground">{[s.branch, yearLabel(s.year)].filter(Boolean).join(" · ")}</div>
            </div>
            {isMe ? <Button asChild variant="secondary" size="sm"><Link to="/settings">Edit profile</Link></Button> : <ConnectButton s={s} />}
          </div>
          {s.bio && <p className="mt-6">{s.bio}</p>}
          {s.relationship_status && <p className="mt-3 text-sm text-muted-foreground">{s.relationship_status}</p>}
          {s.interests.length > 0 && <><h2 className="mt-6 font-mono text-xs uppercase tracking-wider text-muted-foreground">Interests</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">{s.interests.map((i) => <Chip key={i}>{i}</Chip>)}</div></>}
          {s.looking_for.length > 0 && <><h2 className="mt-6 font-mono text-xs uppercase tracking-wider text-muted-foreground">Looking for</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">{s.looking_for.map((i) => <Chip key={i}>{i}</Chip>)}</div></>}
        </div>
      )}
    </AppShell>
  );
}
