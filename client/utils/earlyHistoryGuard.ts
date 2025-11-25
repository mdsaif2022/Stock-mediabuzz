/**
 * Early History Guard has been completely disabled.
 * React Router now manages browser history natively without any overrides.
 */

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[Early History Guard] Disabled – React Router uses native history API.');
}

