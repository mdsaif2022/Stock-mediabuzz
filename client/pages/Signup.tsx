import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";

export default function Signup() {
  const [accountType, setAccountType] = useState<"user" | "creator">("user");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const isCreatorAccount = accountType === "creator";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const registerCreatorProfile = async (name: string, email: string) => {
    try {
      await apiFetch("/api/creators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name || email,
          email,
          firebaseUid: auth.currentUser?.uid,
        }),
      });
    } catch (err) {
      console.error("Creator registration failed:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!formData.acceptTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    setIsLoading(true);

    try {
      await signup(formData.email, formData.password, formData.name, accountType);
      if (isCreatorAccount) {
        await registerCreatorProfile(formData.name, formData.email);
      }
      navigate("/login?verifyEmail=1", { replace: true });
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setIsLoading(true);
    try {
      await loginWithGoogle(accountType);
      if (isCreatorAccount && auth.currentUser?.email) {
        await registerCreatorProfile(auth.currentUser.displayName || auth.currentUser.email, auth.currentUser.email);
      }
      navigate(isCreatorAccount ? "/creator" : "/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign up.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-border shadow-lg p-6 sm:p-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center mb-2">Join FreeMediaBuzz</h1>
            <p className="text-center text-muted-foreground mb-8">
              Sign up for free to start downloading media
            </p>

            {/* Account Type Toggle */}
            <div className="mb-4 sm:mb-6">
              <p className="text-sm font-semibold mb-2">Choose account type</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType("user")}
                  className={`rounded-lg border px-3 py-2 text-left transition-all ${
                    !isCreatorAccount ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border hover:border-primary/40"
                  }`}
                >
                  <p className="font-semibold text-sm">Downloader</p>
                  <p className="text-xs text-muted-foreground">Access free media instantly</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("creator")}
                  className={`rounded-lg border px-3 py-2 text-left transition-all ${
                    isCreatorAccount ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border hover:border-primary/40"
                  }`}
                >
                  <p className="font-semibold text-sm flex items-center gap-1">
                    <Sparkles className="w-4 h-4" /> Creator
                  </p>
                  <p className="text-xs text-muted-foreground">Upload media & earn exposure</p>
                </button>
              </div>
              {isCreatorAccount && (
                <div className="mt-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-primary">
                  Creator access is enabled manually by the admin team. After signing up, an admin will verify your account inside the dashboard.
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        required
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
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
                        required
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>


                  {/* Terms */}
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-border mt-1"
                    />
                    <span className="text-sm text-muted-foreground">
                      I agree to the{" "}
                      <Link to="/terms" className="text-primary hover:text-accent transition-colors">
                        Terms of Service
                      </Link>
                      {" "}and{" "}
                      <Link to="/privacy" className="text-primary hover:text-accent transition-colors">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !formData.acceptTerms}
                    className="w-full py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? "Creating account..." : isCreatorAccount ? "Create & notify admin" : "Create Account"}
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                  <p className="text-xs text-muted-foreground text-center">
                    A verification link will be sent to your email before you can sign in.
                    {isCreatorAccount && " Admins will also enable creator access after you verify."}
                  </p>
                </form>

                {/* Divider */}
                <div className="my-6 flex items-center gap-4">
                  <div className="flex-1 border-t border-border"></div>
                  <span className="text-xs text-muted-foreground">OR</span>
                  <div className="flex-1 border-t border-border"></div>
                </div>

                {/* Social Signup */}
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={isLoading}
                  className="w-full py-2 border border-border rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
            
            {/* Login Link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:text-accent transition-colors font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
