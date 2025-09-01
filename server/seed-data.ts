import { db } from "./db";
import { courses, courseContent, products } from "@shared/schema";

export async function seedDatabase() {
  try {
    console.log('Checking if database needs seeding...');
    
    // Check if courses already exist
    const existingCourses = await db.select().from(courses);
    if (existingCourses.length > 0) {
      console.log('Database already seeded');
      return;
    }

    console.log('Seeding database with course data...');

    // Insert your courses
    const courseData = [
      {
        id: 1,
        title: "Louisiana Journeyman Prep",
        description: "Comprehensive preparation for Louisiana Journeyman Plumber certification exam. Covers all essential topics including codes, regulations, and practical applications.",
        price: 49.99,
        duration: "6 weeks",
        level: "Intermediate",
        category: "certification",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        title: "Backflow Prevention Training",
        description: "Learn testing, repairs, and field report completion for backflow prevention systems. Essential for maintaining water safety standards.",
        price: 79.99,
        duration: "4 weeks", 
        level: "Advanced",
        category: "training course",
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        title: "Natural Gas Certification",
        description: "Complete certification program for natural gas installation and safety. Covers regulations, safety protocols, and installation techniques.",
        price: 89.99,
        duration: "5 weeks",
        level: "Advanced", 
        category: "certification",
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        title: "Medical Gas Installer Certification",
        description: "Specialized training for medical gas systems in healthcare facilities. Critical safety and regulatory compliance training.",
        price: 99.99,
        duration: "6 weeks",
        level: "Expert",
        category: "certification",
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        title: "Master Plumber Prep",
        description: "Advanced preparation for Master Plumber license exam. Comprehensive coverage of advanced plumbing concepts and business practices.",
        price: 129.99,
        duration: "8 weeks",
        level: "Expert",
        category: "certification", 
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await db.insert(courses).values(courseData);
    console.log(`Seeded ${courseData.length} courses successfully`);

    // Check if products already exist
    const existingProducts = await db.select().from(products);
    if (existingProducts.length === 0) {
      // Insert sample products for the store
      const productData = [
        {
          id: "1",
          name: "Digital Gas Detector Pro",
          description: "Professional-grade gas leak detector with advanced sensors for natural gas, propane, and methane detection. Essential for plumbing professionals working with gas lines.",
          shortDescription: "Professional gas leak detector for plumbers",
          category: "gas_detection" as const,
          price: "199.99",
          originalPrice: "249.99",
          amazonUrl: "https://amazon.com/dp/example1",
          affiliateTag: "laplumbprep-20",
          imageUrl: "/api/placeholder/300/200",
          brand: "ProDetect",
          rating: "4.7",
          reviewCount: 156,
          isFeatured: true,
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "2", 
          name: "Professional Pipe Threading Set",
          description: "Complete pipe threading set with dies for 1/8\" to 2\" pipes. Includes ratchet handle, dies, and carrying case. Perfect for plumbing installations and repairs.",
          shortDescription: "Complete pipe threading set with dies",
          category: "pipe_tools" as const,
          price: "299.99",
          originalPrice: "399.99", 
          amazonUrl: "https://amazon.com/dp/example2",
          affiliateTag: "laplumbprep-20",
          imageUrl: "/api/placeholder/300/200",
          brand: "RidgidPro",
          rating: "4.5",
          reviewCount: 89,
          isFeatured: true,
          isActive: true,
          sortOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "3",
          name: "Digital Pipe Locator",
          description: "Advanced digital pipe locator for finding buried pipes and utilities. Features depth measurement, signal strength indicators, and multiple frequency modes.",
          shortDescription: "Digital pipe locator with depth measurement",
          category: "measuring" as const,
          price: "449.99",
          amazonUrl: "https://amazon.com/dp/example3",
          affiliateTag: "laplumbprep-20",
          imageUrl: "/api/placeholder/300/200",
          brand: "PipeFind",
          rating: "4.6",
          reviewCount: 67,
          isFeatured: false,
          isActive: true,
          sortOrder: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "4",
          name: "Safety Glasses Kit",
          description: "ANSI Z87.1 certified safety glasses kit with multiple lens options. Includes clear, tinted, and anti-fog lenses. Essential PPE for plumbing work.",
          shortDescription: "ANSI certified safety glasses with multiple lenses",
          category: "safety" as const,
          price: "39.99",
          originalPrice: "49.99",
          amazonUrl: "https://amazon.com/dp/example4",
          affiliateTag: "laplumbprep-20",
          imageUrl: "/api/placeholder/300/200",
          brand: "SafeWork",
          rating: "4.4",
          reviewCount: 234,
          isFeatured: false,
          isActive: true,
          sortOrder: 4,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "5",
          name: "Louisiana Plumbing Code Book 2025",
          description: "Official 2025 Louisiana State Plumbing Code book with latest updates and amendments. Essential reference for plumbers and contractors.",
          shortDescription: "Official 2025 Louisiana plumbing code book",
          category: "books" as const,
          price: "79.99",
          amazonUrl: "https://amazon.com/dp/example5",
          affiliateTag: "laplumbprep-20",
          imageUrl: "/api/placeholder/300/200",
          brand: "Louisiana Board",
          rating: "4.8",
          reviewCount: 45,
          isFeatured: true,
          isActive: true,
          sortOrder: 5,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await db.insert(products).values(productData);
      console.log(`Seeded ${productData.length} products successfully`);
    }

  } catch (error) {
    console.error('Error seeding database:', error);
  }
}