/**
 * Back button test utility has been removed.
 * Use standard browser navigation to verify history behavior.
 */

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("[testBackButton] Disabled – no custom history manipulation remains.");
}

