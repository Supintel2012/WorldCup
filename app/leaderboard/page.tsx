import { Crown, Users2 } from "lucide-react";

export const metadata = {
  title: "Leaderboard · SmartBracket WC26",
};

interface Entry {
  rank: number;
  user: string;
  points: number;
  picksCorrect: number;
  championPick: string;
  confidence: number;
}

const PLACEHOLDER: Entry[] = [
  { rank: 1,  user: "nate.s",       points: 186, picksCorrect: 28, championPick: "ARG", confidence: 0.22 },
  { rank: 2,  user: "nate.c",       points: 178, picksCorrect: 26, championPick: "FRA", confidence: 0.19 },
  { rank: 3,  user: "lipsy.d",      points: 171, picksCorrect: 25, championPick: "ESP", confidence: 0.18 },
  { rank: 4,  user: "silver.538",   points: 168, picksCorrect: 25, championPick: "BRA", confidence: 0.16 },
  { rank: 5,  user: "breiter.96",   points: 159, picksCorrect: 24, championPick: "ENG", confidence: 0.14 },
  { rank: 6,  user: "ngate.x",      points: 151, picksCorrect: 23, championPick: "POR", confidence: 0.13 },
  { rank: 7,  user: "jackson.a",    points: 144, picksCorrect: 22, championPick: "GER", confidence: 0.12 },
  { rank: 8,  user: "metrick.96",   points: 138, picksCorrect: 21, championPick: "NED", confidence: 0.10 },
  { rank: 9,  user: "host.canada",  points: 132, picksCorrect: 20, championPick: "CAN", confidence: 0.06 },
  { rank: 10, user: "kaggle.bot",   points: 127, picksCorrect: 20, championPick: "BEL", confidence: 0.07 },
];

export default function LeaderboardPage() {
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
              Live scoring · pickchance-weighted points
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
          <h2 className="font-display text-xl">Top 10</h2>
          <span className="chip bg-white/10 text-cream-100/70 ml-auto">Sample data</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-cream-100/40 font-mono">
                <th className="text-left pb-2">Rank</th>
                <th className="text-left pb-2">User</th>
                <th className="text-right pb-2">Points</th>
                <th className="text-right pb-2">Correct</th>
                <th className="text-right pb-2">Champion</th>
                <th className="text-right pb-2">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {PLACEHOLDER.map((e) => (
                <tr key={e.rank} className="border-t border-white/5">
                  <td className="py-2 font-mono text-xs">
                    <span className={e.rank <= 3 ? "text-gold" : "text-cream-100/50"}>
                      {e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : `#${e.rank}`}
                    </span>
                  </td>
                  <td className="py-2 font-mono text-xs">{e.user}</td>
                  <td className="py-2 text-right font-mono text-xs text-gold">{e.points}</td>
                  <td className="py-2 text-right font-mono text-xs">{e.picksCorrect}/32</td>
                  <td className="py-2 text-right font-mono text-xs">{e.championPick}</td>
                  <td className="py-2 text-right font-mono text-xs text-cream-100/60">
                    {(e.confidence * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[11px] text-cream-100/40 font-mono">
          Hook this to <code className="text-gold">SELECT * FROM public.leaderboard ORDER BY points DESC</code> once Supabase is wired up.
        </p>
      </section>
    </div>
  );
}
