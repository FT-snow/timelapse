"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearSession, getToken } from "@/lib/session";
import { FadeIn } from "@/components/fade";
import FoodTab from "@/components/food-tab";
import * as XLSX from "xlsx";
import Papa from "papaparse";

type Cred = { teamCode: string; password: string };

type TeamRow = {
  _id: string;
  teamCode: string;
  teamName: string;
  passwordPlain: string;
  attendance: boolean | undefined;
  roomNumber: string;
  createdAt: number;
};

type Tab = "teams" | "tracks" | "food" | "logs";

const TAB_NAMES: Record<Tab, string> = {
  teams: "TEAMS",
  tracks: "TRACKS",
  food: "FOOD",
  logs: "LOGS",
};

// Full server timestamp with millisecond precision: 2026-10-08 17:52:41.123 UTC
function stamp(ms: number): string {
  const iso = new Date(ms).toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 23)} UTC`;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const token = getToken();
  if (!token) return null;
  return <AdminInner token={token} />;
}

function AdminInner({ token }: { token: string }) {
  const [tab, setTab] = useState<Tab>("teams");
  const logout = useMutation(api.auth.logout);
  const router = useRouter();
  const who = useQuery(api.auth.whoamiInternal, token ? { token } : "skip");

  async function doLogout() {
    try {
      await logout({ token });
    } catch {
      /* ignore */
    }
    clearSession();
    router.replace("/admin/login");
  }

  const tabs: Tab[] = ["teams", "tracks", "food", "logs"];

  return (
    <main className="min-h-screen">
      <header className="border-b border-linesoft sticky top-0 bg-black/90 backdrop-blur z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-mono text-[11px] tracking-[0.25em] text-ink hover:text-white transition-colors"
          >
            TIMELAPSE <span className="text-flux">// CONTROL ROOM</span>
          </Link>
          <div className="flex items-center gap-6 font-mono text-[11px]">
            <span className="text-mut">{who?.email ?? ""}</span>
            <button onClick={doLogout} className="text-mut hover:text-ink transition-colors tracking-[0.15em]">
              SIGN OUT
            </button>
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-6 flex gap-8 border-t border-linesoft">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 font-mono text-[10px] tracking-[0.25em] border-b-2 -mb-px transition-colors ${
                tab === t
                  ? "text-ink border-ink"
                  : "text-mut border-transparent hover:text-ink"
              }`}
            >
              {TAB_NAMES[t]}
            </button>
          ))}
        </nav>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {tab === "teams" && <TeamsTab token={token} />}
        {tab === "tracks" && <TracksTab token={token} />}
        {tab === "food" && <FoodTab token={token} />}
        {tab === "logs" && <LogsTab token={token} />}
      </div>
    </main>
  );
}

/* ============================ TEAMS TAB ============================ */

