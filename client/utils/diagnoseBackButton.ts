/**
 * Back button diagnosis utilities have been removed.
 * React Router's default behavior should be used without custom detectors.
 */

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("[diagnoseBackButton] Disabled – rely on standard navigation logging.");
}

