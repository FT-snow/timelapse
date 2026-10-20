// Bootstrap script: wipes the Timelapse deployment and seeds fresh state.
// Usage:
//   bun scripts/seed.ts                          -> random admin passwords (printed)
//   bun scripts/seed.ts <admin1pw> <admin2pw>    -> chosen admin passwords (>= 8 chars)
//
// Pointed at the cloud deployment via NEXT_PUBLIC_CONVEX_URL (.env.local).

import { ConvexHttpClient } from "convex/browser";
import { api } from "../src/convex/_generated/api";

function randomPassword(len = 12): string {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz#";
  const rnd = new Uint8Array(len);
  crypto.getRandomValues(rnd);
  let out = "";
  for (let i = 0; i < len; i++) out += alpha[rnd[i] % alpha.length];
  return out;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || "https://lovable-dinosaur-577.convex.cloud";
  const [p1, p2] = process.argv.slice(2);
  const admin1Password = p1 || randomPassword();
  const admin2Password = p2 || randomPassword();

  if (admin1Password.length < 8 || admin2Password.length < 8) {
    console.error("Admin passwords must be at least 8 characters.");
    process.exit(1);
  }

  const client = new ConvexHttpClient(url);
  try {
    const res = await client.mutation(api.seed.wipeAndSeed, {
      admin1Password,
      admin2Password,
    });
    if (!res.ok) {
      console.error("Seed failed:", res.error);
      process.exit(1);
    }
    console.log("Seeded fresh Timelapse state.");
    console.log("  3 tracks created: UNSTOP / HACKERRANK / CRAFTORA (all LOCKED)");
    console.log("");
    console.log("ADMIN ACCOUNTS (control room login at /admin/login):");
    for (const a of res.admins) {
      console.log(`  ${a.email}  /  ${a.password}`);
    }
    console.log("");
    console.log("Store these now - passwords are hashed server-side.");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

main();
