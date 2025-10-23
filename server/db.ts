
import dotenv from "dotenv";
dotenv.config(); 
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

export const supabase = createClient(
  "https://rhebmwmxtiyuazljugfl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
);

const sql = postgres("postgresql://postgres:SabbathIsHolyR3st@db.rhebmwmxtiyuazljugfl.supabase.co:5432/postgres", {
  ssl: "require",
});

export const db = drizzle(sql, { schema }); 
