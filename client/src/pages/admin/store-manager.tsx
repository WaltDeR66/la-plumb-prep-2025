import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Link as LinkIcon, 
  Package, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function StoreManager() {
  const [urlToAdd, setUrlToAdd] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products?limit=100");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const categories = [
    { value: "gas_detection", label: "Gas Detection" },
    { value: "pipe_tools", label: "Pipe Tools" },
    { value: "measuring", label: "Measuring Tools" },
    { value: "safety", label: "Safety Equipment" },
    { value: "valves", label: "Valves" },
    { value: "fittings", label: "Fittings" },
    { value: "books", label: "Books & Manuals" },
    { value: "training_materials", label: "Training Materials" },
  ];

  // Extract product data from URL
  const extractFromUrl = async () => {
    if (!urlToAdd.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    try {
      const response = await fetch("/api/extract-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: urlToAdd }),
      });

      if (!response.ok) throw new Error("Failed to extract product data");
      
      const data = await response.json();
      if (data.success) {
        setExtractedData({
          ...data,
          category: "pipe_tools", // default category
          isFeatured: false,
          isActive: true
        });
        toast({
          title: "Success",
          description: "Product data extracted successfully!",
        });
      } else {
        throw new Error(data.message || "Failed to extract product data");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Save product mutation
  const saveProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      if (editingProduct) {
        // Update existing product
        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(productData),
        });
        if (!response.ok) throw new Error("Failed to update product");
        return response.json();
      } else {
        // Create new product
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(productData),
        });
        if (!response.ok) throw new Error("Failed to create product");
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setExtractedData(null);
      setEditingProduct(null);
      setUrlToAdd("");
      toast({
        title: "Success",
        description: editingProduct ? "Product updated successfully!" : "Product added successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete product");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveProduct = () => {
    if (!extractedData) return;
    
    const productData = {
      name: extractedData.name,
      description: extractedData.description,
      shortDescription: extractedData.shortDescription,
      category: extractedData.category,
      price: extractedData.price.replace(/[^0-9.]/g, ''),
      amazonUrl: extractedData.amazonUrl,
      imageUrl: extractedData.imageUrl,
      brand: extractedData.brand,
      features: extractedData.features || [],
      isFeatured: extractedData.isFeatured,
      isActive: extractedData.isActive,
    };

    saveProductMutation.mutate(productData);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setExtractedData({
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription,
      category: product.category,
      price: `$${product.price}`,
      amazonUrl: product.amazonUrl,
      imageUrl: product.imageUrl,
      brand: product.brand,
      features: product.features || [],
      isFeatured: product.isFeatured,
      isActive: product.isActive,
    });
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Store Manager</h1>
            <p className="text-muted-foreground">Add and manage products for your store by URL</p>
          </div>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {productsData?.products?.length || 0} products
            </span>
          </div>
        </div>

        {/* Add Product Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Add New Product by URL</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Label htmlFor="product-url">Product URL (Amazon or other store links)</Label>
                <Input
                  id="product-url"
                  placeholder="https://www.amazon.com/product-name/dp/XXXXXXXXXX..."
                  value={urlToAdd}
                  onChange={(e) => setUrlToAdd(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={extractFromUrl} 
                  disabled={isExtracting || !urlToAdd.trim()}
                  className="flex items-center space-x-2"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Extracting...</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4" />
                      <span>Extract Data</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Extracted Data Form */}
            {extractedData && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Product Data Extracted</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input
                      id="product-name"
                      value={extractedData.name}
                      onChange={(e) => setExtractedData({ ...extractedData, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="product-category">Category</Label>
                    <Select value={extractedData.category} onValueChange={(value) => setExtractedData({ ...extractedData, category: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="product-price">Price</Label>
                    <Input
                      id="product-price"
                      value={extractedData.price}
                      onChange={(e) => setExtractedData({ ...extractedData, price: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="product-brand">Brand</Label>
                    <Input
                      id="product-brand"
                      value={extractedData.brand || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, brand: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="product-description">Description</Label>
                  <Textarea
                    id="product-description"
                    value={extractedData.description}
                    onChange={(e) => setExtractedData({ ...extractedData, description: e.target.value })}
                    className="mt-1"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="product-url-final">Product URL</Label>
                  <Input
                    id="product-url-final"
                    value={extractedData.amazonUrl}
                    onChange={(e) => setExtractedData({ ...extractedData, amazonUrl: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={extractedData.isFeatured}
                      onCheckedChange={(checked) => setExtractedData({ ...extractedData, isFeatured: checked })}
                    />
                    <Label>Featured Product</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={extractedData.isActive}
                      onCheckedChange={(checked) => setExtractedData({ ...extractedData, isActive: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button 
                    onClick={handleSaveProduct}
                    disabled={saveProductMutation.isPending}
                    className="flex items-center space-x-2"
                  >
                    {saveProductMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{editingProduct ? 'Updating...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>{editingProduct ? 'Update Product' : 'Add Product'}</span>
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setExtractedData(null);
                      setEditingProduct(null);
                      setUrlToAdd("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Existing Products */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Existing Products</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="animate-pulse border rounded-lg p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : productsData?.products?.length > 0 ? (
              <div className="space-y-4">
                {productsData.products.map((product: any) => (
                  <div key={product.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium">{product.name}</h3>
                        <Badge variant={product.category === "pipe_tools" ? "default" : "secondary"}>
                          {categories.find(c => c.value === product.category)?.label || product.category}
                        </Badge>
                        {product.isFeatured && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                            Featured
                          </Badge>
                        )}
                        {!product.isActive && (
                          <Badge variant="destructive">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {product.brand} • ${product.price}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {product.shortDescription}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(product.amazonUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={deleteProductMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No products yet</h3>
                <p className="text-muted-foreground">
                  Add your first product using the form above.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}