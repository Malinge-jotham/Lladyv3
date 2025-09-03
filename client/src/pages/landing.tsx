import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FaGoogle } from "react-icons/fa";

export default function Landing() {
  const handleGoogleAuth = () => {
    window.location.href = "/api/login";
  };

  const handleEmailAuth = () => {
    // For now, redirect to Google auth as well
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2" data-testid="app-title">Eldady</h1>
          <p className="text-muted-foreground text-lg" data-testid="app-subtitle">Where products meet community</p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-lg border border-border" data-testid="auth-card">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Google Auth */}
              <Button
                onClick={handleGoogleAuth}
                variant="outline"
                className="w-full bg-white border border-border py-3 px-4 flex items-center justify-center space-x-3 hover:bg-muted transition-colors"
                data-testid="button-google-auth"
              >
                <FaGoogle className="text-red-500" />
                <span className="font-medium text-foreground">Continue with Google</span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card px-4 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Email Form */}
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email address"
                  className="w-full"
                  data-testid="input-email"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  className="w-full"
                  data-testid="input-password"
                />
                
                <Button
                  onClick={handleEmailAuth}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-email-auth"
                >
                  Sign In
                </Button>
              </div>

              <div className="text-center space-y-2">
                <a href="#" className="text-sm text-accent hover:underline" data-testid="link-forgot-password">
                  Forgot password?
                </a>
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <a href="#" className="text-primary hover:underline" data-testid="link-signup">
                    Sign up
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
