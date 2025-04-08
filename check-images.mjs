// Script to check for events with broken or missing images from the database
import Database from '@replit/database';
import fetch from 'node-fetch';

const db = new Database();
const EVENTS_KEY = "events";

async function checkImageValidity(url) {
  if (!url) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type').startsWith('image/');
  } catch (error) {
    console.error(`Error checking image URL: ${url}`, error.message);
    return false;
  }
}

async function checkEvents() {
  try {
    console.log("Starting image check...");
    
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
    console.log("Checking image URLs...");
    
    // Process events in batches to avoid too many concurrent requests
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < events.length; i += batchSize) {
      batches.push(events.slice(i, i + batchSize));
    }
    
    let invalidImageEvents = [];
    
    // Process each batch
    for (const batch of batches) {
      const results = await Promise.all(
        batch.map(async (event) => {
          const isValid = await checkImageValidity(event.imageUrl);
          if (!isValid) {
            console.log(`Invalid image for event: ${event.title} (ID: ${event.id}) - URL: ${event.imageUrl}`);
            return event;
          }
          return null;
        })
      );
      
      invalidImageEvents = [...invalidImageEvents, ...results.filter(r => r !== null)];
    }
    
    if (invalidImageEvents.length === 0) {
      console.log("All events have valid images!");
    } else {
      console.log(`Found ${invalidImageEvents.length} events with invalid images.`);
      console.log("Invalid image event IDs:", invalidImageEvents.map(e => e.id).join(", "));
    }
    
  } catch (error) {
    console.error("Error checking events:", error);
  }
}

// Run the check function
checkEvents();