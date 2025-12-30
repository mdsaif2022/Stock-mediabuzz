import { auth } from "@/lib/firebase";

const normalizeBaseUrl = (url: string) => {
  if (!url) return "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || "");

export const apiFetch = async (path: string, options?: RequestInit) => {
  const targetPath = path.startsWith("/") ? path : `/${path}`;
  const url = API_BASE_URL ? `${API_BASE_URL}${targetPath}` : targetPath;
  
  // Get current user and Firebase ID token
  const currentUser = auth.currentUser;
  
  // Merge headers
  const headers = new Headers(options?.headers);
  
  // Include user info in a format the server expects
  if (currentUser) {
    const userInfo = {
      id: currentUser.uid,
      email: currentUser.email,
      name: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
      role: "user",
    };
    // Encode user info as base64 JSON (browser-compatible)
    const encodedUserInfo = btoa(JSON.stringify(userInfo));
    headers.set("X-User-Info", encodedUserInfo);
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
};

