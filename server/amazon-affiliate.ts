/**
 * Amazon Affiliate Integration
 * Uses SiteStripe approach - generates affiliate links without requiring API access
 */

export interface AmazonProduct {
  title: string;
  price: string;
  image: string;
  url: string;
  rating?: string;
  reviews?: string;
  category: string;
  asin?: string;
}

export interface ProductSearchParams {
  query: string;
  category?: string;
  maxResults?: number;
}

export class AmazonAffiliateService {
  private associateTag: string;

  constructor(associateTag: string = 'laplumbprep-20') {
    this.associateTag = associateTag;
  }

  /**
   * Generate affiliate link with associate tag
   */
  generateAffiliateLink(productUrl: string, asin?: string): string {
    if (asin) {
      return `https://www.amazon.com/dp/${asin}?tag=${this.associateTag}`;
    }
    
    // Extract ASIN from URL if possible
    const asinMatch = productUrl.match(/\/dp\/([A-Z0-9]{10})/i) || 
                     productUrl.match(/\/gp\/product\/([A-Z0-9]{10})/i);
    
    if (asinMatch) {
      return `https://www.amazon.com/dp/${asinMatch[1]}?tag=${this.associateTag}`;
    }
    
    // Fallback: append tag to existing URL
    const separator = productUrl.includes('?') ? '&' : '?';
    return `${productUrl}${separator}tag=${this.associateTag}`;
  }

  /**
   * Search Amazon products using web scraping approach
   * Note: This is a simplified version for demo. For production, consider using Amazon's PA API when available.
   */
  async searchProducts(params: ProductSearchParams): Promise<AmazonProduct[]> {
    const { query, category = 'all', maxResults = 12 } = params;
    
    // For now, return plumbing-specific products as examples
    // In a real implementation, you could web scrape Amazon search results
    const plumbingProducts: AmazonProduct[] = [
      {
        title: "RIDGID 31632 Model 103 Close Quarters Tubing Cutter",
        price: "$23.97",
        image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjE1MCIgcj0iNDAiIGZpbGw9IiM2MzY2RjEiLz4KPHN2Zz4K",
        url: this.generateAffiliateLink("https://www.amazon.com/dp/B000BQTCPQ"),
        rating: "4.5",
        reviews: "1,203",
        category: "tools",
        asin: "B000BQTCPQ"
      },
      {
        title: "SharkBite U720A 1/2-Inch Slip Coupling, 2-Pack",
        price: "$8.47",
        image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjEyMCIgeT0iMTIwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiMxMEI5ODEiLz4KPHN2Zz4K",
        url: this.generateAffiliateLink("https://www.amazon.com/dp/B004I9YBRQ"),
        rating: "4.6",
        reviews: "2,154",
        category: "pipe_fittings",
        asin: "B004I9YBRQ"
      },
      {
        title: "DEWALT Pipe Threading Machine, Heavy Duty (DWPN50)",
        price: "$2,397.00",
        image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjE1MCIgcj0iNDAiIGZpbGw9IiNGRjlBMDAiLz4KPHN2Zz4K",
        url: this.generateAffiliateLink("https://www.amazon.com/dp/B00I4V5ZSS"),
        rating: "4.7",
        reviews: "89",
        category: "tools",
        asin: "B00I4V5ZSS"
      },
      {
        title: "General Tools & Instruments 1/8 Digital Pipe Locator",
        price: "$89.99",
        image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjEyMCIgeT0iMTIwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNEQzI2MjYiLz4KPHN2Zz4K",
        url: this.generateAffiliateLink("https://www.amazon.com/dp/B00K2MZKXW"),
        rating: "4.1",
        reviews: "342",
        category: "measuring_tools",
        asin: "B00K2MZKXW"
      },
      {
        title: "Milwaukee M12 Fuel Hackzall Reciprocating Saw Kit",
        price: "$199.00",
        image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjE1MCIgcj0iNDAiIGZpbGw9IiMxNjE4NUEiLz4KPHN2Zz4K",
        url: this.generateAffiliateLink("https://www.amazon.com/dp/B07D7Z1VPR"),
        rating: "4.8",
        reviews: "567",
        category: "tools",
        asin: "B07D7Z1VPR"
      },
      {
        title: "Legend Valve 101-143NL T-451 FIP Ball Valve, Bronze",
        price: "$22.95",
        image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjEyMCIgeT0iMTIwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNFNjc5MDAiLz4KPHN2Zz4K",
        url: this.generateAffiliateLink("https://www.amazon.com/dp/B008L8KPTY"),
        rating: "4.4",
        reviews: "198",
        category: "valves",
        asin: "B008L8KPTY"
      }
    ];

    // Filter by category if specified
    let results = plumbingProducts;
    if (category !== 'all') {
      results = plumbingProducts.filter(product => product.category === category);
    }

    // Filter by search query
    if (query.trim()) {
      const searchTerms = query.toLowerCase().split(' ');
      results = results.filter(product => 
        searchTerms.some(term => 
          product.title.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term)
        )
      );
    }

    return results.slice(0, maxResults);
  }

  /**
   * Get featured plumbing products
   */
  async getFeaturedProducts(): Promise<AmazonProduct[]> {
    return this.searchProducts({ query: '', category: 'all', maxResults: 6 });
  }

  /**
   * Get popular tools for plumbers
   */
  async getPopularTools(): Promise<AmazonProduct[]> {
    return this.searchProducts({ query: '', category: 'tools', maxResults: 8 });
  }
}

export const amazonAffiliate = new AmazonAffiliateService('laplumbprep-20');