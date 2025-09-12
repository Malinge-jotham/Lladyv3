import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FaTimes, FaUpload, FaLink } from "react-icons/fa";

interface PostProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProductImage {
  url: string;
  name: string;
  type: 'url' | 'upload';
}

const CURRENCIES = [
  { value: "USD", label: "US Dollar (USD)", symbol: "$" },
  { value: "EUR", label: "Euro (EUR)", symbol: "€" },
  { value: "NGN", label: "Nigerian Naira (NGN)", symbol: "₦" },
  { value: "GHS", label: "Ghanaian Cedi (GHS)", symbol: "₵" },
  { value: "KES", label: "Kenyan Shilling (KES)", symbol: "KSh" },
  { value: "ZAR", label: "South African Rand (ZAR)", symbol: "R" },
  { value: "EGP", label: "Egyptian Pound (EGP)", symbol: "£" },
  { value: "XOF", label: "West African CFA Franc (XOF)", symbol: "CFA" },
];

const CATEGORIES = [
  { value: "handmade", label: "Handmade" },
  { value: "vintage", label: "Vintage" },
  { value: "furniture", label: "Furniture" },
  { value: "jewelry", label: "Jewelry" },
  { value: "clothing", label: "clothing" },
  { value: "art &craft", label: "Art&Craft" },
  { value: "decor", label: "Decor" },
];

export default function PostProductModal({ isOpen, onClose }: PostProductModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    currency: "USD",
    category: "",
  });
  const [userDescription, setUserDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<ProductImage[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update description when category or user description changes
  useEffect(() => {
    const categoryHashtag = formData.category ? `#${formData.category}\n` : "";
    const newDescription = categoryHashtag + userDescription;
    setFormData(prev => ({ ...prev, description: newDescription }));
  }, [formData.category, userDescription]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.price || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (imageUrls.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product image",
        variant: "destructive",
      });
      return;
    }

    createProductMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
      imageUrls: imageUrls.map(img => img.url),
      hashtags: extractHashtags(formData.description),
    });
  };

  const extractHashtags = (text: string): string[] => {
    const hashtags = text.match(/#[\w]+/g) || [];
    return hashtags.map(tag => tag.toLowerCase());
  };

  const handleClose = () => {
    setFormData({ name: "", description: "", price: "", currency: "USD", category: "" });
    setUserDescription("");
    setImageUrls([]);
    setImageUrlInput("");
    setActiveTab("upload");
    onClose();
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddUrlImage = () => {
    if (!imageUrlInput) {
      toast({
        title: "Error",
        description: "Please enter an image URL",
        variant: "destructive",
      });
      return;
    }

    try {
      // Basic URL validation
      new URL(imageUrlInput);

      setImageUrls(prev => [...prev, {
        url: imageUrlInput,
        name: `Image from URL`,
        type: 'url'
      }]);
      setImageUrlInput("");

      toast({
        title: "Success",
        description: "Image URL added successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: ProductImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: `File ${file.name} is too large. Maximum size is 5MB.`,
          variant: "destructive",
        });
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        newImages.push({
          url: imageUrl,
          name: file.name,
          type: 'upload'
        });

        // If we've processed all files, update state
        if (newImages.length === files.length) {
          setImageUrls(prev => [...prev, ...newImages]);
          toast({
            title: "Success",
            description: "Images uploaded successfully!",
          });
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    // If category is set, prevent modification of the first line (the category hashtag)
    if (formData.category) {
      const categoryLine = `#${formData.category}`;
      const lines = value.split('\n');

      // If the first line doesn't match the category hashtag, restore it
      if (lines[0] !== categoryLine) {
        const userContent = lines.slice(1).join('\n');
        setUserDescription(userContent);
      } else {
        setUserDescription(lines.slice(1).join('\n'));
      }
    } else {
      // If no category is selected, allow full editing
      setUserDescription(value);
    }
  };

  const getCurrencySymbol = () => {
    const currency = CURRENCIES.find(c => c.value === formData.currency);
    return currency ? currency.symbol : "$";
  };

  // Set cursor position to after the category hashtag when description gains focus
  const handleDescriptionFocus = () => {
    if (formData.category && textareaRef.current) {
      const categoryLineLength = `#${formData.category}\n`.length;
      textareaRef.current.setSelectionRange(categoryLineLength, categoryLineLength);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto" data-testid="post-product-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle data-testid="modal-title" className="text-xl font-bold">Post New Product</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              data-testid="button-close-modal"
              className="h-8 w-8 p-0 rounded-full"
            >
              <FaTimes className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name..."
                required
                data-testid="input-product-name"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium">Price *</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">{getCurrencySymbol()}</span>
                  </div>
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
                    className="pl-8 w-full"
                  />
                </div>

                <div className="w-32">
                  <Label htmlFor="currency" className="sr-only">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger id="currency" className="w-full">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description & Tags *</Label>
            <Textarea
              ref={textareaRef}
              id="description"
              value={formData.description}
              onChange={handleDescriptionChange}
              onFocus={handleDescriptionFocus}
              placeholder={formData.category ? "" : "Describe your product and add hashtags..."}
              className="h-32 resize-none w-full"
              required
              data-testid="textarea-product-description"
            />
            <p className="text-xs text-muted-foreground">
              {formData.category ? (
                <>Category hashtag <span className="font-semibold">#{formData.category}</span> is automatically added and cannot be removed. Add your description below it.</>
              ) : (
                "Use hashtags (e.g., #electronics #gadget) to help customers find your product"
              )}
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Product Images *</Label>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <FaUpload className="h-4 w-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <FaLink className="h-4 w-4" />
                  URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-3">
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FaUpload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </TabsContent>

              <TabsContent value="url" className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Paste image URL here"
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddUrlImage}
                    disabled={!imageUrlInput}
                  >
                    Add Image
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {imageUrls.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  {imageUrls.length} image(s) added
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imageUrls.map((image, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={image.url} 
                        alt={`Product preview ${index + 1}`}
                        className="h-24 w-full object-cover rounded-md border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-90 hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <FaTimes className="h-3 w-3" />
                      </Button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate">
                        {image.name}
                      </div>
                    </div>
                  ))}
                </div>
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