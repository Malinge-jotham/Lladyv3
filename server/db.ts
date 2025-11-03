import dotenv from "dotenv";
dotenv.config(); 

import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first"); // 👈 force IPv4 lookup globall

// --- Supabase Client (HTTPS) ---
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoZWJtd214dGl5dWF6bGp1Z2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTM0OTEsImV4cCI6MjA3NjYyOTQ5MX0.UTwY8C27ED0QYBJzNfAgl-pOJ0aIn98KwQQcGMXdjG8";

const DATABASE_URL =
  "https://rhebmwmxtiyuazljugfl.supabase.co";

// =======================
// 🔐 SUPABASE CLIENT
// =======================
export const supabase = createClient(DATABASE_URL, SUPABASE_ANON_KEY);

const sql = postgres(
  "postgresql://postgres.rhebmwmxtiyuazljugfl:SabbathIsHolyR3st@aws-1-us-east-1.pooler.supabase.com:5432/postgres",
  
  {
    ssl: { rejectUnauthorized: false }, // Bypass SSL issues for testing
    family: 4, // Force IPv4
    connection_timeout: 5000, // 5s timeout
  }
);



export const db = drizzle(sql, { schema });
