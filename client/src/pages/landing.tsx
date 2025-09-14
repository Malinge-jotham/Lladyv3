import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FaGoogle } from "react-icons/fa";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/status', {
          credentials: 'include'
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.log('Not authenticated');
      }
    };

    checkAuthStatus();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGoogleAuth = () => {
    window.location.href = "/api/login";
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: isLogin ? 'Login successful!' : 'Account created successfully!' });

        // Update auth state
        setUser(result.user);
        setIsAuthenticated(true);

        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setMessage({ type: 'error', text: 'Please enter your email address first' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { credentials: 'include' });
      setUser(null);
      setIsAuthenticated(false);
      setMessage({ type: 'success', text: 'Logged out successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Logout failed. Please try again.' });
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setMessage({ type: '', text: '' });
  };

  // If user is authenticated, show welcome message
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Eldady</h1>
            <p className="text-muted-foreground text-lg">Where products meet community</p>
          </div>

          <Card className="shadow-lg border border-border">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-6">
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-3xl text-white font-bold">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </span>
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-semibold mb-2">
                Welcome{user.firstName ? `, ${user.firstName}` : ''}!
              </h2>

              <p className="text-muted-foreground mb-6">
                You are successfully authenticated.
              </p>

              <div className="space-y-4">
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>

                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="w-full"
                >
                  Log Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Regular login/signup form
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2" data-testid="app-title">Eldady</h1>
          <p className="text-muted-foreground text-lg" data-testid="app-subtitle">Where products meet community</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-4 p-3 rounded-md flex items-center ${message.type === 'error' 
            ? 'bg-destructive/20 text-destructive' 
            : 'bg-green-100 text-green-800'}`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="h-5 w-5 mr-2" />
            ) : (
              <CheckCircle className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        )}

        {/* Auth Card */}
        <Card className="shadow-lg border border-border" data-testid="auth-card">
          <CardContent className="p-8">
            <form onSubmit={handleEmailAuth}>
              <div className="space-y-6">
                {/* Google Auth */}
                <Button
                  onClick={handleGoogleAuth}
                  variant="outline"
                  className="w-full bg-white border border-border py-3 px-4 flex items-center justify-center space-x-3 hover:bg-muted transition-colors"
                  data-testid="button-google-auth"
                  type="button"
                  disabled={isLoading}
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
                  {!isLogin && (
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        className="w-full pl-10"
                        data-testid="input-name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required={!isLogin}
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      name="email"
                      placeholder="Email address"
                      className="w-full pl-10"
                      data-testid="input-email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      className="w-full pl-10 pr-10"
                      data-testid="input-password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-email-auth"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span>Loading...</span>
                    ) : isLogin ? (
                      <span>Sign In</span>
                    ) : (
                      <span>Create Account</span>
                    )}
                  </Button>
                </div>

                <div className="text-center space-y-2">
                  {isLogin && (
                    <button 
                      type="button" 
                      className="text-sm text-accent hover:underline" 
                      data-testid="link-forgot-password"
                      onClick={handleForgotPassword}
                      disabled={isLoading}
                    >
                      Forgot password?
                    </button>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button 
                      type="button" 
                      className="text-primary hover:underline" 
                      data-testid="link-toggle-auth"
                      onClick={toggleAuthMode}
                      disabled={isLoading}
                    >
                      {isLogin ? "Sign up" : "Sign in"}
                    </button>
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}