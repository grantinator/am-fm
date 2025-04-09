/**
 * Script to remove all events from the database to start fresh
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
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

async function cleanAllEvents() {
  try {
    console.log('Connecting to database...');
    
    // Count events before deletion
    const eventsCount = await db.select({ count: db.fn.count() }).from(events);
    console.log(`Found ${eventsCount[0].count} events to remove.`);
    
    // First delete all event genres
    const genresResult = await db.delete(eventGenres);
    console.log('Removed all event genres');
    
    // Then delete all events
    const eventsResult = await db.delete(events);
    console.log('Removed all events');
    
    console.log('Successfully cleaned all events from the database. You can now upload fresh seed data.');
  } catch (error) {
    console.error('Error cleaning events:', error);
  }
}

// Run the function
cleanAllEvents();