/**
 * Script to remove all events with unsplash images 
 * to allow for fresh, manually created seed data
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, like } from 'drizzle-orm';
import ws from 'ws';
import * as schema from './shared/schema.ts';
import { events, eventGenres } from './shared/schema.ts';

// Configure connection to database
neonConfig.webSocketConstructor = ws;

// Connect to database
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function removeEventsWithUnsplashImages() {
  try {
    console.log('Connecting to database...');
    
    // Find all events with unsplash images
    const unsplashEvents = await db.select()
      .from(events)
      .where(like(events.imageUrl, '%unsplash.com%'));
    
    console.log(`Found ${unsplashEvents.length} events with Unsplash images to remove.`);
    
    // Delete each event and its related genres
    for (const event of unsplashEvents) {
      console.log(`Removing event: ${event.title} (ID: ${event.id})`);
      
      // First delete related genres
      await db.delete(eventGenres)
        .where(eq(eventGenres.eventId, event.id));
      
      // Then delete the event
      await db.delete(events)
        .where(eq(events.id, event.id));
    }
    
    console.log('Successfully removed all events with Unsplash images');
  } catch (error) {
    console.error('Error removing events:', error);
  }
}

// Run the function
removeEventsWithUnsplashImages();