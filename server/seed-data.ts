import { db } from "./db";
import { courses, courseContent } from "@shared/schema";

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

  } catch (error) {
    console.error('Error seeding database:', error);
  }
}