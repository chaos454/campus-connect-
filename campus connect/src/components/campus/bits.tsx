import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { initials, yearLabel, type Student } from "@/lib/campus";
import { ConnectButton } from "./connect-button";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-extrabold tracking-tight", className)}>
      <span className="grid size-7 place-items-center rounded-lg bg-primary text-[13px] text-primary-foreground">C</span>
      CAMPUS
    </span>
  );
}

const TINTS = ["bg-accent text-accent-foreground", "bg-secondary text-secondary-foreground", "bg-ink text-ink-foreground", "bg-primary text-primary-foreground"];

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const tint = TINTS[name.length % TINTS.length];
  const s = size === "lg" ? "size-20 text-2xl" : size === "sm" ? "size-9 text-xs" : "size-12 text-sm";
  return <span className={cn("grid shrink-0 place-items-center rounded-full font-bold", tint, s)}>{initials(name)}</span>;
}

export function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  const cls = cn(
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground",
    onClick && !active && "hover:border-primary/50",
  );
  return onClick ? <button type="button" onClick={onClick} className={cls}>{children}</button> : <span className={cls}>{children}</span>;
}

export function StudentCard({ s }: { s: Student }) {
  return (
    <div className="group flex flex-col rounded-2xl bg-card p-5 shadow-card transition-transform hover:-translate-y-0.5">
      <Link to="/u/$username" params={{ username: s.username }} className="flex items-center gap-3">
        <Avatar name={s.full_name} />
        <div className="min-w-0">
          <div className="truncate font-semibold">{s.full_name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {[s.branch, yearLabel(s.year)].filter(Boolean).join(" · ")}
          </div>
        </div>
      </Link>
      {s.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{s.bio}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {s.interests.slice(0, 3).map((i) => <Chip key={i}>{i}</Chip>)}
      </div>
      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="font-mono text-[11px] text-muted-foreground">
          {s.shared ? `${s.shared} shared interest${s.shared > 1 ? "s" : ""}` : s.looking_for[0] ?? ""}
        </span>
        <ConnectButton s={s} />
      </div>
    </div>
  );
}
