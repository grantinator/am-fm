// Script to update events with reliable Unsplash images
import Database from '@replit/database';
const db = new Database();
const EVENTS_KEY = "events";

// Reliable Unsplash images by genre
const genreImages = {
  'Rock': 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop',
  'Punk': 'https://images.unsplash.com/photo-1561211974-8a2737b4dceb?w=800&auto=format&fit=crop',
  'Metal': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
  'Indie': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop',
  'Folk': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop',
  'Blues': 'https://images.unsplash.com/photo-1508025690668-ff5f6dc826e5?w=800&auto=format&fit=crop',
  'Bluegrass': 'https://images.unsplash.com/photo-1571751239008-50cad6cb9265?w=800&auto=format&fit=crop',
  'Jazz': 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop',
  'Hip Hop': 'https://images.unsplash.com/photo-1520872024865-3ff2805d8bb3?w=800&auto=format&fit=crop',
  'Electronic': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
  'Open Mic': 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&auto=format&fit=crop',
  'default': 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&auto=format&fit=crop'
};

// Hotel Utah venue info
const venueInfo = {
  name: 'The Hotel Utah Saloon',
  address: '500 4th St, San Francisco, CA 94107',
  url: 'https://hotelutah.com/calendar/',
  neighborhood: 'SoMa'
};

// Get the appropriate Unsplash image for a genre
function getImageForGenre(genres) {
  if (!genres || genres.length === 0) return genreImages['default'];
  
  // Try to find a matching genre image
  for (const genre of genres) {
    if (genreImages[genre]) {
      return genreImages[genre];
    }
  }
  
  // Default image if no matching genre
  return genreImages['default'];
}

async function updateDatabase() {
  try {
    console.log("Getting current events from database...");
    
    const result = await db.get(EVENTS_KEY);
    
    // Parse events
    let existingEvents = [];
    if (result) {
      if (Array.isArray(result)) {
        existingEvents = result;
      } else if (result.value && Array.isArray(result.value)) {
        existingEvents = result.value;
      }
    }
    
    console.log(`Found ${existingEvents.length} existing events.`);
    
    // Update images for all events
    const updatedEvents = existingEvents.map(event => {
      // Check if the event has a broken Hotel Utah image
      if (event.imageUrl && (
          event.imageUrl.includes('hotelutah.com') || 
          !event.imageUrl.startsWith('http') ||
          event.imageUrl.includes('undefined') ||
          event.imageUrl.includes('null')
      )) {
        // Get the appropriate Unsplash image based on genre
        const genres = Array.isArray(event.genres) ? event.genres : [];
        const newImageUrl = getImageForGenre(genres);
        
        return {
          ...event,
          imageUrl: newImageUrl
        };
      }
      return event;
    });
    
    // Make sure all dates are properly formatted for storage
    const eventsForStorage = updatedEvents.map(event => ({
      ...event,
      date: event.date instanceof Date ? event.date.toISOString() : event.date,
      createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
    }));
    
    // Save to database
    await db.set(EVENTS_KEY, eventsForStorage);
    console.log(`Database updated with ${eventsForStorage.length} events with reliable images.`);
    
  } catch (error) {
    console.error("Error updating database:", error);
  }
}

// Run the update process
updateDatabase();