import { defineConfig } from "drizzle-kit";
import "dotenv/config"; // 👈 ensures .env loads when running Drizzle CLI

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Ensure the database is provisioned.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,   // 👈 optional, shows SQL in terminal
  strict: true,    // 👈 ensures schema safety
});
