import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Star, ExternalLink, ShoppingCart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AmazonProduct {
  title: string;
  price: string;
  image: string;
  url: string;
  rating?: string;
  reviews?: string;
  category: string;
  asin?: string;
}

interface ProductSearchProps {
  showSearch?: boolean;
  maxResults?: number;
  category?: string;
  title?: string;
}

export function AmazonProductSearch({ 
  showSearch = true, 
  maxResults = 12, 
  category = 'all',
  title = "Plumbing Tools & Supplies"
}: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/amazon/search', debouncedQuery, selectedCategory, maxResults],
    queryFn: async () => {
      const params = new URLSearchParams({
        query: debouncedQuery,
        category: selectedCategory,
        maxResults: maxResults.toString()
      });
      const response = await fetch(`/api/amazon/search?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'tools', label: 'Tools' },
    { value: 'pipe_fittings', label: 'Pipe Fittings' },
    { value: 'valves', label: 'Valves' },
    { value: 'safety_equipment', label: 'Safety Equipment' },
    { value: 'measuring_tools', label: 'Measuring Tools' },
    { value: 'books', label: 'Books & Manuals' },
    { value: 'supplies', label: 'Supplies' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-2">
          Professional tools and supplies for plumbing professionals. 
          <span className="text-primary font-medium"> Earn us a small commission with no extra cost to you!</span>
        </p>
      </div>

      {/* Search Controls */}
      {showSearch && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search for tools, fittings, valves..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-amazon-search"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-product-category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: maxResults }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-0">
                <Skeleton className="h-48 w-full" />
              </CardHeader>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-6 w-1/3" />
              </CardContent>
            </Card>
          ))
        ) : (
          products?.products?.map((product: AmazonProduct, index: number) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow group" data-testid={`card-product-${index}`}>
              <CardHeader className="p-0">
                <div className="relative overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTIwQzE2NS41IDEyMCAxNzggMTMyLjUgMTc4IDE0OEMxNzggMTYzLjUgMTY1LjUgMTc2IDE1MCAxNzZDMTM0LjUgMTc2IDEyMiAxNjMuNSAxMjIgMTQ4QzEyMiAxMzIuNSAxMzQuNSAxMjAgMTUwIDEyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                    }}
                  />
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 right-2 bg-white/90 text-primary"
                  >
                    {categories.find(c => c.value === product.category)?.label || product.category}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <CardTitle className="text-sm font-medium line-clamp-2 mb-4" data-testid={`text-product-title-${index}`}>
                  {product.title}
                </CardTitle>
                
                <div className="text-sm text-muted-foreground mb-2">
                  See current pricing and details on Amazon
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-0">
                <Button asChild className="w-full" size="sm">
                  <a 
                    href={product.url}
                    target="_blank"
                    rel="nofollow sponsored noopener noreferrer"
                    data-testid={`link-product-${index}`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    View on Amazon
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* No Results */}
      {!isLoading && products?.products?.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or category filter.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          <strong>Amazon Associate Disclosure:</strong> As an Amazon Associate, we earn from qualifying purchases. 
          When you click on our links and make a purchase, we may receive a small commission at no extra cost to you. 
          This helps support our platform and educational content.
        </p>
      </div>
    </div>
  );
}

export function FeaturedProducts() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/amazon/featured'],
    queryFn: async () => {
      const response = await fetch('/api/amazon/featured');
      if (!response.ok) throw new Error('Failed to fetch featured products');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return (
    <AmazonProductSearch 
      showSearch={false}
      maxResults={6}
      title="Featured Tools for Plumbers"
    />
  );
}