import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import ShoppingCart from "@/components/cart/ShoppingCart";
import PostProductModal from "@/components/product/PostProductModal";
import CreateVroomModal from "@/components/vroom/CreateVroomModal";
import { FaHome, FaCompass, FaFire, FaStore, FaComments, FaUser, FaShoppingCart, FaPlus, FaShoppingBag } from "react-icons/fa";

const navigationItems = [
  { path: "/", icon: FaHome, label: "Home", testId: "nav-home" },
  { path: "/explore", icon: FaCompass, label: "Explore", testId: "nav-explore" },
  { path: "/trending", icon: FaFire, label: "Trending", testId: "nav-trending" },
  { path: "/vroom", icon: FaStore, label: "My Vroom", testId: "nav-vroom" },
  { path: "/messages", icon: FaComments, label: "Messages", testId: "nav-messages" },
  { path: "/profile", icon: FaUser, label: "Profile", testId: "nav-profile" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [showCart, setShowCart] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCreateVroom, setShowCreateVroom] = useState(false);
  const { cartItemCount } = useCart();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <>
      <div className="w-64 bg-card border-r border-border p-6 fixed h-full overflow-y-auto" data-testid="sidebar">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center space-x-3" data-testid="sidebar-logo">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FaShoppingBag className="text-primary-foreground text-sm" />
            </div>
            <h1 className="text-xl font-bold text-primary">Eldady</h1>
          </div>

          {/* Navigation */}
          <nav className="space-y-2" data-testid="sidebar-navigation">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path || 
                (item.path === "/vroom" && location.startsWith("/vroom"));
              
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
            
            <Button
              onClick={() => setShowCreateVroom(true)}
              variant="outline"
              className="w-full"
              data-testid="button-create-vroom"
            >
              <FaStore className="mr-2" />
              Create Vroom
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
      
      {/* Create Vroom Modal */}
      <CreateVroomModal isOpen={showCreateVroom} onClose={() => setShowCreateVroom(false)} />
    </>
  );
}
