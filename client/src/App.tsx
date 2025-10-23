
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Vroom from "@/pages/vroom"; // existing
import Messages from "@/pages/messages";
import Trending from "@/pages/trending";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import ProductDetailPage from "@/components/product/ProductDetailPage";

// 🔥 import the scaffolded pages
import HashtagPage from "@/pages/hashtags/[tag]";
import VroomDetailsPage from "@/pages/vrooms/[id]";

// 🔥 import the new policy pages
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes accessible to all users */}
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/explore" component={Explore} />
          <Route path="/vroom/:id?" component={Vroom} /> {/* keep this if needed */}
          <Route path="/messages" component={Messages} />
          <Route path="/trending" component={Trending} />
          <Route path="/profile" component={Profile} />
          <Route path="/products/:id" component={ProductDetailPage} />


          {/* ✅ new dynamic routes */}
          <Route path="/hashtags/:tag" component={HashtagPage} />
          <Route path="/vrooms/:id" component={VroomDetailsPage} />
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
