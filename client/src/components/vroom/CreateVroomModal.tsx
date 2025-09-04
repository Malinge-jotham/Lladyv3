import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FaPlus, FaStore, FaCamera } from "react-icons/fa";
import type { UploadResult } from "@uppy/core";

interface CreateVroomModalProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CreateVroomModal({ trigger, isOpen, onClose }: CreateVroomModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: true,
  });
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");

  const createVroomMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/vrooms", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vroom created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vrooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vrooms/user"] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create vroom",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest('POST', '/api/objects/upload') as { uploadURL: string };
    return {
      method: 'PUT' as const,
      url: response.uploadURL,
    };
  };

  const handleImageUpload = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      try {
        const response = await apiRequest("PUT", "/api/vroom-images", {
          imageURL: uploadedFile.uploadURL,
        });
        const data = await response.json();
        setCoverImageUrl(data.objectPath);
        
        toast({
          title: "Success",
          description: "Cover image uploaded successfully!",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process uploaded image",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Vroom name is required",
        variant: "destructive",
      });
      return;
    }

    createVroomMutation.mutate({
      ...formData,
      coverImageUrl: coverImageUrl || null,
    });
  };

  const handleClose = () => {
    setFormData({ name: "", description: "", isPublic: true });
    setCoverImageUrl("");
    if (onClose) {
      onClose();
    } else {
      setModalOpen(false);
    }
  };

  const open = isOpen !== undefined ? isOpen : modalOpen;
  const setOpen = isOpen !== undefined ? (onClose || (() => {})) : setModalOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      {!trigger && (
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2" data-testid="button-create-vroom">
            <FaPlus />
            Create Vroom
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="create-vroom-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaStore className="text-primary" />
            Create New Vroom
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Vroom Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter vroom name..."
              required
              data-testid="input-vroom-name"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your vroom..."
              rows={3}
              data-testid="input-vroom-description"
            />
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={5 * 1024 * 1024} // 5MB
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleImageUpload}
              buttonClassName="w-full"
            >
              <FaCamera className="w-4 h-4 mr-2" />
              Upload Cover Image
            </ObjectUploader>
            {coverImageUrl && (
              <div className="mt-2">
                <img
                  src={coverImageUrl}
                  alt="Cover preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
              data-testid="switch-vroom-public"
            />
            <Label htmlFor="public">Make this vroom public</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={createVroomMutation.isPending}
              className="flex-1"
              data-testid="button-submit-vroom"
            >
              {createVroomMutation.isPending ? "Creating..." : "Create Vroom"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              data-testid="button-cancel-vroom"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}