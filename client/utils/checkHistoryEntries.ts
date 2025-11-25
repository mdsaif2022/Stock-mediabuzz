/**
 * History entry inspection utilities have been removed.
 * Use browser devtools if you need to inspect navigation state.
 */

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("[checkHistoryEntries] Disabled – history entries are no longer analyzed programmatically.");
}

