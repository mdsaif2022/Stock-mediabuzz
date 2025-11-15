import AdminLayout from "@/components/AdminLayout";
import { Plus, Edit, Trash2, Search, Filter, Upload, X, File, Image as ImageIcon, Video, Music, FileText, CheckCircle2, Link as LinkIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Switch } from "@/components/ui/switch";

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
        }));
        setMediaItems(transformed);
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = mediaItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower === "video") return Video;
    if (lower === "image") return ImageIcon;
    if (lower === "audio") return Music;
    return FileText;
  };

  const getFileIcon = (file: File | Media) => {
    // Check if it's a Media object with category
    if ('category' in file) {
      if (file.category === 'apk') return FileText;
      if (file.category === 'image') return ImageIcon;
      if (file.category === 'video') return Video;
      if (file.category === 'audio') return Music;
      return FileText;
    }
    
    // Check filename for APK files
    if ('name' in file) {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.apk') || fileName.endsWith('.xapk')) {
        return FileText;
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
            <p className="text-muted-foreground mt-2">Add, edit, or delete media files</p>
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
                      accept="image/*,video/*,audio/*,application/vnd.android.package-archive,.apk,.xapk"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                  <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm sm:text-base font-semibold mb-2">
                    Drag and drop files here, or click to select
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Supports: Images, Videos, Audio, APK files (.apk, .xapk) (from desktop, laptop, or mobile)
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
                  } else if (uploadMethod === 'url' && urlLinks.fileUrl) {
                    // Handle URL upload
                    setIsUploading(true);
                    try {
                      const cloudStorageSelect = document.getElementById("cloudStorage") as HTMLSelectElement;
                      const server = cloudStorageSelect?.value || "auto";
                      
                      // Determine resource type from URL
                      const url = urlLinks.fileUrl.toLowerCase();
                      let resourceType = "auto";
                      if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                        resourceType = "image";
                      } else if (url.match(/\.(mp4|webm|mov|avi|mkv)$/i)) {
                        resourceType = "video";
                      } else if (url.match(/\.(apk|xapk)$/i)) {
                        resourceType = "raw"; // Cloudinary treats APK as raw
                      } else if (url.match(/\.(mp3|wav|ogg)$/i)) {
                        resourceType = "raw"; // Cloudinary treats audio as raw
                      } else {
                        resourceType = "raw"; // Default for other file types
                      }

                    const isApkCategory = (category || "").toLowerCase() === "apk";
                    const payload: Record<string, unknown> = {
                      url: urlLinks.fileUrl,
                      server,
                      resource_type: resourceType,
                      title,
                      category,
                      type,
                      description,
                      tags,
                      isPremium,
                      previewUrl: urlLinks.previewUrl || urlLinks.fileUrl,
                    };
                    if (isApkCategory) {
                      payload.iconUrl = appIcon?.url;
                      payload.showScreenshots = showScreenshotsToggle;
                      payload.featureScreenshots = serializeScreenshots();
                    }
                    const response = await apiFetch("/api/upload/url", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                      });

                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.message || "URL upload failed");
                      }

                      const result = await response.json();
                      
                      // Refresh media list
                      await fetchMedia();
                      
                      setIsUploading(false);
                      setUrlLinks({ previewUrl: '', fileUrl: '' });
                      setShowAddForm(false);
                      alert(`Media uploaded successfully from URL to ${result.file.server}!`);
                    } catch (error: any) {
                      console.error("URL upload error:", error);
                      setIsUploading(false);
                      alert(`Upload failed: ${error.message || "Please try again"}`);
                    }
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
              <button className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm sm:text-base touch-manipulation">
                <Filter className="w-4 h-4 flex-shrink-0" />
                Filter
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading media...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? "No media found matching your search." : "No media uploaded yet. Click 'Add Media' to get started."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground">Title</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground">Category</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground">Type</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground">Downloads</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground">Date</th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
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
                          <div className="min-w-0">
                            <p className="font-semibold text-sm sm:text-base truncate">{item.title}</p>
                            {item.isPremium && (
                              <span className="text-xs text-yellow-600 dark:text-yellow-400">Premium</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm sm:text-base">{item.category}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm sm:text-base">{item.type}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm sm:text-base">{item.downloads.toLocaleString()}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm sm:text-base">{item.uploadedDate}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors touch-manipulation">
                            <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          </button>
                          <button 
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
                                try {
                                  const response = await apiFetch(`/api/media/${item.id}`, {
                                    method: "DELETE",
                                  });
                                  if (response.ok) {
                                    await fetchMedia();
                                    alert("Media deleted successfully!");
                                  } else {
                                    alert("Failed to delete media");
                                  }
                                } catch (error) {
                                  console.error("Delete error:", error);
                                  alert("Failed to delete media");
                                }
                              }
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors touch-manipulation"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
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
      </div>
    </AdminLayout>
  );
}
