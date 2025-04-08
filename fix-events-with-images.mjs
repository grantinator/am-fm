// Script to remove events with broken/missing images and add sample events with valid images
import Database from '@replit/database';
const db = new Database();
const EVENTS_KEY = "events";

// Sample valid image URLs from Unsplash
const sampleImages = [
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop"
];

// Sample events with valid images
const sampleEvents = [
  {
    title: "Midnight Echoes",
    description: "A night of ambient and shoegaze music featuring local artists",
    date: new Date("2025-04-15"),
    startTime: "8:00PM",
    endTime: "11:30PM",
    venueName: "The Knockout",
    venueAddress: "3223 Mission St, San Francisco, CA 94110",
    neighborhood: "Mission",
    price: 12,
    genres: ["Shoegaze", "Ambient", "Indie"],
    attendees: 0,
    createdAt: new Date()
  },
  {
    title: "Jazz Fusion Collective",
    description: "Weekly jazz jam session with rotating musicians from the Bay Area",
    date: new Date("2025-04-18"),
    startTime: "7:30PM",
    endTime: "10:00PM",
    venueName: "The Hotel Utah Saloon",
    venueAddress: "500 4th St, San Francisco, CA 94107",
    neighborhood: "SoMa",
    price: 10,
    genres: ["Jazz", "Fusion", "Experimental"],
    attendees: 0,
    createdAt: new Date()
  },
  {
    title: "Underground Bass Night",
    description: "Deep dubstep and bass music showcase featuring local DJs",
    date: new Date("2025-04-22"),
    startTime: "9:00PM",
    endTime: "2:00AM",
    venueName: "Lucky Horseshoe",
    venueAddress: "453 Cortland Ave, San Francisco, CA 94110",
    neighborhood: "Bernal Heights",
    price: 5,
    genres: ["Electronic", "Dubstep", "Bass"],
    attendees: 0,
    createdAt: new Date()
  },
  {
    title: "Folk Collective",
    description: "Acoustic folk music night with singer-songwriters from across the Bay",
    date: new Date("2025-04-25"),
    startTime: "7:00PM",
    endTime: "10:00PM",
    venueName: "Kilowatt",
    venueAddress: "3160 16th St, San Francisco, CA 94103",
    neighborhood: "Mission",
    price: 10,
    genres: ["Folk", "Acoustic", "Singer-Songwriter"],
    attendees: 0,
    createdAt: new Date()
  },
  {
    title: "Punk Rock Thursday",
    description: "Weekly punk showcase featuring local bands and touring acts",
    date: new Date("2025-05-01"),
    startTime: "8:30PM",
    endTime: "12:00AM",
    venueName: "The Knockout",
    venueAddress: "3223 Mission St, San Francisco, CA 94110",
    neighborhood: "Mission",
    price: 8,
    genres: ["Punk", "Hardcore", "DIY"],
    attendees: 0,
    createdAt: new Date()
  }
];

async function fixEvents() {
  try {
    console.log("Starting database cleanup and fix...");
    
    // Get all events from the database
    const result = await db.get(EVENTS_KEY);
    
    if (!result) {
      console.log("No events found in database. Adding sample events...");
      await addSampleEvents();
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
    
    // Keep any good events with working images
    const validEvents = events.filter(event => {
      const url = event.imageUrl;
      
      // Simple check if URL is part of a known valid set (Unsplash images)
      if (url && url.includes('unsplash.com')) {
        return true;
      }
      
      // Otherwise, consider all existing images as invalid since the API check showed they're broken
      return false;
    });
    
    console.log(`Found ${validEvents.length} events with valid images.`);
    console.log(`Removing ${events.length - validEvents.length} events with broken images.`);
    
    // Add sample events with new IDs
    const highestId = Math.max(...events.map(e => e.id || 0), 0);
    const enrichedSampleEvents = sampleEvents.map((event, index) => {
      return {
        ...event,
        id: highestId + index + 1,
        imageUrl: sampleImages[index % sampleImages.length]
      };
    });
    
    console.log(`Adding ${enrichedSampleEvents.length} sample events with valid images.`);
    
    // Combine valid events with sample events
    const updatedEvents = [...validEvents, ...enrichedSampleEvents];
    
    // Save updated events back to the database
    await db.set(EVENTS_KEY, updatedEvents);
    console.log(`Database updated with ${updatedEvents.length} events.`);
    
  } catch (error) {
    console.error("Error fixing events:", error);
  }
}

async function addSampleEvents() {
  try {
    // Add sample events with IDs starting from 1
    const enrichedSampleEvents = sampleEvents.map((event, index) => {
      return {
        ...event,
        id: index + 1,
        imageUrl: sampleImages[index % sampleImages.length]
      };
    });
    
    console.log(`Adding ${enrichedSampleEvents.length} sample events with valid images.`);
    
    // Save sample events to the database
    await db.set(EVENTS_KEY, enrichedSampleEvents);
    console.log(`Database populated with ${enrichedSampleEvents.length} sample events.`);
    
  } catch (error) {
    console.error("Error adding sample events:", error);
  }
}

// Run the fix function
fixEvents();