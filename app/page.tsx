import Link from "next/link";
import { ArrowRight, Brain, Target, Trophy, Users } from "lucide-react";
import { getGroups, getTeams } from "@/lib/bracket-logic";

export default function Home() {
  const teams = getTeams();
  const groups = getGroups();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      {/* Hero */}
      <section className="mb-16 text-center">
        <div className="chip mb-6 bg-gold/10 text-gold border border-gold/20">
          <Trophy className="h-3 w-3" /> FIFA World Cup 2026 · USA · Canada · Mexico
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Smart<span className="text-gold">Bracket</span>
        </h1>
        <p className="text-xl md:text-2xl text-cream-100/80 max-w-2xl mx-auto mb-8">
          Probabilistic bracket optimization for the first 48-team World Cup.
          Powered by Statchance &amp; Pickchance models from Supported Intelligence.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/bracket" className="btn-primary">
            Build my bracket <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/groups" className="btn-ghost">
            Explore the groups
          </Link>
        </div>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        <StatCard icon={<Users className="h-5 w-5" />} label="Teams" value={`${teams.length}`} sub="48-team expanded format" />
        <StatCard icon={<Target className="h-5 w-5" />} label="Groups" value={`${groups.length}`} sub="A through L" />
        <StatCard icon={<Brain className="h-5 w-5" />} label="Models" value="2" sub="Statchance + Pickchance" />
        <StatCard icon={<Trophy className="h-5 w-5" />} label="Play-In slots" value="8" sub="Best third-place finishers" />
      </section>

      {/* Model explainers */}
      <section className="grid md:grid-cols-2 gap-6 mb-16">
        <div className="card">
          <div className="chip bg-confed-uefa/20 text-blue-200 mb-3">STATCHANCE</div>
          <h3 className="font-display text-2xl mb-2">Match outcome engine</h3>
          <p className="text-cream-100/70 leading-relaxed">
            Poisson goal-expectancy model driven by SPI-style offensive and defensive
            ratings. Every matchup &mdash; group, knockout, or hypothetical &mdash; is
            simulated thousands of times to produce win / draw / loss probabilities.
          </p>
          <div className="mt-4 font-mono text-sm text-gold/80">
            λ<sub>home</sub> = home_adv · (spi_off<sub>h</sub> / spi_def<sub>a</sub>) · avg_goals
          </div>
        </div>

        <div className="card">
          <div className="chip bg-burnt/20 text-burnt mb-3">PICKCHANCE</div>
          <h3 className="font-display text-2xl mb-2">Pool strategy overlay</h3>
          <p className="text-cream-100/70 leading-relaxed">
            Models public pick popularity so you can identify contrarian value
            &mdash; teams with high win probability that the crowd is sleeping on.
            Your bracket wins the <em>pool</em>, not just the tournament.
          </p>
          <div className="mt-4 font-mono text-sm text-gold/80">
            EV = P(win) · (1 − P(pick))<sup>N−1</sup>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="card">
        <h3 className="font-display text-xl mb-4">Jump in</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <QuickLink href="/groups" title="Groups" desc="12 groups of 4, simulated" />
          <QuickLink href="/bracket" title="Bracket" desc="Round of 32 → Final" />
          <QuickLink href="/predictions" title="Predictions" desc="Match-by-match probs" />
          <QuickLink href="/leaderboard" title="Leaderboard" desc="How you rank" />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon, label, value, sub,
}: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-gold mb-2">{icon}<span className="font-mono text-xs uppercase tracking-wider">{label}</span></div>
      <div className="font-display text-3xl font-bold">{value}</div>
      <div className="text-xs text-cream-100/60 mt-1">{sub}</div>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-1 p-4 rounded-lg border border-white/10 hover:border-gold/40 hover:bg-white/5 transition-colors"
    >
      <span className="flex items-center gap-2 font-medium group-hover:text-gold transition-colors">
        {title} <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
      <span className="text-sm text-cream-100/60">{desc}</span>
    </Link>
  );
}
