import { hexToRgba } from "../lib/profile.js";
export default function BoardTile({
  tile,
  isHot,
  isMine,
  isPending,
  isSelected,
  onClick,
  onHover
}) {
  const isOwned = Boolean(tile.ownerId);
  const isCooling = tile.cooldownUntil > Date.now();
  const ownedStyle = isOwned
    ? {
        background: `linear-gradient(145deg, ${hexToRgba(tile.ownerColor, 0.95)} 0%, ${hexToRgba(
          tile.ownerColor,
          0.68
        )} 100%)`,
        boxShadow: `inset 0 1px 0 ${hexToRgba(tile.ownerColor, 0.45)}, 0 8px 18px ${hexToRgba(tile.ownerColor, 0.14)}`
      }
    : undefined;
  return (
    <button
      type="button"
      aria-label={
        isOwned
          ? `Tile ${tile.x + 1}, ${tile.y + 1}, owned by ${tile.ownerName}`
          : `Tile ${tile.x + 1}, ${tile.y + 1}, unclaimed`
      }
      title={
        isOwned
          ? `${tile.ownerName} owns ${tile.x + 1}, ${tile.y + 1}`
          : `Capture ${tile.x + 1}, ${tile.y + 1}`
      }
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onClick}
      className={[
        "relative aspect-square w-[22px] rounded-md border transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70",
        isOwned
          ? "border-white/50 hover:-translate-y-[1px] hover:scale-[1.03]"
          : "border-slate-200 bg-white hover:-translate-y-[1px] hover:border-sky-300 hover:bg-sky-50",
        isSelected ? "ring-2 ring-sky-400/80 ring-offset-2 ring-offset-white" : "",
        isPending ? "cursor-progress opacity-75" : "",
        isHot ? "tile-hot" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      style={ownedStyle}
    >
      {isOwned && (
        <span
          className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full bg-white/85"
          aria-hidden="true"
        />
      )}
      {isMine && (
        <span
          className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-slate-900/80"
          aria-hidden="true"
        />
      )}
      {isCooling && (
        <span
          className="absolute inset-0 rounded-md border border-white/30"
          aria-hidden="true"
        />
      )}
    </button>
  );
}