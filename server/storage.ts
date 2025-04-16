import * as schema from "@shared/schema";
import {
  events,
  eventGenres,
  type Event,
  type InsertEvent,
  type EventWithGenres
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import 'dotenv/config'

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const db = drizzle(process.env.DATABASE_URL, { schema: schema });

export interface IStorage {
  getAllEvents(): Promise<EventWithGenres[]>;
  getEvent(id: number): Promise<EventWithGenres | undefined>;
  createEvent(event: InsertEvent, genres: string[]): Promise<EventWithGenres>;
  getEventsByDate(startDate: Date, endDate?: Date): Promise<EventWithGenres[]>;
  incrementAttendees(eventId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private eventIdCounter: number = 1;

  constructor() {
    this.initCounters();
  }

  private async initCounters() {
    const events = await this.getAllEvents();
    this.eventIdCounter = Math.max(...events.map(e => e.id), 0) + 1;
  }

  private async getEventsFromDb(): Promise<EventWithGenres[]> {
    try {
      const result = await db.select().from(events).leftJoin(eventGenres, eq(events.id, eventGenres.eventId));
      console.log('Raw result from database:', result);

      if (!result) {
        return [];
      }

      // Check if the result is already an array
      if (Array.isArray(result)) {
        return result.map((event: any) => ({
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
  }

  private async saveEventsToDb(eventsWithGenres: EventWithGenres[]) {
    const results: (EventWithGenres | null)[] = [];
    for (const eventWithGenres of eventsWithGenres) {
      try {
        const result = await this.saveEventToDb(eventWithGenres);
        results.push(result);
      } catch (error) {
        console.log("Failed saving event to db with error: " + error);
        results.push(null);
      }
    }
    return results;
  }

  private async saveEventToDb(eventWithGenres: EventWithGenres) {
    try {
      // Prepare event data for insertion into the 'events' table
      const eventForStorage: InsertEvent = {
        title: eventWithGenres.title,
        eventDate: eventWithGenres.eventDate,
        startTime: eventWithGenres.startTime,
        venueName: eventWithGenres.venueName,
        venueAddress: eventWithGenres.venueAddress,
        neighborhood: eventWithGenres.neighborhood,
        imageUri: eventWithGenres.imageUri,
        price: eventWithGenres.price,
        attendees: eventWithGenres.attendees,
      };

      const [insertedEvent] = await db.insert(events).values(eventForStorage).returning({ id: events.id });

      if (insertedEvent && insertedEvent.id) {
        const eventId = insertedEvent.id;

        // Insert the genres for the event into the 'event_genres' table
        const genreInsertPromises = eventWithGenres.genres.map((genre) =>
          db.insert(eventGenres).values({ eventId: eventId, genre })
        );

        await Promise.all(genreInsertPromises); // Execute all genre insertions in parallel

        console.log(`Successfully inserted event with ID: ${eventId} and its genres.`);
        return { ...eventWithGenres, id: eventId }; // Return the inserted event with its ID
      } else {
        throw new Error("Failed to insert event or retrieve its ID.");
      }

    } catch (error) {
      console.error("Error saving event to database:", error);
      throw new Error("Failed to save event to database");
    }
  }


  async getAllEvents(): Promise<EventWithGenres[]> {
    const events = await this.getEventsFromDb();
    return events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  async getEvent(id: number): Promise<EventWithGenres | undefined> {
    const events = await this.getEventsFromDb();
    return events.find(e => e.id === id);
  }

  async createEvent(insertEvent: InsertEvent, genres: string[]): Promise<EventWithGenres> {
    const events = await this.getEventsFromDb();
    const id = this.eventIdCounter++;

    const newEvent: EventWithGenres = {
      id,
      title: insertEvent.title,
      eventDate: insertEvent.eventDate,
      startTime: insertEvent.startTime,
      venueName: insertEvent.venueName ?? null,
      venueAddress: insertEvent.venueAddress,
      neighborhood: insertEvent.neighborhood || null,
      imageUri: insertEvent.imageUri || null,
      price: insertEvent.price !== undefined ? insertEvent.price : null,
      attendees: 0,
      createdAt: new Date(),
      genres
    };

    await this.saveEventsToDb([...events, newEvent]);
    return newEvent;
  }

  async getEventsByDate(startDate: Date, endDate?: Date): Promise<EventWithGenres[]> {
    const events = await this.getEventsFromDb();
    const end = endDate || new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    return events
      .filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate >= startDate && eventDate <= end;
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }


  async incrementAttendees(eventId: number): Promise<void> {
    const events = await this.getEventsFromDb();
    const eventIndex = events.findIndex(e => e.id === eventId);

    if (eventIndex !== -1) {
      events[eventIndex].attendees = (events[eventIndex].attendees || 0) + 1;
      await this.saveEventsToDb(events);
    }
  }
}

export const storage = new MemStorage();