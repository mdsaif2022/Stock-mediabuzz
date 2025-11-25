/**
 * Force refresh history utility has been removed.
 * Use the browser's refresh/close controls if needed.
 */

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("[forceRefreshHistory] Disabled – no custom history controls remain.");
}

