"use client";

export default function Header() {
  return (
    <header className="relative border-b border-green-500/20 bg-zinc-900/50 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-green-400 glow-green">
              KIRO-CI
            </h1>
            <div className="flex items-center gap-2 text-xs text-green-400">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </div>
          </div>

          <nav className="flex items-center gap-4">
            <a
              href="https://github.com/mannshah24/Kiro-CI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-green-400 transition-colors"
            >
              GitHub
            </a>
            <a
              href="#live-feed"
              className="text-sm text-gray-400 hover:text-green-400 transition-colors"
            >
              Live Feed
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
