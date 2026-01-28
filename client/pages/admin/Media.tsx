import AdminLayout from "@/components/AdminLayout";
import { Plus, Edit, Search, Filter, Upload, X, File, Image as ImageIcon, Video, Music, FileText, CheckCircle2, Link as LinkIcon, Check, XCircle, AlertCircle, Trash2, Loader2, ExternalLink, Sparkles, Laptop } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MediaItem {
  id: string;
  title: string;
  category: string;
  type: string;
  downloads: number;
  uploadedDate: string;
  isPremium: boolean;
  fileUrl?: string;
  previewUrl?: string;
  status?: "pending" | "approved" | "rejected";
  rejectedReason?: string;
  description?: string;
  tags?: string[];
  uploadedBy?: string;
  creatorId?: string;
}

interface FeatureScreenshotDraft {
  id: string;
  title: string;
  description: string;
  url: string;
  uploading?: boolean;
}

export default function AdminMedia() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [urlLinks, setUrlLinks] = useState<{ previewUrl: string; fileUrl: string }>({ previewUrl: '', fileUrl: '' });
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [rejectingMedia, setRejectingMedia] = useState<MediaItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deletingMedia, setDeletingMedia] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [categoryValue, setCategoryValue] = useState("");
  const [appIcon, setAppIcon] = useState<{ url: string; uploading: boolean } | null>(null);
  const [featureScreenshots, setFeatureScreenshots] = useState<FeatureScreenshotDraft[]>([]);
  const [showScreenshotsToggle, setShowScreenshotsToggle] = useState(true);

  // Fetch media from API
  useEffect(() => {
    fetchMedia();
  }, []);

  useEffect(() => {
    if (categoryValue.toLowerCase() !== "apk") {
      setAppIcon(null);
      setFeatureScreenshots([]);
      setShowScreenshotsToggle(true);
    }
  }, [categoryValue]);

  const fetchMedia = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch("/api/media");
      if (response.ok) {
        const data = await response.json();
        // Transform API data to match MediaItem interface
        const transformed = data.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          category: item.category.charAt(0).toUpperCase() + item.category.slice(1),
          type: item.type,
          downloads: item.downloads || 0,
          uploadedDate: item.uploadedDate,
          isPremium: item.isPremium || false,
          fileUrl: item.fileUrl,
          previewUrl: item.previewUrl,
          status: item.status || "approved", // Default to approved for existing items
          rejectedReason: item.rejectedReason,
          description: item.description,
          tags: item.tags || [],
          uploadedBy: item.uploadedBy,
          creatorId: item.creatorId,
        }));
        setMediaItems(transformed);
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = mediaItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort: pending items first, then by date
  const sortedFiltered = [...filtered].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime();
  });

  const pendingCount = mediaItems.filter(item => item.status === "pending").length;

  const handleApprove = async (item: MediaItem) => {
    try {
      const response = await apiFetch(`/api/media/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (response.ok) {
        await fetchMedia();
      } else {
        alert("Failed to approve media");
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("Failed to approve media");
    }
  };

  const handleReject = async (item: MediaItem, reason: string) => {
    try {
      const response = await apiFetch(`/api/media/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", rejectedReason: reason }),
      });
      if (response.ok) {
        setRejectingMedia(null);
        setRejectReason("");
        await fetchMedia();
      } else {
        alert("Failed to reject media");
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("Failed to reject media");
    }
  };

  const handleEdit = async (item: MediaItem, updates: Partial<MediaItem>) => {
    try {
      const response = await apiFetch(`/api/media/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updates.title,
          description: updates.description,
          tags: updates.tags,
          type: updates.type,
          isPremium: updates.isPremium,
        }),
      });
      if (response.ok) {
        setEditingMedia(null);
        await fetchMedia();
      } else {
        alert("Failed to update media");
      }
    } catch (error) {
      console.error("Edit error:", error);
      alert("Failed to update media");
    }
  };

  const handleDelete = async (item: MediaItem) => {
    setIsDeleting(true);
    try {
      const response = await apiFetch(`/api/media/${item.id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        const result = await response.json();
        setDeletingMedia(null);
        await fetchMedia();
        // Show success message
        alert(result.message || "Media deleted successfully from database and Cloudinary");
      } else {
        // Get error message from response
        let errorMessage = "Failed to delete media";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        
        // Close modal and show error
        setDeletingMedia(null);
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      // Close modal even on error
      setDeletingMedia(null);
      alert(error.message || "Failed to delete media. Please check the console for details.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower === "video") return Video;
    if (lower === "image") return ImageIcon;
    if (lower === "audio") return Music;
    if (lower === "software") return Laptop;
    if (lower === "aivideogenerator" || lower === "ai video generator") return Sparkles;
    return FileText;
  };

  const getFileIcon = (file: File | Media) => {
    // Check if it's a Media object with category
    if ('category' in file) {
      if (file.category === 'apk') return FileText;
      if (file.category === 'software') return Laptop;
      if (file.category === 'image') return ImageIcon;
      if (file.category === 'video') return Video;
      if (file.category === 'audio') return Music;
      if (file.category === 'aivideogenerator') return Sparkles;
      return FileText;
    }
    
    // Check filename for APK files
    if ('name' in file) {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.apk') || fileName.endsWith('.xapk')) {
        return FileText;
      }
      if (fileName.endsWith('.zip')) {
        return Laptop;
      }
    }
    
    // Check MIME type
    const type = file.type ? file.type.split('/')[0] : '';
    switch (type) {
      case 'image':
        return ImageIcon;
      case 'video':
        return Video;
      case 'audio':
        return Music;
      default:
        return FileText;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const uploadAssetFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const cloudStorageSelect = document.getElementById("cloudStorage") as HTMLSelectElement;
    const server = cloudStorageSelect?.value || "auto";
    formData.append("server", server);
    const response = await apiFetch("/api/upload/asset", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Failed to upload asset");
    }
    return data.secureUrl || data.url;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...fileArray]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIconFiles = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    setAppIcon({ url: "", uploading: true });
    try {
      const uploadedUrl = await uploadAssetFile(file);
      setAppIcon({ url: uploadedUrl, uploading: false });
    } catch (error: any) {
      console.error("Icon upload failed:", error);
      setAppIcon(null);
      alert(error.message || "Failed to upload icon");
    } finally {
      if (iconInputRef.current) {
        iconInputRef.current.value = "";
      }
    }
  };

  const generateTempId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  };

  const handleScreenshotFiles = async (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      const tempId = generateTempId();
      setFeatureScreenshots((prev) => [
        ...prev,
        {
          id: tempId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          description: "",
          url: "",
          uploading: true,
        },
      ]);
      try {
        const uploadedUrl = await uploadAssetFile(file);
        setFeatureScreenshots((prev) =>
          prev.map((shot) => (shot.id === tempId ? { ...shot, url: uploadedUrl, uploading: false } : shot))
        );
      } catch (error: any) {
        console.error("Screenshot upload failed:", error);
        setFeatureScreenshots((prev) => prev.filter((shot) => shot.id !== tempId));
        alert(error.message || "Failed to upload screenshot");
      }
    }
    if (screenshotInputRef.current) {
      screenshotInputRef.current.value = "";
    }
  };

  const updateScreenshotField = (id: string, field: "title" | "description", value: string) => {
    setFeatureScreenshots((prev) =>
      prev.map((shot) => (shot.id === id ? { ...shot, [field]: value } : shot))
    );
  };

  const removeScreenshot = (id: string) => {
    setFeatureScreenshots((prev) => prev.filter((shot) => shot.id !== id));
  };

  const serializeScreenshots = () =>
    featureScreenshots
      .filter((shot) => shot.url && !shot.uploading)
      .map((shot) => ({
        title: shot.title?.trim() || undefined,
        description: shot.description?.trim() || undefined,
        url: shot.url,
      }));

  const handleUpload = async (title?: string, category?: string, type?: string, description?: string, tags?: string, isPremium?: boolean) => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress({});

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      // Get cloud storage selection
      const cloudStorageSelect = document.getElementById("cloudStorage") as HTMLSelectElement;
      const server = cloudStorageSelect?.value || "auto";
      formData.append("server", server);

      // Add form data
      if (title) formData.append("title", title);
      if (category) formData.append("category", category);
      if (type) formData.append("type", type);
      if (description) formData.append("description", description);
      if (tags) formData.append("tags", tags);
      if (isPremium !== undefined) formData.append("isPremium", isPremium.toString());
      const isApkCategory =
        (category || "").toLowerCase() === "apk" || categoryValue.toLowerCase() === "apk";
      if (isApkCategory) {
        if (appIcon?.url) formData.append("iconUrl", appIcon.url);
        formData.append("showScreenshots", showScreenshotsToggle ? "true" : "false");
        const serializedScreens = serializeScreenshots();
        if (serializedScreens.length > 0) {
          formData.append("featureScreenshots", JSON.stringify(serializedScreens));
        }
      }

      // Determine resource type from files
      const firstFile = selectedFiles[0];
      let resourceType = "auto";
      const fileName = firstFile.name.toLowerCase();
      
      if (firstFile.type.startsWith("image/")) {
        resourceType = "image";
      } else if (firstFile.type.startsWith("video/")) {
        resourceType = "video";
      } else if (firstFile.type.startsWith("audio/")) {
        resourceType = "raw";
      } else if (fileName.endsWith(".apk") || fileName.endsWith(".xapk") || firstFile.type === "application/vnd.android.package-archive") {
        // APK files should be uploaded as raw type
        resourceType = "raw";
      } else if (firstFile.type.startsWith("application/")) { // For templates/documents
        resourceType = "raw";
      }

      formData.append("resource_type", resourceType);

      // Simulate progress for UI feedback
      selectedFiles.forEach((file) => {
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 10;
          setUploadProgress((prev) => ({ ...prev, [file.name]: Math.min(progress, 90) }));
          if (progress >= 90) {
            clearInterval(progressInterval);
          }
        }, 100);
      });

      // Upload to Cloudinary via API
      const response = await apiFetch("/api/upload/file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      const result = await response.json();

      // Mark all files as complete
      selectedFiles.forEach((file) => {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
      });

      // Refresh media list to show new uploads
      await fetchMedia();

      // Reset form after a short delay
      setTimeout(() => {
        setIsUploading(false);
        setSelectedFiles([]);
        setUploadProgress({});
        setShowAddForm(false);
        setAppIcon(null);
        setFeatureScreenshots([]);
        setShowScreenshotsToggle(true);
        setCategoryValue("");
        setUrlLinks({ previewUrl: '', fileUrl: '' });
        alert(`Successfully uploaded ${result.files.length} file(s) to ${result.files[0]?.server || server}!`);
      }, 500);
    } catch (error: any) {
      console.error("Upload error:", error);
      setIsUploading(false);
      alert(`Upload failed: ${error.message || "Please try again"}`);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Media Management</h1>
            <p className="text-muted-foreground mt-2">Add and edit media files. All uploaded content is permanent and cannot be deleted.</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Media
          </button>
        </div>

        {/* Add Media Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold">Add New Media</h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedFiles([]);
                  setUploadProgress({});
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Method Toggle */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium mb-2 sm:mb-3">Upload Method</label>
              <div className="flex gap-2 sm:gap-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setUploadMethod('file')}
                  className={`flex-1 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${
                    uploadMethod === 'file'
                      ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                  Upload Files
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('url')}
                  className={`flex-1 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${
                    uploadMethod === 'url'
                      ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  Upload via URL
                </button>
              </div>
            </div>

            {/* File Upload Section */}
            {uploadMethod === 'file' && (
              <div className="mb-6 sm:mb-8">
                <label className="block text-sm font-medium mb-3 sm:mb-4">Upload Files</label>
                
                {/* Drag and Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                      accept="image/*,video/*,audio/*,application/vnd.android.package-archive,application/zip,application/x-zip-compressed,.apk,.xapk,.zip"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                  <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm sm:text-base font-semibold mb-2">
                    Drag and drop files here, or click to select
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Supports: Images, Videos, Audio, APK files (.apk, .xapk), Software ZIP (.zip)
                  </p>
                </div>

                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                    <h4 className="text-sm font-semibold">Selected Files ({selectedFiles.length})</h4>
                    {selectedFiles.map((file, index) => {
                      const Icon = getFileIcon(file);
                      const progress = uploadProgress[file.name] || 0;
                      const isComplete = progress === 100;
                      
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-border"
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-medium truncate">{file.name}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                            </p>
                            {isUploading && (
                              <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                          {isComplete ? (
                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                              className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                            >
                              <X className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* URL Upload Section */}
            {uploadMethod === 'url' && (
              <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-6">
                <label className="block text-sm font-medium mb-3 sm:mb-4">Upload via URL/Link</label>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Preview URL</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    <input
                      type="url"
                      value={urlLinks.previewUrl}
                      onChange={(e) => setUrlLinks({ ...urlLinks, previewUrl: e.target.value })}
                      placeholder="https://example.com/preview.jpg"
                      className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
                    URL for preview/thumbnail image
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">File URL</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    <input
                      type="url"
                      value={urlLinks.fileUrl}
                      onChange={(e) => setUrlLinks({ ...urlLinks, fileUrl: e.target.value })}
                      placeholder="https://example.com/video.mp4"
                      required
                      className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
                    Direct URL to the media file (video, image, or audio)
                  </p>
                </div>

                {urlLinks.fileUrl && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
                    <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-200">
                      <strong>Note:</strong> The file will be downloaded from the provided URL and uploaded to your selected cloud storage server.
                    </p>
                  </div>
                )}
              </div>
            )}

              {/* Media Details Form */}
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const title = formData.get("title") as string;
                  const category = formData.get("category") as string;
                  const type = formData.get("type") as string;
                  const description = formData.get("description") as string;
                  const tags = formData.get("tags") as string;
                  const isPremium = formData.get("isPremium") === "on";

                  if (uploadMethod === 'file' && selectedFiles.length > 0) {
                    await handleUpload(title, category, type, description, tags, isPremium);
                  } else if (uploadMethod === 'url') {
                    // Validate URL upload
                    if (!urlLinks.fileUrl || !urlLinks.fileUrl.trim()) {
                      alert("Please provide a File URL to upload.");
                      return;
                    }
                    
                    // Validate URL format
                    try {
                      new URL(urlLinks.fileUrl);
                    } catch {
                      alert("Please provide a valid URL for the file.");
                      return;
                    }
                    
                    if (!title || !title.trim()) {
                      alert("Please provide a title for the media.");
                      return;
                    }
                    
                    if (!category || !category.trim()) {
                      alert("Please select a category.");
                      return;
                    }
                    
                    // Handle URL upload
                    setIsUploading(true);
                    try {
                      const cloudStorageSelect = document.getElementById("cloudStorage") as HTMLSelectElement;
                      const server = cloudStorageSelect?.value || "auto";
                      
                      // Determine resource type from URL
                      const url = urlLinks.fileUrl.toLowerCase();
                      let resourceType: "image" | "video" | "raw" | "auto" = "auto";
                      if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                        resourceType = "image";
                      } else if (url.match(/\.(mp4|webm|mov|avi|mkv|m4v)$/i)) {
                        resourceType = "video";
                      } else if (url.match(/\.(apk|xapk)$/i)) {
                        resourceType = "raw"; // Cloudinary treats APK as raw
                      } else if (url.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) {
                        resourceType = "raw"; // Cloudinary treats audio as raw
                      } else {
                        resourceType = "raw"; // Default for other file types
                      }

                      const isApkCategory = (category || "").toLowerCase() === "apk";
                      const payload: Record<string, unknown> = {
                        url: urlLinks.fileUrl.trim(),
                        server,
                        resource_type: resourceType,
                        title: title.trim(),
                        category: category.trim(),
                        type: type?.trim() || "",
                        description: description?.trim() || "",
                        tags: tags?.trim() || "",
                        isPremium: isPremium || false,
                        previewUrl: urlLinks.previewUrl?.trim() || urlLinks.fileUrl.trim(),
                      };
                      
                      if (isApkCategory) {
                        if (appIcon?.url) {
                          payload.iconUrl = appIcon.url;
                        }
                        payload.showScreenshots = showScreenshotsToggle;
                        payload.featureScreenshots = serializeScreenshots();
                      }
                      
                      console.log("Uploading via URL with payload:", payload);
                      
                      const response = await apiFetch("/api/upload/url", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                      });

                      if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: "Unknown error", message: "Failed to upload" }));
                        console.error("Upload error response:", errorData);
                        throw new Error(errorData.message || errorData.error || "URL upload failed");
                      }

                      const result = await response.json();
                      console.log("Upload success:", result);
                      
                      // Refresh media list
                      await fetchMedia();
                      
                      setIsUploading(false);
                      setUrlLinks({ previewUrl: '', fileUrl: '' });
                      setShowAddForm(false);
                      setCategoryValue("");
                      setAppIcon(null);
                      setFeatureScreenshots([]);
                      setShowScreenshotsToggle(true);
                      alert(`Media uploaded successfully from URL to ${result.file?.server || "cloud storage"}!`);
                    } catch (error: any) {
                      console.error("URL upload error:", error);
                      setIsUploading(false);
                      const errorMessage = error.message || error.toString() || "Please try again";
                      alert(`Upload failed: ${errorMessage}`);
                    }
                  } else {
                    alert("Please select files to upload or provide a URL.");
                  }
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
              >
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Media title"
                  required
                  className="w-full px-3 sm:px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select 
                  name="category"
                  required
                  value={categoryValue}
                  onChange={(e) => setCategoryValue(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                >
                  <option value="">Select category</option>
                  <option value="Video">Video</option>
                  <option value="Image">Image</option>
                  <option value="Audio">Audio</option>
                  <option value="Template">Template</option>
                  <option value="APK">APK (Android Apps)</option>
                  <option value="Software">Softower (PC/Laptop ZIP)</option>
                  <option value="AIVideoGenerator">AI Video Generator</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Type/Resolution</label>
                <input
                  type="text"
                  name="type"
                  placeholder="e.g., 4K, 5K, 320kbps"
                  className="w-full px-3 sm:px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cloud Storage</label>
                <select
                  name="cloudStorage"
                  id="cloudStorage"
                  className="w-full px-3 sm:px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                >
                  <option value="auto">Auto (Least Used)</option>
                  <option value="server1">Server 1 (dk81tgmae)</option>
                  <option value="server2">Server 2 (dxijk3ivo)</option>
                  <option value="server3">Server 3 (dvdtbffva)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  placeholder="Media description"
                  className="w-full px-3 sm:px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base resize-none"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  name="tags"
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-3 sm:px-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                />
              </div>
              {categoryValue.toLowerCase() === "apk" && (
                <div className="md:col-span-2 space-y-6 rounded-lg border border-dashed border-border p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 space-y-3">
                      <label className="block text-sm font-medium">App Icon</label>
                      <p className="text-xs text-muted-foreground">
                        Upload a square icon (PNG/JPG). Recommended size 512x512.
                      </p>
                      <div
                        onClick={() => iconInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleIconFiles(e.dataTransfer.files);
                        }}
                        className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary transition-colors"
                      >
                        {appIcon?.url ? (
                          <div className="relative">
                            <img
                              src={appIcon.url}
                              alt="App icon preview"
                              className="w-20 h-20 rounded-2xl object-cover border border-border"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAppIcon(null);
                              }}
                              className="absolute -top-2 -right-2 bg-white text-destructive rounded-full p-1 shadow"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            <p className="text-sm font-semibold">Drag & drop or click to upload</p>
                          </>
                        )}
                        {appIcon?.uploading && <p className="text-xs text-muted-foreground">Uploading icon...</p>}
                        <input
                          ref={iconInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleIconFiles(e.target.files)}
                        />
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <label className="block text-sm font-medium">Display Screenshots</label>
                      <p className="text-xs text-muted-foreground">
                        Toggle to control whether screenshots appear on the user download page.
                      </p>
                      <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold">Show screenshots</p>
                          <p className="text-xs text-muted-foreground">
                            Users will see these screenshots below the download button.
                          </p>
                        </div>
                        <Switch checked={showScreenshotsToggle} onCheckedChange={setShowScreenshotsToggle} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Feature Screenshots</h4>
                        <p className="text-xs text-muted-foreground">
                          Upload multiple screenshots to showcase app features.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => screenshotInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Images
                      </button>
                      <input
                        ref={screenshotInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleScreenshotFiles(e.target.files)}
                      />
                    </div>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleScreenshotFiles(e.dataTransfer.files);
                      }}
                      className="rounded-xl border-2 border-dashed border-border p-4 text-center text-sm text-muted-foreground"
                    >
                      Drag & drop screenshots here or use the button above.
                    </div>
                    {featureScreenshots.length > 0 ? (
                      <div className="space-y-4">
                        {featureScreenshots.map((shot) => (
                          <div
                            key={shot.id}
                            className="flex flex-col sm:flex-row gap-3 border border-border rounded-xl p-3"
                          >
                            <div className="w-full sm:w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                              {shot.url ? (
                                <img src={shot.url} alt={shot.title || "Screenshot"} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs text-muted-foreground">Uploading...</span>
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={shot.title}
                                onChange={(e) => updateScreenshotField(shot.id, "title", e.target.value)}
                                placeholder="Screenshot title"
                                className="w-full px-3 py-2 rounded-lg border border-border bg-slate-50 dark:bg-slate-800 text-sm"
                              />
                              <textarea
                                value={shot.description}
                                onChange={(e) => updateScreenshotField(shot.id, "description", e.target.value)}
                                placeholder="Description (optional)"
                                className="w-full px-3 py-2 rounded-lg border border-border bg-slate-50 dark:bg-slate-800 text-sm resize-none"
                                rows={2}
                              />
                            </div>
                            <div className="flex items-start justify-end">
                              <button
                                type="button"
                                onClick={() => removeScreenshot(shot.id)}
                                disabled={shot.uploading}
                                className="px-3 py-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 text-sm disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No screenshots added yet.</p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 md:col-span-2">
                <input
                  type="checkbox"
                  id="premium"
                  name="isPremium"
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="premium" className="text-sm font-medium">
                  Mark as Premium
                </label>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 md:col-span-2">
                <button
                  type="submit"
                  disabled={
                    (uploadMethod === 'file' && selectedFiles.length === 0) ||
                    (uploadMethod === 'url' && !urlLinks.fileUrl) ||
                    isUploading
                  }
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
                >
                  {uploadMethod === 'file' ? (
                    <>
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      {isUploading ? 'Uploading...' : selectedFiles.length > 0 ? `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}` : 'Select Files First'}
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      {isUploading ? 'Uploading from URL...' : urlLinks.fileUrl ? 'Upload from URL' : 'Enter File URL'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedFiles([]);
                    setUploadProgress({});
                    setUrlLinks({ previewUrl: '', fileUrl: '' });
                    setUploadMethod('file');
                    setAppIcon(null);
                    setFeatureScreenshots([]);
                    setShowScreenshotsToggle(true);
                    setCategoryValue("");
                  }}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-border rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm sm:text-base touch-manipulation"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Media Table */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border overflow-hidden shadow-sm">
          <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button 
                onClick={fetchMedia}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm sm:text-base touch-manipulation"
              >
                <Search className="w-4 h-4 flex-shrink-0" />
                Refresh
              </button>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 sm:px-4 py-2 border border-border rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
              >
                <option value="all">All ({mediaItems.length})</option>
                <option value="pending">Pending ({pendingCount})</option>
                <option value="approved">Approved ({mediaItems.filter(i => i.status === "approved").length})</option>
                <option value="rejected">Rejected ({mediaItems.filter(i => i.status === "rejected").length})</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading media...
            </div>
          ) : sortedFiltered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery || statusFilter !== "all" ? "No media found matching your filters." : "No media uploaded yet. Click 'Add Media' to get started."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '30%' }}>Title</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '10%' }}>Category</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '10%' }}>Type</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '10%' }}>Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '10%' }}>Downloads</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '12%' }}>Date</th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap" style={{ width: '18%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedFiltered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-4 sm:px-6 py-4" style={{ width: '30%' }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                            {item.previewUrl ? (
                              <img
                                src={item.previewUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => ((e.currentTarget.style.display = "none"))}
                              />
                            ) : (
                              (() => {
                                const Icon = getCategoryIcon(item.category);
                                return <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />;
                              })()
                            )}
                          </div>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <Link
                              to={`/browse/${item.category.toLowerCase()}/${item.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-sm sm:text-base hover:text-primary transition-colors flex items-center gap-1.5 group"
                              title={`View ${item.title} on user site`}
                            >
                              <span className="truncate block">{item.title}</span>
                              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </Link>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {item.isPremium && (
                                <span className="text-xs text-yellow-600 dark:text-yellow-400 whitespace-nowrap">Premium</span>
                              )}
                              {item.creatorId && (
                                <span className="text-xs text-muted-foreground whitespace-nowrap">Creator Upload</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm sm:text-base whitespace-nowrap" style={{ width: '10%' }}>{item.category}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm sm:text-base whitespace-nowrap truncate" style={{ width: '10%' }} title={item.type}>{item.type}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap" style={{ width: '10%' }}>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === "pending" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                          item.status === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}>
                          {item.status === "pending" ? "Pending" : item.status === "approved" ? "Approved" : "Rejected"}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm sm:text-base whitespace-nowrap" style={{ width: '10%' }}>{item.downloads.toLocaleString()}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm sm:text-base whitespace-nowrap" style={{ width: '12%' }}>{item.uploadedDate}</td>
                      <td className="px-4 sm:px-6 py-4" style={{ width: '18%' }}>
                        <div className="flex justify-end gap-2">
                          {item.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(item)}
                                className="p-2 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors touch-manipulation"
                                title="Approve"
                              >
                                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                              </button>
                              <button
                                onClick={() => setRejectingMedia(item)}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors touch-manipulation"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setEditingMedia(item)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors touch-manipulation"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          </button>
                          <button
                            onClick={() => setDeletingMedia(item)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors touch-manipulation"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingMedia && (
          <Dialog open={!!editingMedia} onOpenChange={() => setEditingMedia(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Media: {editingMedia.title}</DialogTitle>
              </DialogHeader>
              <EditMediaForm
                media={editingMedia}
                onSave={(updates) => handleEdit(editingMedia, updates)}
                onCancel={() => setEditingMedia(null)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Reject Modal */}
        {rejectingMedia && (
          <Dialog open={!!rejectingMedia} onOpenChange={() => setRejectingMedia(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Media: {rejectingMedia.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rejection Reason</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => {
                    setRejectingMedia(null);
                    setRejectReason("");
                  }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleReject(rejectingMedia, rejectReason)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Modal */}
        {deletingMedia && (
          <Dialog open={!!deletingMedia} onOpenChange={() => !isDeleting && setDeletingMedia(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Media: {deletingMedia.title}</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete the media from both the database and Cloudinary storage.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800 dark:text-red-200">
                      <p className="font-semibold mb-1">Warning: Permanent Deletion</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Media will be removed from the database</li>
                        <li>File will be deleted from Cloudinary storage</li>
                        <li>Preview images and screenshots will also be deleted</li>
                        <li>This action cannot be reversed</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setDeletingMedia(null)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleDelete(deletingMedia)}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Permanently
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}

function EditMediaForm({ media, onSave, onCancel }: { media: MediaItem; onSave: (updates: Partial<MediaItem>) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    title: media.title,
    description: media.description || "",
    tags: Array.isArray(media.tags) ? media.tags.join(", ") : media.tags || "",
    type: media.type,
    isPremium: media.isPremium,
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="tag1, tag2, tag3"
          className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Type/Format</label>
        <input
          type="text"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="edit-premium"
          checked={formData.isPremium}
          onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
          className="w-4 h-4 rounded border-border"
        />
        <label htmlFor="edit-premium" className="text-sm font-medium">
          Mark as Premium
        </label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave({
          ...formData,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        })}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
