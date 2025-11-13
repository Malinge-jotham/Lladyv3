import React from "react";
import { Link } from "react-router-dom";

const Sidebar: React.FC = () => {
  return (
    <nav className="flex flex-col space-y-4">
      <Link to="/" className="hover:text-primary">Home</Link>
      <Link to="/explore" className="hover:text-primary">Explore</Link>
      <Link to="/profile" className="hover:text-primary">Profile</Link>
    </nav>
  );
};

export default Sidebar;
