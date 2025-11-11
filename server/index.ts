import 'global-agent/bootstrap.js';
//global.GLOBAL_AGENT.HTTP_PROXY = 'http://0.0.0.0';
process.env.NODE_OPTIONS = "--dns-result-order=ipv4first";
// 👈 must come FIRST before anything else
import dotenv from 'dotenv';


import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

app.use("/api", (req, res, next) => {
  // Prevent proxies/browsers from returning 304 for API responses
  res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
  // If you vary by Authorization (recommended), tell caches not to serve same response to different auths
  res.setHeader("Vary", "Authorization");
  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite only in development
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Always serve the app on the port specified in the environment variable PORT
  const port = parseInt(process.env.PORT || "", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`🚀 Server running on port ${port}`);
    }
  );
})();
