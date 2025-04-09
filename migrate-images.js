/**
 * Script to migrate images from the old uploads directory to the new persistent directory
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the old and new paths
const oldUploadsDir = path.join(process.cwd(), 'dist/public/uploads');
const newUploadsDir = path.join(process.cwd(), 'persistent_uploads');

// Create the new directory if it doesn't exist
if (!fs.existsSync(newUploadsDir)) {
  fs.mkdirSync(newUploadsDir, { recursive: true });
  console.log(`Created new uploads directory at ${newUploadsDir}`);
}

// Check if old directory exists
if (!fs.existsSync(oldUploadsDir)) {
  console.log(`Old uploads directory not found at ${oldUploadsDir}`);
  process.exit(0);
}

// Copy files from old to new directory
try {
  const files = fs.readdirSync(oldUploadsDir);
  
  if (files.length === 0) {
    console.log('No files found in the old uploads directory.');
    process.exit(0);
  }
  
  console.log(`Found ${files.length} files to migrate.`);
  
  for (const file of files) {
    const oldPath = path.join(oldUploadsDir, file);
    const newPath = path.join(newUploadsDir, file);
    
    // Skip if file already exists in the destination
    if (fs.existsSync(newPath)) {
      console.log(`File ${file} already exists in the new directory, skipping.`);
      continue;
    }
    
    // Copy the file
    fs.copyFileSync(oldPath, newPath);
    console.log(`Migrated ${file}`);
  }
  
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Error during migration:', error);
}