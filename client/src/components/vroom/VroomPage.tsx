import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FaStore, FaPlus } from "react-icons/fa";
import VroomCard from "@/components/vroom/VroomCard";
import CreateVroomModal from "@/components/vroom/CreateVroomModal";

export default function VroomPage() {
  const { data: userVrooms, isLoading: vroomsLoading } = useQuery({
    queryKey: ["/api/my/vrooms"],
    queryFn: async () => {
      const res = await fetch("/api/my/vrooms");
      if (!res.ok) throw new Error("Failed to fetch vrooms");
      return res.json();
    },
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">My Vrooms</h2>

      {vroomsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : userVrooms && Array.isArray(userVrooms) && userVrooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userVrooms.map((vroom: any) => (
            <VroomCard key={vroom.id} vroom={vroom} showFollowButton={false} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <FaStore className="mx-auto text-5xl mb-4 opacity-30" />
          <h3 className="text-xl font-medium mb-2">No vrooms yet</h3>
          <p className="mb-6">Create your first vroom to organize your products!</p>
          <CreateVroomModal
            trigger={
              <Button className="bg-primary hover:bg-primary/90">
                <FaPlus className="mr-2" />
                Create Your First Vroom
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
