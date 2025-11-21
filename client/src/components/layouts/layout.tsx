import React, { useState } from "react";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";

/***
 * Responsive style Layout
 * -----------------------------------
 * - Left Sidebar: vertical (desktop) | hidden (mobile)
 * - Bottom Nav Bar: horizontal (mobile) - handled by Sidebar component
 * - Right Sidebar: visible on large screens
 * - Main: dynamic page area
 */
const Layout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-all duration-300">
      {/* ===== MOBILE MENU BUTTON ===== */}
      <button
        className="fixed top-4 left-4 z-40 flex items-center justify-center rounded-full p-2
                   bg-primary text-primary-foreground shadow-md lg:hidden"
        onClick={toggleDrawer}
        aria-label="Toggle sidebar menu"
      >
        {drawerOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* ===== LEFT SIDEBAR (Drawer on Mobile, Static on Desktop) ===== */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-[260px] sm:w-[300px] lg:w-[275px]
          bg-background border-r border-border p-4 z-30 flex flex-col transform transition-transform duration-300
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:flex
        `}
      >
        <Sidebar />
      </aside>

      {/* ===== OVERLAY (for mobile when drawer is open) ===== */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleDrawer}
          aria-hidden="true"
        />
      )}

      {/* ===== MAIN CONTENT (PAGES) ===== */}
      <main
        className="flex-1 min-h-screen max-w-full sm:max-w-[600px]
                   border-r border-border mx-auto px-1 sm:px-3 md:px-4 overflow-y-auto
                   pb-16 md:pb-0" // Add padding bottom for mobile bottom nav
      >
        <Outlet />
      </main>

      {/* ===== RIGHT SIDEBAR (hidden on smaller screens) ===== */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-[350px]
                   border-l border-border sticky top-0 h-screen p-4 overflow-y-auto"
      >
        <RightSidebar />
      </aside>

      {/* ===== MOBILE BOTTOM NAVBAR ===== */}
      {/* This is now handled by the Sidebar component itself */}
      {/* The Sidebar component includes its own mobile bottom navigation */}
    </div>
  );
};

export default Layout;
