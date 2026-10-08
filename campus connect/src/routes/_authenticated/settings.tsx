import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/campus/app-shell";
import { ProfileForm } from "@/components/campus/profile-form";
import { meQuery } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Campus" }] }),
  component: Settings,
});

function Settings() {
  const { data } = useQuery(meQuery);
  const p = data?.profile;
  return (
    <AppShell>
      <h1 className="text-3xl font-extrabold">Settings</h1>
      <p className="mt-2 text-muted-foreground">Edit your profile and privacy.</p>
      {p && <div className="mt-8 max-w-2xl rounded-2xl bg-card p-6 shadow-card"><ProfileForm mode="edit" initial={p} onDone={() => {}} /></div>}
    </AppShell>
  );
}
