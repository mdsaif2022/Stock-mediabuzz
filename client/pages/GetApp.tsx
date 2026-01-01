import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Smartphone, Download, CheckCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Media } from "@shared/api";
import { apiFetch } from "@/lib/api";

export default function GetApp() {
  const [apps, setApps] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOfficialApps = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await apiFetch("/api/media/official-apps");
        if (!response.ok) {
          throw new Error("Failed to load official apps");
        }
        const data = await response.json();
        setApps(data.data || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unable to load official apps");
      } finally {
        setLoading(false);
      }
    };

    fetchOfficialApps();
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 sm:py-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary to-accent mb-4">
              <Smartphone className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Get Our Official App
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
              Download and install our verified official applications. All apps are tested and approved by our team.
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-center max-w-md mx-auto">
              {error}
            </div>
          )}

          {/* Apps List */}
          {!loading && !error && (
            <>
              {apps.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-border p-12 text-center">
                  <Smartphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Official Apps Available</h3>
                  <p className="text-muted-foreground">
                    Official apps will appear here when they are added by administrators.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {apps.map((app) => (
                    <Link
                      key={app.id}
                      to={`/browse/apk/${app.id}`}
                      className="group bg-white dark:bg-slate-900 rounded-xl border border-border p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50"
                    >
                      {/* App Icon */}
                      <div className="mb-4 flex items-start justify-between">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          {app.iconUrl ? (
                            <img
                              src={app.iconUrl}
                              alt={app.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                                const parent = (e.currentTarget as HTMLImageElement).parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg class="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>`;
                                }
                              }}
                            />
                          ) : (
                            <Smartphone className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-primary">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-xs font-medium">Verified</span>
                        </div>
                      </div>

                      {/* App Title */}
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {app.title}
                      </h3>

                      {/* App Description */}
                      {app.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {app.description}
                        </p>
                      )}

                      {/* App Details */}
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex flex-col gap-1">
                          {app.fileSize && (
                            <span className="text-xs text-muted-foreground">
                              {app.fileSize}
                            </span>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Download className="w-3 h-3" />
                            <span>{app.downloads || 0} downloads</span>
                          </div>
                        </div>
                        <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium group-hover:bg-primary group-hover:text-white transition-colors">
                          Install
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
