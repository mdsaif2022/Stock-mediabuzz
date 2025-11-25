/**
 * Duplicate history clearing utility removed.
 * Close the browser tab or use a hard refresh to reset history.
 */

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("[clearDuplicateHistory] Disabled – manual browser actions are required.");
}

