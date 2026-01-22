import { promises as fs } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");
const rootDir = join(__dirname, "..");

const readEnvFile = async (path) => {
  try {
    const content = await fs.readFile(path, "utf-8");
    const lines = content.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
      env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
};

const escapeXml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toDateString = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
};

const fetchAllMedia = async (apiBaseUrl) => {
  if (!apiBaseUrl) return [];
  const pageSize = 1000;
  let page = 1;
  let total = Infinity;
  const items = [];

  while (items.length < total) {
    const url = `${apiBaseUrl.replace(/\/$/, "")}/api/media?page=${page}&pageSize=${pageSize}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch media (${response.status})`);
    }
    const data = await response.json();
    const batch = Array.isArray(data) ? data : data?.data || [];
    items.push(...batch);
    total = typeof data?.total === "number" ? data.total : items.length;
    if (batch.length === 0) break;
    page += 1;
  }

  return items;
};

export const generateSitemap = async () => {
  const env = await readEnvFile(join(rootDir, ".env.production"));
  const siteUrl = env.VITE_SITE_URL || env.SITE_URL || "https://www.freemediabuzz.com";
  const apiBaseUrl = env.VITE_API_BASE_URL || "";

  const staticUrls = [
    { loc: `${siteUrl}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${siteUrl}/browse`, changefreq: "daily", priority: "0.9" },
    { loc: `${siteUrl}/categories`, changefreq: "weekly", priority: "0.7" },
    { loc: `${siteUrl}/contact`, changefreq: "monthly", priority: "0.5" },
    { loc: `${siteUrl}/creator`, changefreq: "weekly", priority: "0.6" },
    { loc: `${siteUrl}/user-manual`, changefreq: "monthly", priority: "0.4" },
    { loc: `${siteUrl}/login`, changefreq: "monthly", priority: "0.3" },
    { loc: `${siteUrl}/signup`, changefreq: "monthly", priority: "0.3" },
    { loc: `${siteUrl}/get-app`, changefreq: "monthly", priority: "0.4" },
    { loc: `${siteUrl}/browse/video`, changefreq: "daily", priority: "0.8" },
    { loc: `${siteUrl}/browse/image`, changefreq: "daily", priority: "0.8" },
    { loc: `${siteUrl}/browse/audio`, changefreq: "daily", priority: "0.8" },
    { loc: `${siteUrl}/browse/template`, changefreq: "daily", priority: "0.7" },
    { loc: `${siteUrl}/browse/apk`, changefreq: "daily", priority: "0.7" },
    { loc: `${siteUrl}/browse/aivideogenerator`, changefreq: "daily", priority: "0.6" },
  ];

  let mediaItems = [];
  try {
    mediaItems = await fetchAllMedia(apiBaseUrl);
  } catch (error) {
    console.warn("⚠️ Failed to fetch media for sitemap:", error.message || error);
  }

  const mediaUrls = mediaItems
    .filter((item) => item?.id && item?.category)
    .slice(0, 50000)
    .map((item) => {
      const category = encodeURIComponent(String(item.category).toLowerCase());
      const id = encodeURIComponent(String(item.id));
      const loc = `${siteUrl}/browse/${category}/${id}`;
      return {
        loc,
        lastmod: toDateString(item.uploadedDate || item.updatedAt),
        changefreq: "weekly",
        priority: "0.6",
        title: item.title || "",
        description: item.description || "",
        previewUrl: item.previewUrl || item.iconUrl || "",
        fileUrl: item.fileUrl || "",
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
        entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : null,
        entry.priority ? `    <priority>${entry.priority}</priority>` : null,
      ];

      if (entry.previewUrl) {
        lines.push(
          `    <image:image>`,
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

  const xml = `${header}${urlEntries.join("\n")}\n</urlset>\n`;

  const distDir = join(rootDir, "dist", "spa");
  try {
    await fs.mkdir(distDir, { recursive: true });
    await fs.writeFile(join(distDir, "sitemap.xml"), xml, "utf-8");
    console.log("✅ Sitemap generated at dist/spa/sitemap.xml");
  } catch (error) {
    console.error("❌ Failed to write sitemap:", error.message || error);
  }
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  generateSitemap();
}
