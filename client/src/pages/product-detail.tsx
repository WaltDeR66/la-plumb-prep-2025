import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, ShoppingCart, ExternalLink, ChevronLeft, Plus, Minus } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const [, params] = useRoute("/store/product/:id");
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ["/api/products", params?.id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${params?.id}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      return response.json();
    },
    enabled: !!params?.id,
  });

  const { data: reviews } = useQuery({
    queryKey: ["/api/products", params?.id, "reviews"],
    queryFn: async () => {
      const response = await fetch(`/api/products/${params?.id}/reviews`);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    },
    enabled: !!params?.id,
  });

  // Check if user is authenticated
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      // If user is authenticated, use API
      if (user) {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ productId, quantity }),
        });
        if (!response.ok) throw new Error("Failed to add to cart");
        return response.json();
      } else {
        // If not authenticated, use localStorage
        const existingCart = JSON.parse(localStorage.getItem("guest-cart") || "[]");
        const existingItem = existingCart.find((item: any) => item.productId === productId);
        
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          existingCart.push({ 
            productId, 
            quantity, 
            product: product,
            addedAt: new Date().toISOString() 
          });
        }
        
        localStorage.setItem("guest-cart", JSON.stringify(existingCart));
        // Dispatch custom event to update cart count in header
        window.dispatchEvent(new Event('cartUpdated'));
        return { success: true };
      }
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: user ? 
          "Product has been added to your cart successfully." :
          "Product added to cart. Sign in to save your cart across devices.",
      });
      if (user) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product to cart",
        variant: "destructive",
      });
    },
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const handleAddToCart = () => {
    if (product) {
      addToCartMutation.mutate({ productId: product.id, quantity });
    }
  };

  const handleBuyOnAmazon = () => {
    if (product?.amazonUrl) {
      window.open(product.amazonUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Product not found
            </h2>
            <Link href="/store">
              <Button>Back to Store</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/store" className="inline-flex items-center text-blue-600 hover:text-blue-700" data-testid="back-to-store">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Store
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-4">
              <img
                src={product.imageUrl || "/api/placeholder/600/400"}
                alt={product.name}
                className="w-full h-96 object-contain"
                data-testid="product-image-large"
              />
              {product.isFeatured && (
                <Badge className="absolute top-6 left-6 bg-blue-600 text-white" data-testid="featured-badge">
                  Featured
                </Badge>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4" data-testid="product-title">
                {product.name}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center" data-testid="product-rating">
                  {renderStars(parseFloat(product.rating || "0"))}
                </div>
                <span className="text-sm text-gray-500" data-testid="review-count">
                  {product.reviewCount || 0} reviews
                </span>
                {product.brand && (
                  <Badge variant="outline" data-testid="product-brand">
                    {product.brand}
                  </Badge>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-blue-600" data-testid="product-price">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                  <span className="text-xl text-gray-500 line-through" data-testid="original-price">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 mb-6" data-testid="product-description">
                {product.description}
              </p>

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3" data-testid="features-title">
                    Key Features
                  </h3>
                  <ul className="space-y-2" data-testid="features-list">
                    {product.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quantity and Add to Cart */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4">
                  <span className="font-medium text-gray-900 dark:text-white" data-testid="quantity-label">
                    Quantity:
                  </span>
                  <div className="flex items-center border rounded-md" data-testid="quantity-selector">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      data-testid="quantity-decrease"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="px-3 py-2 min-w-[3rem] text-center" data-testid="quantity-value">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      data-testid="quantity-increase"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleAddToCart}
                    disabled={addToCartMutation.isPending}
                    className="flex-1"
                    data-testid="add-to-cart-button"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                  </Button>
                  <Button
                    onClick={handleBuyOnAmazon}
                    variant="outline"
                    className="flex-1"
                    data-testid="buy-on-amazon-button"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Buy on Amazon
                  </Button>
                </div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <span className="text-sm text-gray-500">Category: </span>
                <Badge variant="secondary" data-testid="product-category">
                  {product.category.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        {product.specifications && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle data-testid="specifications-title">Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="specifications-grid">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">{value as string}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle data-testid="reviews-title">
                Customer Reviews ({reviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6" data-testid="reviews-list">
                {reviews.map((review: any) => (
                  <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center" data-testid="review-rating">
                        {renderStars(review.rating)}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {review.title}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-2" data-testid="review-comment">
                      {review.comment}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>By {review.user?.firstName || "Anonymous"}</span>
                      <span>•</span>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      {review.isVerifiedPurchase && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            Verified Purchase
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}