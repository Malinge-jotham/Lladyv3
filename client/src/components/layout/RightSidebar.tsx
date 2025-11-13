import React from "react";

const RightSidebar: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg">
        <h2 className="font-semibold text-lg">Trends</h2>
        <p className="text-sm text-muted-foreground">#NextGenTech</p>
      </div>
      <div className="p-4 border rounded-lg">
        <h2 className="font-semibold text-lg">Who to follow</h2>
        <p className="text-sm text-muted-foreground">@eldady</p>
      </div>
    </div>
  );
};

export default RightSidebar;
