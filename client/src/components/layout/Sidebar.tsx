import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import ShoppingCart from "@/components/cart/ShoppingCart";
import PostProductModal from "@/components/product/PostProductModal";
import { FaHome, FaCompass, FaStore, FaComments, FaUser, FaShoppingCart, FaPlus } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import logo from "@/assets/ELDADY-LOGO.png";

const navigationItems = [
  { path: "/", icon: FaHome, label: "Home", testId: "nav-home" },
  { path: "/explore", icon: FaCompass, label: "Explore", testId: "nav-explore" },
  { path: "/vroom", icon: FaStore, label: "My Vroom", testId: "nav-vroom" }, // special handling
  { path: "/messages", icon: FaComments, label: "Messages", testId: "nav-messages" },
  { path: "/profile", icon: FaUser, label: "Profile", testId: "nav-profile" },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const [showCart, setShowCart] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const { cartItemCount } = useCart();
  const { user } = useAuth();

  // fetch user vrooms
  const { data: userVrooms } = useQuery({
    queryKey: ["/api/vrooms/user"],
    enabled: !!user,
    select: (data) => Array.isArray(data) ? data : [],
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleMyVroomClick = () => {
    if (userVrooms && userVrooms.length > 0) {
      setLocation(`/vroom/${userVrooms[0].id}`); // redirect to first vroom
    } else {
      setLocation("/vroom"); // fallback to general vroom page
    }
  };

  return (
    <>
      <div className="w-64 bg-card border-r border-border p-6 fixed h-full overflow-y-auto" data-testid="sidebar">
        <div className="space-y-6">
          {/* Logo */}
          <img 
            src={logo} 
            alt="Eldady Logo" 
            className="w-24 h-auto object-contain"
          />


          {/* Navigation */}
          <nav className="space-y-2" data-testid="sidebar-navigation">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location === item.path ||
                (item.path === "/vroom" && location.startsWith("/vroom"));

              if (item.path === "/vroom") {
                return (
                  <div
                    key={item.path}
                    onClick={handleMyVroomClick}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    data-testid={item.testId}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                );
              }

              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    data-testid={item.testId}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Cart Button */}
          <Button
            onClick={() => setShowCart(true)}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 flex items-center justify-center space-x-2"
            data-testid="button-cart"
          >
            <FaShoppingCart />
            <span>Cart</span>
            {cartItemCount > 0 && (
              <Badge variant="secondary" className="bg-accent-foreground text-accent" data-testid="cart-item-count">
                {cartItemCount}
              </Badge>
            )}
          </Button>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => setShowPostModal(true)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-post-product"
            >
              <FaPlus className="mr-2" />
              Post Product
            </Button>
          </div>

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
            data-testid="button-logout"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Shopping Cart */}
      <ShoppingCart isOpen={showCart} onClose={() => setShowCart(false)} />

      {/* Post Product Modal */}
      <PostProductModal isOpen={showPostModal} onClose={() => setShowPostModal(false)} />
    </>
  );
}