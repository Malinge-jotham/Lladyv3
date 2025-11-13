import React from "react";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";
import { Outlet } from "react-router-dom";

const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground transition-all duration-300">
      {/* Left Sidebar */}
      <aside
        className="hidden sm:flex sm:flex-col sm:w-[70px] lg:w-[275px] 
        border-r border-border sticky top-0 h-screen p-2 lg:p-4 overflow-y-auto"
      >
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <main
        className="flex-1 min-h-screen max-w-full sm:max-w-[600px] 
        border-r border-border mx-auto px-1 sm:px-3 md:px-4 overflow-y-auto"
      >
        <Outlet />
      </main>

      {/* Right Sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-[350px] 
        border-l border-border sticky top-0 h-screen p-4 overflow-y-auto"
      >
        <RightSidebar />
      </aside>
    </div>
  );
};

export default Layout;
