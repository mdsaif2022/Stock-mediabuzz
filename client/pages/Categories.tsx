import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowRight, Play, Image as ImageIcon, Music, Smartphone, FileText, Sparkles, Laptop } from "lucide-react";
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
  software: Laptop,
  aivideogenerator: Sparkles,
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
    if (category === "software") return "Softower";
    if (category === "aivideogenerator") return "AI Video Generator";
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
                      {(() => {
                        // Always show default theme for audio category
                        if (category.category === "audio") {
                          return (
                            <div className="w-full h-full bg-gradient-to-br from-purple-400 via-pink-500 to-cyan-500 dark:from-purple-600 dark:via-pink-600 dark:to-cyan-600 flex items-center justify-center relative overflow-hidden">
                              {/* Animated background pattern */}
                              <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                              </div>
                              <Music className="w-16 h-16 text-white relative z-10 drop-shadow-lg" />
                            </div>
                          );
                        }
                        
                        // Always show default theme for APK category
                        if (category.category === "apk") {
                          return (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600 relative overflow-hidden p-3">
                              {/* Grid of app icons */}
                              <div className="grid grid-cols-3 gap-2 h-full">
                                {[...Array(9)].map((_, i) => (
                                  <div
                                    key={i}
                                    className="bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30 dark:border-white/20 shadow-lg"
                                  >
                                    <Smartphone 
                                      className={`w-6 h-6 text-white ${
                                        i % 3 === 0 ? "rotate-[-5deg]" : i % 3 === 2 ? "rotate-[5deg]" : ""
                                      }`}
                                    />
                                  </div>
                                ))}
                              </div>
                              {/* Overlay gradient */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                            </div>
                          );
                        }
                        
                        // Always show default theme for template category
                        if (category.category === "template") {
                          return (
                            <div className="w-full h-full bg-gradient-to-br from-green-400 via-blue-500 to-indigo-600 dark:from-green-600 dark:via-blue-600 dark:to-indigo-700 flex items-center justify-center relative overflow-hidden">
                              {/* Animated background pattern */}
                              <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                              </div>
                              <FileText className="w-16 h-16 text-white relative z-10 drop-shadow-lg" />
                            </div>
                          );
                        }
                        
                        // Always show default theme for video category
                        if (category.category === "video") {
                          return (
                            <div className="w-full h-full bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 dark:from-red-600 dark:via-orange-600 dark:to-yellow-600 flex items-center justify-center relative overflow-hidden">
                              {/* Animated background pattern */}
                              <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                              </div>
                              <Play className="w-16 h-16 text-white relative z-10 drop-shadow-lg" />
                            </div>
                          );
                        }
                        
                        // Always show default theme for image category
                        if (category.category === "image") {
                          return (
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600 flex items-center justify-center relative overflow-hidden">
                              {/* Animated background pattern */}
                              <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                              </div>
                              <ImageIcon className="w-16 h-16 text-white relative z-10 drop-shadow-lg" />
                            </div>
                          );
                        }
                        
                        // Always show default theme for AI Video Generator category
                        if (category.category === "aivideogenerator") {
                          return (
                            <div className="w-full h-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 dark:from-cyan-600 dark:via-blue-600 dark:to-purple-600 flex items-center justify-center relative overflow-hidden">
                              {/* Animated background pattern */}
                              <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                              </div>
                              <Sparkles className="w-16 h-16 text-white relative z-10 drop-shadow-lg" />
                            </div>
                          );
                        }
                        
                        // Default fallback for unknown categories
                        return (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Icon className="w-10 h-10" />
                          </div>
                        );
                      })()}
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

