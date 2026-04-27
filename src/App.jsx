import { useEffect, useState } from "react";
import ActivityFeed from "./components/ActivityFeed.jsx";
import BoardTile from "./components/BoardTile.jsx";
import InfoCard from "./components/InfoCard.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import { useSharedBoard } from "./hooks/useSharedBoard.js";
import { hexToRgba, randomColor } from "./lib/profile.js";
function connectionLabel(state) {
  if (state === "connected") {
    return "Live";
  }
  if (state === "reconnecting") {
    return "Reconnecting";
  }
  return "Connecting";
}
function formatPercent(value, total) {
  if (!total) {
    return "0%";
  }
  return `${Math.round((value / total) * 100)}%`;
}
function formatCooldown(tile) {
  if (!tile?.cooldownUntil) {
    return "Ready now";
  }
  const remaining = Math.max(0, Math.ceil((tile.cooldownUntil - Date.now()) / 1000));
  return remaining > 0 ? `${remaining}s lock` : "Ready now";
}
export default function App() {
  const {
    activity,
    banner,
    board,
    claimTile,
    connectionState,
    hotTiles,
    newAlias,
    pendingTileId,
    profile,
    saveIdentity,
    stats
  } = useSharedBoard();
  const [draftName, setDraftName] = useState(profile.name);
  const [draftColor, setDraftColor] = useState(profile.color);
  const [focusedTileId, setFocusedTileId] = useState(null);
  const [hoveredTileId, setHoveredTileId] = useState(null);
  useEffect(() => {
    setDraftName(profile.name);
    setDraftColor(profile.color);
  }, [profile.color, profile.name]);
  useEffect(() => {
    if (!board || focusedTileId !== null) {
      return;
    }
    const centerTileId = Math.floor(board.tiles.length / 2);
    setFocusedTileId(centerTileId);
  }, [board, focusedTileId]);
  const selectedTileId = hoveredTileId ?? focusedTileId;
  const selectedTile =
    selectedTileId !== null && board ? board.tiles[selectedTileId] : null;
  const myStanding = stats.leaderboard.find((entry) => entry.userId === profile.userId);
  const connectionTone =
    connectionState === "connected"
      ? "emerald"
      : connectionState === "reconnecting"
        ? "amber"
        : "pink";
  return (
    <div className="min-h-screen px-4 py-6 text-black sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow">Realtime shared grid</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={[
                "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm",
                connectionState === "connected"
                  ? "border-emerald-200 bg-emerald-50 text-black"
                  : "border-amber-200 bg-amber-50 text-black"
              ].join(" ")}
            >
              <span
                className={[
                  "h-2.5 w-2.5 rounded-full",
                  connectionState === "connected" ? "bg-emerald-500 status-live" : "bg-amber-500"
                ].join(" ")}
                aria-hidden="true"
              />
              {connectionLabel(connectionState)}
            </span>
            <span className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-black">
              {stats.onlineUsers} online
            </span>
            <span className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-black">
              {stats.claimedTiles}/{stats.totalTiles || 576} claimed
            </span>
          </div>
        </header>
        {banner && (
          <div className="mb-5 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-black">
            {banner}
          </div>
        )}
        <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            label="Active Users"
            value={stats.onlineUsers}
            detail="Connected sessions with presence updates synchronized in real time."
            accent="emerald"
          />
          <InfoCard
            label="Your Tiles"
            value={myStanding?.tilesOwned || 0}
            detail="Current number of cells assigned to your session."
            accent="cyan"
          />
          <InfoCard
            label="Board Coverage"
            value={formatPercent(stats.claimedTiles, stats.totalTiles)}
            detail={`${stats.claimedTiles} claimed tiles with live ownership updates.`}
            accent="amber"
          />
          <InfoCard
            label="Claims Processed"
            value={stats.totalClaims}
            detail="Total accepted ownership claims processed by the backend."
            accent={connectionTone}
          />
        </section>
        <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <aside className="space-y-5">
            <div className="glass-panel rounded-lg p-5">
              <p className="eyebrow">Profile</p>
              <h2 className="mt-2 text-xl font-semibold text-black">Current session</h2>
              <div className="mt-5 flex items-center gap-4 rounded-md border border-slate-200 bg-slate-50/80 p-4">
                <div
                  className="h-14 w-14 rounded-md border border-white shadow-sm"
                  style={{
                    background: `linear-gradient(145deg, ${hexToRgba(draftColor, 1)} 0%, ${hexToRgba(
                      draftColor,
                      0.55
                    )} 100%)`
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-black">{profile.name}</p>
                </div>
              </div>
              <label className="mt-5 block text-sm font-medium text-black" htmlFor="alias">
                Display name
              </label>
              <input
                id="alias"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                maxLength={18}
                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-black outline-none transition focus:border-sky-400"
                placeholder="Pick your alias"
              />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => saveIdentity({ name: draftName, color: draftColor })}
                  className="rounded-md border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-200"
                >
                  Save alias
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextColor = randomColor(draftColor);
                    setDraftColor(nextColor);
                    saveIdentity({ name: draftName, color: nextColor });
                  }}
                  className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-50"
                >
                  New color
                </button>
              </div>
              <button
                type="button"
                onClick={newAlias}
                className="mt-3 w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-100"
              >
                Start as a new alias
              </button>
            </div>
          </aside>
          <main className="glass-panel rounded-lg overflow-hidden p-4 sm:p-5">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="eyebrow">Board</p>
                <h2 className="mt-2 text-2xl font-semibold text-black">Shared ownership grid</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.24em] text-black">
                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  {board?.width || 24} x {board?.height || 24}
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  {stats.uniqueOwners} active owners
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  4s cooldown
                </span>
              </div>
            </div>
            <div
              className="mt-5 overflow-auto rounded-md border border-slate-200 bg-slate-50/90 p-3 board-scroll"
              onMouseLeave={() => setHoveredTileId(null)}
            >
              {board ? (
                <div
                  className="grid gap-1.5 p-2"
                  style={{
                    gridTemplateColumns: `repeat(${board.width}, minmax(0, 1fr))`,
                    minWidth: "max-content"
                  }}
                >
                  {board.tiles.map((tile) => (
                    <BoardTile
                      key={tile.id}
                      tile={tile}
                      isHot={Boolean(hotTiles[tile.id])}
                      isMine={tile.ownerId === profile.userId}
                      isPending={pendingTileId === tile.id}
                      isSelected={selectedTileId === tile.id}
                      onHover={() => setHoveredTileId(tile.id)}
                      onClick={() => {
                        setFocusedTileId(tile.id);
                        claimTile(tile.id);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[580px] items-center justify-center text-sm text-black">
                  Pulling the live board from the server...
                </div>
              )}
            </div>
          </main>
          <aside className="space-y-5">
            <Leaderboard leaderboard={stats.leaderboard} activeUserId={profile.userId} />
            <ActivityFeed activity={activity} />
          </aside>
        </section>
      </div>
    </div>
  );
}