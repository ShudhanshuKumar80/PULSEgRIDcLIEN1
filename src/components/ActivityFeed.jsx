function timeAgo(timestamp) {
  const delta = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (delta < 60) {
    return `${delta}s ago`;
  }
  if (delta < 3600) {
    return `${Math.floor(delta / 60)}m ago`;
  }
  return `${Math.floor(delta / 3600)}h ago`;
}
export default function ActivityFeed({ activity }) {
  return (
    <div className="glass-panel rounded-lg p-5">
      <p className="eyebrow">Activity</p>
      <h2 className="mt-2 text-xl font-semibold text-black">Latest captures</h2>
      <div className="mt-5 space-y-3">
        {activity.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-200 px-4 py-5 text-sm text-black">
            Quiet board. One click will wake it up.
          </div>
        )}
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {activity.map((item) => (
            <div
              key={item.id}
              className="rounded-md w-full border border-slate-200 bg-white px-4 py-3 mb-3 last:mb-0"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-black">{item.name}</p>
                <span className="text-xs uppercase tracking-[0.2em] text-black">
                  {timeAgo(item.at)}
                </span>
              </div>
              <p className="mt-2 text-sm text-black">
                Captured tile {item.x + 1}, {item.y + 1}
                {item.previousOwnerName ? ` from ${item.previousOwnerName}` : ""}.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}