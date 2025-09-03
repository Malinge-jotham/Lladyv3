import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { FaTimes } from "react-icons/fa";
import type { UploadResult } from "@uppy/core";

interface PostProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PostProductModal({ isOpen, onClose }: PostProductModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await apiRequest("POST", "/api/products", productData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product posted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to post product",
        variant: "destructive",
      });
    },
  });

  const getUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    try {
      for (const file of result.successful || []) {
        // Set ACL policy for the uploaded image
        const response = await apiRequest("PUT", "/api/product-images", {
          imageURL: file.uploadURL,
        });
        const data = await response.json();
        setImageUrls(prev => [...prev, data.objectPath]);
      }
      
      toast({
        title: "Success",
        description: "Images uploaded successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process uploaded images",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createProductMutation.mutate({
      ...formData,
      price: formData.price,
      imageUrls,
      hashtags: extractHashtags(formData.description),
    });
  };

  const extractHashtags = (text: string): string[] => {
    const hashtags = text.match(/#[\w]+/g) || [];
    return hashtags.map(tag => tag.toLowerCase());
  };

  const handleClose = () => {
    setFormData({ name: "", description: "", price: "" });
    setImageUrls([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="post-product-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle data-testid="modal-title">Post New Product</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              data-testid="button-close-modal"
            >
              <FaTimes />
            </Button>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter product name..."
              required
              data-testid="input-product-name"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description & Tags</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your product and add hashtags..."
              className="h-32 resize-none"
              required
              data-testid="textarea-product-description"
            />
          </div>
          
          <div>
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="0.00"
              required
              data-testid="input-product-price"
            />
          </div>
          
          <div>
            <Label>Product Images</Label>
            <ObjectUploader
              maxNumberOfFiles={5}
              maxFileSize={5242880} // 5MB
              onGetUploadParameters={getUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="w-full"
            >
              <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-input rounded-lg hover:border-primary transition-colors">
                <div className="text-2xl mb-2">📁</div>
                <p className="text-muted-foreground">Click to upload images or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
              </div>
            </ObjectUploader>
            
            {imageUrls.length > 0 && (
              <div className="mt-2 text-sm text-muted-foreground" data-testid="uploaded-images-count">
                {imageUrls.length} image(s) uploaded
              </div>
            )}
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProductMutation.isPending}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-submit"
            >
              {createProductMutation.isPending ? "Posting..." : "Post Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
