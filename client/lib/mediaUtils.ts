import { Media } from "@shared/api";

/**
 * Generate fake downloads/views based on media ID for consistency
 * Returns a value between 1.6K - 9.4K or more
 */
export function getFakeDownloads(mediaId: string, actualDownloads: number = 0): number {
  // If actual downloads exist and are > 0, use them
  if (actualDownloads > 0) {
    return actualDownloads;
  }

  // Generate consistent fake value based on media ID
  // Use a simple hash of the ID to get a consistent number
  let hash = 0;
  for (let i = 0; i < mediaId.length; i++) {
    const char = mediaId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Normalize to positive number and scale to 1.6K - 9.4K range
  const normalized = Math.abs(hash) % 1000;
  const minValue = 1600; // 1.6K
  const maxValue = 9400; // 9.4K
  const range = maxValue - minValue;
  const fakeValue = minValue + (normalized / 1000) * range;

  // Sometimes return values above 9.4K (up to 50K) for variety
  if (normalized % 10 === 0) {
    const extendedMax = 50000;
    const extendedRange = extendedMax - maxValue;
    return maxValue + (normalized / 1000) * extendedRange;
  }

  return Math.round(fakeValue);
}

/**
 * Generate fake views based on media ID for consistency
 * Views are typically higher than downloads
 */
export function getFakeViews(mediaId: string, actualViews: number = 0): number {
  // If actual views exist and are > 0, use them
  if (actualViews > 0) {
    return actualViews;
  }

  // Generate consistent fake value based on media ID
  let hash = 0;
  for (let i = 0; i < mediaId.length; i++) {
    const char = mediaId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  // Views are typically 1.5x to 3x downloads
  const normalized = Math.abs(hash) % 1000;
  const minValue = 2400; // 2.4K (1.5x of 1.6K)
  const maxValue = 28200; // 28.2K (3x of 9.4K)
  const range = maxValue - minValue;
  const fakeValue = minValue + (normalized / 1000) * range;

  // Sometimes return values above 28.2K (up to 100K) for variety
  if (normalized % 10 === 0) {
    const extendedMax = 100000;
    const extendedRange = extendedMax - maxValue;
    return maxValue + (normalized / 1000) * extendedRange;
  }

  return Math.round(fakeValue);
}

/**
 * Format number to K notation (e.g., 1600 -> "1.6K", 9400 -> "9.4K")
 */
export function formatCount(count: number): string {
  if (count >= 1000) {
    const kValue = count / 1000;
    // Show one decimal place if needed
    if (kValue % 1 === 0) {
      return `${kValue}K`;
    }
    return `${kValue.toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS format
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) {
    return "00:00";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get display stats for media (with fake values if needed)
 */
export function getMediaDisplayStats(media: Media): {
  downloads: number;
  views: number;
  downloadsLabel: string;
  viewsLabel: string;
} {
  const downloads = getFakeDownloads(media.id, media.downloads || 0);
  const views = getFakeViews(media.id, media.views || 0);

  return {
    downloads,
    views,
    downloadsLabel: formatCount(downloads),
    viewsLabel: formatCount(views),
  };
}

