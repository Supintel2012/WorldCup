import { Crown, Users2 } from "lucide-react";
import { fetchLeaderboard } from "@/lib/db-data";

export const metadata = {
  title: "Leaderboard · SmartBracket WC26",
};

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const rows = await fetchLeaderboard(100);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-10">
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20 text-gold">
            <Users2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Pool Leaderboard</h1>
            <p className="text-cream-100/60 font-mono text-xs">
              {rows.length > 0
                ? `${rows.length} bracket${rows.length === 1 ? "" : "s"} submitted · live from public.leaderboard`
                : "No brackets scored yet · awaiting the scoring job"}
            </p>
          </div>
        </div>
        <p className="max-w-3xl text-sm text-cream-100/70 leading-relaxed">
          Points are awarded per correct pick, scaled by the round (1 / 2 / 4 /
          8 / 16 / 32) and weighted by the inverse public pick rate. This is
          the same scoring schema used by SI&apos;s March Madness pool.
        </p>
      </section>

      <section className="card">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="h-5 w-5 text-gold" />
          <h2 className="font-display text-xl">Standings</h2>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-cream-100/70 max-w-3xl">
            The <code className="text-gold">public.leaderboard</code> table is empty. Rows are written by
            the scoring job once tournament matches start reporting winners — see{" "}
            <code className="text-gold">TO_CONFIGURE.md</code> &rarr; &quot;Leaderboard scoring job&quot; for the
            wiring that still needs to happen. Once brackets are submitted, users will appear here ranked by
            points.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-cream-100/40 font-mono">
                  <th className="text-left pb-2">Rank</th>
                  <th className="text-left pb-2">User</th>
                  <th className="text-right pb-2">Points</th>
                  <th className="text-right pb-2">Correct</th>
                  <th className="text-right pb-2">Champion P</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const rank = r.rank ?? i + 1;
                  const correct = r.correct_picks ?? 0;
                  return (
                    <tr key={r.id} className="border-t border-white/5">
                      <td className="py-2 font-mono text-xs">
                        <span className={rank <= 3 ? "text-gold" : "text-cream-100/50"}>
                          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                        </span>
                      </td>
                      <td className="py-2 font-mono text-xs">{r.display_name ?? "anonymous"}</td>
                      <td className="py-2 text-right font-mono text-xs text-gold">
                        {Number(r.points).toFixed(1)}
                      </td>
                      <td className="py-2 text-right font-mono text-xs">{correct}/32</td>
                      <td className="py-2 text-right font-mono text-xs text-cream-100/60">
                        {r.champion_prob != null
                          ? `${(Number(r.champion_prob) * 100).toFixed(0)}%`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
