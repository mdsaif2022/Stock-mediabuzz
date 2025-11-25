/**
 * History cleanup utility has been removed.
 * Browsers prevent programmatic history clearing for security reasons.
 */

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("[cleanHistory] Disabled – close/reopen the tab to clear history.");
}

