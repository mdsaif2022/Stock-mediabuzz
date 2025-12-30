import { Link } from "react-router-dom";
import { Music, Play, Download, Eye } from "lucide-react";
import { Media } from "@shared/api";
import { cn } from "@/lib/utils";
import { getMediaDisplayStats } from "@/lib/mediaUtils";

interface AudioCardProps {
  media: Media;
  to: string;
  variant?: "compact" | "detailed";
  className?: string;
  theme?: "default" | "gradient" | "minimal" | "wave" | "vinyl" | "neon";
}

// Different preview themes for audio items
const audioThemes = {
  default: {
    container: "bg-gradient-to-br from-purple-500 to-pink-500",
    iconBg: "bg-white/20",
    iconColor: "text-white",
  },
  gradient: {
    container: "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500",
    iconBg: "bg-white/20",
    iconColor: "text-white",
  },
  minimal: {
    container: "bg-gradient-to-br from-slate-600 to-slate-800",
    iconBg: "bg-white/10",
    iconColor: "text-white",
  },
  wave: {
    container: "bg-gradient-to-br from-cyan-500 to-blue-600",
    iconBg: "bg-white/20",
    iconColor: "text-white",
  },
  vinyl: {
    container: "bg-gradient-to-br from-amber-600 via-red-600 to-purple-600",
    iconBg: "bg-black/30",
    iconColor: "text-white",
  },
  neon: {
    container: "bg-gradient-to-br from-green-400 via-cyan-500 to-blue-500",
    iconBg: "bg-white/20",
    iconColor: "text-white",
  },
};

export function AudioCard({ media, to, variant = "detailed", className, theme = "default" }: AudioCardProps) {
  // Cycle through themes based on media ID to ensure variety
  const themeKeys = Object.keys(audioThemes) as Array<keyof typeof audioThemes>;
  const themeIndex = parseInt(media.id?.slice(-1) || "0", 16) % themeKeys.length;
  const selectedTheme = theme !== "default" ? theme : themeKeys[themeIndex];
  // Ensure selectedTheme is valid, fallback to "default" if not
  const validTheme: keyof typeof audioThemes = (selectedTheme && selectedTheme in audioThemes) ? selectedTheme as keyof typeof audioThemes : "default";
  const themeStyles = audioThemes[validTheme] || audioThemes.default;

  const displayStats = getMediaDisplayStats(media);
  const downloadsLabel = displayStats.downloadsLabel;
  const viewsLabel = displayStats.viewsLabel;

  if (variant === "compact") {
    return (
      <Link
        to={to}
        className={cn(
          "group relative overflow-hidden rounded-xl shadow-sm hover:shadow-lg transition-all duration-300",
          className
        )}
      >
        <div className={cn("aspect-video relative overflow-hidden", themeStyles.container)}>
          {/* Wave animation overlay for wave theme */}
          {validTheme === "wave" && (
            <div className="absolute inset-0 opacity-20">
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-white/30 animate-pulse" style={{ animationDuration: "2s" }} />
              <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-white/20 animate-pulse" style={{ animationDuration: "1.5s", animationDelay: "0.5s" }} />
            </div>
          )}

          {/* Vinyl record effect for vinyl theme */}
          {validTheme === "vinyl" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-black/40 border-4 border-white/20 animate-spin-slow" />
              <div className="absolute w-8 h-8 rounded-full bg-white/30" />
            </div>
          )}

          {/* Neon glow effect for neon theme */}
          {validTheme === "neon" && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          )}

          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center backdrop-blur-sm", themeStyles.iconBg)}>
              <Music className={cn("w-8 h-8", themeStyles.iconColor)} />
            </div>
          </div>

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", themeStyles.iconBg)}>
                <Play className={cn("w-6 h-6 ml-1", themeStyles.iconColor)} />
              </div>
            </div>
          </div>

          {/* Type badge */}
          {media.type && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-sm">
              {media.type}
            </div>
          )}
        </div>

        <div className="p-3 bg-white dark:bg-slate-900">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
            {media.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{downloadsLabel} downloads</span>
            <span>{viewsLabel} views</span>
          </div>
        </div>
      </Link>
    );
  }

  // Detailed variant
  return (
    <Link
      to={to}
      className={cn(
        "group bg-white dark:bg-slate-900 border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300",
        className
      )}
    >
      <div className={cn("relative aspect-video overflow-hidden", themeStyles.container)}>
        {/* Wave animation overlay for wave theme */}
        {selectedTheme === "wave" && (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-white/30 animate-pulse" style={{ animationDuration: "2s" }} />
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-white/20 animate-pulse" style={{ animationDuration: "1.5s", animationDelay: "0.5s" }} />
            <div className="absolute bottom-0 left-0 right-0 h-1/5 bg-white/10 animate-pulse" style={{ animationDuration: "1s", animationDelay: "1s" }} />
          </div>
        )}

        {/* Vinyl record effect for vinyl theme */}
        {validTheme === "vinyl" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-black/40 border-8 border-white/20 animate-spin-slow" />
            <div className="absolute w-12 h-12 rounded-full bg-white/30" />
            <div className="absolute w-4 h-4 rounded-full bg-black/50" />
          </div>
        )}

        {/* Neon glow effect for neon theme */}
        {validTheme === "neon" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 via-cyan-500/20 to-blue-500/20" />
          </>
        )}

        {/* Minimal theme pattern */}
        {validTheme === "minimal" && (
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "24px 24px"
            }} />
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg", themeStyles.iconBg)}>
            <Music className={cn("w-10 h-10", themeStyles.iconColor)} />
          </div>
        </div>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center shadow-xl", themeStyles.iconBg)}>
              <Play className={cn("w-8 h-8 ml-1", themeStyles.iconColor)} />
            </div>
          </div>
        </div>

        {/* Info overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 text-white text-xs">
          <span className="bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm">{media.type}</span>
          <span className="font-semibold">{media.fileSize}</span>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">Audio</span>
          <span>{new Date(media.uploadedDate).toLocaleDateString()}</span>
        </div>
        <h3 className="text-base font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {media.title}
        </h3>
        {media.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{media.description}</p>
        )}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            <span>{downloadsLabel} downloads</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{viewsLabel} views</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

