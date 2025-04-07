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

    // Initialize with some mock events
    this.initMockEvents();
  }

  private initMockEvents() {
    const mockEvents: Array<[InsertEvent, string[]]> = [
      [
        {
          title: "The Midnight Drifters w/ Ghost Notes",
          date: new Date("2023-12-12T20:00:00"),
          startTime: "8:00 PM",
          endTime: "11:00 PM",
          venueName: "Bottom of the Hill",
          venueAddress: "1233 17th Street, San Francisco, CA 94107",
          neighborhood: "Potrero Hill",
          description: "Join us for an amazing night with The Midnight Drifters as they return to SF to celebrate their new EP release! Special guests Ghost Notes will be opening the show.",
          imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=333&q=80",
        },
        ["Indie", "Rock"]
      ],
      [
        {
          title: "Electric Pulse + Future Memory",
          date: new Date("2023-12-13T21:30:00"),
          startTime: "9:30 PM",
          endTime: "1:00 AM",
          venueName: "Rickshaw Stop",
          venueAddress: "155 Fell St, San Francisco, CA 94102",
          neighborhood: "Hayes Valley",
          description: "Electric Pulse returns to SF for a night of electronic beats and visual spectacle, with Future Memory opening.",
          imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=333&q=80",
        },
        ["Electronic", "DJ"]
      ],
      [
        {
          title: "Mission House Party: Acoustic Night",
          date: new Date("2023-12-14T19:00:00"),
          startTime: "7:00 PM",
          endTime: "10:00 PM",
          venueName: "Secret Location",
          venueAddress: "Address provided day of show, Mission District",
          neighborhood: "Mission",
          description: "An intimate acoustic night featuring local artists in a cozy Mission District house setting. BYOB.",
          imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=333&q=80",
        },
        ["Acoustic", "Folk"]
      ],
      [
        {
          title: "SF Jazz Collective",
          date: new Date("2023-12-15T20:30:00"),
          startTime: "8:30 PM",
          endTime: "11:00 PM",
          venueName: "Mr. Tipple's",
          venueAddress: "39 Fell St, San Francisco, CA 94102",
          neighborhood: "Hayes Valley",
          description: "A night of classic and modern jazz interpretations by the renowned SF Jazz Collective. No cover charge.",
          imageUrl: "https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=333&q=80",
        },
        ["Jazz"]
      ],
      [
        {
          title: "Toxic Wasteland + The Misfits",
          date: new Date("2023-12-19T21:00:00"),
          startTime: "9:00 PM",
          endTime: "1:00 AM",
          venueName: "The Eagle",
          venueAddress: "398 12th St, San Francisco, CA 94103",
          neighborhood: "SoMa",
          description: "High-energy punk rock night featuring Toxic Wasteland's album release party with special guests The Misfits.",
          imageUrl: "https://images.unsplash.com/photo-1563841930606-67e2bce48b78?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=333&q=80",
        },
        ["Punk", "Rock"]
      ],
      [
        {
          title: "Sunset Riders Album Release",
          date: new Date("2023-12-20T20:00:00"),
          startTime: "8:00 PM",
          endTime: "11:30 PM",
          venueName: "The Independent",
          venueAddress: "628 Divisadero St, San Francisco, CA 94117",
          neighborhood: "NoPa",
          description: "Sunset Riders celebrates the release of their new album 'Golden Hour' with a full performance and special guest openers.",
          imageUrl: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=333&q=80",
        },
        ["Indie", "Pop"]
      ]
    ];

    mockEvents.forEach(([event, genres]) => {
      this.createEvent(event, genres);
    });
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
    const newEvent: Event = {
      ...insertEvent,
      id,
      attendees: 0,
      createdAt: new Date()
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
