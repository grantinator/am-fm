import { 
  events, 
  type Event, 
  type InsertEvent, 
  type User, 
  type InsertUser, 
  type EventWithGenres 
} from "@shared/schema";
import { Database } from "@replit/database";

const db = new Database();
const EVENTS_KEY = "events";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllEvents(): Promise<EventWithGenres[]>;
  getEvent(id: number): Promise<EventWithGenres | undefined>;
  createEvent(event: InsertEvent, genres: string[]): Promise<EventWithGenres>;
  getEventsByNeighborhood(neighborhood: string): Promise<EventWithGenres[]>;
  getEventsByGenre(genre: string): Promise<EventWithGenres[]>;
  getEventsByDate(startDate: Date, endDate?: Date): Promise<EventWithGenres[]>;
  incrementAttendees(eventId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userIdCounter: number;
  private eventIdCounter: number;

  constructor() {
    this.users = new Map();
    this.userIdCounter = 1;
    this.initCounters();
  }

  private async initCounters() {
    const events = await this.getAllEvents();
    this.eventIdCounter = Math.max(...events.map(e => e.id), 0) + 1;
  }

  private async getEventsFromDb(): Promise<EventWithGenres[]> {
    const events = await db.get(EVENTS_KEY) || [];
    return events.map(event => ({
      ...event,
      date: new Date(event.date),
      createdAt: new Date(event.createdAt)
    }));
  }

  private async saveEventsToDb(events: EventWithGenres[]) {
    await db.set(EVENTS_KEY, events);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllEvents(): Promise<EventWithGenres[]> {
    const events = await this.getEventsFromDb();
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getEvent(id: number): Promise<EventWithGenres | undefined> {
    const events = await this.getEventsFromDb();
    return events.find(e => e.id === id);
  }

  async createEvent(insertEvent: InsertEvent, genres: string[]): Promise<EventWithGenres> {
    const events = await this.getEventsFromDb();
    const id = this.eventIdCounter++;

    const newEvent: EventWithGenres = {
      ...insertEvent,
      id,
      attendees: 0,
      createdAt: new Date(),
      endTime: insertEvent.endTime || null,
      neighborhood: insertEvent.neighborhood || null,
      description: insertEvent.description || null,
      imageUrl: insertEvent.imageUrl || null,
      price: insertEvent.price !== undefined ? insertEvent.price : null,
      genres
    };

    await this.saveEventsToDb([...events, newEvent]);
    return newEvent;
  }

  async getEventsByNeighborhood(neighborhood: string): Promise<EventWithGenres[]> {
    const events = await this.getEventsFromDb();
    return events
      .filter(event => event.neighborhood?.toLowerCase() === neighborhood.toLowerCase())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getEventsByGenre(genre: string): Promise<EventWithGenres[]> {
    const events = await this.getEventsFromDb();
    return events
      .filter(event => event.genres.some(g => g.toLowerCase() === genre.toLowerCase()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getEventsByDate(startDate: Date, endDate?: Date): Promise<EventWithGenres[]> {
    const events = await this.getEventsFromDb();
    const end = endDate || new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= startDate && eventDate <= end;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
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