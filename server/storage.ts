import { 
  events, 
  eventGenres, 
  type Event, 
  type InsertEvent, 
  type User, 
  type InsertUser, 
  type EventWithGenres 
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Event methods
  getAllEvents(): Promise<EventWithGenres[]>;
  getEvent(id: number): Promise<EventWithGenres | undefined>;
  createEvent(event: InsertEvent, genres: string[]): Promise<EventWithGenres>;
  getEventsByNeighborhood(neighborhood: string): Promise<EventWithGenres[]>;
  getEventsByGenre(genre: string): Promise<EventWithGenres[]>;
  getEventsByDate(startDate: Date, endDate?: Date): Promise<EventWithGenres[]>;
  searchEvents(query: string): Promise<EventWithGenres[]>;
  incrementAttendees(eventId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private eventGenresMap: Map<number, string[]>;
  private userIdCounter: number;
  private eventIdCounter: number;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.eventGenresMap = new Map();
    this.userIdCounter = 1;
    this.eventIdCounter = 1;
    
    // No mock events - we'll use only scraped events
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
    return Array.from(this.events.values())
      .map(event => this.attachGenresToEvent(event))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getEvent(id: number): Promise<EventWithGenres | undefined> {
    const event = this.events.get(id);
    if (!event) {
      return undefined;
    }
    return this.attachGenresToEvent(event);
  }

  async createEvent(insertEvent: InsertEvent, genres: string[]): Promise<EventWithGenres> {
    const id = this.eventIdCounter++;
    // Ensure all fields are properly set with correct types
    const newEvent: Event = {
      ...insertEvent,
      id,
      attendees: 0,
      createdAt: new Date(),
      endTime: insertEvent.endTime || null,
      neighborhood: insertEvent.neighborhood || null,
      description: insertEvent.description || null,
      imageUrl: insertEvent.imageUrl || null,
      // Ensure price is always a number or null
      price: insertEvent.price !== undefined ? insertEvent.price : null
    };
    
    this.events.set(id, newEvent);
    this.eventGenresMap.set(id, genres);
    
    return this.attachGenresToEvent(newEvent);
  }

  async getEventsByNeighborhood(neighborhood: string): Promise<EventWithGenres[]> {
    return Array.from(this.events.values())
      .filter(event => event.neighborhood?.toLowerCase() === neighborhood.toLowerCase())
      .map(event => this.attachGenresToEvent(event))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getEventsByGenre(genre: string): Promise<EventWithGenres[]> {
    return Array.from(this.events.values())
      .filter(event => {
        const eventGenres = this.eventGenresMap.get(event.id) || [];
        return eventGenres.some(g => g.toLowerCase() === genre.toLowerCase());
      })
      .map(event => this.attachGenresToEvent(event))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getEventsByDate(startDate: Date, endDate?: Date): Promise<EventWithGenres[]> {
    const end = endDate || new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // Default to next day if no end date
    
    return Array.from(this.events.values())
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= startDate && eventDate <= end;
      })
      .map(event => this.attachGenresToEvent(event))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async searchEvents(query: string): Promise<EventWithGenres[]> {
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.events.values())
      .filter(event => {
        // Search in title, venue, neighborhood, description
        return (
          event.title.toLowerCase().includes(lowerQuery) ||
          event.venueName.toLowerCase().includes(lowerQuery) ||
          (event.neighborhood && event.neighborhood.toLowerCase().includes(lowerQuery)) ||
          (event.description && event.description.toLowerCase().includes(lowerQuery))
        );
      })
      .map(event => this.attachGenresToEvent(event))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async incrementAttendees(eventId: number): Promise<void> {
    const event = this.events.get(eventId);
    if (event) {
      event.attendees = (event.attendees || 0) + 1;
      this.events.set(eventId, event);
    }
  }

  private attachGenresToEvent(event: Event): EventWithGenres {
    return {
      ...event,
      genres: this.eventGenresMap.get(event.id) || []
    };
  }
}

export const storage = new MemStorage();
