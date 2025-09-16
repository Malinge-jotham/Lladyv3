import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Vroom from "@/pages/vroom";
import Messages from "@/pages/messages";
import Trending from "@/pages/trending";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route component={Landing} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/explore" component={Explore} />
          {/* Separate routes for user vrooms and specific vroom */}
          {/* Routes for vrooms */}
          <Route path="/vroom/:id?" component={Vroom} />
          <Route path="/messages" component={Messages} />
          <Route path="/trending" component={Trending} />
          <Route path="/profile" component={Profile} />

        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
