const normalizeBaseUrl = (url: string) => {
  if (!url) return "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || "");

export const apiFetch = (path: string, options?: RequestInit) => {
  const targetPath = path.startsWith("/") ? path : `/${path}`;
  const url = API_BASE_URL ? `${API_BASE_URL}${targetPath}` : targetPath;
  return fetch(url, options);
};

