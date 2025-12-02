import { RequestHandler } from "express";
import { AuthResponse, LoginRequest, SignupRequest, AuthUser } from "@shared/api";
import "dotenv/config";

// Mock user database (for auth - production should use real database)
const userDatabase: AuthUser[] = [
  {
    id: "1",
    email: process.env.ADMIN_EMAIL || "admin@freemediabuzz.com",
    name: "Admin User",
    role: "admin",
    createdAt: "2024-01-01",
  },
];

// Signup handler
export const signup: RequestHandler = (req, res) => {
  const { email, password, name }: SignupRequest = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // Check if user already exists
  if (userDatabase.find((u) => u.email === email)) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const newUser: AuthUser = {
    id: Date.now().toString(),
    email,
    name,
    role: "user",
    createdAt: new Date().toISOString().split("T")[0],
  };

  userDatabase.push(newUser);

  const response: AuthResponse = {
    user: newUser,
    token: generateMockToken(newUser),
  };

  res.status(201).json(response);
};

// Login handler
export const login: RequestHandler = (req, res) => {
  const { email, password, mode }: LoginRequest & { mode?: "admin" | "user" } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // Special admin credentials bypass
  const adminEmail = process.env.ADMIN_EMAIL || "mediabuzz@local";
  const adminUsername = process.env.ADMIN_USERNAME || "mediabuzz";
  const adminPassword = process.env.ADMIN_PASSWORD || "buzz@2025>";

  if (
    mode === "admin" &&
    (email.toLowerCase() === adminEmail.toLowerCase() || email.toLowerCase() === adminUsername.toLowerCase()) &&
    password === adminPassword
  ) {
    const adminUser: AuthUser = {
      id: "admin",
      email: adminEmail,
      name: "Admin User",
      role: "admin",
      createdAt: new Date().toISOString(),
    };
    const response: AuthResponse = {
      user: adminUser,
      token: generateMockToken(adminUser),
    };
    res.json(response);
    return;
  }

  const user = userDatabase.find((u) => u.email === email);

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  // In production, verify password hash
  const response: AuthResponse = {
    user,
    token: generateMockToken(user),
  };

  res.json(response);
};

// Get current user
export const getCurrentUser: RequestHandler = (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json(req.user);
};

// Logout handler
export const logout: RequestHandler = (req, res) => {
  // In production, invalidate token in database
  res.json({ message: "Logged out successfully" });
};

// Password reset request
export const resetPasswordRequest: RequestHandler = (req, res) => {
  const { email } = req.body;

  const user = userDatabase.find((u) => u.email === email);
  if (!user) {
    // Don't reveal if email exists
    res.json({ message: "If email exists, reset link sent" });
    return;
  }

  // In production, send actual email
  res.json({
    message: "Password reset link sent to email",
    resetToken: "mock-reset-token",
  });
};

// Helper function to generate mock JWT token
function generateMockToken(user: AuthUser): string {
  // In production, use jsonwebtoken library
  return Buffer.from(JSON.stringify(user)).toString("base64");
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
