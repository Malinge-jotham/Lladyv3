import React, { useState } from "react"; 
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import ShoppingCart from "@/components/cart/ShoppingCart";
import PostProductModal from "@/components/product/PostProductModal";
import {
  FaHome,
  FaCompass,
  FaStore,
  FaComments,
  FaUser,
  FaShoppingCart,
  FaPlus,
  FaBars,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import logo from "@/assets/ELDADY-LOGO.png";
import { logoutClient } from "@/lib/auth";

const navigationItems = [
  { path: "/", icon: FaHome, label: "Home", testId: "nav-home" },
  { path: "/explore", icon: FaCompass, label: "Explore", testId: "nav-explore" },
  { path: "/vroom", icon: FaStore, label: "My Vroom", testId: "nav-vroom" },
  { path: "/messages", icon: FaComments, label: "Messages", testId: "nav-messages" },
  { path: "/profile", icon: FaUser, label: "Profile", testId: "nav-profile" },
];

interface SidebarProps {
  isImpact?: boolean;
}

export default function Sidebar({ isImpact }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const [showCart, setShowCart] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const { cartItemCount } = useCart();
  const { user } = useAuth();

  // fetch user vrooms
  const { data: userVrooms } = useQuery({
    queryKey: ["/api/vrooms/user"],
    enabled: !!user,
    select: (data) => (Array.isArray(data) ? data : []),
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleMyVroomClick = () => {
    if (userVrooms && userVrooms.length > 0) {
      setLocation(`/vroom/${userVrooms[0].id}`);
    } else {
      setLocation("/vroom");
    }
  };

  const handleNavigationClick = (path: string) => {
    if (path === "/vroom") {
      handleMyVroomClick();
    } else {
      setLocation(path);
    }
  };

  // Desktop sidebar content
  const DesktopSidebar = (
    <div className="flex flex-col min-h-full space-y-6">
      {/* Logo */}
      <div className="flex items-center">
        <img src={logo} alt="Eldady Logo" className="w-20 md:w-24 h-auto object-contain" />
      </div>

      {/* Navigation */}
      <nav className="space-y-2" data-testid="sidebar-navigation">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location === item.path || (item.path === "/vroom" && location.startsWith("/vroom"));

          return (
            <div
              key={item.path}
              onClick={() => handleNavigationClick(item.path)}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
              data-testid={item.testId}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium truncate">{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* Cart Button */}
      <div className="space-y-3">
        <Button
          onClick={() => setShowCart(true)}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 flex items-center justify-center space-x-2"
          data-testid="button-cart"
        >
          <FaShoppingCart />
          <span className="truncate">Cart</span>
          {cartItemCount > 0 && (
            <Badge variant="secondary" className="bg-accent-foreground text-accent" data-testid="cart-item-count">
              {cartItemCount}
            </Badge>
          )}
        </Button>

        <Button
          onClick={() => setShowPostModal(true)}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
          data-testid="button-post-product"
        >
          <FaPlus className="mr-2" />
          <span className="truncate">Post Product</span>
        </Button>

        <Button onClick={() => logoutClient()} variant="outline" className="w-full" data-testid="button-logout">
          Logout
        </Button>
      </div>

      <div className="flex-1" />

      <div className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} Eldady
      </div>
    </div>
  );

  // Mobile bottom navigation
  const MobileBottomNav = (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around p-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location === item.path || (item.path === "/vroom" && location.startsWith("/vroom"));

          return (
            <button
              key={item.path}
              onClick={() => handleNavigationClick(item.path)}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors min-w-0 flex-1 mx-1 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid={`mobile-${item.testId}`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
        
        {/* Cart Button in Mobile Nav */}
        <button
          onClick={() => setShowCart(true)}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors min-w-0 flex-1 mx-1 ${
            showCart ? "text-primary" : "text-muted-foreground"
          }`}
          data-testid="mobile-button-cart"
        >
          <div className="relative">
            <FaShoppingCart className="w-5 h-5 mb-1" />
            {cartItemCount > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs min-w-4 h-4 flex items-center justify-center p-0"
                data-testid="mobile-cart-item-count"
              >
                {cartItemCount}
              </Badge>
            )}
          </div>
          <span className="text-xs truncate max-w-full">Cart</span>
        </button>

        {/* Post Product Button in Mobile Nav */}
        <button
          onClick={() => setShowPostModal(true)}
          className="flex flex-col items-center p-2 rounded-lg transition-colors min-w-0 flex-1 mx-1 text-muted-foreground"
          data-testid="mobile-button-post-product"
        >
          <FaPlus className="w-5 h-5 mb-1" />
          <span className="text-xs truncate max-w-full">Post</span>
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop / Tablet sidebar (md+) */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-full bg-card border-r border-border p-6 overflow-y-auto"
        style={{ width: "clamp(200px, 16vw, 280px)" }}
        data-testid="sidebar"
      >
        {DesktopSidebar}
      </aside>

      {/* Mobile Bottom Navigation */}
      {MobileBottomNav}

      {/* Shopping Cart & Post Modal */}
      <ShoppingCart isOpen={showCart} onClose={() => setShowCart(false)} />
      <PostProductModal isOpen={showPostModal} onClose={() => setShowPostModal(false)} />
    </>
  );
}
