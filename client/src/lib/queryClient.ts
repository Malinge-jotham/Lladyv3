import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";


// ✅ Initialize Supabase client
export const supabase = createClient(
  "https://rhebmwmxtiyuazljugfl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoZWJtd214dGl5dWF6bGp1Z2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTM0OTEsImV4cCI6MjA3NjYyOTQ5MX0.UTwY8C27ED0QYBJzNfAgl-pOJ0aIn98KwQQcGMXdjG8"
);

// ✅ Helper to throw if response is not OK
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// ✅ Main API Request Function with headers
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  // Get Supabase session token
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  // Set headers
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`http://https://lladynew.onrender.com${url}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// ✅ Default query function for react-query
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`http://https://lladynew.onrender.com${queryKey.join("/")}`, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// ✅ Create a global QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
