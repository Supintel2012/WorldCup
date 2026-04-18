import { GroupCard } from "@/components/GroupCard";
import { getGroups, getGroupTeams, simulateAllGroups } from "@/lib/bracket-logic";
import { Globe2 } from "lucide-react";

export const metadata = {
  title: "Groups · SmartBracket WC26",
};

export const dynamic = "force-dynamic";

export default function GroupsPage() {
  const groups = getGroups();
  const { allResults, playInAdvancers } = simulateAllGroups(2000);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-10">
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20 text-gold">
            <Globe2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Group Stage</h1>
            <p className="text-cream-100/60 font-mono text-xs">
              12 groups · 4 teams · top 2 advance · 8 best thirds into knockouts
            </p>
          </div>
        </div>
        <p className="max-w-3xl text-sm text-cream-100/70 leading-relaxed">
          Every group standing below reflects 2,000 Monte-Carlo simulations of
          the full six-match round robin. Each match is resolved with{" "}
          <span className="text-gold">Statchance</span> — a Poisson goal model
          tuned to SPI ratings. Finishing probabilities update live as you
          shift parameters on the{" "}
          <a href="/predictions" className="text-gold hover:text-gold-dim underline underline-offset-4">
            Predictions
          </a>{" "}
          screen.
        </p>
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {groups.map((g) => (
          <GroupCard
            key={g.code}
            code={g.code}
            venue={g.venue}
            teams={getGroupTeams(g.code)}
            sims={allResults[g.code]}
          />
        ))}
      </section>

      <section className="card">
        <div className="flex items-center gap-3 mb-4">
          <span className="chip bg-burnt/20 text-burnt">Play-In</span>
          <h2 className="font-display text-xl">Best Third-Placed Finishers</h2>
        </div>
        <p className="text-sm text-cream-100/70 mb-5 max-w-3xl">
          FIFA's 2026 format awards 8 of 12 third-place teams a Round of 32
          ticket — the closest analog to the NCAA First Four. Ranking below
          uses projected third-place probability weighted by path strength.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-cream-100/40 font-mono">
                <th className="text-left pb-2">#</th>
                <th className="text-left pb-2">Group</th>
                <th className="text-left pb-2">Team</th>
                <th className="text-right pb-2">3rd-Place P</th>
                <th className="text-right pb-2">Advance P</th>
              </tr>
            </thead>
            <tbody>
              {playInAdvancers.map((p, i) => (
                <tr key={`${p.groupCode}-${p.teamCode}`} className="border-t border-white/5">
                  <td className="py-2 font-mono text-cream-100/50">{i + 1}</td>
                  <td className="py-2 font-mono text-xs">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gold/20 text-gold">
                      {p.groupCode}
                    </span>
                  </td>
                  <td className="py-2 font-medium">{p.teamCode}</td>
                  <td className="py-2 text-right font-mono text-xs">
                    {(p.thirdProb * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 text-right font-mono text-xs text-gold">
                    {(p.advanceProb * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
