import { Link } from "react-router-dom";
import { ArrowRight, Search, Download, Play, Music, Image as ImageIcon, Zap, Shield, Smile, Smartphone } from "lucide-react";
import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import { Media } from "@shared/api";
import { apiFetch } from "@/lib/api";
import { VideoCard } from "@/components/media/VideoCard";

export default function Index() {
  const [trendingMedia, setTrendingMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Handle hash navigation on page load
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const elementId = hash.substring(1); // Remove the # symbol
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100); // Small delay to ensure page is rendered
    }
  }, []);

  // Fetch trending media from API
  useEffect(() => {
    const fetchTrendingMedia = async () => {
      try {
        setIsLoading(true);
        const response = await apiFetch("/api/media/trending");
        if (response.ok) {
          const data = await response.json();
          setTrendingMedia(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch trending media:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingMedia();
  }, []);

  // Convert API media to display format
  const getThumbnailBg = (category: string, index: number) => {
    const colors = {
      video: ["from-orange-400 to-red-500", "from-green-500 to-emerald-600"],
      image: ["from-blue-400 to-blue-600", "from-slate-500 to-slate-700"],
      audio: ["from-purple-400 to-pink-600", "from-cyan-400 to-blue-500"],
      template: ["from-green-400 to-blue-600", "from-indigo-400 to-purple-600"],
      apk: ["from-indigo-400 to-purple-500", "from-purple-500 to-pink-600"],
    };
    const categoryKey = category.toLowerCase() as keyof typeof colors;
    return colors[categoryKey]?.[index % colors[categoryKey].length] || "from-slate-400 to-slate-600";
  };

  const displayTrendingMedia =
    trendingMedia.length > 0
      ? trendingMedia.slice(0, 7).map((media, index) => ({
          media,
          gradient: getThumbnailBg(media.category, index),
        }))
      : [];

  const categories = [
    {
      id: 1,
      name: "Video",
      icon: Play,
      count: "2.4M",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: 2,
      name: "Images",
      icon: ImageIcon,
      count: "3.1M",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: 3,
      name: "Audio",
      icon: Music,
      count: "2.2M",
      color: "from-orange-500 to-red-500",
    },
    {
      id: 4,
      name: "Templates",
      icon: Zap,
      count: "2.7M",
      color: "from-green-500 to-emerald-500",
    },
    {
      id: 5,
      name: "APK",
      icon: Smartphone,
      count: "2.9M",
      color: "from-indigo-500 to-purple-500",
    },
  ];

  // Fallback demo media if API returns empty
  const fallbackTrendingMedia = [
    {
      id: "1",
      title: "Cinematic Urban Sunset",
      category: "Video",
      type: "4K",
      downloads: "12.5K",
      thumbnail: "bg-gradient-to-br from-orange-400 to-red-500",
      isPremium: false,
      previewUrl: "",
    },
    {
      id: "2",
      title: "Professional Business Background",
      category: "Image",
      type: "4K",
      downloads: "8.3K",
      thumbnail: "bg-gradient-to-br from-blue-400 to-blue-600",
      isPremium: true,
      previewUrl: "",
    },
    {
      id: "3",
      title: "Upbeat Electronic Music",
      category: "Audio",
      type: "320kbps",
      downloads: "5.2K",
      thumbnail: "bg-gradient-to-br from-purple-400 to-pink-600",
      isPremium: false,
      previewUrl: "",
    },
    {
      id: "4",
      title: "Modern Landing Page Template",
      category: "Template",
      type: "React",
      downloads: "3.1K",
      thumbnail: "bg-gradient-to-br from-green-400 to-blue-600",
      isPremium: false,
      previewUrl: "",
    },
    {
      id: "5",
      title: "Forest Walking Path",
      category: "Video",
      type: "1080p",
      downloads: "9.7K",
      thumbnail: "bg-gradient-to-br from-green-500 to-emerald-600",
      isPremium: false,
      previewUrl: "",
    },
    {
      id: "6",
      title: "Modern Tech Workspace",
      category: "Image",
      type: "5K",
      downloads: "11.2K",
      thumbnail: "bg-gradient-to-br from-slate-500 to-slate-700",
      isPremium: false,
      previewUrl: "",
    },
  ];

  const hasLiveTrending = displayTrendingMedia.length > 0;

  const features = [
    {
      icon: Download,
      title: "Unlimited Downloads",
      description: "Download as many files as you want, completely free. No restrictions, no limits.",
    },
    {
      icon: Shield,
      title: "100% Free & Open",
      description: "All media is free to use for personal and commercial projects. No subscriptions needed.",
    },
    {
      icon: Smile,
      title: "High Quality",
      description: "Professional-grade videos, images, audio, and templates from creators worldwide.",
    },
    {
      icon: Zap,
      title: "Easy to Find",
      description: "Powerful search with filters by category, format, resolution, and more.",
    },
  ];

  return (
    <Layout>
      {/* Page Container with distinct visual separation */}
      <div className="relative min-h-screen">
        {/* Hero Section */}
        <section className="relative py-12 sm:py-16 md:py-24 lg:py-32 overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 border-b border-border/50">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl -z-0"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-full blur-3xl -z-0"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 mb-4 sm:mb-6">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-primary">Join 3.4M+ creators using FreeMediaBuzz</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6 animate-fade-in px-2">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Free Stock Media
              </span>
              <br />
              <span className="text-foreground">For Everyone</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
              Download unlimited videos, images, audio tracks, and templates completely free. No subscriptions, no watermarks, no restrictions.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-8 sm:mb-12 animate-slide-up px-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search videos, images, audio..."
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-lg border border-border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                />
              </div>
              <Link
                to="/browse"
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
              >
                Explore
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-border px-2">
              <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">12.8M+</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Media Files</p>
              </div>
              <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary">3.4M+</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Active Users</p>
              </div>
              <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent">48.6M+</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Downloads</p>
              </div>
              <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">100%</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Free Forever</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-12 sm:py-16 md:py-24 bg-white dark:bg-slate-950 scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">Explore by Category</h2>
            <p className="text-base sm:text-lg text-muted-foreground">Find exactly what you're looking for</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.id}
                  to={`/browse/${category.name === "Images" ? "image" : category.name.toLowerCase()}`}
                  className="group animate-slide-up touch-manipulation"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="h-40 sm:h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl overflow-hidden relative group-hover:shadow-lg transition-all active:scale-95">
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6">
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">{category.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{category.count} files</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trending Media Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-12 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">Trending Now</h2>
              <p className="text-base sm:text-lg text-muted-foreground">Most downloaded this week</p>
            </div>
            <Link
              to="/browse"
              className="hidden sm:flex items-center gap-2 text-primary hover:text-accent transition-colors font-semibold"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading trending media...</p>
            </div>
          ) : hasLiveTrending ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {displayTrendingMedia.map(({ media, gradient }) => {
                const downloadsLabel =
                  media.downloads > 1000
                    ? `${(media.downloads / 1000).toFixed(1)}K`
                    : media.downloads.toString();
                const isVideoCard = media.category?.toLowerCase() === "video" && Boolean(media.fileUrl);

                const categoryPath = media.category?.toLowerCase() || "all";
                
                if (isVideoCard) {
                  return (
                    <VideoCard key={media.id} media={media} to={`/browse/${categoryPath}/${media.id}`} variant="compact" className="h-full" />
                  );
                }

                const getIcon = (category: string) => {
                  const categoryLower = category.toLowerCase();
                  if (categoryLower === "video") return Play;
                  if (categoryLower === "image") return ImageIcon;
                  if (categoryLower === "audio") return Music;
                  return Zap;
                };
                const Icon = getIcon(media.category);

                return (
                  <Link
                    key={media.id}
                    to={`/browse/${categoryPath}/${media.id}`}
                    className="group cursor-pointer touch-manipulation active:scale-[0.98] transition-transform"
                  >
                    <div className="relative overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                      {media.previewUrl ? (
                        <div className="aspect-video relative group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                          <img
                            src={media.previewUrl}
                            alt={media.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent) {
                                parent.className = `aspect-video flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300 bg-gradient-to-br ${gradient}`;
                                const iconContainer = document.createElement("div");
                                iconContainer.innerHTML =
                                  '<svg class="w-12 h-12 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                                parent.appendChild(iconContainer);
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 sm:p-4">
                            <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className={`aspect-video flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300 bg-gradient-to-br ${gradient}`}>
                          <Icon className="w-12 h-12 text-white/80" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 sm:p-4">
                            <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                        </div>
                      )}

                      {media.isPremium && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full">
                          Premium
                        </div>
                      )}
                    </div>

                    <div className="mt-3 sm:mt-4">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {media.title}
                      </h3>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-xs bg-secondary/10 text-secondary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                            {media.category}
                          </span>
                          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-muted-foreground px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                            {media.type}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground font-medium">{downloadsLabel}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {fallbackTrendingMedia.map((media) => {
                const categoryPath = media.category?.toLowerCase() || "all";
                const getIcon = (category: string) => {
                  const categoryLower = category.toLowerCase();
                  if (categoryLower === "video") return Play;
                  if (categoryLower === "image") return ImageIcon;
                  if (categoryLower === "audio") return Music;
                  return Zap;
                };
                const Icon = getIcon(media.category);
                return (
                  <Link
                    key={media.id}
                    to={`/browse/${categoryPath}/${media.id}`}
                    className="group cursor-pointer touch-manipulation active:scale-[0.98] transition-transform"
                  >
                    <div className="relative overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                      <div className={`aspect-video flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300 ${media.thumbnail}`}>
                        <Icon className="w-12 h-12 text-white/80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 sm:p-4">
                          <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-4">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {media.title}
                      </h3>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-xs bg-secondary/10 text-secondary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                            {media.category}
                          </span>
                          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-muted-foreground px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                            {media.type}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground font-medium">{media.downloads}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="flex sm:hidden justify-center mt-8">
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 text-primary hover:text-accent transition-colors font-semibold"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">Why Choose FreeMediaBuzz?</h2>
            <p className="text-base sm:text-lg text-muted-foreground">Everything you need, absolutely free</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 sm:p-8 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-border hover:border-primary/50 transition-all hover:shadow-lg animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 sm:py-16 md:py-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">How It Works</h2>
            <p className="text-base sm:text-lg text-muted-foreground">Get your media in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {[
              {
                step: 1,
                title: "Sign Up",
                description: "Create a free account in seconds. No credit card required.",
              },
              {
                step: 2,
                title: "Browse & Search",
                description: "Explore our collection of videos, images, audio, and templates.",
              },
              {
                step: 3,
                title: "Download & Use",
                description: "Download what you need and use it freely in your projects.",
              },
            ].map((item, index) => (
              <div key={index} className="relative animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold mx-auto mb-3 sm:mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-6 sm:top-8 -right-4 w-6 h-6 sm:w-8 sm:h-8">
                    <ArrowRight className="w-full h-full text-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Ad Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl overflow-hidden relative">
            {/* Content */}
            <div className="relative z-10 p-6 sm:p-8 md:p-12 lg:p-16">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 border border-white/20 mb-4 sm:mb-6">
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-white">Featured Promotion</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                  Become a Content Creator
                </h2>
                <p className="text-base sm:text-lg text-white/90 mb-4 sm:mb-6">
                  Join our community of creators and contribute your own media. Earn money through promotions and grow your portfolio.
                </p>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-primary font-semibold rounded-lg hover:shadow-lg transition-all text-sm sm:text-base touch-manipulation"
                >
                  Start Creating
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                </Link>
              </div>
            </div>

            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-br from-slate-900 to-slate-950">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              Ready to find your perfect media?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mb-6 sm:mb-8">
              Start exploring our collection of premium-quality free media today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                to="/browse"
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
              >
                Browse Media
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </Link>
              <Link
                to="/signup"
                className="px-6 sm:px-8 py-2.5 sm:py-3 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/5 transition-all text-sm sm:text-base touch-manipulation"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
    </Layout>
  );
}
