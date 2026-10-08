import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { findCollege, INTERESTS, LOOKING_FOR, RELATIONSHIP } from "@/lib/campus";
import { Chip } from "./bits";

type P = {
  full_name: string; username: string; branch: string | null; year: number | null; bio: string | null;
  interests: string[]; looking_for: string[]; relationship_status: string | null;
  show_relationship: boolean; discoverable: boolean;
};

export function ProfileForm({ initial, mode, onDone }: { initial?: Partial<P>; mode: "create" | "edit"; onDone: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState<P>({
    full_name: "", username: "", branch: "", year: null, bio: "", interests: [], looking_for: [],
    relationship_status: null, show_relationship: false, discoverable: true, ...initial,
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof P>(k: K, v: P[K]) => setF((x) => ({ ...x, [k]: v }));
  const toggle = (k: "interests" | "looking_for", v: string) =>
    set(k, f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const username = f.username.trim().toLowerCase();
    if (!f.full_name.trim() || !/^[a-z0-9_.]{3,20}$/.test(username)) {
      toast.error("Add your name and a username (3–20 letters, numbers, _ or .)");
      return;
    }
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const user = u.user!;
      const college = await findCollege(user.email ?? "");
      if (!college) throw new Error("Your email isn't from a supported college.");
      const row = {
        ...f, username, full_name: f.full_name.trim(), branch: f.branch || null, bio: f.bio || null,
        id: user.id, college_id: college.id, updated_at: new Date().toISOString(),
      };
      const { error } = mode === "create"
        ? await supabase.from("profiles").insert(row)
        : await supabase.from("profiles").update(row).eq("id", user.id);
      if (error) throw new Error(error.code === "23505" ? "That username is taken." : error.message);
      await qc.invalidateQueries();
      toast.success(mode === "create" ? "Welcome to Campus!" : "Profile saved");
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label>Full name</Label><Input value={f.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Username</Label><Input value={f.username} onChange={(e) => set("username", e.target.value)} placeholder="e.g. aarav_k" /></div>
        <div className="space-y-1.5"><Label>Branch</Label><Input value={f.branch ?? ""} onChange={(e) => set("branch", e.target.value)} placeholder="e.g. Computer Science" /></div>
        <div className="space-y-1.5"><Label>Year</Label>
          <div className="flex gap-1.5">{[1, 2, 3, 4, 5].map((y) => <Chip key={y} active={f.year === y} onClick={() => set("year", y)}>{y}</Chip>)}</div>
        </div>
      </div>
      <div className="space-y-1.5"><Label>Bio</Label><Textarea value={f.bio ?? ""} maxLength={240} onChange={(e) => set("bio", e.target.value)} placeholder="What are you into?" /></div>
      <div className="space-y-2"><Label>Interests</Label>
        <div className="flex flex-wrap gap-1.5">{INTERESTS.map((i) => <Chip key={i} active={f.interests.includes(i)} onClick={() => toggle("interests", i)}>{i}</Chip>)}</div>
      </div>
      <div className="space-y-2"><Label>Looking for</Label>
        <div className="flex flex-wrap gap-1.5">{LOOKING_FOR.map((i) => <Chip key={i} active={f.looking_for.includes(i)} onClick={() => toggle("looking_for", i)}>{i}</Chip>)}</div>
      </div>
      <div className="space-y-2"><Label>Relationship status (optional)</Label>
        <div className="flex flex-wrap gap-1.5">{RELATIONSHIP.map((i) => <Chip key={i} active={f.relationship_status === i} onClick={() => set("relationship_status", f.relationship_status === i ? null : i)}>{i}</Chip>)}</div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground"><Switch checked={f.show_relationship} onCheckedChange={(v) => set("show_relationship", v)} /> Show it on my profile</label>
      </div>
      <label className="flex items-center gap-2 text-sm"><Switch checked={f.discoverable} onCheckedChange={(v) => set("discoverable", v)} /> Let classmates find me in Discover</label>
      <Button type="submit" size="lg" disabled={busy}>{busy ? "Saving…" : mode === "create" ? "Join my campus" : "Save changes"}</Button>
    </form>
  );
}
