import { Request } from "express";
import crypto from "crypto";

/**
 * Generate a device fingerprint from request headers
 * Uses IP address + User-Agent for device identification
 * This helps prevent spam accounts by limiting one creator account per device
 */
export function generateDeviceFingerprint(req: Request): string {
  // Get client IP address (handles proxies and load balancers)
  const getClientIp = (req: Request): string => {
    const forwarded = req.headers["x-forwarded-for"];
    const realIp = req.headers["x-real-ip"];
    
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ips = (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(",");
      return ips[0].trim();
    }
    
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }
    
    return req.ip || req.socket.remoteAddress || "unknown";
  };

  const ip = getClientIp(req);
  const userAgent = req.headers["user-agent"] || "unknown";
  
  // Create a hash of IP + User-Agent for privacy
  const fingerprintData = `${ip}|${userAgent}`;
  const hash = crypto.createHash("sha256").update(fingerprintData).digest("hex");
  
  return hash;
}

/**
 * Get a readable device identifier for logging (first 8 chars of hash)
 */
export function getDeviceId(req: Request): string {
  return generateDeviceFingerprint(req).substring(0, 8);
}

