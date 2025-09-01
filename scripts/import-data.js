import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '../shared/schema.js';
import fs from 'fs';
import path from 'path';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function importData() {
  try {
    console.log('Starting data import...');

    // Import courses
    if (fs.existsSync('./data/courses.json')) {
      const coursesData = JSON.parse(fs.readFileSync('./data/courses.json', 'utf8'));
      if (coursesData.length > 0) {
        await db.insert(schema.courses).values(coursesData).onConflictDoNothing();
        console.log(`Imported ${coursesData.length} courses`);
      }
    }

    // Import course content
    if (fs.existsSync('./data/course_content.json')) {
      const contentData = JSON.parse(fs.readFileSync('./data/course_content.json', 'utf8'));
      if (contentData.length > 0) {
        await db.insert(schema.courseContent).values(contentData).onConflictDoNothing();
        console.log(`Imported ${contentData.length} course content items`);
      }
    }

    // Import course enrollments
    if (fs.existsSync('./data/course_enrollments.json')) {
      const enrollmentData = JSON.parse(fs.readFileSync('./data/course_enrollments.json', 'utf8'));
      if (enrollmentData.length > 0) {
        await db.insert(schema.courseEnrollments).values(enrollmentData).onConflictDoNothing();
        console.log(`Imported ${enrollmentData.length} course enrollments`);
      }
    }

    console.log('Data import completed successfully!');
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

importData();