"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Typewriter from "@/components/typewriter";
import GsapScroller from "@/components/gsap-scroller";
import { FadeIn } from "@/components/fade";
import { InkOrbitSculpture } from "@/components/ui/ink-orbit-hero";

const TRACKS = [
  {
    id: "TRACK ONE",
    name: "UNSTOP",
    body: "The first gate opens on Unstop. Reverse the binary, break the pattern, submit on the platform. Your login opens the door - the clock does the rest.",
  },
  {
    id: "TRACK TWO",
    name: "HACKERRANK",
    body: "The second gate opens on HackerRank. Disassemble, debug, reconstruct. Every challenge is a machine that someone swore could not be opened.",
  },
  {
    id: "TRACK THREE",
    name: "CRAFTORA",
    body: "The third gate opens on Craftora. The final stretch of the timeline. Same rule as the rest: nothing is closed source if you are patient enough.",
  },
];

const PROTOCOL = [
  ["ENTRY", "One login per team, issued by the control room. No public registration."],
  ["PACING", "Tracks open only on the control room's signal. Locked means locked - for everyone."],
  ["PLAY", "There are no submissions on this site. You compete directly on Unstop, HackerRank, and Craftora."],
  ["ATTENDANCE", "Every team is checked in at the desk before the first gate opens."],
  ["FOOD", "Ordering opens on the control room's signal. Orders are delivered to your room."],
  ["CONDUCT", "Tampering with the timeline - or another team's run - ends your run. Yours."],
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <main className="relative min-h-screen flex flex-col overflow-x-clip">
      <GsapScroller />

      {/* =================================== HERO */}
      <section ref={heroRef} className="relative border-b border-linesoft">
        <header className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between font-mono text-[11px] tracking-[0.2em] text-mut">
          <span>TIMELINE // NO. 001</span>
        </header>
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28"
        >
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-14 items-center">
            <div>
              <p className="font-mono text-[11px] tracking-[0.25em] text-mut mb-6" data-reveal>
                A PAN INDIA REVERSE ENGINEERING HACKATHON
              </p>
              <h1
                className="font-display leading-[0.92] tracking-[-0.03em]"
                style={{ fontSize: "clamp(3.4rem, 11vw, 9rem)" }}
                data-reveal
              >
                TIME
                <br />
                <span className="text-flux">LAPSE</span>
              </h1>
              <Typewriter
                text="Three tracks. No submissions. Nothing is closed source if you are patient enough."
                className="font-mono text-sm md:text-base text-mut mt-8 max-w-xl"
                speed={34}
                startDelay={500}
              />
              <div className="hairline my-10 [transform-origin:left]" data-line-draw />
              <div className="flex flex-col sm:flex-row gap-4" data-reveal>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center bg-ink text-bg font-mono text-xs tracking-[0.2em] px-8 py-4 hover:bg-white transition-colors active:scale-[0.98]"
                >
                  TEAM LOGIN
                </Link>
                <Link
                  href="/admin/login"
                  className="inline-flex items-center justify-center border border-line text-mut hover:text-ink font-mono text-xs tracking-[0.2em] px-8 py-4 transition-colors active:scale-[0.98]"
                >
                  CONTROL ROOM
                </Link>
              </div>
            </div>
            <div className="relative h-[340px] sm:h-[420px] lg:h-[560px] border border-linesoft" data-reveal>
              <InkOrbitSculpture
                height="100%"
                theme="dark"
                background="#000000"
                ink="#4fa3a5"
                spin={0.12}
                seed={2026}
                label="TIMELAPSE · 3D"
                hint="Drag to rotate · Click to reforge"
              />
            </div>
          </div>
        </motion.div>
        <div className="max-w-6xl mx-auto px-6 pb-6 font-mono text-[10px] tracking-[0.3em] text-mut flex items-center gap-3" data-reveal>
          <span>SCROLL THROUGH THE TIMELINE</span>
          <span className="block h-px flex-1 bg-line" />
        </div>
      </section>

      {/* =================================== FORMAT */}
      <section className="border-b border-linesoft">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <p className="font-mono text-[11px] tracking-[0.25em] text-mut mb-10" data-reveal>
            THE FORMAT
          </p>
          <h2
            className="font-display tracking-[-0.02em] mb-14"
            style={{ fontSize: "clamp(2.6rem, 6vw, 5rem)" }}
            data-reveal
          >
            Reverse everything.
          </h2>

          <div className="max-w-3xl space-y-8">
            <p className="font-mono text-xs md:text-sm text-mut leading-[2]" data-reveal>
              Timelapse is a Pan India reverse engineering hackathon. There is nothing to upload
              here - no report card, no submission box, no file drop. Every challenge lives on an
              external platform, and every team competes there directly, in the open, against the
              clock.
            </p>
            <p className="font-mono text-xs md:text-sm leading-[2]" data-reveal>
              <span className="text-ink">This site is the control room.</span> It holds your team
              login, opens the three track gates on the organizer&apos;s signal, keeps the
              attendance sheet, and runs the food counter. The competition itself happens where it
              always does - on the platforms.
            </p>
            <p className="font-mono text-xs md:text-sm leading-[2]" data-reveal>
              <span className="text-flux">Three tracks. One timeline. Zero submissions.</span>
            </p>
          </div>

          <div className="hairline my-14 [transform-origin:left]" data-line-draw />

          <p className="font-mono text-[11px] tracking-[0.25em] text-flux mb-10" data-reveal>
            THE THREE GATES
          </p>
          <div className="grid sm:grid-cols-3 gap-px bg-linesoft border border-linesoft">
            {TRACKS.map((t) => (
              <div key={t.name} className="bg-black p-8" data-reveal>
                <p className="font-mono text-[10px] tracking-[0.3em] text-mut mb-3">{t.id}</p>
                <h3 className="font-display text-3xl tracking-tight mb-3">{t.name}</h3>
                <p className="font-mono text-xs text-mut leading-[1.9]">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================================== PROTOCOL */}
      <section className="border-b border-linesoft">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <p className="font-mono text-[11px] tracking-[0.25em] text-mut mb-10" data-reveal>
            PROTOCOL
          </p>
          <div className="space-y-0 max-w-3xl">
            {PROTOCOL.map(([k, v]) => (
              <div key={k} className="border-t border-linesoft last:border-b" data-reveal>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-10 px-1 py-6">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-ink w-32 shrink-0 pt-1">{k}</span>
                  <span className="font-mono text-xs text-mut leading-[1.9]">{v}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================================== FINAL CTA */}
      <section className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 w-full">
          <h2
            className="font-display tracking-[-0.02em] leading-[1.05] max-w-3xl"
            style={{ fontSize: "clamp(2.6rem, 6vw, 5rem)" }}
            data-reveal
          >
            The clock is already running.
            <br />
            <span className="text-flux">Step onto the timeline.</span>
          </h2>
          <div className="hairline my-10 [transform-origin:left]" data-line-draw />
          <div className="flex flex-col sm:flex-row gap-4" data-reveal>
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-ink text-bg font-mono text-xs tracking-[0.2em] px-8 py-4 hover:bg-white transition-colors active:scale-[0.98]"
            >
              ENTER THE TIMELINE
            </Link>
            <FadeIn delay={0.1}>
              <span className="inline-flex items-center font-mono text-[10px] tracking-[0.25em] text-mut px-4 py-4">
                TEAM CREDENTIALS ARE ISSUED BY THE CONTROL ROOM ONLY
              </span>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* =================================== FOOTER */}
      <footer className="border-t border-linesoft">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-mono text-[10px] tracking-[0.25em] text-mut">
            TIMELAPSE - A PAN INDIA REVERSE ENGINEERING HACKATHON
          </span>
          <span className="font-mono text-[10px] tracking-[0.25em] text-mut">
            A WEBSITE BY <span className="text-ink">SNOW</span>
          </span>
        </div>
      </footer>
    </main>
  );
}
