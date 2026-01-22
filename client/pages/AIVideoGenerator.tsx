import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Sparkles, Loader2, Play, Download, Video, AlertCircle, CheckCircle2, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface GenerationRequest {
  prompt: string;
  duration?: number;
  style?: string;
  aspectRatio?: string;
}

interface GeneratedVideo {
  id: string;
  prompt: string;
  videoUrl: string;
  thumbnailUrl?: string;
  status: "processing" | "completed" | "failed";
  createdAt: string;
  duration?: number;
}

export default function AIVideoGenerator() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<number>(10);
  const [style, setStyle] = useState<string>("realistic");
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [previewVideo, setPreviewVideo] = useState<GeneratedVideo | null>(null);

  useEffect(() => {
    fetchGeneratedVideos();
  }, []);

  const fetchGeneratedVideos = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await apiFetch("/api/ai-video/history");
      if (response.ok) {
        const data = await response.json();
        setGeneratedVideos(data.videos || []);
      }
    } catch (error) {
      console.error("Failed to fetch generated videos:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a video generation prompt",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await apiFetch("/api/ai-video/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          duration,
          style,
          aspectRatio,
        } as GenerationRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate video");
      }

      const data = await response.json();
      
      toast({
        title: "Generation Started",
        description: "Your video is being generated. This may take a few minutes.",
      });

      // Add to generated videos list
      setGeneratedVideos((prev) => [data.video, ...prev]);
      
      // Poll for status updates if video is processing
      if (data.video.status === "processing") {
        pollVideoStatus(data.video.id);
      }
      
      // Clear form
      setPrompt("");
    } catch (error: any) {
      console.error("Generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "An error occurred while generating the video",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const pollVideoStatus = async (videoId: string) => {
    const maxAttempts = 60; // Poll for up to 5 minutes (5 second intervals)
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await apiFetch(`/api/ai-video/status/${videoId}`);
        if (response.ok) {
          const data = await response.json();
          
          setGeneratedVideos((prev) =>
            prev.map((video) =>
              video.id === videoId
                ? { ...video, ...data.video }
                : video
            )
          );

          if (data.video.status === "completed" || data.video.status === "failed") {
            clearInterval(interval);
            if (data.video.status === "completed") {
              toast({
                title: "Video Generated",
                description: "Your video has been successfully generated!",
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to check status:", error);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        toast({
          title: "Status Check Timeout",
          description: "Video generation is taking longer than expected. Please check back later.",
          variant: "destructive",
        });
      }
    }, 5000); // Poll every 5 seconds
  };

  const handleDownload = async (video: GeneratedVideo) => {
    if (video.status !== "completed") {
      toast({
        title: "Video Not Ready",
        description: "This video is still being generated. Please wait.",
        variant: "destructive",
      });
      return;
    }

    if (!video.videoUrl) {
      toast({
        title: "Video URL Missing",
        description: "Video URL is not available. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use proxy endpoint to handle CORS and downloads
      const downloadUrl = `/api/ai-video/download/${video.id}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `ai-video-${video.id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Your video download has started.",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download the video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = (video: GeneratedVideo) => {
    if (video.status !== "completed") {
      toast({
        title: "Video Not Ready",
        description: "This video is still being generated. Please wait.",
        variant: "destructive",
      });
      return;
    }

    if (!video.videoUrl) {
      toast({
        title: "Video URL Missing",
        description: "Video URL is not available. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    // Open video in modal
    setPreviewVideo(video);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 sm:py-12 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 mb-4">
              <Sparkles className="w-5 h-5 text-cyan-500" />
              <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                AI Video Generator
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              {t("aiVideoGenerator.title") || "Generate Videos with AI"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("aiVideoGenerator.description") || "Transform your ideas into stunning videos with the power of artificial intelligence. Simply describe what you want, and we'll bring it to life."}
            </p>
            {/* Info Banner - Will show based on first generation result */}
            <Card className="max-w-2xl mx-auto border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-left space-y-2">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                      AI Video Generation Ready
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Enter a detailed prompt below to generate your video. The AI will create a video that matches your description. If videos don't match your prompts, check your API provider configuration.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generation Form */}
          <Card className="border-2 border-cyan-500/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-500" />
                {t("aiVideoGenerator.createVideo") || "Create New Video"}
              </CardTitle>
              <CardDescription>
                {t("aiVideoGenerator.formDescription") || "Enter a detailed description of the video you want to generate"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="prompt">
                    {t("aiVideoGenerator.promptLabel") || "Video Prompt"} *
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder={t("aiVideoGenerator.promptPlaceholder") || "Example: A serene sunset over a calm ocean with gentle waves, cinematic style, 4K quality..."}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] text-base"
                    required
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("aiVideoGenerator.promptHint") || "Be as descriptive as possible. Include details about style, mood, colors, and any specific elements you want."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">
                      {t("aiVideoGenerator.durationLabel") || "Duration (seconds)"}
                    </Label>
                    <Select
                      value={duration.toString()}
                      onValueChange={(value) => setDuration(parseInt(value))}
                      disabled={isGenerating}
                    >
                      <SelectTrigger id="duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 seconds</SelectItem>
                        <SelectItem value="10">10 seconds</SelectItem>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">60 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="style">
                      {t("aiVideoGenerator.styleLabel") || "Style"}
                    </Label>
                    <Select
                      value={style}
                      onValueChange={setStyle}
                      disabled={isGenerating}
                    >
                      <SelectTrigger id="style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realistic">{t("aiVideoGenerator.styleRealistic") || "Realistic"}</SelectItem>
                        <SelectItem value="cinematic">{t("aiVideoGenerator.styleCinematic") || "Cinematic"}</SelectItem>
                        <SelectItem value="animated">{t("aiVideoGenerator.styleAnimated") || "Animated"}</SelectItem>
                        <SelectItem value="artistic">{t("aiVideoGenerator.styleArtistic") || "Artistic"}</SelectItem>
                        <SelectItem value="abstract">{t("aiVideoGenerator.styleAbstract") || "Abstract"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aspectRatio">
                      {t("aiVideoGenerator.aspectRatioLabel") || "Aspect Ratio"}
                    </Label>
                    <Select
                      value={aspectRatio}
                      onValueChange={setAspectRatio}
                      disabled={isGenerating}
                    >
                      <SelectTrigger id="aspectRatio">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                        <SelectItem value="9:16">9:16 (Vertical/Story)</SelectItem>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                        <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-6 text-lg"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t("aiVideoGenerator.generating") || "Generating..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      {t("aiVideoGenerator.generateButton") || "Generate Video"}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Generated Videos History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {t("aiVideoGenerator.history") || "Your Generated Videos"}
              </h2>
              <Button
                variant="outline"
                onClick={fetchGeneratedVideos}
                disabled={isLoadingHistory}
                size="sm"
              >
                {isLoadingHistory ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("common.refresh") || "Refresh"
                )}
              </Button>
            </div>

            {isLoadingHistory ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-500" />
                <p className="mt-4 text-muted-foreground">
                  {t("common.loading") || "Loading..."}
                </p>
              </div>
            ) : generatedVideos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Video className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-lg font-semibold text-muted-foreground mb-2">
                    {t("aiVideoGenerator.noVideos") || "No videos generated yet"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("aiVideoGenerator.noVideosDescription") || "Create your first AI-generated video using the form above"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden">
                    <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
                      {video.status === "completed" && video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.prompt}
                          className="w-full h-full object-cover"
                        />
                      ) : video.status === "completed" && video.videoUrl ? (
                        <video
                          src={video.videoUrl}
                          className="w-full h-full object-cover"
                          controls={false}
                          muted
                          loop
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {video.status === "processing" ? (
                            <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
                          ) : (
                            <AlertCircle className="w-12 h-12 text-red-500" />
                          )}
                        </div>
                      )}
                      {video.status === "processing" && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-center text-white">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                            <p className="text-sm font-medium">Processing...</p>
                          </div>
                        </div>
                      )}
                      {video.status === "completed" && (
                        <div className="absolute top-2 right-2">
                          <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Ready
                          </span>
                        </div>
                      )}
                      {video.status === "failed" && (
                        <div className="absolute top-2 right-2">
                          <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                            <X className="w-3 h-3" />
                            Failed
                          </span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm font-medium line-clamp-2 mb-3 min-h-[2.5rem]">
                        {video.prompt}
                      </p>
                      <div className="flex gap-2">
                        {video.status === "completed" && video.videoUrl && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handlePreview(video)}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              {t("common.preview") || "Preview"}
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                              onClick={() => handleDownload(video)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              {t("common.download") || "Download"}
                            </Button>
                          </>
                        )}
                        {video.status === "completed" && !video.videoUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            disabled
                          >
                            Video URL Not Available
                          </Button>
                        )}
                        {video.status === "processing" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            disabled
                          >
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Processing...
                          </Button>
                        )}
                        {video.status === "failed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            disabled
                          >
                            Generation Failed
                          </Button>
                        )}
                      </div>
                      {video.duration && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Duration: {video.duration}s
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
      <Dialog open={!!previewVideo} onOpenChange={(open) => !open && setPreviewVideo(null)}>
        <DialogContent className="max-w-4xl w-full p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="line-clamp-2">
              {previewVideo?.prompt || "Video Preview"}
            </DialogTitle>
            <DialogDescription>
              {previewVideo?.duration && `Duration: ${previewVideo.duration}s`}
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-video bg-black">
            {previewVideo?.videoUrl ? (
              <video
                src={previewVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full"
                onError={(e) => {
                  console.error("Video playback error:", e);
                  toast({
                    title: "Playback Error",
                    description: "Failed to load video. The video URL may be invalid or unreachable.",
                    variant: "destructive",
                  });
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <AlertCircle className="w-12 h-12" />
              </div>
            )}
          </div>
          <div className="p-6 pt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewVideo(null)}
            >
              Close
            </Button>
            {previewVideo && (
              <Button
                onClick={() => {
                  if (previewVideo) {
                    handleDownload(previewVideo);
                  }
                }}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

