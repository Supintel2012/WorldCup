import { TeamChip } from "./TeamChip";
import { pct } from "@/lib/utils";
import type { Team } from "@/types";

export function MatchBar({
  home,
  away,
  pWin,
  pDraw,
  pLoss,
  expGoalsHome,
  expGoalsAway,
  knockout,
}: {
  home: Team;
  away: Team;
  pWin: number;
  pDraw: number;
  pLoss: number;
  expGoalsHome: number;
  expGoalsAway: number;
  knockout?: boolean;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <TeamChip team={home} size="md" />
        <span className="font-mono text-xs text-cream-100/40">
          {expGoalsHome.toFixed(2)} : {expGoalsAway.toFixed(2)}
        </span>
        <TeamChip team={away} size="md" className="flex-row-reverse" />
      </div>

      <div className="relative h-2 rounded-full overflow-hidden bg-white/10 flex">
        <div
          className="bg-gold transition-all"
          style={{ width: `${pWin * 100}%` }}
          title={`${home.name} win ${pct(pWin)}`}
        />
        {!knockout && (
          <div
            className="bg-cream-100/40 transition-all"
            style={{ width: `${pDraw * 100}%` }}
            title={`Draw ${pct(pDraw)}`}
          />
        )}
        <div
          className="bg-burnt transition-all"
          style={{ width: `${pLoss * 100}%` }}
          title={`${away.name} win ${pct(pLoss)}`}
        />
      </div>

      <div className="flex justify-between mt-2 font-mono text-[11px]">
        <span className="text-gold">{pct(pWin, 0)}</span>
        {!knockout && <span className="text-cream-100/50">{pct(pDraw, 0)} draw</span>}
        <span className="text-burnt">{pct(pLoss, 0)}</span>
      </div>
    </div>
  );
}
