// Script to remove events with missing images from the database
const Database = require('@replit/database');
const db = new Database();
const EVENTS_KEY = "events";

async function cleanEvents() {
  try {
    console.log("Starting database cleanup...");
    
    // Get all events from the database
    const result = await db.get(EVENTS_KEY);
    
    if (!result) {
      console.log("No events found in database.");
      return;
    }
    
    // Parse events
    let events = [];
    if (Array.isArray(result)) {
      events = result;
    } else if (result.value && Array.isArray(result.value)) {
      events = result.value;
    } else {
      console.error("Invalid events data in database:", result);
      return;
    }
    
    console.log(`Found ${events.length} events in database.`);
    
    // Filter events to remove ones with missing or broken images
    const validEvents = events.filter(event => {
      // Check if the event has a valid imageUrl
      return event.imageUrl && 
        typeof event.imageUrl === 'string' && 
        event.imageUrl.trim() !== '' && 
        !event.imageUrl.includes('undefined') &&
        !event.imageUrl.includes('null');
    });
    
    console.log(`Filtered to ${validEvents.length} events with valid images.`);
    console.log(`Removing ${events.length - validEvents.length} events with missing images.`);
    
    if (events.length === validEvents.length) {
      console.log("No events to remove. All events have valid images.");
      return;
    }
    
    // Save filtered events back to the database
    await db.set(EVENTS_KEY, validEvents);
    console.log("Database cleanup complete.");
    
  } catch (error) {
    console.error("Error cleaning events:", error);
  }
}

// Run the cleanup function
cleanEvents();