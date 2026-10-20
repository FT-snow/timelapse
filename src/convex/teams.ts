import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminByToken, requireTeamByToken, audit } from "./lib/auth";
import { hashPassword, makeSalt, randomPassword } from "./lib/hash";

// ---------- Admin queries ----------

// The attendance sheet + credential desk. Every premade login, password
// visible to the desk only.
export const listAdmin = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdminByToken(ctx, args.token);
    const teams = await ctx.db.query("teams").withIndex("by_teamCode").collect();
    return {
      teams: teams.map((t) => ({
        _id: t._id,
        teamCode: t.teamCode,
        teamName: t.teamName,
        passwordPlain: t.passwordPlain ?? "", // admin desk lookup only
        attendance: t.attendance,
        roomNumber: t.roomNumber ?? "",
        createdAt: t.createdAt,
      })),
    };
  },
});

// Team's own live identity (name/ID) - reflects assignment immediately.
export const summary = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const team = await requireTeamByToken(ctx, args.token);
    return {
      teamCode: team.teamCode,
      teamName: team.teamName,
      attendance: team.attendance ?? false,
      roomNumber: team.roomNumber ?? "",
    };
  },
});

// Internal: used right after login to hydrate admin UI quickly.
export const countAdmin = query({
  args: {},
  handler: async (ctx) => {
    return { teams: (await ctx.db.query("teams").collect()).length };
  },
});

// ---------- Premade login generation ----------
// Creates N login pairs (TM-xxx + random password), unassigned. The control
// room hands each pair to a team and renames the row with the team name.

export const createLogins = mutation({
  args: {
    token: v.string(),
    count: v.number(),
    startNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdminByToken(ctx, args.token);
    const count = Math.floor(args.count);
    if (!Number.isInteger(count) || count < 1 || count > 500) {
      return { ok: false as const, error: "Count must be between 1 and 500" };
    }

    const existing = await ctx.db.query("teams").withIndex("by_teamCode").collect();
    let maxNum = 0;
    for (const t of existing) {
      const m = /^TM-(\d+)$/.exec(t.teamCode);
      if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
    }
    let n = Math.max(maxNum + 1, args.startNumber ?? 1);

    const credentials: { teamCode: string; password: string }[] = [];
    for (let i = 0; i < count; i++) {
      const teamCode = `TM-${String(n).padStart(3, "0")}`;
      n++;
      const password = randomPassword();
      const salt = makeSalt();
      await ctx.db.insert("teams", {
        teamName: "",
        teamCode,
        passwordHash: hashPassword(password, salt),
        passwordPlain: password,
        salt,
        createdAt: Date.now(),
      });
      credentials.push({ teamCode, password });
    }

    await audit(ctx, {
      action: "teams.createLogins",
      adminId: admin._id,
      adminLabel: admin.email,
      details: `Generated ${count} premade login(s): ${credentials[0]?.teamCode} .. ${credentials[credentials.length - 1]?.teamCode}`,
    });

    return { ok: true as const, credentials };
  },
});

// Assign / rename a login with the team's name when it is handed out.
export const assignName = mutation({
  args: { token: v.string(), teamCode: v.string(), newName: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdminByToken(ctx, args.token);
    const code = args.teamCode.trim().toUpperCase();
    const team = await ctx.db
      .query("teams")
      .withIndex("by_teamCode", (q) => q.eq("teamCode", code))
      .unique();
    if (!team) return { ok: false as const, error: "Team not found" };
    await ctx.db.patch(team._id, { teamName: args.newName.trim() });
    await audit(ctx, {
      action: "teams.assignName",
      adminId: admin._id,
      adminLabel: admin.email,
      details: args.newName.trim()
        ? `${code} assigned to "${args.newName.trim()}"`
        : `${code} marked unassigned`,
    });
    return { ok: true as const };
  },
});

// ---------- Attendance ----------
export const setAttendance = mutation({
  args: { token: v.string(), teamCode: v.string(), present: v.boolean() },
  handler: async (ctx, args) => {
    const admin = await requireAdminByToken(ctx, args.token);
    const code = args.teamCode.trim().toUpperCase();
    const team = await ctx.db
      .query("teams")
      .withIndex("by_teamCode", (q) => q.eq("teamCode", code))
      .unique();
    if (!team) return { ok: false as const, error: "Team not found" };
    await ctx.db.patch(team._id, { attendance: args.present });
    await audit(ctx, {
      action: "teams.setAttendance",
      adminId: admin._id,
      adminLabel: admin.email,
      details: `${code} marked ${args.present ? "PRESENT" : "ABSENT"}`,
    });
    return { ok: true as const };
  },
});

export const setAttendanceBulk = mutation({
  args: { token: v.string(), present: v.boolean() },
  handler: async (ctx, args) => {
    const admin = await requireAdminByToken(ctx, args.token);
    const teams = await ctx.db.query("teams").withIndex("by_teamCode").collect();
    for (const t of teams) {
      if (t.attendance !== args.present) await ctx.db.patch(t._id, { attendance: args.present });
    }
    await audit(ctx, {
      action: "teams.setAttendanceBulk",
      adminId: admin._id,
      adminLabel: admin.email,
      details: `All ${teams.length} team(s) marked ${args.present ? "PRESENT" : "ABSENT"}`,
    });
    return { ok: true as const, count: teams.length };
  },
});

// ---------- Delete a login row ----------
export const deleteLogin = mutation({
  args: { token: v.string(), teamCode: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdminByToken(ctx, args.token);
    const code = args.teamCode.trim().toUpperCase();
    const team = await ctx.db
      .query("teams")
      .withIndex("by_teamCode", (q) => q.eq("teamCode", code))
      .unique();
    if (!team) return { ok: false as const, error: "Team not found" };
    await ctx.db.delete(team._id);
    const or = await ctx.db
      .query("orders")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .collect();
    for (const o of or) await ctx.db.delete(o._id);
    const ss = await ctx.db
      .query("sessions")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .collect();
    for (const s of ss) await ctx.db.delete(s._id);
    await audit(ctx, {
      action: "teams.deleteLogin",
      adminId: admin._id,
      adminLabel: admin.email,
      details: `Deleted login ${code}${team.teamName ? ` (${team.teamName})` : ""}`,
    });
    return { ok: true as const };
  },
});
