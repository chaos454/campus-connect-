import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { meQuery } from "@/lib/campus";
import { Logo } from "@/components/campus/bits";
import { ProfileForm } from "@/components/campus/profile-form";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your profile — Campus" }] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const { data } = useQuery(meQuery);
  useEffect(() => { if (data?.profile) navigate({ to: "/home", replace: true }); }, [data, navigate]);
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Logo />
      <h1 className="mt-8 text-3xl font-extrabold">Set up your profile</h1>
      <p className="mt-2 text-muted-foreground">Only verified students of your college will see this.</p>
      <div className="mt-8 rounded-2xl bg-card p-6 shadow-card">
        <ProfileForm mode="create" onDone={() => navigate({ to: "/home", replace: true })} />
      </div>
    </div>
  );
}
