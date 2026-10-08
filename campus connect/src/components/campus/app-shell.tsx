import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Compass, Home, LogOut, Settings, Users, Network, CalendarDays, FolderKanban, BookOpen, MessageCircle, UsersRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { meQuery } from "@/lib/campus";
import { Avatar, Logo } from "./bits";

const NAV = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/connections", label: "Connections", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const SOON = [
  { label: "Campus Graph", icon: Network },
  { label: "Communities", icon: UsersRound },
  { label: "Events", icon: CalendarDays },
  { label: "Projects", icon: FolderKanban },
  { label: "Study Groups", icon: BookOpen },
  { label: "Messages", icon: MessageCircle },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery(meQuery);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!isLoading && data && !data.profile) navigate({ to: "/onboarding", replace: true });
  }, [isLoading, data, navigate]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const profile = data?.profile;
  const college = profile?.colleges as { short_name: string } | null | undefined;

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r bg-sidebar p-4 md:flex">
        <Link to="/home" className="px-2 py-1"><Logo /></Link>
        {college && (
          <div className="mt-4 rounded-xl bg-card px-3 py-2 text-xs shadow-card">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Verified campus</div>
            <div className="font-semibold">{college.short_name}</div>
          </div>
        )}
        <nav className="mt-6 flex flex-col gap-0.5">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "!bg-card !text-foreground shadow-card" }}>
              <n.icon className="size-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 px-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Coming next</div>
        <div className="mt-1 flex flex-col">
          {SOON.map((n) => (
            <span key={n.label} className="flex items-center gap-3 px-3 py-1.5 text-sm text-muted-foreground/60">
              <n.icon className="size-4" /> {n.label}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center gap-2 border-t pt-4">
          {profile && (
            <Link to="/u/$username" params={{ username: profile.username }} className="flex min-w-0 flex-1 items-center gap-2">
              <Avatar name={profile.full_name} size="sm" />
              <span className="truncate text-sm font-medium">{profile.full_name}</span>
            </Link>
          )}
          <button onClick={signOut} aria-label="Sign out" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        <Logo />
        <button onClick={signOut} aria-label="Sign out" className="p-2 text-muted-foreground"><LogOut className="size-4" /></button>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-10 md:pt-10">
        {isLoading || !profile ? <div className="h-40 animate-pulse rounded-2xl bg-muted" /> : children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t bg-card md:hidden">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
            activeProps={{ className: "!text-primary" }}>
            <n.icon className="size-5" /> {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
