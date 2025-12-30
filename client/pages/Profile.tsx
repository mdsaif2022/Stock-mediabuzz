import Layout from "@/components/Layout";
import { User, Mail, Phone, Camera, Save, ArrowLeft, DollarSign } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile, updateEmail } from "firebase/auth";

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phoneNumber: "",
    photoURL: "",
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        displayName: currentUser.displayName || "",
        email: currentUser.email || "",
        phoneNumber: currentUser.phoneNumber || "",
        photoURL: currentUser.photoURL || "",
      });
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // Update display name and photo URL
      await updateProfile(currentUser, {
        displayName: formData.displayName,
        photoURL: formData.photoURL || undefined,
      });

      // Update email if changed
      if (formData.email !== currentUser.email && formData.email) {
        await updateEmail(currentUser, formData.email);
      }

      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 sm:py-8 px-4 sm:px-6">
          <div className="container mx-auto max-w-2xl">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-6 sm:p-8 shadow-sm text-center">
              <p className="text-muted-foreground mb-4">Please log in to view your profile.</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 sm:py-8 px-4 sm:px-6">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold">User Profile</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">Manage your profile information</p>
          </div>

          {/* Profile Form */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4 sm:p-6 md:p-8 shadow-sm">
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Profile Picture */}
            <div className="flex flex-col items-center mb-6 sm:mb-8">
              <div className="relative mb-4">
                {formData.photoURL ? (
                  <img
                    src={formData.photoURL}
                    alt={formData.displayName || "Profile"}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-border"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center border-4 border-border">
                    <User className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  </div>
                )}
                <button
                  type="button"
                  className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-lg"
                  onClick={() => document.getElementById("photo-upload")?.click()}
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // In a real app, you would upload to Firebase Storage
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData((prev) => ({
                          ...prev,
                          photoURL: reader.result as string,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">Click camera icon to change profile picture</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                  />
                </div>
                {currentUser.emailVerified === false && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                    Email not verified. Verification is optional.
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+1234567890"
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg border border-border bg-slate-100 dark:bg-slate-800 text-muted-foreground text-sm sm:text-base cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Phone number is managed through Firebase Authentication
                </p>
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-sm font-medium mb-2">Profile Picture URL</label>
                <input
                  type="url"
                  name="photoURL"
                  value={formData.photoURL}
                  onChange={handleChange}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Or enter a direct URL to your profile picture
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
                >
                  <Save className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
                <Link
                  to="/dashboard"
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-border rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center text-sm sm:text-base touch-manipulation"
                >
                  Cancel
                </Link>
              </div>
            </form>

            {/* Quick Links */}
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Quick Links</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  to="/earnings"
                  className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Earnings & Referrals</div>
                    <div className="text-xs text-muted-foreground">View your earnings and referrals</div>
                  </div>
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Dashboard</div>
                    <div className="text-xs text-muted-foreground">Go back to dashboard</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Account Info */}
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Account Information</h3>
              <div className="space-y-2 sm:space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-xs truncate ml-4">{currentUser.uid}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Account Created</span>
                  <span>{currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Last Sign In</span>
                  <span>{currentUser.metadata.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString() : "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email Verified</span>
                  <span className={currentUser.emailVerified ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}>
                    {currentUser.emailVerified ? "Verified" : "Not Verified (Optional)"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

