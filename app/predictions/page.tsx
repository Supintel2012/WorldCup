import { TeamChip } from "@/components/TeamChip";
import { pickValues } from "@/lib/pickchance";
import { fetchChampionProbs, fetchTeams } from "@/lib/db-data";
import { cn, pct } from "@/lib/utils";
import type { Team } from "@/types";
import { Sparkles, TrendingUp, Trophy } from "lucide-react";

export const metadata = {
  title: "Predictions · SmartBracket WC26",
};

export const dynamic = "force-dynamic";

/**
 * Fallback win-probability estimator used only when public.champion_probs is
 * empty. The real numbers come from the nightly Monte Carlo job — see
 * TO_CONFIGURE.md "Nightly Monte Carlo".
 */
function approximateWinProbs(teams: Team[]): Map<string, number> {
  if (teams.length === 0) return new Map();
  const max = Math.max(...teams.map((t) => t.fifa));
  const weights = teams.map((t) => Math.exp((t.fifa - max) / 60));
  const sum = weights.reduce((a, b) => a + b, 0);
  return new Map(teams.map((t, i) => [t.code, weights[i] / sum]));
}

export default async function PredictionsPage() {
  const [teams, probs] = await Promise.all([fetchTeams(), fetchChampionProbs()]);

  const hasTeams = teams.length > 0;
  const hasProbs = probs.length > 0;

  const winProbs = hasProbs
    ? new Map(probs.map((p) => [p.team_code, Number(p.p_champion)]))
    : approximateWinProbs(teams);

  const values = hasTeams ? pickValues(teams, winProbs, { contrarian: 0.35, poolSize: 50 }) : [];

  const chalk = values.slice(0, 5);
  const contrarian = [...values]
    .sort((a, b) => b.leverage - a.leverage)
    .filter((v) => v.winProb > 0.01)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-10">
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20 text-gold">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Predictions</h1>
            <p className="text-cream-100/60 font-mono text-xs">
              {hasProbs
                ? `${probs.length} teams · champion_probs from Supabase`
                : "No champion_probs rows yet · showing FIFA-softmax approximation"}
            </p>
          </div>
        </div>
        <p className="max-w-3xl text-sm text-cream-100/70 leading-relaxed">
          A win-probability ranking alone isn&apos;t enough to win a bracket
          pool. The smart move is to identify teams whose true probability of
          winning outruns their public pick rate. Pickchance models that pick
          popularity as a mindshare softmax, then surfaces leverage —{" "}
          <span className="font-mono text-gold">winProb / pickPct</span>.
        </p>
      </section>

      {!hasTeams ? (
        <EmptyState
          title="No teams in Supabase"
          body="public.teams is empty — seed it via supabase/migrations/003_seed_reference.sql (or the REST upsert described in TO_CONFIGURE.md)."
        />
      ) : (
        <>
          <section className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-gold" />
                <h2 className="font-display text-lg">Chalk · Highest EV</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-cream-100/40 font-mono">
                    <th className="text-left pb-2">Team</th>
                    <th className="text-right pb-2">Win P</th>
                    <th className="text-right pb-2">Pick %</th>
                    <th className="text-right pb-2">EV</th>
                  </tr>
                </thead>
                <tbody>
                  {chalk.map((v) => {
                    const team = teams.find((t) => t.code === v.teamCode)!;
                    return (
                      <tr key={v.teamCode} className="border-t border-white/5">
                        <td className="py-2"><TeamChip team={team} size="sm" /></td>
                        <td className="py-2 text-right font-mono text-xs text-gold">{pct(v.winProb)}</td>
                        <td className="py-2 text-right font-mono text-xs">{pct(v.pickPct)}</td>
                        <td className="py-2 text-right font-mono text-xs">{v.expectedValue.toFixed(3)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-burnt" />
                <h2 className="font-display text-lg">Contrarian · Highest Leverage</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-cream-100/40 font-mono">
                    <th className="text-left pb-2">Team</th>
                    <th className="text-right pb-2">Win P</th>
                    <th className="text-right pb-2">Pick %</th>
                    <th className="text-right pb-2">Leverage</th>
                  </tr>
                </thead>
                <tbody>
                  {contrarian.map((v) => {
                    const team = teams.find((t) => t.code === v.teamCode)!;
                    return (
                      <tr key={v.teamCode} className="border-t border-white/5">
                        <td className="py-2"><TeamChip team={team} size="sm" /></td>
                        <td className="py-2 text-right font-mono text-xs">{pct(v.winProb)}</td>
                        <td className="py-2 text-right font-mono text-xs">{pct(v.pickPct)}</td>
                        <td className="py-2 text-right font-mono text-xs text-burnt">{v.leverage.toFixed(2)}×</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h2 className="font-display text-xl mb-4">All {teams.length} Teams</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-cream-100/40 font-mono">
                    <th className="text-left pb-2">#</th>
                    <th className="text-left pb-2">Team</th>
                    <th className="text-left pb-2">Confed</th>
                    <th className="text-right pb-2">FIFA</th>
                    <th className="text-right pb-2">Win P</th>
                    <th className="text-right pb-2">Pick %</th>
                    <th className="text-right pb-2">EV</th>
                    <th className="text-right pb-2">Leverage</th>
                  </tr>
                </thead>
                <tbody>
                  {values.map((v, i) => {
                    const team = teams.find((t) => t.code === v.teamCode)!;
                    return (
                      <tr key={v.teamCode} className="border-t border-white/5">
                        <td className="py-2 font-mono text-cream-100/50">{i + 1}</td>
                        <td className="py-2"><TeamChip team={team} size="sm" /></td>
                        <td className="py-2 font-mono text-[11px] text-cream-100/60">{team.confederation}</td>
                        <td className="py-2 text-right font-mono text-xs">{team.fifa}</td>
                        <td className="py-2 text-right font-mono text-xs text-gold">{pct(v.winProb)}</td>
                        <td className="py-2 text-right font-mono text-xs">{pct(v.pickPct)}</td>
                        <td className="py-2 text-right font-mono text-xs">{v.expectedValue.toFixed(3)}</td>
                        <td className={cn(
                          "py-2 text-right font-mono text-xs",
                          v.leverage > 1.5 ? "text-burnt" : "text-cream-100/60",
                        )}>{v.leverage.toFixed(2)}×</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <section className="card">
      <h2 className="font-display text-xl mb-2">{title}</h2>
      <p className="text-sm text-cream-100/70 max-w-3xl">{body}</p>
    </section>
  );
}
