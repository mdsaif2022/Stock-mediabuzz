
  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      await loginWithGoogle();
      if (accountType === "admin") {
        throw new Error("Admin accounts must sign in with email/password.");
      }
      if (isCreatorAccount) {
        await refreshCreatorProfile();
        navigate("/creator");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        setError("Google sign-in was cancelled. Please try again.");
      } else {
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Lock, Mail, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_BASE_PATH } from "@/constants/routes";
import { apiFetch } from "@/lib/api";

export default function Login() {
  const [searchParams] = useSearchParams();
  const isAdminMode = searchParams.get("role") === "admin";
  const showVerifyBanner = searchParams.get("verifyEmail") === "1";
  const [accountType, setAccountType] = useState<"user" | "creator" | "admin">(isAdminMode ? "admin" : "user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { login, loginWithGoogle, resetPassword, refreshCreatorProfile } = useAuth();

  const isCreatorAccount = accountType === "creator";

  useEffect(() => {
    if (isAdminMode) {
      setAccountType("admin");
    }
  }, [isAdminMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (accountType === "admin") {
        const response = await apiFetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            mode: "admin",
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.error || "Incorrect admin credentials. Please try again.");
        }

        sessionStorage.setItem("adminSession", "true");
        navigate(ADMIN_BASE_PATH);
        return;
      }

      const emailToUse = email.trim();
      await login(emailToUse, password);

      if (isCreatorAccount) {
        await refreshCreatorProfile(emailToUse);
        navigate("/creator");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      if (accountType === "admin") {
        setError(err?.message || "Failed to sign in as admin. Please check your credentials.");
      } else if (err?.code === "auth/user-not-found" || err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        setError("Incorrect email or password. Please try again.");
      } else if (err?.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please wait a moment or reset your password.");
      } else {
        setError(err?.message || "Failed to sign in. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSuccess("");

    if (accountType === "admin") {
      setError("Admin accounts must sign in with email and password.");
      return;
    }

    setIsLoading(true);
    try {
      await loginWithGoogle(accountType);
      if (isCreatorAccount) {
        await refreshCreatorProfile();
        navigate("/creator");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        setError("Google sign-in was cancelled. Please try again.");
      } else {
        setError(err?.message || "Failed to sign in with Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-border shadow-lg p-6 sm:p-8">
            <div className="flex justify-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center mb-2">Welcome Back</h1>
            <p className="text-center text-muted-foreground mb-8">Sign in to your FreeMediaBuzz account</p>

            {!isAdminMode ? (
              <div className="mb-4 sm:mb-6">
                <p className="text-sm font-semibold mb-2">Sign in as</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType("user")}
                    className={`rounded-lg border px-3 py-2 text-left transition-all ${
                      !isCreatorAccount ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <p className="font-semibold text-sm">Downloader</p>
                    <p className="text-xs text-muted-foreground">Access your downloads</p>
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
                    <p className="text-xs text-muted-foreground">Manage uploads & stats</p>
                  </button>
                </div>
                {isCreatorAccount && (
                  <div className="mt-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 text-xs text-primary">
                    We'll redirect you to the creator portal after sign in.
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4 sm:mb-6 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 text-xs text-primary">
                Admin access detected. Please sign in with admin credentials.
              </div>
            )}

            {showVerifyBanner && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/40 text-amber-800 dark:text-amber-200 rounded-lg text-sm">
                Please verify your email using the link we sent before signing in.
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">{error}</div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 rounded-lg text-sm">{success}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{isAdminMode ? "Username or Email" : "Email Address"}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={isAdminMode ? "text" : "email"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isAdminMode ? "Enter admin username or email" : "you@example.com"}
                    required
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 rounded border-border" />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) {
                      setError("Please enter your email address first");
                      return;
                    }
                    try {
                      await resetPassword(email);
                      setSuccess("Password reset email sent! Check your inbox.");
                      setError("");
                    } catch (err: any) {
                      setError(err?.message || "Failed to send password reset email.");
                      setSuccess("");
                    }
                  }}
                  className="text-primary hover:text-accent transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? "Signing in..." : "Sign In"}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {!isAdminMode && (
              <>
                <div className="my-6 flex items-center gap-4">
                  <div className="flex-1 border-t border-border"></div>
                  <span className="text-xs text-muted-foreground">OR</span>
                  <div className="flex-1 border-t border-border"></div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
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
                </div>
              </>
            )}

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:text-accent transition-colors font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
