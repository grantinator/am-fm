// Script to rescrape Hotel Utah events with the actual images from their website
import Database from '@replit/database';
import axios from 'axios';
import * as cheerio from 'cheerio';

const db = new Database();
const EVENTS_KEY = "events";

// Hotel Utah venue info
const venueInfo = {
  name: 'The Hotel Utah Saloon',
  address: '500 4th St, San Francisco, CA 94107',
  url: 'https://hotelutah.com/calendar/',
  neighborhood: 'SoMa'
};

// Fallback images based on genre (only used if we can't get the actual image)
const fallbackImages = {
  'default': 'https://hotelutah.com/wp-content/uploads/2020/11/Hotel-Utah-Logo-Horizontal-Small-300x78.png',
  'Blues': 'https://hotelutah.com/wp-content/uploads/2021/07/Blues-Jam-400x400.jpg',
  'Bluegrass': 'https://hotelutah.com/wp-content/uploads/2021/07/Bluegrass-Jam-400x400.jpg',
  'Open Mic': 'https://hotelutah.com/wp-content/uploads/2021/07/Open-Mic-400x400.jpg'
};

async function scrapeHotelUtah() {
  try {
    console.log("Starting Hotel Utah scrape...");
    
    // Fetch the calendar page
    const response = await axios.get(venueInfo.url);
    const html = response.data;
    const $ = cheerio.load(html);
    
    const events = [];
    
    // Find all event containers based on the pattern observed in the HTML
    $('.seetickets-list-event-container').each((index, element) => {
      try {
        // Extract event data from HTML
        const eventElement = $(element);
        
        // Parse date
        const dateText = eventElement.find('.event-date').text().trim();
        const dateMatch = dateText.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\w+)\s+(\d+)/);
        
        let eventDate;
        if (dateMatch) {
          const [_, dayOfWeek, month, day] = dateMatch;
          // Handle parsing the date - assuming current year
          const currentYear = new Date().getFullYear();
          const monthMap = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
          };
          
          if (monthMap[month] !== undefined) {
            eventDate = new Date(currentYear, monthMap[month], parseInt(day));
          } else {
            // If month parsing fails, use current date
            console.log(`Could not parse month from date: ${dateText}`);
            eventDate = new Date();
          }
        } else {
          // No date match, use current date
          console.log(`Could not parse date from: ${dateText}`);
          eventDate = new Date();
        }
        
        // Parse time
        const timeText = eventElement.find('.event-time').text().trim();
        const startTime = timeText || null;
        
        // Get title
        const title = eventElement.find('.event-title').text().trim();
        
        // Get description
        const description = eventElement.find('.event-description').text().trim() || null;
        
        // Reconstruct more info URL
        const eventLink = eventElement.find('a.list-event-link').attr('href');
        const moreInfoUrl = eventLink ? `More info: ${eventLink}` : '';
        
        // Full description with more info
        const fullDescription = description 
          ? (moreInfoUrl ? `${description} ${moreInfoUrl}` : description)
          : (moreInfoUrl || null);
        
        // Get price - usually found in the purchase button text
        const priceText = eventElement.find('.event-ticket-purchase-button').text().trim();
        const priceMatch = priceText.match(/\$(\d+(\.\d+)?)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
        
        // Get the actual image URL from the event
        let imageUrl = null;
        
        // First, try to get the image url directly
        const imgElement = eventElement.find('.event-image');
        if (imgElement.length > 0) {
          imageUrl = imgElement.attr('src');
          // If the src is empty or invalid, try data-src (for lazy-loaded images)
          if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null') {
            imageUrl = imgElement.attr('data-src');
          }
          
          // Check if it's a relative URL and make it absolute if needed
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = new URL(imageUrl, 'https://hotelutah.com').href;
          }
        }
        
        // Let's use Hotel Utah's logo or genre-specific images as fallbacks
        // We won't attempt to fetch individual event pages as that would require nested async calls
        
        // Make a best guess at genres based on title and description
        const genreHints = (title + ' ' + (description || '')).toLowerCase();
        const genres = inferGenres(genreHints);
        
        // If we still don't have a valid image, use fallback based on genre
        if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null') {
          if (title.toLowerCase().includes('blues jam') || genres.includes('Blues')) {
            imageUrl = fallbackImages['Blues'];
          } else if (title.toLowerCase().includes('bluegrass jam') || genres.includes('Bluegrass')) {
            imageUrl = fallbackImages['Bluegrass'];
          } else if (title.toLowerCase().includes('open mic') || genres.includes('Open Mic')) {
            imageUrl = fallbackImages['Open Mic'];
          } else {
            imageUrl = fallbackImages['default'];
          }
        }
        
        // Create event object
        const event = {
          title,
          description: fullDescription,
          date: eventDate,
          startTime,
          endTime: null,
          venueName: venueInfo.name,
          venueAddress: venueInfo.address,
          neighborhood: venueInfo.neighborhood,
          price,
          imageUrl,
          attendees: 0,
          createdAt: new Date(),
          genres
        };
        
        events.push(event);
      } catch (error) {
        console.error(`Error parsing event: ${error.message}`);
      }
    });
    
    console.log(`Scraped ${events.length} events from Hotel Utah`);
    return events;
  } catch (error) {
    console.error(`Error scraping Hotel Utah: ${error.message}`);
    return [];
  }
}

