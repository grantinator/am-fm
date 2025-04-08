import fs from 'fs';
import path from 'path';
import { Database } from '@replit/database';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database();
const EVENTS_KEY = "events";

async function migrateEvents() {
  try {
    // First, check if events already exist in the database
    const existingEvents = await db.get(EVENTS_KEY) || [];
    console.log(`Found ${Array.isArray(existingEvents) ? existingEvents.length : 0} existing events in database.`);
    
    // Read events from file
    const eventsFilePath = path.join(process.cwd(), 'events.json');
    if (!fs.existsSync(eventsFilePath)) {
      console.error('events.json file not found!');
      return;
    }
    
    const fileContent = fs.readFileSync(eventsFilePath, 'utf8');
    const fileEvents = JSON.parse(fileContent);
    console.log(`Read ${fileEvents.length} events from events.json`);
    
    // Prepare events for saving
    let allEvents;
    if (Array.isArray(existingEvents) && existingEvents.length > 0) {
      // Create a map of existing event IDs for quick lookup
      const existingEventIds = new Set(existingEvents.map(e => e.id));
      
      // Only add events from file that don't already exist in the database
      const newEvents = fileEvents.filter(event => !existingEventIds.has(event.id));
      console.log(`Found ${newEvents.length} new events to add to the database.`);
      
      // Combine existing and new events
      allEvents = [...existingEvents, ...newEvents];
    } else {
      // No existing events, use all events from file
      allEvents = fileEvents;
      console.log(`No existing events in database, adding all ${fileEvents.length} events.`);
    }
    
    // Ensure date objects are properly formatted before saving
    const formattedEvents = allEvents.map(event => ({
      ...event,
      // These will be converted back to Date objects when retrieved
      date: event.date instanceof Date ? event.date.toISOString() : event.date,
      createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt
    }));
    
    // Save combined events to database
    await db.set(EVENTS_KEY, formattedEvents);
    console.log(`Successfully saved ${formattedEvents.length} events to database.`);
    
    console.log('Migration complete!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

migrateEvents();