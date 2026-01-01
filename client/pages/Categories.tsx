import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowRight, Play, Image as ImageIcon, Music, Smartphone, FileText } from "lucide-react";
import Layout from "@/components/Layout";
import { apiFetch } from "@/lib/api";

type CategorySummary = {
  category: string;
  count: number;
  latestTitle: string | null;
  previewUrl: string | null;
  sampleId: string | null;
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  video: Play,
  image: ImageIcon,
  audio: Music,
  template: FileText,
  apk: Smartphone,
};

export default function Categories() {
  const [data, setData] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/media/categories/summary")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load categories");
        return res.json();
      })
      .then((payload) => setData(payload || []))
      .catch((err: any) => {
        console.error(err);
        setError(err.message || "Unable to load categories");
      })
      .finally(() => setLoading(false));
  }, []);

  const formatLabel = (category: string) => {
    if (category === "apk") return "APK / App";
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 sm:py-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl space-y-10">
          <div className="text-center space-y-3">
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">Media Categories</p>
            <h1 className="text-3xl sm:text-4xl font-bold">Everything you need, organized</h1>
            <p className="text-muted-foreground">
              Explore real-time counts for each content type. Click a category to jump straight into Browse with that filter applied.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-center">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.map((category) => {
                const Icon = iconMap[category.category] || FileText;
                return (
                  <Link
                    to={`/browse?category=${category.category}`}
                    key={category.category}
                    className="rounded-xl border border-border bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{formatLabel(category.category)}</h3>
                          <p className="text-sm text-muted-foreground">{category.count} files</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="h-36 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 relative group">
                      {category.previewUrl && (() => {
                        // Check if previewUrl is a video file that can't be displayed as an image
                        const isDirectVideoFile = category.previewUrl.match(/\.(mp4|webm|mov|avi|ogg)$/i) && 
                                                 !category.previewUrl.includes('/video/upload/so_') &&
                                                 !category.previewUrl.includes('/image/') &&
                                                 !category.previewUrl.includes('cloudinary.com/video/upload');
                        
                        // If it's a direct video file (not a thumbnail), don't try to display it as an image
                        if (isDirectVideoFile) {
                          return (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground relative">
                              <Icon className="w-10 h-10" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-black/30 dark:bg-white/10 flex items-center justify-center">
                                  <Play className="w-8 h-8 text-white ml-1" />
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        // For images and thumbnails, display normally
                        return (
                          <>
                            <img
                              src={category.previewUrl}
                              alt={category.latestTitle ?? "Preview"}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                // Show fallback icon if image fails to load
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                            <div className="hidden w-full h-full items-center justify-center text-muted-foreground">
                              <Icon className="w-10 h-10" />
                            </div>
                          </>
                        );
                      })()}
                      {!category.previewUrl && (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Icon className="w-10 h-10" />
                        </div>
                      )}
                      {category.latestTitle && (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent text-white p-3 text-sm">
                          <p className="font-medium line-clamp-1">{category.latestTitle}</p>
                          {category.count > 0 && (
                            <p className="text-xs text-white/80 mt-0.5">
                              {category.count === 1 ? "1 file" : `${category.count} files`}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Want to contribute to a category that isn’t listed yet? Submit your request via the creator portal.
            </p>
            <Link
              to="/creator"
              className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold shadow hover:opacity-90 transition"
            >
              Open Creator Portal
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

