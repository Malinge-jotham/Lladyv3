// server/replitAuth.ts
import type { Express, RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import session from "express-session";
import connectPg from "connect-pg-simple";
/*
//secret
// --- Environment setup ---
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables");
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for session storage");
}
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set");
}
*/
const DATABASE_URL="postgresql://postgres:SabbathIsHolyR3st@db.rhebmwmxtiyuazljugfl.supabase.co:5432/postgres"
const PUBLIC_OBJECT_SEARCH_PATHS="public"
const SESSION_SECRET="3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4"
const REPLIT_DOMAINS="localhost"
const REPL_ID="local-dev"
let NODE_ENV


// --- Direct Supabase Connection ---
export const supabase = createClient(
  "https://rhebmwmxtiyuazljugfl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoZWJtd214dGl5dWF6bGp1Z2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTM0OTEsImV4cCI6MjA3NjYyOTQ5MX0.UTwY8C27ED0QYBJzNfAgl-pOJ0aIn98KwQQcGMXdjG8"
);


// --- Express Session (using Postgres store) ---
export function getSession() {
  const pgStore = connectPg(session);
  console.log("[Auth] Using Postgres session store with:", DATABASE_URL);

  return session({
    store: new pgStore({
      conString: DATABASE_URL,
      createTableIfMissing: true,
      tableName: "sessions",
    }),
    secret: SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  });
}

// --- Setup authentication routes ---
export function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Credentials", "true");
    next();
  });

  // --- REGISTER ---
  app.post("/api/auth/register", async (req, res) => {
    console.log("[Auth] Register request body:", req.body);
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (error) {
        console.error("[Auth] Supabase signup error:", error);
        return res.status(400).json({ message: error.message });
      }

      console.log("[Auth] User registered:", data.user);
      res.json({ message: "User registered successfully", user: data.user });
    } catch (err) {
      console.error("[Auth] Register error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- LOGIN ---
  app.post("/api/login", async (req, res) => {
    console.log("[Auth] Login request:", req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[Auth] Supabase login error:", error);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Save session user
      req.session.user = {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.user_metadata?.name || null,
      };

      console.log("[Auth] Session created for user:", req.session.user);
      res.json({ message: "Login successful", user: req.session.user });
    } catch (err) {
      console.error("[Auth] Login error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- LOGOUT ---
  app.get("/api/auth/logout", (req, res) => {
    console.log("[Auth] Logout requested");
    req.session.destroy(() => {
      console.log("[Auth] Session destroyed");
      res.json({ message: "Logged out" });
    });
  });

  // --- STATUS ---
  app.get("/api/auth/status", (req, res) => {
    console.log("[Auth] Checking auth status. Session user:", req.session.user);
    if (req.session.user) {
      return res.json(req.session.user);
    }
    res.status(401).json({ message: "Not authenticated" });
  });

  // --- RESET PASSWORD ---
  app.post("/api/auth/reset-password", async (req, res) => {
    const { email } = req.body;
    console.log("[Auth] Reset password request:", email);
    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      console.error("[Auth] Password reset error:", error);
      return res.status(400).json({ message: error.message });
    }

    console.log("[Auth] Password reset email sent to:", email);
    res.json({ message: "Password reset email sent" });
  });
}
/*

// --- Auth Middleware ---
export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  console.log("[Middleware] Checking authentication...");

  if (req.session) {
    console.log("[Middleware] Session ID:", req.session.id);
    console.log("[Middleware] Session content:", req.session);
  } else {
    console.log("[Middleware] No session object found!");
  }

  if (req.session && req.session.user) {
    console.log("[Middleware] Authenticated user found:", req.session.user);
    req.user = {
      id: req.session.user.id,
      email: req.session.user.email ?? null,
      name: req.session.user.name ?? null,
    };
    return next();
  }

  console.warn("[Middleware] Unauthorized request — no user in session.");
  return res.status(401).json({ message: "Unauthorized" });
};
*/
// --- Auth Middleware (Temporary Testing Mode) ---
export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  

  // Mock user data
  req.user = {
    id: "698cbaa0-3170-455a-9c9c-38f014a9109e",
    email: "malinge069@gmail.com",
    name: "Test User",
  };

  
  return next();
};
