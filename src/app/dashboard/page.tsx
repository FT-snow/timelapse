"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { clearSession, getToken } from "@/lib/session";
import { useMutation } from "convex/react";
import StatusBadge from "@/components/status-badge";
import { FadeIn } from "@/components/fade";
import { ExternalLinkIcon, LockIcon } from "@/components/icons";
import Typewriter from "@/components/typewriter";

export default function DashboardPage() {
  const token = getToken();
  if (!token) return null;
  return <DashboardInner token={token} />;
}

function DashboardInner({ token }: { token: string }) {
  const summary = useQuery(api.teams.summary, { token });
  const tracks = useQuery(api.tracks.listTeam, { token });
  const logout = useMutation(api.auth.logout);
  const router = useRouter();

  async function doLogout() {
    try {
      await logout({ token });
    } catch {
      /* ignore */
    }
    clearSession();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-linesoft sticky top-0 bg-black/90 backdrop-blur z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between font-mono text-[11px] tracking-[0.2em]">
          <Link href="/" className="text-ink hover:text-white transition-colors">
            TIMELAPSE
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-mut hidden sm:inline">{summary ? `${summary.teamCode}${summary.teamName ? ` - ${summary.teamName}` : " - UNASSIGNED"}` : ""}</span>
            <button onClick={doLogout} className="text-mut hover:text-ink transition-colors tracking-[0.15em]">
              SIGN OUT
            </button>
          </div>
        </div>
      </header>

      {!summary || !tracks ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="blink font-mono text-xs tracking-[0.3em] text-mut">OPENING THE TIMELINE...</p>
        </div>
      ) : (
        <>
          <section className="max-w-6xl mx-auto px-6 pt-16 pb-12">
            <FadeIn>
              <p className="font-mono text-[10px] tracking-[0.3em] text-mut">TEAM CONSOLE</p>
              <h1 className="mt-4 font-display text-5xl md:text-7xl tracking-[-0.03em]">
                {summary.teamName || "Unassigned team"}
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 font-mono text-[11px] tracking-[0.2em]">
                <span className="border border-line px-3 py-1.5 text-ink">{summary.teamCode}</span>
                <span className={`border px-3 py-1.5 ${summary.attendance ? "text-sage border-sage/40" : "text-mut border-line"}`}>
                  {summary.attendance ? "CHECKED IN" : "NOT CHECKED IN"}
                </span>
              </div>
              <Typewriter
                text="Three tracks. The control room opens each gate when its clock hits zero."
                className="font-mono text-xs text-mut mt-8 max-w-xl"
                speed={30}
                startDelay={300}
              />
            </FadeIn>
          </section>

          <div className="max-w-6xl mx-auto px-6"><div className="hairline" /></div>

          <section className="max-w-6xl mx-auto px-6 py-14">
            <p className="font-mono text-[10px] tracking-[0.3em] text-mut mb-6">THE THREE TRACKS</p>
            <div className="space-y-px bg-linesoft border border-linesoft">
              {tracks.tracks.map((t) => (
                <div key={t.key} className="bg-black p-7 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="font-mono text-[10px] tracking-[0.3em] text-mut">TRACK {String(t.key === "unstop" ? 1 : t.key === "hackerrank" ? 2 : 3).padStart(2, "0")}</span>
                        <StatusBadge status={t.status} pulse />
                      </div>
                      <h2 className="font-display text-3xl md:text-4xl tracking-tight mt-3">{t.platform}</h2>
                      <p className="font-mono text-xs text-mut leading-[1.9] mt-2 max-w-2xl">
                        {t.description || "The control room has not written a brief for this track yet."}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {t.status === "live" && t.url ? (
                        <a
                          href={t.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-3 bg-ink text-bg font-mono text-xs tracking-[0.2em] px-7 py-4 hover:bg-white transition-colors active:scale-[0.98]"
                        >
                          OPEN TRACK <ExternalLinkIcon />
                        </a>
                      ) : t.status === "closed" ? (
                        <span className="inline-flex items-center gap-3 border border-line text-mut font-mono text-xs tracking-[0.2em] px-7 py-4">
                          <LockIcon size={14} /> CLOSED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-3 border border-line text-mut font-mono text-xs tracking-[0.2em] px-7 py-4">
                          <LockIcon size={14} /> WAITING FOR SIGNAL
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-6 pb-20">
            <FadeIn>
              <Link
                href="/food"
                className="group flex items-center justify-between border border-linesoft px-7 py-8 hover:border-line transition-colors"
              >
                <div>
                  <p className="font-mono text-[10px] tracking-[0.3em] text-mut">FOOD COUNTER</p>
                  <h2 className="font-display text-3xl tracking-tight mt-2">Order for your room.</h2>
                </div>
                <span className="font-mono text-xs tracking-[0.2em] text-mut group-hover:text-ink transition-colors">
                  OPEN MENU →
                </span>
              </Link>
            </FadeIn>
          </section>
        </>
      )}
    </main>
  );
}
