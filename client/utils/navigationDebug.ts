/**
 * Navigation debugging utilities have been deprecated.
 * React Router now handles POP navigation without any custom overrides.
 */

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("[navigationDebug] Utilities disabled – use standard browser devtools instead.");
}
