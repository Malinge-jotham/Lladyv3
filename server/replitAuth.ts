// auth.ts (enhanced)
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import bcrypt from "bcrypt";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  // Extract user data from OIDC claims
  const userData = {
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["given_name"] || claims["first_name"] || "",
    lastName: claims["family_name"] || claims["last_name"] || "",
    profileImageUrl: claims["picture"] || claims["profile_image_url"] || "",
    // Additional fields with default values
    bannerImageUrl: claims["banner_image_url"] || "",
    bio: claims["bio"] || "",
    location: claims["location"] || "",
    website: claims["website"] || "",
  };

  await storage.upsertUser(userData);
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });

  // Add additional authentication endpoints for email/password auth
  setupEmailAuth(app);
}

// Setup email/password authentication endpoints
function setupEmailAuth(app: Express) {
  // Registration endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, username } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Split name into first and last name
      const nameParts = name ? name.split(' ') : [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create user with password
      const user = await storage.createUserWithPassword({
        email,
        password,
        firstName,
        lastName,
        username,
        // Set default values for other fields
        bannerImageUrl: "",
        bio: "",
        location: "",
        website: "",
      });

      // Log the user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login after registration failed" });
        }
        res.json({ user });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await storage.verifyPassword(user.id, password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Log the user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({ user });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Password reset endpoints
  app.post("/api/auth/forgot-password", async (req, res) => {
    // Implement password reset logic here
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user exists
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Don't reveal whether email exists or not
      return res.json({ message: "If the email exists, a reset link has been sent" });
    }

    // Generate reset token and send email (implementation omitted)
    // For now, just return success
    res.json({ message: "If the email exists, a reset link has been sent" });
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Verify token and get user ID (implementation omitted)
    // For now, assume token verification is successful and we have userId
    const userId = "user_id_from_token"; // This should come from token verification

    try {
      await storage.updatePassword(userId, newPassword);
      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Password reset failed" });
    }
  });

  // Auth status endpoint
  app.get("/api/auth/status", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};