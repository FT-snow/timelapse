import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  teams: defineTable({
    teamName: v.string(), // assigned by the control room when the login is handed out; "" while unassigned
    teamCode: v.string(), // "TM-001"
    passwordHash: v.string(),
    salt: v.string(),
    passwordPlain: v.optional(v.string()), // admin-desk copy; team-facing endpoints never return it
    roomNumber: v.optional(v.string()), // food delivery: room the team is occupying
    attendance: v.optional(v.boolean()), // checked in at the desk
    createdAt: v.number(),
  })
    .index("by_teamCode", ["teamCode"])
    .index("by_teamName", ["teamName"]),

  admins: defineTable({
    email: v.string(), // admin1@timelapse.event
    passwordHash: v.string(),
    salt: v.string(),
    passwordPlain: v.optional(v.string()), // desk copy; shown to admins only
    name: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    tokenHash: v.string(),
    tokenPrefix: v.string(), // first 6 chars for identification
    role: v.string(), // "team" | "admin"
    teamId: v.optional(v.id("teams")),
    adminId: v.optional(v.id("admins")),
    createdAt: v.number(),
    expiresAt: v.number(), // 14 days
  })
    .index("by_tokenHash", ["tokenHash"])
    .index("by_team", ["teamId"])
    .index("by_admin", ["adminId"]),

  // The three competition tracks. No submissions here - teams compete on
  // external platforms; this app only opens the doors and tracks state.
  tracks: defineTable({
    key: v.string(), // "unstop" | "hackerrank" | "craftora"
    order: v.number(), // 1-3
    name: v.string(), // display name
    platform: v.string(), // "UNSTOP" | "HACKERRANK" | "CRAFTORA"
    url: v.string(), // external track link, provided by the control room
    description: v.string(),
    status: v.string(), // locked | live | closed
    updatedAt: v.optional(v.number()),
  })
    .index("by_key", ["key"])
    .index("by_order", ["order"]),

  config: defineTable({
    restaurantName: v.optional(v.string()),
    upiVpa: v.optional(v.string()),
    payLink: v.optional(v.string()),
    foodNote: v.optional(v.string()),
    foodEnabled: v.optional(v.boolean()),
    paymentQrId: v.optional(v.id("_storage")),
    paymentEvidenceDriveUrl: v.optional(v.string()),
  }),

  menu_items: defineTable({
    order: v.number(), // 1..N row order
    name: v.string(),
    price: v.number(), // rupees, integer
    veg: v.boolean(),
    cat: v.optional(v.string()), // e.g. PIZZA | WRAPS | FRIES | SHAKES | DRINKS
  }).index("by_order", ["order"]),

  orders: defineTable({
    teamId: v.id("teams"),
    items: v.array(v.object({ name: v.string(), qty: v.number(), price: v.number() })),
    subtotal: v.number(),
    deliveryCharge: v.number(),
    total: v.number(),
    status: v.string(), // "awaiting_payment" | "confirmed"
    placedAt: v.number(),
    transactionId: v.optional(v.string()),
    paymentScreenshotId: v.optional(v.id("_storage")),
  }).index("by_team", ["teamId"]),

  audit_log: defineTable({
    action: v.string(),
    adminId: v.optional(v.id("admins")),
    adminLabel: v.string(), // email or "system"
    details: v.string(),
    at: v.number(),
  }).index("by_time", ["at"]),
});
