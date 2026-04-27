const DEFAULT_BACKEND_PORT = "4000";
const LOCAL_HOST_ALIASES = ["localhost", "127.0.0.1"];
function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}
function isHttpProtocol(protocol) {
  return protocol === "http:" || protocol === "https:";
}
function getConfiguredBackendPort() {
  return String(import.meta.env.VITE_BACKEND_PORT || DEFAULT_BACKEND_PORT);
}
function pushCandidate(list, value) {
  const normalized = normalizeBaseUrl(value);

  if (!normalized || list.includes(normalized)) {
    return;
  }
  list.push(normalized);
}
export function buildApiBaseCandidates() {
  const candidates = [];
  const configuredBase = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (configuredBase) {
    pushCandidate(candidates, configuredBase);
  }
  if (typeof window === "undefined") {
    return candidates;
  }
  const pageProtocol = isHttpProtocol(window.location.protocol)
    ? window.location.protocol
    : "http:";
  if (window.location.origin && isHttpProtocol(window.location.protocol)) {
    pushCandidate(candidates, window.location.origin);
  }
  const backendPort = getConfiguredBackendPort();
  const host = window.location.hostname;
  if (host) {
    pushCandidate(candidates, `${pageProtocol}//${host}:${backendPort}`);
  }
  LOCAL_HOST_ALIASES.forEach((alias) => {
    pushCandidate(candidates, `${pageProtocol}//${alias}:${backendPort}`);
  });
  return candidates;
}
export function buildSocketUrlCandidates() {
  const configuredSocketUrl = normalizeBaseUrl(import.meta.env.VITE_WS_URL);
  const candidates = [];
  if (configuredSocketUrl) {
    pushCandidate(candidates, configuredSocketUrl);
  }
  buildApiBaseCandidates().forEach((baseUrl) => {
    if (baseUrl.startsWith("http://")) {
      pushCandidate(candidates, `${baseUrl.replace("http://", "ws://")}/ws`);
      return;
    }
    if (baseUrl.startsWith("https://")) {
      pushCandidate(candidates, `${baseUrl.replace("https://", "wss://")}/ws`);
    }
  });
  return candidates;
}
