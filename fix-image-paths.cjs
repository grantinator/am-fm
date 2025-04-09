/**
 * Script to fix image references in events to ensure they match our persistent_uploads structure
 * This script:
 * 1. Checks all events for image paths
 * 2. Attempts to locate those images in the persistent_uploads directory
 * 3. If an image exists with that filename, ensures the database reference is correct
 * 4. Logs information about which events had image references fixed
 */

const Database = require('@replit/database');
const fs = require('fs');
const path = require('path');

// Setup database connection
const db = new Database();
const EVENTS_KEY = "events";

// Directory paths
const PERSISTENT_UPLOADS_DIR = path.join(process.cwd(), 'persistent_uploads');

// Ensure persistent uploads directory exists
if (!fs.existsSync(PERSISTENT_UPLOADS_DIR)) {
  fs.mkdirSync(PERSISTENT_UPLOADS_DIR, { recursive: true });
  console.log(`Created persistent uploads directory at ${PERSISTENT_UPLOADS_DIR}`);
}

// Get all files in persistent uploads directory
const getPersistentFiles = () => {
  try {
    return fs.readdirSync(PERSISTENT_UPLOADS_DIR);
  } catch (error) {
    console.error('Error reading persistent uploads directory:', error);
    return [];
  }
};

// Get all events from database
const getEventsFromDb = async () => {
  try {
    const result = await db.get(EVENTS_KEY);
    
    if (!result) {
      return [];
    }
    
    // Check if the result is already an array
    if (Array.isArray(result)) {
      return result.map((event) => ({
        ...event,
        date: new Date(event.date),
        createdAt: new Date(event.createdAt),
        // Ensure genres is always an array
        genres: Array.isArray(event.genres) ? event.genres : []
      }));
    }
    
    // If it's not an array, it might be an object with a "value" property (Replit DB format)
    if (result.value && Array.isArray(result.value)) {
      return result.value.map((event) => ({
        ...event,
        date: new Date(event.date),
        createdAt: new Date(event.createdAt),
        // Ensure genres is always an array
        genres: Array.isArray(event.genres) ? event.genres : []
      }));
    }
    
    console.error("Invalid events data in database:", result);
    return [];
  } catch (error) {
    console.error("Error retrieving events from database:", error);
    return [];
  }
};

// Save events to database
const saveEventsToDb = async (events) => {
  try {
    // Prepare events for storage - convert Date objects to strings
    const eventsForStorage = events.map(event => ({
      ...event,
      date: event.date instanceof Date ? event.date.toISOString() : event.date,
      createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
    }));
    
    // Set the events in the database
    await db.set(EVENTS_KEY, eventsForStorage);
    console.log(`Saved ${events.length} events to database`);
    return true;
  } catch (error) {
    console.error("Error saving events to database:", error);
    return false;
  }
};

// Fix image references in events
const fixImageReferences = async () => {
  try {
    console.log('Starting image path fix process...');
    
    // Get all events
    const events = await getEventsFromDb();
    console.log(`Found ${events.length} events in the database`);
    
    // Get all files in persistent uploads directory
    const persistentFiles = getPersistentFiles();
    console.log(`Found ${persistentFiles.length} files in the persistent uploads directory`);
    
    // Track which events needed fixing
    let fixedEvents = 0;
    let eventsWithMissingImages = 0;
    let eventsWithNoImageUrls = 0;
    
    // Process each event
    const updatedEvents = events.map(event => {
      // If event doesn't have an imageUrl, nothing to fix
      if (!event.imageUrl) {
        eventsWithNoImageUrls++;
        return event;
      }
      
      // Extract the filename from the imageUrl (remove `/uploads/` prefix)
      const filename = event.imageUrl.replace('/uploads/', '');
      
      // Check if the file exists in the persistent uploads directory
      if (persistentFiles.includes(filename)) {
        // Image exists, ensure the URL is correctly formatted
        if (event.imageUrl !== `/uploads/${filename}`) {
          event.imageUrl = `/uploads/${filename}`;
          fixedEvents++;
          console.log(`Fixed image URL for event: ${event.title} (ID: ${event.id})`);
        }
      } else {
        // Image doesn't exist in persistent uploads
        console.log(`Warning: Image ${filename} for event "${event.title}" (ID: ${event.id}) not found in persistent uploads`);
        eventsWithMissingImages++;
      }
      
      return event;
    });
    
    // Save updated events if any were fixed
    if (fixedEvents > 0) {
      console.log(`Fixing ${fixedEvents} events with incorrect image URLs...`);
      await saveEventsToDb(updatedEvents);
    } else {
      console.log('No events needed image URL fixes');
    }
    
    // Summary
    console.log('\nFix Image Paths Summary:');
    console.log(`- Total events: ${events.length}`);
    console.log(`- Events with no image URLs: ${eventsWithNoImageUrls}`);
    console.log(`- Events with missing images: ${eventsWithMissingImages}`);
    console.log(`- Events with fixed image URLs: ${fixedEvents}`);
    
  } catch (error) {
    console.error('Error fixing image references:', error);
  }
};

// Run the fix function
fixImageReferences();