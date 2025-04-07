import axios from 'axios';
import * as cheerio from 'cheerio';
import { VenueScraper, ScraperResult } from './base-scraper';
import { EventWithGenres } from '@shared/schema';
import { log } from '../vite';

export class KnockoutScraper extends VenueScraper {
  constructor() {
    super(
      'The Knockout',
      '3223 Mission St, San Francisco, CA 94110',
      'https://theknockoutsf.com/calendar2',
      'Mission'
    );
  }

  async scrape(): Promise<ScraperResult> {
    try {
      const response = await axios.get(this.venueUrl);
      const html = response.data;
      const $ = cheerio.load(html);
      
      const events: EventWithGenres[] = [];
      
      // The Knockout website uses Squarespace, so we need to find event data
      // Note: This is a best-effort scraper that will need adjustment if the website changes
      
      // Look for event sections on the page
      $('.eventlist-event').each((index, element) => {
        try {
          const eventElement = $(element);
          
          // Extract title
          const title = eventElement.find('.eventlist-title').text().trim();
          
          // Extract date
          const dateElement = eventElement.find('.eventlist-meta-date');
          const dateText = dateElement.text().trim();
          
          // Parse the date (format is typically "Month Day, Year")
          let eventDate = new Date();
          try {
            // Handles dates like "April 10, 2025"
            eventDate = new Date(dateText);
            
            // If the date is invalid, try to parse it manually
            if (isNaN(eventDate.getTime())) {
              const dateMatch = dateText.match(/(\w+)\s+(\d+),\s+(\d+)/);
              if (dateMatch) {
                const [_, month, day, year] = dateMatch;
                const monthMap: {[key: string]: number} = {
                  'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
                  'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
                };
                eventDate = new Date(parseInt(year), monthMap[month], parseInt(day));
              }
            }
          } catch (dateError) {
            log(`Error parsing date for Knockout event: ${dateError}`, 'scraper');
          }
          
          // Extract time
          const timeElement = eventElement.find('.eventlist-meta-time');
          const timeText = timeElement.text().trim();
          
          // Parse start and end times (format is typically "8:00pm - 11:00pm")
          let startTime = "";
          let endTime = "";
          
          if (timeText) {
            const timeParts = timeText.split('-').map(t => t.trim());
            startTime = timeParts[0] || "8:00pm"; // Default if not found
            endTime = timeParts[1] || ""; // Leave blank if not found
          } else {
            startTime = "8:00pm"; // Default time if none specified
          }
          
          // Get description and extract any additional info
          const description = eventElement.find('.eventlist-description').text().trim();
          
          // Try to extract price from description
          let price = 0;
          const priceMatch = description.match(/\$(\d+)/);
          if (priceMatch && priceMatch[1]) {
            price = parseInt(priceMatch[1]);
          }
          
          // Get image if available
          let imageUrl = "";
          const imageElement = eventElement.find('.eventlist-column-thumbnail img');
          if (imageElement.length > 0) {
            imageUrl = imageElement.attr('data-src') || imageElement.attr('src') || "";
          }
          
          // Infer genres from title and description
          const genres = this.inferGenres(title, description);
          
          // Construct event URL by combining venue URL with event-specific path if available
          let eventUrl = "";
          const eventUrlElement = eventElement.find('.eventlist-title-link');
          if (eventUrlElement.length > 0) {
            const eventPath = eventUrlElement.attr('href');
            if (eventPath) {
              // Construct full URL depending on path format
              if (eventPath.startsWith('http')) {
                eventUrl = eventPath;
              } else {
                // Get base URL and append path
                const baseUrl = this.venueUrl.split('/').slice(0, 3).join('/');
                eventUrl = eventPath.startsWith('/') 
                  ? `${baseUrl}${eventPath}` 
                  : `${baseUrl}/${eventPath}`;
              }
            }
          }
          
          // Add URL to description if available
          const fullDescription = eventUrl 
            ? `${description} More info: ${eventUrl}` 
            : description;
          
          // Create event object
          const event: EventWithGenres = {
            id: index + 3000, // Temporary ID, will be replaced by storage
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
          log(`Error processing Knockout event: ${eventError.message}`, 'scraper');
        }
      });
      
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
    
    // If no genres detected, use "Rock" as a fallback since The Knockout is primarily a rock/punk venue
    if (detectedGenres.size === 0) {
      detectedGenres.add('Rock');
    }
    
    return Array.from(detectedGenres);
  }
}