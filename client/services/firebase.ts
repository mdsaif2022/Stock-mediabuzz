import { apiFetch } from "@/lib/api";

// Firebase configuration
// NOTE: In production, use environment variables for sensitive data

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "freemediabuzz.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "freemediabuzz",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "freemediabuzz.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
};

// Firebase Auth Service
export const firebaseAuthService = {
  // Sign up with email and password
  async signup(email: string, password: string, name: string) {
    try {
      // In production, call Firebase API or your backend
      const response = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) throw new Error("Signup failed");

      const data = await response.json();
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      return data;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  },

  // Login with email and password
  async login(email: string, password: string) {
    try {
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error("Login failed");

      const data = await response.json();
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Logout
  async logout() {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }
  },

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get auth token
  getAuthToken() {
    return localStorage.getItem("authToken");
  },

  // Check if user is logged in
  isLoggedIn() {
    return !!localStorage.getItem("authToken");
  },

  // Send password reset email
  async resetPassword(email: string) {
    try {
      const response = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error("Reset password failed");

      return await response.json();
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  },

  // Verify email
  async verifyEmail(token: string) {
    try {
      const response = await apiFetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) throw new Error("Email verification failed");

      return await response.json();
    } catch (error) {
      console.error("Email verification error:", error);
      throw error;
    }
  },
};

// Hooks for Firebase auth
export function useAuth() {
  const user = firebaseAuthService.getCurrentUser();
  const isLoggedIn = firebaseAuthService.isLoggedIn();

  return {
    user,
    isLoggedIn,
    login: firebaseAuthService.login,
    signup: firebaseAuthService.signup,
    logout: firebaseAuthService.logout,
    resetPassword: firebaseAuthService.resetPassword,
  };
}

export default firebaseConfig;
