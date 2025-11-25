/**
 * History guard logging utility removed.
 * There is no custom history guard anymore.
 */

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("[showHistoryGuardLogs] Disabled – no history guard is installed.");
}

