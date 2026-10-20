import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { hashPassword, makeSalt } from "./lib/hash";

// wipe everything then reseed fresh state.
// SAFE: only run during setup at event admin request (scripts/seed.ts).
export const wipeAndSeed = mutation({
  args: {
    admin1Password: v.string(),
    admin2Password: v.string(),
    unstopUrl: v.optional(v.string()),
    hackerrankUrl: v.optional(v.string()),
    craftoraUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Wipe all tables
    const tables = [
      "teams", "admins", "sessions", "tracks",
      "config", "menu_items", "orders", "audit_log",
    ] as const;
    for (const t of tables) {
      const rows = await ctx.db.query(t as "teams").collect();
      for (const r of rows) await ctx.db.delete(r._id);
    }

    // 2. Create two admins
    const adminsToCreate = [
      { email: "admin1@timelapse.event", name: "Admin One", password: args.admin1Password },
      { email: "admin2@timelapse.event", name: "Admin Two", password: args.admin2Password },
    ];
    for (const a of adminsToCreate) {
      if (a.password.length < 8) {
        return { ok: false as const, error: `Admin ${a.email} password must be >= 8 chars` };
      }
      const salt = makeSalt();
      await ctx.db.insert("admins", {
        email: a.email,
        name: a.name,
        passwordHash: hashPassword(a.password, salt),
        salt,
        createdAt: Date.now(),
      });
    }

    // 3. Seed the three tracks (locked, links set now or later from the desk)
    const trackSeed = [
      {
        key: "unstop",
        order: 1,
        name: "Track One",
        platform: "UNSTOP",
        url: args.unstopUrl?.trim() ?? "",
        description: "Reverse engineering challenge hosted on Unstop. Open the link, log into your Unstop account, and compete there.",
      },
      {
        key: "hackerrank",
        order: 2,
        name: "Track Two",
        platform: "HACKERRANK",
        url: args.hackerrankUrl?.trim() ?? "",
        description: "Reverse engineering challenge hosted on HackerRank. Open the link, log into your HackerRank account, and compete there.",
      },
      {
        key: "craftora",
        order: 3,
        name: "Track Three",
        platform: "CRAFTORA",
        url: args.craftoraUrl?.trim() ?? "",
        description: "Reverse engineering challenge hosted on Craftora. Open the link, log into your Craftora account, and compete there.",
      },
    ];
    for (const t of trackSeed) {
      await ctx.db.insert("tracks", { ...t, status: "locked", updatedAt: Date.now() });
    }

    // 4. Audit
    await ctx.db.insert("audit_log", {
      action: "seed.wipeAndSeed",
      adminLabel: "system",
      details: "Wiped database and seeded fresh: 2 admins, 3 tracks (locked)",
      at: Date.now(),
    });

    return {
      ok: true as const,
      admins: adminsToCreate.map((a) => ({ email: a.email, password: a.password })),
      tracks: trackSeed.map((t) => ({ key: t.key, url: t.url })),
    };
  },
});
