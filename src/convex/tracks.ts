import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminByToken, requireTeamByToken, audit } from "./lib/auth";

const VALID_KEYS = ["unstop", "hackerrank", "craftora"];
const VALID_STATUSES = ["locked", "live", "closed"];

// ---------- Admin ----------

export const listAdmin = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdminByToken(ctx, args.token);
    const tracks = await ctx.db.query("tracks").withIndex("by_order").collect();
    return { tracks: tracks.sort((a, b) => a.order - b.order) };
  },
});

// Upsert a track: name, platform, url, description, status.
export const setTrack = mutation({
  args: {
    token: v.string(),
    key: v.string(),
    name: v.string(),
    platform: v.string(),
    url: v.string(),
    description: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdminByToken(ctx, args.token);
    const key = args.key.trim().toLowerCase();
    if (!VALID_KEYS.includes(key)) {
      return { ok: false as const, error: `Unknown track key: ${key}` };
    }
    const status = args.status.trim().toLowerCase();
    if (!VALID_STATUSES.includes(status)) {
      return { ok: false as const, error: "Status must be locked, live, or closed" };
    }
    const name = args.name.trim();
    if (!name) return { ok: false as const, error: "Track name is required" };
    const url = args.url.trim();
    if (url && !/^https:\/\//.test(url)) {
      return { ok: false as const, error: "Track link must start with https://" };
    }
    const existing = await ctx.db
      .query("tracks")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    const order = VALID_KEYS.indexOf(key) + 1;
    const row = {
      key,
      order,
      name,
      platform: args.platform.trim().toUpperCase() || key.toUpperCase(),
      url,
      description: args.description.trim(),
      status,
      updatedAt: Date.now(),
    };
    if (existing) await ctx.db.patch(existing._id, row);
    else await ctx.db.insert("tracks", row);

    await audit(ctx, {
      action: "tracks.setTrack",
      adminId: admin._id,
      adminLabel: admin.email,
      details: `${row.platform}: ${status.toUpperCase()}${url ? ` - ${url}` : " - no link"}`,
    });
    return { ok: true as const };
  },
});

// Bulk status: open/close every track at once (the "doors" control).
export const setAllStatus = mutation({
  args: { token: v.string(), status: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdminByToken(ctx, args.token);
    const status = args.status.trim().toLowerCase();
    if (!VALID_STATUSES.includes(status)) {
      return { ok: false as const, error: "Status must be locked, live, or closed" };
    }
    const tracks = await ctx.db.query("tracks").withIndex("by_order").collect();
    for (const t of tracks) {
      if (t.status !== status) {
        await ctx.db.patch(t._id, { status, updatedAt: Date.now() });
      }
    }
    await audit(ctx, {
      action: "tracks.setAllStatus",
      adminId: admin._id,
      adminLabel: admin.email,
      details: `All ${tracks.length} track(s) set to ${status.toUpperCase()}`,
    });
    return { ok: true as const, count: tracks.length };
  },
});

// ---------- Team ----------
// The link is only revealed while the track is LIVE. Locked tracks return
// no url; closed tracks return the url but no live state.

export const listTeam = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const team = await requireTeamByToken(ctx, args.token);
    const tracks = await ctx.db.query("tracks").withIndex("by_order").collect();
    return {
      tracks: tracks.sort((a, b) => a.order - b.order).map((t) => ({
        key: t.key,
        name: t.name,
        platform: t.platform,
        description: t.description,
        status: t.status,
        url: t.status === "locked" ? "" : t.url,
      })),
    };
  },
});
