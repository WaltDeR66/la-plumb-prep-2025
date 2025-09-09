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
        image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=300&fit=crop&crop=center",
        url: `https://www.amazon.com/s?k=RIDGID+tubing+cutter&tag=${this.associateTag}&linkCode=ll2&linkId=example`,
        rating: "4.5",
        reviews: "1,203",
        category: "tools",
        asin: "search"
      },
      {
        title: "SharkBite U720A 1/2-Inch Slip Coupling, 2-Pack",
        price: "$8.47",
        image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=300&h=300&fit=crop&crop=center",
        url: `https://www.amazon.com/s?k=SharkBite+slip+coupling&tag=${this.associateTag}&linkCode=ll2&linkId=example`,
        rating: "4.6",
        reviews: "2,154",
        category: "pipe_fittings",
        asin: "search"
      },
      {
        title: "DEWALT Pipe Threading Machine, Heavy Duty (DWPN50)",
        price: "$2,397.00",
        image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300&h=300&fit=crop&crop=center",
        url: `https://www.amazon.com/s?k=DEWALT+pipe+threading+machine&tag=${this.associateTag}&linkCode=ll2&linkId=example`,
        rating: "4.7",
        reviews: "89",
        category: "tools",
        asin: "search"
      },
      {
        title: "General Tools & Instruments 1/8 Digital Pipe Locator",
        price: "$89.99",
        image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=300&fit=crop&crop=center",
        url: `https://www.amazon.com/s?k=digital+pipe+locator&tag=${this.associateTag}&linkCode=ll2&linkId=example`,
        rating: "4.1",
        reviews: "342",
        category: "measuring_tools",
        asin: "search"
      },
      {
        title: "Milwaukee M12 Fuel Hackzall Reciprocating Saw Kit",
        price: "$199.00",
        image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=300&fit=crop&crop=center",
        url: `https://www.amazon.com/s?k=Milwaukee+M12+hackzall&tag=${this.associateTag}&linkCode=ll2&linkId=example`,
        rating: "4.8",
        reviews: "567",
        category: "tools",
        asin: "search"
      },
      {
        title: "Legend Valve 101-143NL T-451 FIP Ball Valve, Bronze",
        price: "$22.95",
        image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300&h=300&fit=crop&crop=center",
        url: `https://www.amazon.com/s?k=FIP+ball+valve+bronze&tag=${this.associateTag}&linkCode=ll2&linkId=example`,
        rating: "4.4",
        reviews: "198",
        category: "valves",
        asin: "search"
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