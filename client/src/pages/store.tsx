import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Search, ShoppingCart } from "lucide-react";
import { Link } from "wouter";

export default function Store() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["/api/products", { search: searchTerm, category, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (category) params.set("category", category);
      params.set("page", page.toString());
      params.set("limit", "12");
      
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const { data: featuredProducts } = useQuery({
    queryKey: ["/api/products/featured"],
    queryFn: async () => {
      const response = await fetch("/api/products/featured?limit=4");
      if (!response.ok) throw new Error("Failed to fetch featured products");
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4" data-testid="store-title">
            Professional Plumbing Tools & Equipment
          </h1>
          <p className="text-gray-600 dark:text-gray-300" data-testid="store-description">
            Discover high-quality tools and equipment recommended by Louisiana plumbing professionals
          </p>
        </div>

        {/* Featured Products */}
        {featuredProducts && featuredProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6" data-testid="featured-title">
              Featured Products
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product: any) => (
                <Card key={product.id} className="group hover:shadow-lg transition-shadow" data-testid={`featured-product-${product.id}`}>
                  <CardHeader className="p-0">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={product.imageUrl || "/api/placeholder/300/200"}
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        data-testid="product-image"
                      />
                      <Badge className="absolute top-2 left-2 bg-blue-600 text-white" data-testid="featured-badge">
                        Featured
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-2 line-clamp-2" data-testid="product-name">
                      {product.name}
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2" data-testid="product-description">
                      {product.shortDescription || product.description}
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center" data-testid="product-rating">
                        {renderStars(parseFloat(product.rating || "0"))}
                      </div>
                      <span className="text-sm text-gray-500" data-testid="review-count">
                        ({product.reviewCount || 0})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-blue-600" data-testid="product-price">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                        <span className="text-sm text-gray-500 line-through" data-testid="original-price">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Link href={`/store/product/${product.id}`} className="w-full">
                      <Button className="w-full" data-testid="view-product-button">
                        View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-64" data-testid="category-filter">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="" data-testid="category-all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value} data-testid={`category-${cat.value}`}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {productsData?.products?.map((product: any) => (
            <Card key={product.id} className="group hover:shadow-lg transition-shadow" data-testid={`product-card-${product.id}`}>
              <CardHeader className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={product.imageUrl || "/api/placeholder/300/200"}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    data-testid="product-image"
                  />
                  {product.isFeatured && (
                    <Badge className="absolute top-2 left-2 bg-blue-600 text-white" data-testid="featured-badge">
                      Featured
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg mb-2 line-clamp-2" data-testid="product-name">
                  {product.name}
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2" data-testid="product-description">
                  {product.shortDescription || product.description}
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center" data-testid="product-rating">
                    {renderStars(parseFloat(product.rating || "0"))}
                  </div>
                  <span className="text-sm text-gray-500" data-testid="review-count">
                    ({product.reviewCount || 0})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-blue-600" data-testid="product-price">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                    <span className="text-sm text-gray-500 line-through" data-testid="original-price">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Link href={`/store/product/${product.id}`} className="w-full">
                  <Button className="w-full" data-testid="view-product-button">
                    View Details
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {productsData?.total && productsData.total > 12 && (
          <div className="flex justify-center items-center gap-4" data-testid="pagination">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              data-testid="prev-page"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-300" data-testid="page-info">
              Page {page} of {Math.ceil(productsData.total / 12)}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(productsData.total / 12)}
              data-testid="next-page"
            >
              Next
            </Button>
          </div>
        )}

        {/* Empty State */}
        {productsData?.products?.length === 0 && (
          <div className="text-center py-12" data-testid="empty-state">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No products found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}