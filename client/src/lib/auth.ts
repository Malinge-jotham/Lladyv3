import { apiRequest, supabase } from "@/lib/queryClient";

export async function logoutClient() {
  try {
    // Notify server (optional)
    await apiRequest("POST", "/api/auth/logout");
  } catch (err) {
    // ignore server errors; still proceed with client cleanup
    console.warn("Server logout failed:", err);
  }

  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn("Supabase signOut failed:", err);
  }

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (err) {}

  // redirect to home / login
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}