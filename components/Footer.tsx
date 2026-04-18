export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-20">
      <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-cream-100/50">
        <div className="font-mono">
          &copy; 2012&ndash;2026 Supported Intelligence, LLC. SmartBracket&trade;.
        </div>
        <div className="font-mono">
          Patents 9,798,700 · 10,460,249 · 10,546,248
        </div>
        <a
          href="https://www.supportedintelligence.com"
          className="text-gold hover:text-gold-dim font-mono"
        >
          supportedintelligence.com
        </a>
      </div>
    </footer>
  );
}
