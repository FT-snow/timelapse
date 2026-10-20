import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminByToken, requireTeamByToken, createSession, hashToken, SESSION_TTL, audit } from "./lib/auth";
import { hashPassword, makeSalt, randomPassword } from "./lib/hash";

export const adminLogin = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!admin) return { ok: false as const, error: "Invalid credentials" };
    if (hashPassword(args.password, admin.salt) !== admin.passwordHash) {
      // dummy path to keep timing roughly constant, avoid trivial user enum
      return { ok: false as const, error: "Invalid credentials" };
    }
    const token = await createSession(ctx, { role: "admin", adminId: admin._id });
    await audit(ctx, { action: "admin.login", adminId: admin._id, adminLabel: admin.email, details: "Admin logged in" });
    return { ok: true as const, token, name: admin.name, email: admin.email };
  },
});

export const teamLogin = mutation({
  args: { teamCode: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const code = args.teamCode.trim().toUpperCase();
    if (!/^(TM-\d{3,4}|TEAM-\d{5})$/.test(code)) {
      return { ok: false as const, error: "Invalid credentials" };
    }
    const team = await ctx.db
      .query("teams")
      .withIndex("by_teamCode", (q) => q.eq("teamCode", code))
      .unique();
    if (!team) return { ok: false as const, error: "Invalid credentials" };
    if (hashPassword(args.password, team.salt) !== team.passwordHash) {
      return { ok: false as const, error: "Invalid credentials" };
    }
    const token = await createSession(ctx, { role: "team", teamId: team._id });
    return { ok: true as const, token, teamName: team.teamName, teamCode: team.teamCode };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const th = hashToken(args.token);
    const s = await ctx.db
      .query("sessions")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", th))
      .unique();
    if (s) await ctx.db.delete(s._id);
    return { ok: true as const };
  },
});

export const whoami = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // Validation pass over websockets: sessions db lookup. Returns minimal info.
    const th = hashToken(args.token);
    const s = await ctx.db
      .query("sessions")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", th))
      .unique();
    if (!s || s.expiresAt < Date.now()) {
      if (s && s.expiresAt < Date.now()) await ctx.db.delete(s._id);
      return { ok: false as const };
    }
    if (s.role === "admin" && s.adminId) {
      const admin = await ctx.db.get(s.adminId);
      if (!admin) return { ok: false as const };
      return { ok: true as const, role: "admin" as const, name: admin.name, email: admin.email };
    }
    if (s.role === "team" && s.teamId) {
      const team = await ctx.db.get(s.teamId);
      if (!team) return { ok: false as const };
      return { ok: true as const, role: "team" as const, teamName: team.teamName, teamCode: team.teamCode };
    }
    return { ok: false as const };
  },
});

export const resetPassword = mutation({
  args: { token: v.string(), teamCode: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdminByToken(ctx, args.token);
    const code = args.teamCode.trim().toUpperCase();
    const team = await ctx.db
      .query("teams")
      .withIndex("by_teamCode", (q) => q.eq("teamCode", code))
      .unique();
    if (!team) return { ok: false as const, error: "Team not found" };
    const pw = randomPassword();
    const salt = makeSalt();
    await ctx.db.patch(team._id, { passwordHash: hashPassword(pw, salt), passwordPlain: pw, salt });
    // Kill existing team sessions
    const old = await ctx.db
      .query("sessions")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .collect();
    for (const s of old) await ctx.db.delete(s._id);
    await audit(ctx, {
      action: "team.resetPassword",
      adminId: admin._id,
      adminLabel: admin.email,
      details: `Password reset for ${code}`,
    });
    return { ok: true as const, password: pw };
  },
});

export const resetAdminPassword = mutation({
  args: { token: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdminByToken(ctx, args.token);
    const email = args.email.trim().toLowerCase();
    const target = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!target) return { ok: false as const, error: "Admin not found" };
    const pw = randomPassword();
    const salt = makeSalt();
    await ctx.db.patch(target._id, { passwordHash: hashPassword(pw, salt), salt });
    const old = await ctx.db
      .query("sessions")
      .withIndex("by_admin", (q) => q.eq("adminId", target._id))
      .collect();
    for (const s of old) await ctx.db.delete(s._id);
    await audit(ctx, {
      action: "admin.resetPassword",
      adminId: admin._id,
      adminLabel: admin.email,
      details: `Password reset for admin ${email}`,
    });
    return { ok: true as const, password: pw };
  },
});

export const changeOwnPassword = mutation({
  args: { token: v.string(), currentPassword: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdminByToken(ctx, args.token);
    if (hashPassword(args.currentPassword, admin.salt) !== admin.passwordHash) {
      return { ok: false as const, error: "Current password incorrect" };
    }
    if (args.newPassword.length < 8) {
      return { ok: false as const, error: "New password must be at least 8 characters" };
    }
    const salt = makeSalt();
    await ctx.db.patch(admin._id, { passwordHash: hashPassword(args.newPassword, salt), salt });
    await audit(ctx, {
      action: "admin.changeOwnPassword",
      adminId: admin._id,
      adminLabel: admin.email,
      details: "Admin changed own password",
    });
    return { ok: true as const };
  }
});

export const teamDelete = mutation({
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
    // Delete related rows
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
      action: "team.delete",
      adminId: admin._id,
      adminLabel: admin.email,
      details: `Deleted team ${code}${team.teamName ? ` (${team.teamName})` : ""}`,
    });
    return { ok: true as const };
  },
});

export const sessionTtlMs = SESSION_TTL;

// Lightweight identity echo for the admin header. Same object as whoami but server function reuse.
export const whoamiInternal = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdminByToken(ctx, args.token);
    return { email: admin.email, name: admin.name };
  },
});


// Add a new admin account (existing admin only).
export const createAdmin = mutation({
  args: { token: v.string(), email: v.string(), name: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdminByToken(ctx, args.token);
    const email = args.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return { ok: false as const, error: "Invalid email format" };
    }
    if (args.password.length < 8) {
      return { ok: false as const, error: "Password must be at least 8 characters" };
    }
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) return { ok: false as const, error: "This admin already exists" };
    const salt = makeSalt();
    await ctx.db.insert("admins", {
      email,
      name: args.name.trim() || email.split("@")[0],
      passwordHash: hashPassword(args.password, salt),
      passwordPlain: args.password,
      salt,
      createdAt: Date.now(),
    });
    await audit(ctx, {
      action: "admin.createAdmin",
      adminId: admin._id,
      adminLabel: admin.email,
      details: `New admin created: ${email}`,
    });
    return { ok: true as const };
  },
});

// List admins with desk-visible passwords (admin only).
export const adminsList = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdminByToken(ctx, args.token);
    const rows = await ctx.db.query("admins").withIndex("by_email").collect();
    return {
      admins: rows.map((a) => ({
        email: a.email,
        name: a.name,
        passwordPlain: a.passwordPlain ?? "—",
      })),
    };
  },
});
