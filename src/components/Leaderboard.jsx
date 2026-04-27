export default function Leaderboard({ leaderboard, activeUserId }) {
  return (
    <div className="max-h-75 overflow-y-auto scrollbar-thin">
      <div className="glass-panel rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Leaderboard</p>
            <h2 className="mt-2 text-xl font-semibold text-black">Ownership leaderboard</h2>
          </div>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-black">
            Live
          </span>
        </div>
        <div className="mt-5 space-y-3">
          {leaderboard.length === 0 && (
            <div className="rounded-md border border-dashed border-slate-200 px-4 py-5 text-sm text-black">
              First capture takes the lead.
            </div>
          )}
          {leaderboard.map((entry, index) => (
            <div
              key={entry.userId}
              className={[
                "flex items-center justify-between rounded-md border px-4 py-3 transition-colors",
                entry.userId === activeUserId
                  ? "border-sky-200 bg-sky-50"
                  : "border-slate-200 bg-white"
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-semibold text-slate-950"
                  style={{ backgroundColor: entry.color }}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-black">{entry.name}</p>
                  <p className="text-xs text-black">
                    {entry.connected ? "Online now" : "Offline"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-black">{entry.tilesOwned}</p>
                <p className="text-xs uppercase tracking-[0.24em] text-black">tiles</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}