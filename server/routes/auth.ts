import { RequestHandler } from "express";
import { AuthResponse, LoginRequest, SignupRequest, AuthUser } from "@shared/api";

// Mock user database
const userDatabase: AuthUser[] = [
  {
    id: "1",
    email: "admin@freemediabuzz.com",
    name: "Admin User",
    role: "admin",
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    email: "user@example.com",
    name: "John Doe",
    role: "user",
    createdAt: "2024-01-15",
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
  const { email, password }: LoginRequest = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Missing required fields" });
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
