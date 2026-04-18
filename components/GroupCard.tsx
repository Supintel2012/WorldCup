import { TeamChip } from "./TeamChip";
import { pct } from "@/lib/utils";
import type { Team } from "@/types";

interface GroupSim {
  code: string;
  finishProb: { first: number; second: number; third: number; fourth: number };
  advanceProb: number;
}

export function GroupCard({
  code,
  venue,
  teams,
  sims,
}: {
  code: string;
  venue: string;
  teams: Team[];
  sims: GroupSim[];
}) {
  const byCode = new Map(sims.map((s) => [s.code, s]));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gold text-navy font-mono font-bold text-sm">
              {code}
            </span>
            <span className="font-display text-lg">Group {code}</span>
          </div>
          <div className="text-xs text-cream-100/50 font-mono mt-0.5">{venue}</div>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-cream-100/40 font-mono">
            <th className="text-left pb-2">Team</th>
            <th className="text-right pb-2">Win group</th>
            <th className="text-right pb-2">Advance</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => {
            const s = byCode.get(t.code);
            const advance = s?.advanceProb ?? 0;
            const winGroup = s?.finishProb.first ?? 0;
            return (
              <tr key={t.code} className="border-t border-white/5">
                <td className="py-2">
                  <TeamChip team={t} size="sm" />
                </td>
                <td className="py-2 text-right font-mono text-xs">
                  <span className={winGroup > 0.4 ? "text-gold" : "text-cream-100/80"}>
                    {pct(winGroup, 0)}
                  </span>
                </td>
                <td className="py-2 text-right font-mono text-xs">
                  <div className="relative inline-block w-20">
                    <div className="h-1 rounded-full bg-white/10" />
                    <div
                      className="absolute left-0 top-0 h-1 rounded-full bg-gold"
                      style={{ width: `${advance * 100}%` }}
                    />
                    <span className="block mt-1 text-cream-100/80">{pct(advance, 0)}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
