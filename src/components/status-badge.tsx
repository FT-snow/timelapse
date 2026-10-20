// Track status pill + team attendance chip. No emoji, tiny mono uppercase text.

const STYLES: Record<string, string> = {
  locked: "text-mut border-line",
  live: "text-flux border-flux/50",
  closed: "text-mut border-line",
};

export function trackLabel(status: string): string {
  switch (status) {
    case "locked":
      return "LOCKED";
    case "live":
      return "LIVE";
    case "closed":
      return "CLOSED";
    default:
      return status.toUpperCase();
  }
}

export default function StatusBadge({
  status,
  pulse = false,
}: {
  status: string;
  pulse?: boolean;
}) {
  const cls = STYLES[status] ?? STYLES.locked;
  return (
    <span
      className={`inline-flex items-center gap-2 border px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] ${cls}`}
    >
      {status === "live" && (
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full bg-flux ${pulse ? "dot-live" : ""}`}
        />
      )}
      {trackLabel(status)}
    </span>
  );
}
