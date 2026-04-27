import { useEffect, useRef, useState } from "react";
import { buildApiBaseCandidates, buildSocketUrlCandidates } from "../lib/endpoints.js";
import {
  createProfile,
  loadStoredProfile,
  sanitizeColor,
  sanitizeName,
  saveStoredProfile
} from "../lib/profile.js";
const EMPTY_STATS = {
  onlineUsers: 0,
  claimedTiles: 0,
  totalTiles: 0,
  totalClaims: 0,
  uniqueOwners: 0,
  cooldownMs: 0,
  leaderboard: []
};
function patchTiles(previousTiles, updates) {
  const nextTiles = [...previousTiles];
  updates.forEach((tile) => {
    nextTiles[tile.id] = tile;
  });
  return nextTiles;
}
export function useSharedBoard() {
  const [profile, setProfile] = useState(() => loadStoredProfile() || createProfile());
  const [board, setBoard] = useState(null);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [activity, setActivity] = useState([]);
  const [connectionState, setConnectionState] = useState("connecting");
  const [banner, setBanner] = useState("");
  const [pendingTileId, setPendingTileId] = useState(null);
  const [hotTiles, setHotTiles] = useState({});
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const hotTileTimersRef = useRef(new Map());
  const shouldReconnectRef = useRef(true);
  const reconnectAttemptRef = useRef(0);
  const profileRef = useRef(profile);
  const socketCandidateIndexRef = useRef(0);
  const hasLoadedSnapshotRef = useRef(false);
  useEffect(() => {
    profileRef.current = profile;
    saveStoredProfile(profile);
  }, [profile]);
  useEffect(() => {
    shouldReconnectRef.current = true;
    const socketCandidates = buildSocketUrlCandidates();
    const apiBases = buildApiBaseCandidates();
    let isDisposed = false;
    async function loadSnapshot() {
      for (const baseUrl of apiBases) {
        try {
          const response = await fetch(`${baseUrl}/api/state`);
          if (!response.ok) {
            continue;
          }
          const snapshot = await response.json();
          if (isDisposed) {
            return;
          }
          hasLoadedSnapshotRef.current = true;
          setBoard({
            width: snapshot.board.width,
            height: snapshot.board.height,
            tiles: snapshot.tiles,
            serverTime: snapshot.serverTime
          });
          setStats(snapshot.stats);
          setActivity(snapshot.activity);
          return;
        } catch {
          continue;
        }
      }
    }
    function scheduleReconnect() {
      if (!shouldReconnectRef.current || isDisposed) {
        return;
      }
      setConnectionState("reconnecting");
      reconnectAttemptRef.current += 1;
      socketCandidateIndexRef.current = 0;
      const delay = Math.min(1500 + reconnectAttemptRef.current * 700, 6000);
      reconnectTimerRef.current = window.setTimeout(() => {
        connect();
      }, delay);
    }
    function connect() {
      if (socketCandidates.length === 0) {
        setBanner("No backend address was configured for the realtime board.");
        scheduleReconnect();
        return;
      }
      const candidateIndex = socketCandidateIndexRef.current % socketCandidates.length;
      const socketUrl = socketCandidates[candidateIndex];
      const socket = new WebSocket(socketUrl);
      let didReceiveWelcome = false;
      let closeWasHandled = false;
      wsRef.current = socket;
      setConnectionState(reconnectAttemptRef.current > 0 ? "reconnecting" : "connecting");
      const handshakeTimerId = window.setTimeout(() => {
        if (didReceiveWelcome || closeWasHandled || isDisposed) {
          return;
        }
        closeWasHandled = true;
        socket.close();
        if (candidateIndex + 1 < socketCandidates.length) {
          socketCandidateIndexRef.current = candidateIndex + 1;
          connect();
          return;
        }
        if (!hasLoadedSnapshotRef.current) {
          setBanner("The board server is reachable, but realtime sync has not answered yet.");
        }
        scheduleReconnect();
      }, 2500);
      socket.addEventListener("open", () => {
        reconnectAttemptRef.current = 0;
        setConnectionState("connected");
        socket.send(
          JSON.stringify({
            type: "hello",
            payload: profileRef.current
          })
        );
      });
      socket.addEventListener("message", (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }
        switch (message.type) {
          case "welcome":
            didReceiveWelcome = true;
            socketCandidateIndexRef.current = candidateIndex;
            window.clearTimeout(handshakeTimerId);
            setBoard({
              width: message.payload.board.width,
              height: message.payload.board.height,
              tiles: message.payload.tiles,
              serverTime: message.payload.serverTime
            });
            hasLoadedSnapshotRef.current = true;
            setStats(message.payload.stats);
            setActivity(message.payload.activity);
            if (message.payload.you) {
              setProfile(message.payload.you);
            }
            setPendingTileId(null);
            break;
          case "tile_claimed":
            setBoard((currentBoard) =>
              currentBoard
                ? {
                    ...currentBoard,
                    tiles: patchTiles(currentBoard.tiles, [message.payload.tile]),
                    serverTime: message.payload.serverTime
                  }
                : currentBoard
            );
            setStats(message.payload.stats);
            setActivity((currentActivity) =>
              [message.payload.activityItem, ...currentActivity].slice(0, 14)
            );
            setPendingTileId(null);
            flashTile(message.payload.tile.id);
            break;
          case "tiles_synced":
            setBoard((currentBoard) =>
              currentBoard
                ? {
                    ...currentBoard,
                    tiles: patchTiles(currentBoard.tiles, message.payload.tiles),
                    serverTime: message.payload.serverTime
                  }
                : currentBoard
            );
            setStats(message.payload.stats);
            message.payload.tiles.forEach((tile) => flashTile(tile.id));
            break;
          case "stats_updated":
            setStats(message.payload.stats);
            break;
          case "profile_updated":
            if (message.payload.user) {
              setProfile(message.payload.user);
            }
            break;
          case "claim_rejected":
            if (message.payload.tile) {
              setBoard((currentBoard) =>
                currentBoard
                  ? {
                      ...currentBoard,
                      tiles: patchTiles(currentBoard.tiles, [message.payload.tile]),
                      serverTime: message.payload.serverTime || Date.now()
                    }
                  : currentBoard
              );
            }
            setPendingTileId(null);
            setBanner(message.payload.message || "That move did not land.");
            break;
          default:
            break;
        }
      });
      socket.addEventListener("close", () => {
        window.clearTimeout(handshakeTimerId);
        if (!shouldReconnectRef.current || isDisposed) {
          return;
        }
        if (closeWasHandled) {
          return;
        }
        if (!didReceiveWelcome && candidateIndex + 1 < socketCandidates.length) {
          closeWasHandled = true;
          socketCandidateIndexRef.current = candidateIndex + 1;
          connect();
          return;
        }
        closeWasHandled = true;
        scheduleReconnect();
      });
      socket.addEventListener("error", () => {
        window.clearTimeout(handshakeTimerId);
      });
    }
    loadSnapshot();
    connect();
    return () => {
      isDisposed = true;
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      hotTileTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      hotTileTimersRef.current.clear();
      if (wsRef.current && wsRef.current.readyState < WebSocket.CLOSING) {
        wsRef.current.close();
      }
    };
  }, [profile.userId]);
  useEffect(() => {
    if (!banner) {
      return undefined;
    }
    const timerId = window.setTimeout(() => setBanner(""), 2600);
    return () => window.clearTimeout(timerId);
  }, [banner]);
  function flashTile(tileId) {
    setHotTiles((current) => ({
      ...current,
      [tileId]: Date.now()
    }));
    if (hotTileTimersRef.current.has(tileId)) {
      window.clearTimeout(hotTileTimersRef.current.get(tileId));
    }
    const timerId = window.setTimeout(() => {
      setHotTiles((current) => {
        const next = { ...current };
        delete next[tileId];
        return next;
      });
      hotTileTimersRef.current.delete(tileId);
    }, 1400);
    hotTileTimersRef.current.set(tileId, timerId);
  }
  function sendMessage(message) {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      setBanner("Connection is warming back up...");
      return false;
    }
    wsRef.current.send(JSON.stringify(message));
    return true;
  }
  function claimTile(tileId) {
    if (pendingTileId !== null) {
      return;
    }
    const didSend = sendMessage({
      type: "claim_tile",
      payload: {
        tileId
      }
    });
    if (didSend) {
      setPendingTileId(tileId);
    }
  }
  function saveIdentity(nextValues) {
    const nextProfile = {
      ...profileRef.current,
      name: sanitizeName(nextValues.name),
      color: sanitizeColor(nextValues.color)
    };
    setProfile(nextProfile);
    sendMessage({
      type: "update_profile",
      payload: nextProfile
    });
  }
  function newAlias() {
    const nextProfile = createProfile();
    setProfile(nextProfile);
    setBanner("Fresh alias loaded. Your old tiles stay with the old handle.");
  }
  return {
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
  };
}
