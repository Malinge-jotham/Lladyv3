import type { Express, RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";
import { supabase } from "./db";




// =======================
// ⚙️ AUTH SETUP ROUTES
// =======================
export function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  // ✅ Allow requests from your frontend (React/Vite)
  app.use(
    cors({
      origin: [
        "http://localhost:5173", // your dev frontend
        "https://eldadymart.vercel.app", // your deployed frontend
        "https://lladynew.onrender.com/"
      ],
      credentials: true,
    })
  );

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Credentials", "true");
    next();
  });

  // --- REGISTER ---
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (error) return res.status(400).json({ message: error.message });

      res.json({ message: "User registered successfully", user: data.user });
    } catch (err) {
      console.error("[Auth] Register error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- LOGIN ---
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error)
        return res.status(401).json({ message: "Invalid credentials" });

      res.json({
        message: "Login successful",
        user: data.user,
        access_token: data.session?.access_token,
      });
    } catch (err) {
      console.error("[Auth] Login error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- STATUS ---
  app.get("/api/auth/status", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "Authorization header missing" });

    const token = authHeader.split(" ")[1];
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user)
      return res.status(401).json({ message: "Invalid or expired token" });

    res.json({ user: data.user });
  });

  // --- LOGOUT ---
  app.post("/api/auth/logout", (req, res) => {
    // Since we’re not using express-session anymore, client should clear token.
    res.json({ message: "Logout successful. Please clear client session." });
  });

  // --- RESET PASSWORD ---
  app.post("/api/auth/reset-password", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return res.status(400).json({ message: error.message });

    res.json({ message: "Password reset email sent" });
  });
}

// =======================
// 🔒 AUTH MIDDLEWARE (Supabase JWT Verification)
// =======================
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  console.log("[Middleware] Checking Supabase token...");

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.warn("[Middleware] Missing Authorization header.");
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      console.warn("[Middleware] Invalid Supabase token:", error);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    console.log("[Middleware] ✅ Authenticated user:", data.user.email);
    req.user = data.user;
    next();
  } catch (err) {
    console.error("[Middleware] Token verification failed:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
};
