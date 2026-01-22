import { RequestHandler } from "express";
import { getMediaDatabase } from "./media.js";

const SITE_URL = (process.env.SITE_URL || process.env.VITE_SITE_URL || "https://www.freemediabuzz.com").replace(/\/$/, "");
const CACHE_TTL_MINUTES = parseInt(process.env.SITEMAP_CACHE_MINUTES || "360", 10);
const CACHE_TTL_MS = Math.max(5, CACHE_TTL_MINUTES) * 60 * 1000;
const MAX_URLS = 50000;

let cachedXml: string | null = null;
let cachedAt = 0;
let isRefreshing = false;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toDateString = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
};

const buildSitemapXml = async (): Promise<string> => {
  const staticUrls = [
    { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${SITE_URL}/browse`, changefreq: "daily", priority: "0.9" },
    { loc: `${SITE_URL}/categories`, changefreq: "weekly", priority: "0.7" },
    { loc: `${SITE_URL}/contact`, changefreq: "monthly", priority: "0.5" },
    { loc: `${SITE_URL}/creator`, changefreq: "weekly", priority: "0.6" },
    { loc: `${SITE_URL}/user-manual`, changefreq: "monthly", priority: "0.4" },
    { loc: `${SITE_URL}/login`, changefreq: "monthly", priority: "0.3" },
    { loc: `${SITE_URL}/signup`, changefreq: "monthly", priority: "0.3" },
    { loc: `${SITE_URL}/get-app`, changefreq: "monthly", priority: "0.4" },
    { loc: `${SITE_URL}/browse/video`, changefreq: "daily", priority: "0.8" },
    { loc: `${SITE_URL}/browse/image`, changefreq: "daily", priority: "0.8" },
    { loc: `${SITE_URL}/browse/audio`, changefreq: "daily", priority: "0.8" },
    { loc: `${SITE_URL}/browse/template`, changefreq: "daily", priority: "0.7" },
    { loc: `${SITE_URL}/browse/apk`, changefreq: "daily", priority: "0.7" },
    { loc: `${SITE_URL}/browse/aivideogenerator`, changefreq: "daily", priority: "0.6" },
  ];

  const mediaDatabase = await getMediaDatabase();
  const mediaUrls = mediaDatabase
    .filter((item) => !item.status || item.status === "approved")
    .filter((item) => item?.id && item?.category)
    .slice(0, MAX_URLS)
    .map((item) => {
      const category = encodeURIComponent(String(item.category).toLowerCase());
      const id = encodeURIComponent(String(item.id));
      return {
        loc: `${SITE_URL}/browse/${category}/${id}`,
        lastmod: toDateString(item.uploadedDate || (item as any).updatedAt),
        previewUrl: item.previewUrl || item.iconUrl || "",
        fileUrl: item.fileUrl || "",
        title: item.title || "",
        description: item.description || "",
        category: String(item.category || "").toLowerCase(),
      };
    });

  const header =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
    'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" ' +
    'xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';

  const urlEntries = [
    ...staticUrls.map((entry) => {
      return [
        "  <url>",
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : null,
        entry.priority ? `    <priority>${entry.priority}</priority>` : null,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    }),
    ...mediaUrls.map((entry) => {
      const lines = [
        "  <url>",
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : null,
      ];

      if (entry.previewUrl) {
        lines.push(
          "    <image:image>",
          `      <image:loc>${escapeXml(entry.previewUrl)}</image:loc>`,
          entry.title ? `      <image:title>${escapeXml(entry.title)}</image:title>` : null,
          "    </image:image>"
        );
      }

      if (entry.category === "video" && entry.fileUrl) {
        lines.push(
          "    <video:video>",
          entry.previewUrl ? `      <video:thumbnail_loc>${escapeXml(entry.previewUrl)}</video:thumbnail_loc>` : null,
          entry.title ? `      <video:title>${escapeXml(entry.title)}</video:title>` : null,
          entry.description ? `      <video:description>${escapeXml(entry.description)}</video:description>` : null,
          `      <video:content_loc>${escapeXml(entry.fileUrl)}</video:content_loc>`,
          "    </video:video>"
        );
      }

      lines.push("  </url>");
      return lines.filter(Boolean).join("\n");
    }),
  ];

  return `${header}${urlEntries.join("\n")}\n</urlset>\n`;
};

const refreshSitemap = async () => {
  if (isRefreshing) return;
  isRefreshing = true;
  try {
    cachedXml = await buildSitemapXml();
    cachedAt = Date.now();
  } catch (error) {
    console.error("❌ Failed to refresh sitemap:", error);
  } finally {
    isRefreshing = false;
  }
};

// Periodic refresh (acts like a lightweight cron)
setInterval(() => {
  refreshSitemap().catch(() => undefined);
}, CACHE_TTL_MS);

export const getSitemap: RequestHandler = async (_req, res) => {
  const isStale = !cachedXml || Date.now() - cachedAt > CACHE_TTL_MS;
  if (isStale) {
    await refreshSitemap();
  }

  if (!cachedXml) {
    res.status(503).send("Sitemap unavailable");
    return;
  }

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", `public, max-age=${CACHE_TTL_MINUTES * 60}`);
  res.send(cachedXml);
};