function TeamsTab({ token }: { token: string }) {
  const teamsData = useQuery(api.teams.listAdmin, { token });
  const createLogins = useMutation(api.teams.createLogins);
  const assignName = useMutation(api.teams.assignName);
  const deleteLogin = useMutation(api.teams.deleteLogin);
  const resetPw = useMutation(api.auth.resetPassword);
  const setAttendanceMutation = useMutation(api.teams.setAttendance);
  const setAttendanceBulkMutation = useMutation(api.teams.setAttendanceBulk);

  const [count, setCount] = useState("20");
  const [creds, setCreds] = useState<Cred[] | null>(null);
  const [opsError, setOpsError] = useState("");
  const [opsMsg, setOpsMsg] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sheetQuery, setSheetQuery] = useState("");
  const [nameDraft, setNameDraft] = useState<Record<string, string>>({});

  const teams = useMemo(() => teamsData?.teams ?? [], [teamsData]);
  const presentCount = teams.filter((t) => t.attendance).length;

  async function doGenerate() {
    const n = parseInt(count, 10);
    if (!Number.isInteger(n) || n < 1 || n > 500) {
      setOpsError("Enter a count between 1 and 500");
      return;
    }
    if (!confirm(`Create ${n} premade team login(s)? Each gets a TM-xxx ID and a random password.`)) return;
    setGenerating(true);
    setOpsError("");
    setOpsMsg("");
    try {
      const res = await createLogins({ token, count: n });
      if (res.ok) {
        setCreds(res.credentials);
        setOpsMsg(`${res.credentials.length} login(s) created. Copy them now - hand one pair to each team.`);
      } else {
        setOpsError(res.error);
      }
    } catch (err) {
      setOpsError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  const filtered = teams.filter((t) => {
    if (!sheetQuery.trim()) return true;
    const q = sheetQuery.trim().toLowerCase();
    return t.teamCode.toLowerCase().includes(q) || t.teamName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* login generator */}
      <FadeIn>
        <section className="border border-linesoft p-7">
          <h2 className="font-display text-3xl tracking-tight mb-2">Premade team logins</h2>
          <p className="font-mono text-xs text-mut leading-relaxed max-w-2xl">
            Generate login pairs in bulk. Hand one ID + password to each team at the desk, then use
            ASSIGN to label the row with the team&apos;s name.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <input
              value={count}
              onChange={(e) => setCount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="20"
              className="field font-mono text-xs px-4 py-2.5 w-28"
              spellCheck={false}
            />
            <button
              onClick={doGenerate}
              disabled={generating}
              className="bg-ink text-bg font-mono text-[10px] tracking-[0.2em] px-6 py-2.5 hover:bg-white transition-colors disabled:opacity-40"
            >
              {generating ? "GENERATING..." : "GENERATE LOGINS"}
            </button>
            {teams.length > 0 && (
              <span className="font-mono text-[10px] tracking-[0.2em] text-mut">
                {teams.length} LOGIN(S) TOTAL - {presentCount} PRESENT
              </span>
            )}
          </div>
          {opsError && <p className="mt-4 font-mono text-xs text-flux">{opsError}</p>}
          {opsMsg && <p className="mt-4 font-mono text-xs text-sage">{opsMsg}</p>}

          {creds && (
            <div className="mt-6 border border-flux/40 bg-flux/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[10px] tracking-[0.25em] text-flux">
                  NEW LOGIN PAIRS - {creds.length}
                </p>
                <button
                  onClick={() => {
                    downloadCsv(
                      "timelapse-team-logins.csv",
                      [["Team ID", "Password"], ...creds.map((c) => [c.teamCode, c.password])]
                    );
                  }}
                  className="border border-line px-3 py-2 font-mono text-[10px] text-mut hover:text-ink"
                >
                  EXPORT CSV
                </button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 font-mono text-xs">
                {creds.map((c) => (
                  <div key={c.teamCode} className="flex justify-between border border-linesoft px-3 py-2 bg-black">
                    <span className="text-ink">{c.teamCode}</span>
                    <span className="text-amber">{c.password}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </FadeIn>

      {/* attendance sheet */}
      <FadeIn>
        <section className="border border-linesoft p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <h2 className="font-display text-3xl tracking-tight">Attendance sheet</h2>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] tracking-[0.2em] text-mut">
              <input
                value={sheetQuery}
                onChange={(e) => setSheetQuery(e.target.value)}
                placeholder="SEARCH ID OR NAME"
                className="field font-mono text-[11px] px-4 py-2.5 w-56"
                spellCheck={false}
              />
              <button
                onClick={async () => {
                  if (!confirm("Mark EVERY team PRESENT?")) return;
                  await setAttendanceBulkMutation({ token, present: true });
                }}
                className="border border-sage/40 text-sage px-4 py-2.5 hover:bg-sage/10 transition-colors"
              >
                ALL PRESENT
              </button>
              <button
                onClick={async () => {
                  if (!confirm("Mark EVERY team ABSENT?")) return;
                  await setAttendanceBulkMutation({ token, present: false });
                }}
                className="border border-line text-mut px-4 py-2.5 hover:text-ink transition-colors"
              >
                CLEAR ALL
              </button>
              <button
                onClick={() => {
                  const rowsOut: (string | number)[][] = [
                    ["Team ID", "Team Name", "Password", "Attendance", "Room", "Created At"],
                    ...teams.map((t) => [
                      t.teamCode,
                      t.teamName,
                      t.passwordPlain,
                      t.attendance ? "PRESENT" : "ABSENT",
                      t.roomNumber,
                      new Date(t.createdAt).toISOString(),
                    ]),
                  ];
                  downloadCsv("timelapse-attendance.csv", rowsOut);
                }}
                className="border border-line text-mut hover:text-ink px-4 py-2.5 transition-colors"
              >
                EXPORT CSV
              </button>
            </div>
          </div>

          {teams.length === 0 ? (
            <p className="font-mono text-xs text-mut">No logins yet. Generate the first batch above.</p>
          ) : (
            <div className="overflow-x-auto border border-linesoft max-h-[560px] overflow-y-auto">
              <table className="w-full font-mono text-xs">
                <thead className="sticky top-0 bg-[#0d0d0d] text-left text-mut">
                  <tr>
                    <th className="px-4 py-2.5 font-normal">TEAM ID</th>
                    <th className="px-4 py-2.5 font-normal">PASSWORD</th>
                    <th className="px-4 py-2.5 font-normal">ASSIGNED TO</th>
                    <th className="px-4 py-2.5 font-normal">ROOM</th>
                    <th className="px-4 py-2.5 font-normal">ATTENDANCE</th>
                    <th className="px-4 py-2.5 font-normal text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t._id} className="border-t border-linesoft align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-flux">{t.teamCode}</td>
                      <td className="px-4 py-3 text-amber whitespace-nowrap">{t.passwordPlain || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            value={nameDraft[t.teamCode] ?? t.teamName}
                            onChange={(e) => setNameDraft((p) => ({ ...p, [t.teamCode]: e.target.value }))}
                            placeholder="UNASSIGNED"
                            className="field font-mono text-[11px] px-3 py-1.5 w-48"
                          />
                          {(nameDraft[t.teamCode] ?? t.teamName) !== t.teamName && (
                            <button
                              onClick={async () => {
                                const res = await assignName({ token, teamCode: t.teamCode, newName: nameDraft[t.teamCode] ?? "" });
                                if (res.ok) setNameDraft((p) => { const n = { ...p }; delete n[t.teamCode]; return n; });
                                else setOpsError(res.error);
                              }}
                              className="border border-line px-3 py-1.5 text-[10px] text-mut hover:bg-ink hover:text-bg"
                            >
                              SAVE
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-mut whitespace-nowrap">{t.roomNumber || "-"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={async () => {
                            await setAttendanceMutation({ token, teamCode: t.teamCode, present: !t.attendance });
                          }}
                          className={`border px-3 py-1.5 text-[10px] tracking-[0.15em] transition-colors ${
                            t.attendance
                              ? "border-sage/50 text-sage hover:bg-sage/10"
                              : "border-line text-mut hover:text-ink"
                          }`}
                        >
                          {t.attendance ? "PRESENT" : "ABSENT"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={async () => {
                            if (!confirm(`Reset the password for ${t.teamCode}? The old password stops working immediately.`)) return;
                            const res = await resetPw({ token, teamCode: t.teamCode });
                            if (res.ok) setOpsMsg(`New password for ${t.teamCode}: ${res.password}`);
                            else setOpsError(res.error);
                          }}
                          className="text-mut hover:text-ink text-[10px] tracking-[0.15em] mr-4"
                        >
                          RESET PW
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete login ${t.teamCode}? This cannot be undone.`)) return;
                            const res = await deleteLogin({ token, teamCode: t.teamCode });
                            if (!res.ok) setOpsError(res.error);
                          }}
                          className="text-flux/70 hover:text-flux text-[10px] tracking-[0.15em]"
                        >
                          DELETE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </FadeIn>
    </div>
  );
}

/* ============================ TRACKS TAB ============================ */

type TrackRow = {
  key: string;
  order: number;
  name: string;
  platform: string;
  url: string;
  description: string;
  status: string;
};

function TracksTab({ token }: { token: string }) {
  const tracksData = useQuery(api.tracks.listAdmin, { token });
  const setTrack = useMutation(api.tracks.setTrack);
  const setAllStatus = useMutation(api.tracks.setAllStatus);

  const [drafts, setDrafts] = useState<Record<string, { name: string; platform: string; url: string; description: string; status: string }>>({});
  const [msg, setMsg] = useState("");

  const tracks: TrackRow[] = useMemo(() => tracksData?.tracks ?? [], [tracksData]);

  function draftFor(t: TrackRow) {
    return (
      drafts[t.key] ?? {
        name: t.name,
        platform: t.platform,
        url: t.url,
        description: t.description,
        status: t.status,
      }
    );
  }

  if (!tracksData) {
    return <p className="font-mono text-xs text-mut blink tracking-[0.25em]">LOADING TRACKS...</p>;
  }

  return (
    <div className="space-y-6">
      {msg && <p className={`font-mono text-xs ${msg.includes("saved") ? "text-sage" : "text-flux"}`}>{msg}</p>}

      {/* bulk door control */}
      <FadeIn>
        <section className="border border-linesoft p-7">
          <h2 className="font-display text-3xl tracking-tight mb-2">Gate control</h2>
          <p className="font-mono text-xs text-mut leading-relaxed max-w-2xl mb-5">
            Open or close every track at once. A live track reveals its link to logged-in teams on
            their console. Locked tracks hide the link entirely.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={async () => {
                if (!confirm("Open ALL tracks? Every logged-in team will see the links.")) return;
                const res = await setAllStatus({ token, status: "live" });
                if (res.ok) setMsg("All tracks opened.");
                else setMsg(res.error);
              }}
              className="border border-flux/50 text-flux font-mono text-[10px] tracking-[0.2em] px-6 py-2.5 hover:bg-flux/10 transition-colors"
            >
              OPEN ALL TRACKS
            </button>
            <button
              onClick={async () => {
                if (!confirm("Close ALL tracks? Links stay visible but gates read closed.")) return;
                const res = await setAllStatus({ token, status: "closed" });
                if (res.ok) setMsg("All tracks closed.");
                else setMsg(res.error);
              }}
              className="border border-line text-mut font-mono text-[10px] tracking-[0.2em] px-6 py-2.5 hover:text-ink transition-colors"
            >
              CLOSE ALL TRACKS
            </button>
            <button
              onClick={async () => {
                if (!confirm("Lock ALL tracks? Links become hidden until you open them again.")) return;
                const res = await setAllStatus({ token, status: "locked" });
                if (res.ok) setMsg("All tracks locked.");
                else setMsg(res.error);
              }}
              className="border border-line text-mut font-mono text-[10px] tracking-[0.2em] px-6 py-2.5 hover:text-ink transition-colors"
            >
              LOCK ALL TRACKS
            </button>
          </div>
        </section>
      </FadeIn>

      {/* per-track editors */}
      {tracks.map((t) => {
        const d = draftFor(t);
        return (
          <FadeIn key={t.key}>
            <section className="border border-linesoft p-7">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-3xl tracking-tight">{t.platform || t.key.toUpperCase()}</h2>
                <span
                  className={`font-mono text-[10px] tracking-[0.2em] border px-2.5 py-1 ${
                    t.status === "live"
                      ? "text-flux border-flux/50"
                      : t.status === "closed"
                        ? "text-mut border-line"
                        : "text-mut border-line"
                  }`}
                >
                  {t.status.toUpperCase()}
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  value={d.name}
                  onChange={(e) => setDrafts((p) => ({ ...p, [t.key]: { ...d, name: e.target.value } }))}
                  placeholder="TRACK NAME (E.G. TRACK ONE)"
                  className="field font-mono text-[11px] px-4 py-2.5"
                />
                <input
                  value={d.platform}
                  onChange={(e) => setDrafts((p) => ({ ...p, [t.key]: { ...d, platform: e.target.value } }))}
                  placeholder="PLATFORM (E.G. UNSTOP)"
                  className="field font-mono text-[11px] px-4 py-2.5"
                  spellCheck={false}
                />
                <input
                  value={d.url}
                  onChange={(e) => setDrafts((p) => ({ ...p, [t.key]: { ...d, url: e.target.value } }))}
                  placeholder="TRACK LINK (HTTPS://...)"
                  className="field font-mono text-[11px] px-4 py-2.5 md:col-span-2"
                  spellCheck={false}
                />
                <textarea
                  value={d.description}
                  onChange={(e) => setDrafts((p) => ({ ...p, [t.key]: { ...d, description: e.target.value } }))}
                  placeholder="SHORT BRIEF SHOWN ON THE TEAM CONSOLE"
                  rows={2}
                  className="field font-mono text-[11px] px-4 py-2.5 md:col-span-2"
                />
                <div className="flex items-center gap-2">
                  {(["locked", "live", "closed"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setDrafts((p) => ({ ...p, [t.key]: { ...d, status: s } }))}
                      className={`border px-4 py-2 font-mono text-[10px] tracking-[0.15em] transition-colors ${
                        d.status === s
                          ? s === "live"
                            ? "border-flux/60 text-flux bg-flux/10"
                            : "border-ink text-ink bg-ink/10"
                          : "border-line text-mut hover:text-ink"
                      }`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={async () => {
                      setMsg("");
                      const res = await setTrack({ token, key: t.key, ...d });
                      if (res.ok) setMsg(`${t.key.toUpperCase()} saved.`);
                      else setMsg(res.error);
                    }}
                    className="border border-line font-mono text-[10px] tracking-[0.2em] px-8 py-2.5 hover:bg-ink hover:text-bg transition-colors"
                  >
                    SAVE TRACK
                  </button>
                </div>
              </div>
            </section>
          </FadeIn>
        );
      })}
    </div>
  );
}

/* ============================ LOGS TAB ============================ */

function LogsTab({ token }: { token: string }) {
  const logs = useQuery(api.logs.listAdmin, { token });
  if (!logs) {
    return <p className="font-mono text-xs text-mut blink tracking-[0.25em]">LOADING LOGS...</p>;
  }
  return (
    <FadeIn>
      <section className="border border-linesoft p-7">
        <h2 className="font-display text-3xl tracking-tight mb-5">Audit log</h2>
        {logs.entries.length === 0 ? (
          <p className="font-mono text-xs text-mut">Nothing logged yet.</p>
        ) : (
          <div className="space-y-0 max-w-4xl">
            {logs.entries.map((e) => (
              <div key={e._id} className="border-t border-linesoft last:border-b py-3 flex flex-col sm:flex-row gap-1 sm:gap-6 px-1">
                <span className="font-mono text-[10px] text-mut w-56 shrink-0 pt-0.5 whitespace-nowrap">{stamp(e.at)}</span>
                <span className="font-mono text-[10px] tracking-[0.15em] text-flux w-56 shrink-0 pt-0.5">{e.action}</span>
                <span className="font-mono text-xs text-mut leading-relaxed">{e.details}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </FadeIn>
  );
}
