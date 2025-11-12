import { useEffect, useState } from "react";
import { supabase } from "@/lib/queryClient";

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
