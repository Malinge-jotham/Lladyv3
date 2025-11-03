
import { createClient } from "@supabase/supabase-js";
import eldadyLogo from "@/assets/ELDADY-LOGO.png";

  import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
//import { supabase } from "@/lib/supabaseClient";
import { FaArrowRight } from "react-icons/fa";
// --- Initialize Supabase client ---
export const supabase = createClient("https://rhebmwmxtiyuazljugfl.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoZWJtd214dGl5dWF6bGp1Z2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTM0OTEsImV4cCI6MjA3NjYyOTQ5MX0.UTwY8C27ED0QYBJzNfAgl-pOJ0aIn98KwQQcGMXdjG8")
//profiles
export default function Landing() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup state
  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [country, setCountry] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const handleLogin = async () => {
  if (!loginEmail || !loginPassword) {
    alert("Please enter both email and password");
    return;
  }

  setLoading(true);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) throw error;

    if (data?.session) {
      const token = data.session.access_token;

      // ✅ Store token locally so you can send it in backend API requests
      localStorage.setItem("token", token);

      alert("Login successful!");

      // Example: call your backend immediately to verify
      const res = await fetch("https://lladynew.onrender.com/api/products/user", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      console.log("User data from backend:", result);
    }
  } catch (err) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};


  const handleSignup = async () => {
    if (!firstName || !secondName || !signupEmail || !signupPassword) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create profile in profiles table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            first_name: firstName,
            last_name: secondName,
            gender: gender,
            dob: dob || null,
            mobile: mobile,
            country: country
          });

        if (profileError) throw profileError;

        alert("Account created successfully! Please check your email for verification.");
        setIsSignup(false); // Switch back to login
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      alert("Please enter your email address");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginEmail);
      if (error) throw error;
      alert("Password reset email sent!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl">
        <div className="grid md:grid-cols-2 min-h-[600px]">
          {/* Left Side - Logo */}
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 flex flex-col items-center justify-center p-8">
            <div className="text-center">
              <img 
                src={eldadyLogo} 
                alt="Eldady Logo" 
                className="w-32 h-32 mx-auto mb-6 object-contain"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
              <h1 className="text-4xl font-bold text-primary mb-4">Ldady</h1>
              <p className="text-xl text-muted-foreground font-medium">Excelio in it</p>
            </div>
          </div>

          {/* Right Side - Auth Forms */}
          <div className="p-8 flex flex-col justify-center">
            {!isSignup ? (
              /* Login Form */
              <div className="w-full max-w-md mx-auto">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl">Sign In</CardTitle>
                  <CardDescription>
                    Welcome back to your Eldady account
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-4">
                  <Input
                    placeholder="Email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="py-2"
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="py-2"
                  />
                  <Button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full text-lg py-2 mt-4"
                  >
                    {loading ? "Please wait..." : "Sign In"}
                    <FaArrowRight className="ml-2" />
                  </Button>
                  
                  <div className="text-sm text-center space-y-2 pt-4">
                    <p>
                      Don't have an account?{" "}
                      <button
                        className="text-primary underline font-medium"
                        onClick={() => setIsSignup(true)}
                      >
                        Sign Up
                      </button>
                    </p>
                    <p>
                      <button 
                        className="text-primary underline font-medium"
                        onClick={handleForgotPassword}
                      >
                        Click here if forgot password
                      </button>
                    </p>
                  </div>
                </CardContent>
              </div>
            ) : (
              /* Signup Form */
              <div className="w-full max-w-md mx-auto">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl">Sign Up</CardTitle>
                  <CardDescription>
                    Create your Eldady account
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="First Name *"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="py-2"
                    />
                    <Input
                      placeholder="Second Name *"
                      value={secondName}
                      onChange={(e) => setSecondName(e.target.value)}
                      className="py-2"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <select 
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    
                    <Input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="py-2"
                    />
                  </div>
                  
                  <Input
                    placeholder="Mobile Number"
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="py-2"
                  />
                  
                  <Input
                    placeholder="Email *"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="py-2"
                  />
                  
                  <Input
                    placeholder="Country of Residence"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="py-2"
                  />
                  
                  <Input
                    placeholder="Password *"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="py-2"
                  />
                  
                  <Button
                    onClick={handleSignup}
                    disabled={loading}
                    className="w-full text-lg py-2 mt-2"
                  >
                    {loading ? "Creating Account..." : "Sign Up"}
                    <FaArrowRight className="ml-2" />
                  </Button>
                  
                  <p className="text-sm text-center mt-3">
                    Already have an account?{" "}
                    <button
                      className="text-primary underline font-medium"
                      onClick={() => setIsSignup(false)}
                    >
                      Sign In
                    </button>
                  </p>
                </CardContent>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
