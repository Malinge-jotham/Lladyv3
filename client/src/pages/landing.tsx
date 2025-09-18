import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaShoppingBag, FaUsers, FaComments, FaArrowRight } from "react-icons/fa";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" data-testid="app-title">
            Welcome to Eldady
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="app-subtitle">
            The social commerce platform where you can discover, share, and sell amazing products 
            while connecting with a vibrant community of creators and shoppers.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="text-lg px-8 py-3"
            data-testid="button-login"
          >
            Get Started
            <FaArrowRight className="ml-2" />
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <FaShoppingBag className="text-2xl text-primary" />
              </div>
              <CardTitle>Shop & Sell</CardTitle>
              <CardDescription>
                Discover unique products and showcase your own creations to a global audience.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <FaUsers className="text-2xl text-primary" />
              </div>
              <CardTitle>Connect</CardTitle>
              <CardDescription>
                Build meaningful connections with other creators, sellers, and shoppers in our community.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <FaComments className="text-2xl text-primary" />
              </div>
              <CardTitle>Engage</CardTitle>
              <CardDescription>
                Share your thoughts, ask questions, and get recommendations from the community.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Join?</CardTitle>
              <CardDescription className="text-lg">
                Start your journey with Eldady today and become part of our growing community.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleLogin}
                size="lg"
                className="w-full text-lg py-3"
                data-testid="button-join-now"
              >
                Join Now - It's Free!
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}