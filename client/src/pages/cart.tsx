import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const [guestCartItems, setGuestCartItems] = useState<any[]>([]);
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: apiCartItems } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
    retry: false,
  });

  // Load guest cart from localStorage
  useEffect(() => {
    if (!user) {
      const guestCart = JSON.parse(localStorage.getItem("guest-cart") || "[]");
      setGuestCartItems(guestCart);
    }
  }, [user]);

  const cartItems = user ? (apiCartItems || []) : guestCartItems;

  const updateGuestCartQuantity = (productId: string, newQuantity: number) => {
    const updatedCart = guestCartItems.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ).filter(item => item.quantity > 0);
    
    setGuestCartItems(updatedCart);
    localStorage.setItem("guest-cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeGuestCartItem = (productId: string) => {
    const updatedCart = guestCartItems.filter(item => item.productId !== productId);
    setGuestCartItems(updatedCart);
    localStorage.setItem("guest-cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
    
    toast({
      title: "Item removed",
      description: "Product has been removed from your cart",
    });
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.product?.price || item.price || "0");
      return total + (price * item.quantity);
    }, 0).toFixed(2);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Add some products to get started
              </p>
              <Link href="/store">
                <Button>Continue Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => {
              const product = item.product || item;
              return (
                <Card key={item.productId || index}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={product.image || "/placeholder-product.jpg"}
                          alt={product.title || product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {product.title || product.name}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {product.category}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-lg font-bold text-primary">
                            ${parseFloat(product.price || "0").toFixed(2)}
                          </span>
                          {product.rating && (
                            <Badge variant="outline">
                              ⭐ {product.rating}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => 
                            user 
                              ? {} // TODO: API call for authenticated users
                              : updateGuestCartQuantity(item.productId, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => 
                            user 
                              ? {} // TODO: API call for authenticated users
                              : updateGuestCartQuantity(item.productId, item.quantity + 1)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => 
                          user 
                            ? {} // TODO: API call for authenticated users
                            : removeGuestCartItem(item.productId)
                        }
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Items ({cartItems.length})</span>
                  <span>${calculateTotal()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${calculateTotal()}</span>
                </div>

                {!user && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800 mb-2">
                      Sign in to save your cart and complete your purchase
                    </p>
                    <div className="space-y-2">
                      <Link href="/login">
                        <Button variant="outline" size="sm" className="w-full">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button size="sm" className="w-full">
                          Create Account
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                <Button className="w-full" size="lg">
                  Proceed to Checkout
                </Button>

                <Link href="/store">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}