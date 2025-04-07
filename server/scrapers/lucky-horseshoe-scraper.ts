import axios from 'axios';
import * as cheerio from 'cheerio';
import { VenueScraper, ScraperResult } from './base-scraper';
import { EventWithGenres } from '@shared/schema';
import { log } from '../vite';

export class LuckyHorseshoeScraper extends VenueScraper {
  constructor() {
    super(
      'The Lucky Horseshoe',
      '453 Cortland Ave, San Francisco, CA 94110',
      'https://www.theluckyhorseshoebar.com/calendar',
      'Bernal Heights'
    );
  }

  async scrape(): Promise<ScraperResult> {
    try {
      const response = await axios.get(this.venueUrl);
      const html = response.data;
      const $ = cheerio.load(html);
      
      const events: EventWithGenres[] = [];
      
      // The Lucky Horseshoe website uses Wix, so we'll need to look for specific patterns
      // This is a best-effort scraper that will need adjustment if the website structure changes
      
      // Look for event containers - Wix sites often use repeated divs with similar classes
      $('.event-item, [data-testid="event-item"], [data-hook="event-item"]').each((index, element) => {
        try {
          const eventElement = $(element);
          
          // Extract title
          const titleElement = eventElement.find('.event-title, [data-testid="event-title"], h3, h4');
          let title = titleElement.text().trim();
          if (!title) {
            // Fallback method - look for headers within the event
            title = eventElement.find('h1, h2, h3, h4, h5').first().text().trim();
          }
          
          // If still no title, skip this event
          if (!title) {
            log(`Skipping Lucky Horseshoe event - no title found`, 'scraper');
            return; // Skip this iteration
          }
          
          // Extract date and time
          const dateElement = eventElement.find('.event-date, [data-testid="event-date"]');
          const timeElement = eventElement.find('.event-time, [data-testid="event-time"]');
          
          let dateText = dateElement.text().trim();
          let timeText = timeElement.text().trim();
          
          // If date elements not found, try looking for text containing date patterns
          if (!dateText) {
            // Look for date patterns in any text element
            eventElement.find('*').each((_, el) => {
              const text = $(el).text().trim();
              // Check for date patterns like "April 10" or "04/10/25"
              if (/[A-Z][a-z]+ \d{1,2}|\d{1,2}\/\d{1,2}(\/\d{2,4})?/.test(text)) {
                dateText = text;
                return false; // Break the each loop
              }
            });
          }
          
          // If time elements not found, look for time patterns
          if (!timeText) {
            eventElement.find('*').each((_, el) => {
              const text = $(el).text().trim();
              // Check for time patterns like "8:00pm" or "8pm"
              if (/\d{1,2}:\d{2}\s*(am|pm|AM|PM)|\d{1,2}\s*(am|pm|AM|PM)/.test(text)) {
                timeText = text;
                return false; // Break the each loop
              }
            });
          }
          
          // Parse date
          let eventDate = new Date();
          try {
            if (dateText) {
              // Try direct parsing for standard date format 
              const parsedDate = new Date(dateText);
              
              if (!isNaN(parsedDate.getTime())) {
                eventDate = parsedDate;
              } else {
                // Try to extract month and day from text
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                   'July', 'August', 'September', 'October', 'November', 'December'];
                
                // Check for "Month Day" pattern
                for (let i = 0; i < monthNames.length; i++) {
                  const monthName = monthNames[i];
                  if (dateText.includes(monthName) || dateText.includes(monthName.substring(0, 3))) {
                    const dayMatch = dateText.match(/\d{1,2}/);
                    if (dayMatch) {
                      const day = parseInt(dayMatch[0]);
                      const year = new Date().getFullYear();
                      eventDate = new Date(year, i, day);
                      break;
                    }
                  }
                }
                
                // Check for MM/DD/YY pattern
                const dateMatch = dateText.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
                if (dateMatch) {
                  const month = parseInt(dateMatch[1]) - 1; // JS months are 0-indexed
                  const day = parseInt(dateMatch[2]);
                  let year = new Date().getFullYear();
                  if (dateMatch[3]) {
                    year = parseInt(dateMatch[3]);
                    if (year < 100) year += 2000; // Convert 2-digit year to 4-digit
                  }
                  eventDate = new Date(year, month, day);
                }
              }
            }
          } catch (dateError) {
            log(`Error parsing date for Lucky Horseshoe event: ${dateError}`, 'scraper');
          }
          
          // Parse time
          let startTime = "8:00 PM"; // Default
          let endTime = ""; 
          
          if (timeText) {
            // Look for patterns like "8PM" or "8:00 PM - 11:00 PM"
            const timeMatch = timeText.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))/g);
            if (timeMatch && timeMatch.length > 0) {
              startTime = timeMatch[0];
              if (timeMatch.length > 1) {
                endTime = timeMatch[1];
              }
            }
          }
          
          // Get description
          let description = eventElement.find('.event-description, [data-testid="event-description"], p').text().trim();
          if (!description) {
            // Combine all text not in headers or known elements
            const textNodes = eventElement.contents().filter(function() {
              return this.nodeType === 3 && $(this).text().trim().length > 0; // Text nodes only
            });
            
            if (textNodes.length > 0) {
              description = textNodes.map((_, node) => $(node).text().trim()).get().join(' ');
            }
          }
          
          // Extract price (if available)
          let price = 0;
          const pricePattern = /\$(\d+)/;
          const priceMatch = description.match(pricePattern) || timeText.match(pricePattern) || title.match(pricePattern);
          if (priceMatch && priceMatch[1]) {
            price = parseInt(priceMatch[1]);
          }
          
          // Get image (if available)
          let imageUrl = "";
          const imageElement = eventElement.find('img');
          if (imageElement.length > 0) {
            imageUrl = imageElement.attr('src') || "";
          }
          
          // Infer genres from title and description
          const genres = this.inferGenres(title, description);
          
          // Construct event URL (if available)
          let eventUrl = "";
          const linkElement = eventElement.find('a[href]');
          if (linkElement.length > 0) {
            const hrefAttr = linkElement.attr('href');
            if (hrefAttr && hrefAttr.length > 1 && !hrefAttr.startsWith('#')) {
              // Check if it's a relative or absolute URL
              if (hrefAttr.startsWith('http')) {
                eventUrl = hrefAttr;
              } else {
                // Get base URL (hostname)
                const baseUrl = this.venueUrl.split('/').slice(0, 3).join('/');
                eventUrl = hrefAttr.startsWith('/') 
                  ? `${baseUrl}${hrefAttr}` 
                  : `${baseUrl}/${hrefAttr}`;
              }
            }
          }
          
          // Add URL to description if available
          const fullDescription = eventUrl 
            ? `${description} More info: ${eventUrl}` 
            : description;
          
          // Create event object
          const event: EventWithGenres = {
            id: index + 4000, // Temporary ID, will be replaced by storage
            title,
            description: fullDescription,
            date: eventDate,
            startTime,
            endTime,
            venueName: this.venueName,
            venueAddress: this.venueAddress,
            neighborhood: this.neighborhood,
            price,
            imageUrl,
            attendees: 0,
            createdAt: new Date(),
            genres
          };
          
          events.push(event);
        } catch (eventError: any) {
          log(`Error processing Lucky Horseshoe event: ${eventError.message}`, 'scraper');
        }
      });
      
      // If no events found using the main selectors, try a more generic approach
      if (events.length === 0) {
        log('No events found with primary selectors, trying secondary approach for Lucky Horseshoe', 'scraper');
        
        // Look for date headers or event day markers
        $('*:contains("Monday"), *:contains("Tuesday"), *:contains("Wednesday"), *:contains("Thursday"), *:contains("Friday"), *:contains("Saturday"), *:contains("Sunday")').each((index, element) => {
          const dayElement = $(element);
          const dayText = dayElement.text().trim();
          
          // Skip if this is a navigation element or too short to be a real header
          if (dayElement.is('a, nav, button') || dayText.length < 5) {
            return;
          }
          
          // Try to find events associated with this day
          let nextElements = dayElement.nextAll();
          if (nextElements.length === 0) {
            // If no siblings, try parent's siblings
            nextElements = dayElement.parent().nextAll();
          }
          
          // Look at next elements until we hit another day header or a limit
          let eventInfo = '';
          let currentElement = nextElements.first();
          
          for (let i = 0; i < 5; i++) { // Limit to 5 elements to avoid going too far
            if (currentElement.length === 0) break;
            
            const text = currentElement.text().trim();
            if (text.match(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/)) {
              break; // Stop if we hit another day header
            }
            
            eventInfo += ' ' + text;
            currentElement = currentElement.next();
          }
          
          if (eventInfo.length > 10) { // Only process if we found substantial text
            try {
              // Parse as best we can
              const title = dayText; // Use the day as part of the title
              
              // Try to extract a date from the day text
              let eventDate = new Date();
              const dateMatch = dayText.match(/(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?/);
              if (dateMatch) {
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                  'July', 'August', 'September', 'October', 'November', 'December'];
                const dayOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                
                // Check if the first part is a month or a day of week
                const part1 = dateMatch[1];
                const monthIndex = monthNames.findIndex(m => m.toLowerCase().startsWith(part1.toLowerCase()));
                
                if (monthIndex >= 0) {
                  // Format is like "April 15th"
                  const day = parseInt(dateMatch[2]);
                  const year = dateMatch[3] ? parseInt(dateMatch[3]) : new Date().getFullYear();
                  eventDate = new Date(year, monthIndex, day);
                } else {
                  // Format might be like "Friday, April 15th"
                  // Just use current date but adjust the day of week
                  const dayIndex = dayOfWeekNames.findIndex(d => d.toLowerCase().startsWith(part1.toLowerCase()));
                  if (dayIndex >= 0) {
                    const today = new Date();
                    const daysDiff = dayIndex - today.getDay();
                    eventDate = new Date(today.getTime() + daysDiff * 24 * 60 * 60 * 1000);
                  }
                }
              }
              
              // Extract time if present
              let startTime = "8:00 PM"; // Default
              const timeMatch = eventInfo.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))/);
              if (timeMatch) {
                startTime = timeMatch[1];
              }
              
              // Extract price if present
              let price = 0;
              const priceMatch = eventInfo.match(/\$(\d+)/);
              if (priceMatch) {
                price = parseInt(priceMatch[1]);
              }
              
              // Create a simple event
              const event: EventWithGenres = {
                id: index + 4500, // Temporary ID
                title: title.replace(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/i, '').trim() || "Event at Lucky Horseshoe",
                description: eventInfo.trim(),
                date: eventDate,
                startTime,
                endTime: "",
                venueName: this.venueName,
                venueAddress: this.venueAddress,
                neighborhood: this.neighborhood,
                price,
                imageUrl: "",
                attendees: 0,
                createdAt: new Date(),
                genres: this.inferGenres(title, eventInfo)
              };
              
              events.push(event);
            } catch (eventError: any) {
              log(`Error processing Lucky Horseshoe event with secondary approach: ${eventError.message}`, 'scraper');
            }
          }
        });
      }
      
      this.logSuccess(events.length);
      return {
        success: true,
        events
      };
    } catch (error: any) {
      return this.logError(error);
    }
  }
  
  private inferGenres(title: string, description: string): string[] {
    const text = (title + ' ' + description).toLowerCase();
    const detectedGenres: Set<string> = new Set();
    
    // Map of keywords to genres
    const genreKeywords: Record<string, string[]> = {
      'Rock': ['rock', 'indie', 'alternative', 'punk', 'metal', 'hardcore', 'garage'],
      'Indie': ['indie', 'alternative'],
      'Electronic': ['electronic', 'techno', 'house', 'dj', 'edm', 'dance', 'disco'],
      'Jazz': ['jazz', 'fusion'],
      'Punk': ['punk', 'hardcore', 'thrash'],
      'Hip Hop': ['hip hop', 'hip-hop', 'rap', 'hiphop'],
      'Folk': ['folk', 'acoustic', 'singer-songwriter', 'americana'],
      'Blues': ['blues'],
      'Metal': ['metal', 'heavy', 'doom', 'stoner', 'thrash'],
      'Pop': ['pop', 'synth'],
      'R&B': ['r&b', 'rnb', 'soul', 'funk'],
      'Experimental': ['experimental', 'noise', 'avant-garde', 'ambient'],
      'Acoustic': ['acoustic', 'unplugged']
    };
    
    // Check for genre keywords in text
    for (const [genre, keywords] of Object.entries(genreKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          detectedGenres.add(genre);
          break;
        }
      }
    }
    
    // If no genres detected, use "Folk" as a fallback as Lucky Horseshoe tends to have folk/acoustic acts
    if (detectedGenres.size === 0) {
      detectedGenres.add('Folk');
    }
    
    return Array.from(detectedGenres);
  }
}