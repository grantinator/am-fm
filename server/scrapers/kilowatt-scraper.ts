import axios from 'axios';
import { VenueScraper, ScraperResult } from './base-scraper';
import { EventWithGenres } from '@shared/schema';

export class KilowattScraper extends VenueScraper {
  private readonly apiKey = 'cxapsVUwK54628CtqISh79lqEA7pdqEH6sJ6Lt5B';
  private readonly partnerId = 'ff10e59d';

  constructor() {
    super(
      'Kilowatt Bar',
      '3160 16th St, San Francisco, CA 94103',
      'https://kilowattbar.com/events',
      'Mission'
    );
  }

  async scrape(): Promise<ScraperResult> {
    try {
      // Use the DICE.fm API to fetch events for Kilowatt
      const response = await axios.get('https://api.dice.fm/v1/events', {
        params: {
          venue: 'Kilowatt',
          apiKey: this.apiKey,
          partnerId: this.partnerId
        }
      });

      if (!response.data || !response.data.data) {
        return {
          success: false,
          events: [],
          error: 'No data returned from DICE.fm API'
        };
      }

      const events: EventWithGenres[] = [];
      
      // Process each event from the API response
      response.data.data.forEach((eventData: any, index: number) => {
        if (!eventData) return;
        
        // Extract and process necessary information
        const title = eventData.name || 'Unknown Event';
        const description = eventData.description || '';
        
        // Convert event date/time to a Date object
        const eventDate = eventData.date ? new Date(eventData.date) : new Date();
        
        // Format the time for display
        const startTime = eventDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        });
        
        // Try to extract end time if available
        const endTime = eventData.endDate 
          ? new Date(eventData.endDate).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit', 
              hour12: true 
            })
          : '';
        
        // Extract price information
        let price = 0; // Default to free
        if (eventData.price && eventData.price.total) {
          // Price might be in cents or with currency symbol
          const priceValue = eventData.price.total;
          if (typeof priceValue === 'number') {
            price = priceValue;
          } else if (typeof priceValue === 'string') {
            // Remove currency symbol if present and convert to number
            const cleanPrice = priceValue.replace(/[^0-9.]/g, '');
            price = parseFloat(cleanPrice) || 0;
          }
        }
        
        // Get image URL
        const imageUrl = eventData.image || eventData.coverImage || '';
        
        // Detect genres based on event tags or categories
        const detectedGenres: string[] = [];
        
        if (eventData.tags && Array.isArray(eventData.tags)) {
          const genreMap: Record<string, string> = {
            'rock': 'Rock',
            'indie': 'Indie',
            'electronic': 'Electronic',
            'house': 'Electronic',
            'techno': 'Electronic',
            'folk': 'Folk',
            'acoustic': 'Acoustic',
            'jazz': 'Jazz',
            'blues': 'Blues',
            'punk': 'Punk',
            'hip-hop': 'Hip Hop',
            'rap': 'Hip Hop',
            'pop': 'Pop'
          };
          
          // Map the event tags to our genres
          eventData.tags.forEach((tag: string) => {
            const lowerTag = tag.toLowerCase();
            for (const [keyword, genre] of Object.entries(genreMap)) {
              if (lowerTag.includes(keyword)) {
                detectedGenres.push(genre);
                break;
              }
            }
          });
        }
        
        // If no genres were detected, try to infer from description/title
        if (detectedGenres.length === 0) {
          const genreKeywords: Record<string, string[]> = {
            'Rock': ['rock', 'indie', 'alternative', 'punk', 'metal'],
            'Electronic': ['electronic', 'techno', 'house', 'dj', 'edm', 'dance'],
            'Folk': ['folk', 'acoustic', 'singer-songwriter'],
            'Jazz': ['jazz', 'blues', 'soul'],
            'Hip Hop': ['hip hop', 'hip-hop', 'rap', 'hiphop'],
            'Pop': ['pop', 'synth']
          };
          
          const textToSearch = (title + ' ' + description).toLowerCase();
          
          for (const [genre, keywords] of Object.entries(genreKeywords)) {
            for (const keyword of keywords) {
              if (textToSearch.includes(keyword)) {
                detectedGenres.push(genre);
                break;
              }
            }
          }
        }
        
        // If still no genres, use "Other"
        if (detectedGenres.length === 0) {
          detectedGenres.push('Other');
        }
        
        // Create event object
        const event: EventWithGenres = {
          id: index + 1000, // Temporary ID, will be replaced when saved to storage
          title,
          description,
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
          genres: Array.from(new Set(detectedGenres)) // Remove duplicates
        };
        
        events.push(event);
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
}