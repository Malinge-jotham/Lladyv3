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
  isImpact?: boolean; // ✅ new optional prop
}

export default function Sidebar({ isImpact }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const [showCart, setShowCart] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const { cartItemCount } = useCart();
  const { user } = useAuth();

  // mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // sidebar content reused for desktop and mobile drawer
  const SidebarInner = (
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

          if (item.path === "/vroom") {
            return (
              <div
                key={item.path}
                onClick={handleMyVroomClick}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
                data-testid={item.testId}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium truncate">{item.label}</span>
              </div>
            );
          }

          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
                data-testid={item.testId}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium truncate">{item.label}</span>
              </div>
            </Link>
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

  return (
    <>
      {/* Desktop / Tablet sidebar (md+) */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-full bg-card border-r border-border p-6 overflow-y-auto"
        style={{ width: "clamp(200px, 16vw, 280px)" }}
        data-testid="sidebar"
      >
        {SidebarInner}
      </aside>

      {/* Mobile: floating menu button */}
      <div className="md:hidden fixed left-4 bottom-4 z-50">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          aria-controls="mobile-sidebar"
          className="bg-white/95 backdrop-blur border border-slate-200 rounded-full px-4 py-3 shadow-md text-sm"
          title="Open menu"
        >
          <FaBars className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile slide-over */}
      <div
        id="mobile-sidebar"
        className={`fixed inset-0 z-50 ${drawerOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!drawerOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${drawerOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={`absolute left-0 top-0 bottom-0 bg-card shadow-xl transform transition-transform ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
          style={{ width: "min(88vw, 340px)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="p-6 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <img src={logo} alt="Eldady Logo" className="w-20 h-auto object-contain" />
              <button onClick={() => setDrawerOpen(false)} className="text-gray-600 px-2 py-1">
                Close
              </button>
            </div>

            {SidebarInner}
          </div>
        </div>
      </div>

      {/* Shopping Cart & Post Modal (unchanged) */}
      <ShoppingCart isOpen={showCart} onClose={() => setShowCart(false)} />
      <PostProductModal isOpen={showPostModal} onClose={() => setShowPostModal(false)} />
    </>
  );
}
