/**
 * Back button debug utility removed.
 * React Router's navigation should be observed using built-in devtools only.
 */

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("[debugBackButton] Disabled – no custom debug hooks remain.");
}

