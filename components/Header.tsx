import Link from "next/link";
import { Trophy } from "lucide-react";

const nav = [
  { href: "/groups", label: "Groups" },
  { href: "/bracket", label: "Bracket" },
  { href: "/predictions", label: "Predictions" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 glass border-b border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold text-navy font-mono font-bold">
            <Trophy className="h-4 w-4" />
          </span>
          <span className="font-display text-lg tracking-tight">
            Smart<span className="text-gold">Bracket</span>
            <span className="ml-1 font-mono text-[10px] text-cream-100/50">WC26</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-3 py-2 rounded-md text-sm font-medium text-cream-100/80 hover:text-gold hover:bg-white/5 transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/bracket" className="btn-primary text-sm">
          Build Bracket
        </Link>
      </div>
    </header>
  );
}
