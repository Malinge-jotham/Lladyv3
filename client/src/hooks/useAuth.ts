import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

//import { supabase } from "../supabaseClient"; // ✅ make sure you have this configured

export const supabase = createClient("https://rhebmwmxtiyuazljugfl.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoZWJtd214dGl5dWF6bGp1Z2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTM0OTEsImV4cCI6MjA3NjYyOTQ5MX0.UTwY8C27ED0QYBJzNfAgl-pOJ0aIn98KwQQcGMXdjG8")

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error("Error fetching user:", error);
      setUser(data?.user ?? null);
      setIsLoading(false);
    }

    getUser();

    // 🔁 Listen for login/logout changes
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
