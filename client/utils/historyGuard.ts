/**
 * History guard has been removed.
 * React Router now manages browser history without interception.
 */

export function setupHistoryGuard() {
  if (process.env.NODE_ENV === "development") {
    console.log("[HistoryGuard] Disabled – no pushState overrides are applied.");
  }
}

export function setProgrammaticNavigation() {
  // No-op
}

export function resetHistoryGuard() {
  // No-op
}

export function getHistoryState() {
  return {
    currentUrl: typeof window !== "undefined" ? window.location.href : "",
    urlKey: "",
    historyLength: typeof window !== "undefined" ? window.history.length : 0,
    lastTrackedUrl: null,
    isGuardEnabled: false,
  };
}

export function setHistoryGuardEnabled() {
  // No-op
}

