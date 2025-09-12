// components/vroom/VroomProductsPage.tsx
import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { FaArrowLeft, FaStore } from "react-icons/fa";

export default function VroomProductsPage() {
  const [match, params] = useRoute("/vroom/:id");
  const [vroom, setVroom] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (params?.id) {
      fetchVroomData(params.id);
    }
  }, [params?.id]);

  const fetchVroomData = async (vroomId: string) => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", `/api/vrooms/${vroomId}`);
      const vroomData = await response.json();
      setVroom(vroomData);

      // Fetch products in this vroom
      const productsResponse = await apiRequest("GET", `/api/vrooms/${vroomId}/products`);
      const productsData = await productsResponse.json();
      setProducts(productsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load vroom data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (!vroom) {
    return <div className="container mx-auto p-4">Vroom not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          <FaArrowLeft className="mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          {vroom.coverImageUrl ? (
            <img
              src={vroom.coverImageUrl}
              alt={vroom.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
              <FaStore className="text-2xl text-muted-foreground/50" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{vroom.name}</h1>
            {vroom.description && (
              <p className="text-muted-foreground">{vroom.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <FaStore className="text-4xl text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No products yet</h3>
          <p className="text-muted-foreground">This vroom doesn't have any products added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showAddToVroom={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}