/**
 * History diagnosis utilities have been removed.
 * Use standard browser devtools or React Router instrumentation instead.
 */

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("[diagnoseHistory] Disabled – history API is no longer patched.");
}

