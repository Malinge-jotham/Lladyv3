import dotenv from "dotenv";
dotenv.config(); 

import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first"); // 👈 force IPv4 lookup globall

// --- Supabase Client (HTTPS) ---
export const supabase = createClient(
  "https://rhebmwmxtiyuazljugfl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // replace with your actual anon/service key
);
/*
// --- Database Connection (Force IPv4) ---
const sql = postgres(
  "postgresql://postgres:SabbathIsHolyR3st@db.rhebmwmxtiyuazljugfl.supabase.co:5432/postgres",
  {
    ssl: "require",
    hostname: "db.rhebmwmxtiyuazljugfl.supabase.co",
    port: 5432,
    connection: {
      family: 4, // 👈 Force IPv4 to bypass IPv6 unreachable error
    },
  }
); */
const sql = postgres(
  "postgresql://postgres.rhebmwmxtiyuazljugfl:SabbathIsHolyR3st@aws-1-us-east-1.pooler.supabase.com:5432/postgres",
  
  {
    ssl: { rejectUnauthorized: false }, // Bypass SSL issues for testing
    family: 4, // Force IPv4
    connection_timeout: 5000, // 5s timeout
  }
);



export const db = drizzle(sql, { schema });
