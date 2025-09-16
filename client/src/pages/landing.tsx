import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { useLocation } from "wouter";
import {
  Card, CardHeader, CardTitle, CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { FcGoogle } from "react-icons/fc";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Terminal, WifiOff, Wifi } from "lucide-react";

// ---------- Types ----------
interface User {
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
}

interface Message {
  type: "success" | "error" | "warning";
  text: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

type WebSocketStatus = "connected" | "disconnected" | "connecting" | "error";

// ---------- Component ----------
const Landing: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    username: "",
  });
  const [message, setMessage] = useState<Message | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>("disconnected");

  const wsRef = useRef<WebSocket | null>(null);
  const [, setLocation] = useLocation();

  // ----- WebSocket Connection -----
  useEffect(() => {
    if (!isAuthenticated) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname === "localhost"
      ? "localhost:5000" // ✅ always target backend in dev
      : window.location.host;

    const wsUrl = `${protocol}//${host}/ws?token=demo123`;

    setWsStatus("connecting");
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => setWsStatus("connected");
    socket.onclose = () => setWsStatus("disconnected");
    socket.onerror = () => setWsStatus("error");

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "notification") {
          setMessage({ type: "success", text: data.message });
        }
      } catch {
        console.error("Invalid WS message", event.data);
      }
    };

    return () => {
      socket.close();
    };
  }, [isAuthenticated]);

  // ----- Handle input change -----
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ----- Handle login/signup -----
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Success!" });
        setIsAuthenticated(true);
        setUser(data.user);
        setLocation("/home");
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong." });
    }
  };

  // ----- Google OAuth -----
  const handleGoogleAuth = () => {
    window.location.href = "/api/auth/google";
  };

  // ----- Logout -----
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { credentials: "include" });
    setIsAuthenticated(false);
    setUser(null);
    wsRef.current?.close();
    setMessage({ type: "success", text: "Logged out successfully!" });
  };

  // ----- Forgot Password -----
  const handleForgotPassword = async () => {
    if (!formData.email) {
      setMessage({ type: "error", text: "Please enter your email first." });
      return;
    }
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email }),
    });
    setMessage({ type: "success", text: "Password reset email sent!" });
  };

  // Connection status indicator
  const renderConnectionStatus = () => {
    const statusConfig = {
      connected: { text: "Connected", icon: <Wifi size={16} className="text-green-500" /> },
      disconnected: { text: "Disconnected", icon: <WifiOff size={16} className="text-gray-500" /> },
      connecting: { text: "Connecting...", icon: <Terminal size={16} className="text-yellow-500" /> },
      error: { text: "Connection Error", icon: <Terminal size={16} className="text-red-500" /> },
    };
    const { text, icon } = statusConfig[wsStatus];
    return <div className="flex items-center justify-end gap-2 mb-2 text-xs">{icon}<span>{text}</span></div>;
  };

  // ---------- Render ----------
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md p-6 shadow-lg relative">
        {renderConnectionStatus()}
        {!isAuthenticated ? (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                {isLogin ? "Welcome Back" : "Create Account"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {message && (
                <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input type="text" name="firstName" placeholder="First Name" onChange={handleChange} required />
                    <Input type="text" name="lastName" placeholder="Last Name" onChange={handleChange} required />
                  </div>
                )}
                <Input type="email" name="email" placeholder="Email" onChange={handleChange} required />
                <Input type="password" name="password" placeholder="Password" onChange={handleChange} required />
                <Button type="submit" className="w-full">{isLogin ? "Login" : "Sign Up"}</Button>
              </form>
              <Button onClick={handleGoogleAuth} className="w-full mt-4 flex items-center gap-2" variant="outline">
                <FcGoogle size={20} /> Google
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle>Welcome, {user?.firstName || "User"}!</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src="/default-avatar.png" alt="User" />
                <AvatarFallback>{user?.firstName?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <Button onClick={() => setLocation("/home")} className="w-full">Go to Home</Button>
              <Button onClick={handleLogout} variant="outline" className="w-full">Logout</Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default Landing;