// Helper function to infer genres based on title and description
function inferGenres(textHints) {
  const genreKeywords = {
    'rock': 'Rock',
    'punk': 'Punk',
    'metal': 'Metal',
    'indie': 'Indie',
    'folk': 'Folk',
    'pop': 'Pop',
    'electronic': 'Electronic',
    'hip hop': 'Hip Hop',
    'hip-hop': 'Hip Hop',
    'jazz': 'Jazz',
    'blues': 'Blues',
    'bluegrass': 'Bluegrass',
    'country': 'Country',
    'r&b': 'R&B',
    'soul': 'Soul',
    'funk': 'Funk',
    'disco': 'Disco',
    'techno': 'Techno',
    'house': 'House',
    'ambient': 'Ambient',
    'experimental': 'Experimental',
    'acoustic': 'Acoustic',
    'singer-songwriter': 'Singer-Songwriter',
    'jam': 'Jam',
    'reggae': 'Reggae',
    'world': 'World',
    'latin': 'Latin',
    'classical': 'Classical',
    'alternative': 'Alternative',
    'dogs': 'Punk' // Special case for "The Dogs" band
  };
  
  const foundGenres = [];
  
  for (const [keyword, genre] of Object.entries(genreKeywords)) {
    if (textHints.includes(keyword)) {
      foundGenres.push(genre);
    }
  }
  
  // Special cases
  if (textHints.includes('open mic')) {
    foundGenres.push('Open Mic');
  }
  
  if (textHints.includes('bluegrass jam')) {
    foundGenres.push('Bluegrass');
  } else if (textHints.includes('blues jam')) {
    foundGenres.push('Blues');
  }
  
  // If no genres found, return "Other"
  return foundGenres.length > 0 ? foundGenres : ['Other'];
}

async function updateDatabase() {
  try {
    // Start by clearing any existing events
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
    
    // Get existing valid events (non-Hotel Utah)
    const nonHotelUtahEvents = existingEvents.filter(event => 
      event.venueName !== venueInfo.name && 
      event.imageUrl && 
      typeof event.imageUrl === 'string' && 
      event.imageUrl.trim() !== '' && 
      !event.imageUrl.includes('undefined') &&
      !event.imageUrl.includes('null')
    );
    
    console.log(`Keeping ${nonHotelUtahEvents.length} valid non-Hotel Utah events.`);
    
    // Get fresh Hotel Utah events
    const hotelUtahEvents = await scrapeHotelUtah();
    
    // Assign IDs to new events
    const highestId = Math.max(...existingEvents.map(e => e.id || 0), 0);
    const enrichedHotelUtahEvents = hotelUtahEvents.map((event, index) => {
      return {
        ...event,
        id: highestId + index + 1
      };
    });
    
    // Combine events
    const updatedEvents = [...nonHotelUtahEvents, ...enrichedHotelUtahEvents];
    
    // Make sure all dates are properly formatted for storage
    const eventsForStorage = updatedEvents.map(event => ({
      ...event,
      date: event.date instanceof Date ? event.date.toISOString() : event.date,
      createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
    }));
    
    // Save to database
    await db.set(EVENTS_KEY, eventsForStorage);
    console.log(`Database updated with ${eventsForStorage.length} events (${enrichedHotelUtahEvents.length} from Hotel Utah).`);
    
  } catch (error) {
    console.error("Error updating database:", error);
  }
}

// Run the update process
updateDatabase();