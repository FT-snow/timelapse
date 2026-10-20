# Timelapse

A Pan India reverse engineering hackathon. Three tracks - Unstop, HackerRank,
Craftora - opened by the control room. No submissions on this site: teams
compete directly on the platforms. This app holds team credentials, the
attendance sheet, and the food counter.

Stack: Next.js 15 + Convex + Tailwind v4 + Bun.

## Setup

```bash
bun install
bunx convex codegen        # generate convex/_generated
bunx convex push           # push functions to https://lovable-dinosaur-577.convex.cloud
bun scripts/seed.ts        # wipe + seed: 2 admins, 3 tracks (locked)
bun dev                    # run on http://localhost:3000
```

## Routes

- `/` - landing
- `/login` - team login (premade TM-xxx ID + password issued by the control room)
- `/dashboard` - team console: the three track gates (live tracks reveal links) + food counter
- `/food` - food ordering (menu open/closed by admin, UPI/QR payment, room delivery)
- `/admin/login` - control room login (admin ID + password)
- `/admin` - tabs: TEAMS (premade logins + attendance sheet), TRACKS (gate control + links), FOOD (menu + order monitor), LOGS (audit)

## Bootstrap

`bun scripts/seed.ts [admin1pw] [admin2pw]` prints the two admin accounts.
Generate team logins in bulk from the TEAMS tab, hand one pair per team, and
ASSIGN the row with the team name.
