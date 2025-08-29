import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Star, Package, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductForm {
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  price: string;
  originalPrice: string;
  amazonUrl: string;
  imageUrl: string;
  brand: string;
  model: string;
  features: string[];
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
}

const defaultForm: ProductForm = {
  name: "",
  description: "",
  shortDescription: "",
  category: "",
  price: "",
  originalPrice: "",
  amazonUrl: "",
  imageUrl: "",
  brand: "",
  model: "",
  features: [],
  isActive: true,
  isFeatured: false,
  tags: [],
};

export default function ProductManager() {
  const [activeTab, setActiveTab] = useState("list");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [newFeature, setNewFeature] = useState("");
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products", { limit: 100 }],
    queryFn: async () => {
      const response = await fetch("/api/products?limit=100");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (!response.ok) throw new Error("Failed to create product");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Product created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setForm(defaultForm);
      setActiveTab("list");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update product");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Product updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingProduct(null);
      setForm(defaultForm);
      setActiveTab("list");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete product");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Product deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.description || !form.category || !form.price || !form.amazonUrl) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      ...form,
      price: parseFloat(form.price),
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription || "",
      category: product.category,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || "",
      amazonUrl: product.amazonUrl,
      imageUrl: product.imageUrl || "",
      brand: product.brand || "",
      model: product.model || "",
      features: product.features || [],
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      tags: product.tags || [],
    });
    setActiveTab("form");
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setForm({ ...form, features: [...form.features, newFeature.trim()] });
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setForm({ ...form, features: form.features.filter((_, i) => i !== index) });
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      setForm({ ...form, tags: [...form.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setForm({ ...form, tags: form.tags.filter((_, i) => i !== index) });
  };

  const formatPrice = (price: string | number) => {
    return `$${parseFloat(price.toString()).toFixed(2)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4" data-testid="product-manager-title">
          Product Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-300" data-testid="product-manager-description">
          Manage your store products, add new items, and update existing inventory
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" data-testid="tab-list">
            <Package className="w-4 h-4 mr-2" />
            Products List
          </TabsTrigger>
          <TabsTrigger value="form" data-testid="tab-form">
            <Plus className="w-4 h-4 mr-2" />
            {editingProduct ? "Edit Product" : "Add Product"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Products ({products?.products?.length || 0})</span>
                <Button onClick={() => { setForm(defaultForm); setEditingProduct(null); setActiveTab("form"); }} data-testid="add-product-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="animate-pulse border rounded-lg p-4">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4" data-testid="products-list">
                  {products?.products?.map((product: any) => (
                    <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow" data-testid={`product-item-${product.id}`}>
                      <div className="flex gap-4">
                        <img
                          src={product.imageUrl || "/api/placeholder/64/64"}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                          data-testid="product-image"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg mb-1" data-testid="product-name">
                                {product.name}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2" data-testid="product-description">
                                {product.shortDescription || product.description.substring(0, 100)}...
                              </p>
                              <div className="flex items-center gap-4 mb-2">
                                <span className="font-bold text-blue-600" data-testid="product-price">
                                  {formatPrice(product.price)}
                                </span>
                                <Badge variant="outline" data-testid="product-category">
                                  {product.category.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </Badge>
                                {product.isFeatured && (
                                  <Badge className="bg-blue-600" data-testid="featured-badge">
                                    <Star className="w-3 h-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                                {!product.isActive && (
                                  <Badge variant="destructive" data-testid="inactive-badge">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>★ {product.rating || "0.0"}</span>
                                <span>•</span>
                                <span>{product.reviewCount || 0} reviews</span>
                                <span>•</span>
                                <span>{product.brand || "No brand"}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(product)} data-testid="edit-product-button">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteProductMutation.mutate(product.id)}
                                disabled={deleteProductMutation.isPending}
                                data-testid="delete-product-button"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="form-title">
                {editingProduct ? `Edit Product: ${editingProduct.name}` : "Add New Product"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6" data-testid="product-form">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter product name"
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Input
                    id="shortDescription"
                    value={form.shortDescription}
                    onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                    placeholder="Brief product description for listings"
                    data-testid="input-short-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Full Description *</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Detailed product description"
                    rows={4}
                    required
                    data-testid="textarea-description"
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="0.00"
                      required
                      data-testid="input-price"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">Original Price (Optional)</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      step="0.01"
                      value={form.originalPrice}
                      onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                      placeholder="0.00"
                      data-testid="input-original-price"
                    />
                  </div>
                </div>

                {/* Product Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      placeholder="Product brand"
                      data-testid="input-brand"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                      placeholder="Product model"
                      data-testid="input-model"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="https://..."
                      data-testid="input-image-url"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amazonUrl">Amazon URL *</Label>
                  <Input
                    id="amazonUrl"
                    value={form.amazonUrl}
                    onChange={(e) => setForm({ ...form, amazonUrl: e.target.value })}
                    placeholder="https://amzn.to/..."
                    required
                    data-testid="input-amazon-url"
                  />
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <Label>Product Features</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add a feature"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFeature())}
                      data-testid="input-new-feature"
                    />
                    <Button type="button" onClick={handleAddFeature} data-testid="add-feature-button">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2" data-testid="features-list">
                    {form.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {feature}
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="ml-1 hover:text-red-500"
                          data-testid={`remove-feature-${index}`}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-4">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                      data-testid="input-new-tag"
                    />
                    <Button type="button" onClick={handleAddTag} data-testid="add-tag-button">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2" data-testid="tags-list">
                    {form.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(index)}
                          className="ml-1 hover:text-red-500"
                          data-testid={`remove-tag-${index}`}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Settings */}
                <Separator />
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                      data-testid="switch-active"
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.isFeatured}
                      onCheckedChange={(checked) => setForm({ ...form, isFeatured: checked })}
                      data-testid="switch-featured"
                    />
                    <Label>Featured</Label>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex items-center gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={createProductMutation.isPending || updateProductMutation.isPending}
                    data-testid="submit-button"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {editingProduct
                      ? updateProductMutation.isPending
                        ? "Updating..."
                        : "Update Product"
                      : createProductMutation.isPending
                      ? "Creating..."
                      : "Create Product"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setForm(defaultForm);
                      setEditingProduct(null);
                      setActiveTab("list");
                    }}
                    data-testid="cancel-button"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}