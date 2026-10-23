export default function NotFound() {
  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="text-[10px] font-mono text-ink-dim tracking-[0.3em]">ERROR 404</div>
        <h1 className="text-display font-serif font-bold text-ink">
          Frame Not Found
        </h1>
        <p className="text-sm text-ink-muted font-sans max-w-md mx-auto">
          The sequence you requested does not exist in this timeline.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-3 px-6 py-3 bg-ink text-obsidian text-[11px] font-mono font-bold tracking-[0.15em] uppercase hover:bg-accent-warm transition-colors"
        >
          Return to Studio
        </a>
      </div>
    </div>
  );
}

