import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, MailCheck, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/campus/bits";
import { findCollege } from "@/lib/campus";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["signin", "signup"]).optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — Campus" },
      { name: "description", content: "Sign in or join Campus with your college email." },
      { property: "og:title", content: "Sign in — Campus" },
      { property: "og:description", content: "Sign in or join Campus with your college email." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initial } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(initial ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [college, setCollege] = useState<{ name: string } | null | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/home", replace: true }); });
  }, [navigate]);

  useEffect(() => {
    if (!email.includes("@") || !email.split("@")[1]?.includes(".")) { setCollege(undefined); return; }
    const t = setTimeout(() => findCollege(email).then(setCollege), 300);
    return () => clearTimeout(t);
  }, [email]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!college) { toast.error("Please use your official college email."); return; }
        if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/home" } });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/home" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Google sign-in failed");
    else if (!r.redirected) navigate({ to: "/home" });
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink p-10 text-ink-foreground md:flex">
        <Link to="/"><Logo /></Link>
        <div>
          <h2 className="text-4xl font-extrabold leading-tight">Find your people<br />on campus.</h2>
          <p className="mt-4 max-w-sm opacity-70">Only verified students from your college can see you. Free and ad-free, always.</p>
        </div>
        <span className="font-mono text-xs opacity-50">VERIFIED · PRIVATE · AD-FREE</span>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-rise">
          <Link to="/" className="md:hidden"><Logo /></Link>
          {sent ? (
            <div className="text-center">
              <MailCheck className="mx-auto size-10 text-primary" />
              <h1 className="mt-4 text-2xl font-bold">Check your college inbox</h1>
              <p className="mt-2 text-sm text-muted-foreground">We sent a verification link to <b>{email}</b>. Click it to unlock your campus.</p>
            </div>
          ) : (
            <>
              <h1 className="mt-6 text-3xl font-extrabold md:mt-0">{mode === "signup" ? "Join your campus" : "Welcome back"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "signup" ? "Use your official college email to get verified." : "Sign in with your college email."}
              </p>
              <form onSubmit={submit} className="mt-8 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">College email</Label>
                  <Input id="email" type="email" required placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
                  {mode === "signup" && college !== undefined && (
                    college ? (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-primary"><CheckCircle2 className="size-3.5" /> {college.name}</p>
                    ) : (
                      <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="size-3.5" /> This college isn't on Campus yet.</p>
                    )
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pw">Password</Label>
                  <Input id="pw" type="password" required minLength={mode === "signup" ? 8 : 1} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={busy}>
                  {mode === "signup" ? "Create account" : "Sign in"}
                </Button>
              </form>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
              <Button variant="outline" size="lg" className="w-full" onClick={google}>Continue with Google (college account)</Button>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signup" ? "Already on Campus?" : "New here?"}{" "}
                <button className="font-semibold text-primary" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
                  {mode === "signup" ? "Sign in" : "Join your campus"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
