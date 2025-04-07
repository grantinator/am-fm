import axios from 'axios';
import * as cheerio from 'cheerio';
import { VenueScraper, ScraperResult } from './base-scraper';
import { EventWithGenres } from '@shared/schema';
import { log } from '../vite';

export class HotelUtahScraper extends VenueScraper {
  constructor() {
    super(
      'The Hotel Utah Saloon',
      '500 4th St, San Francisco, CA 94107',
      'https://hotelutah.com/calendar/',
      'SoMa'
    );
  }

  async scrape(): Promise<ScraperResult> {
    try {
      // Fetch the calendar page
      const response = await axios.get(this.venueUrl);
      const html = response.data;
      const $ = cheerio.load(html);
      
      const events: EventWithGenres[] = [];
      
      // Find all event containers based on the pattern observed in the HTML
      $('.seetickets-list-event-container').each((index, element) => {
        try {
          // Extract event data from HTML
          const eventElement = $(element);
          
          // Parse date
          const dateText = eventElement.find('.event-date').text().trim();
          const dateMatch = dateText.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\w+)\s+(\d+)/);
          
          let eventDate: Date;
          if (dateMatch) {
            const [_, dayOfWeek, month, day] = dateMatch;
            // Handle parsing the date - assuming current year
            const currentYear = new Date().getFullYear();
            const monthMap: {[key: string]: number} = {
              'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
              'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };
            
            if (monthMap[month] !== undefined) {
              eventDate = new Date(currentYear, monthMap[month], parseInt(day));
            } else {
              // If month parsing fails, use current date
              log(`Could not parse month from date: ${dateText}`, 'scraper');
              eventDate = new Date();
            }
          } else {
            // Fallback to current date if parsing fails
            log(`Could not parse date from: ${dateText}`, 'scraper');
            eventDate = new Date();
          }
          
          // Get title
          const titleElement = eventElement.find('.event-title a');
          const title = titleElement.text().trim();
          const eventUrl = titleElement.attr('href') || '';
          
          // Get image URL
          const imageElement = eventElement.find('.seetickets-list-view-event-image');
          const imageUrl = imageElement.attr('src') || '';
          
          // Get event time
          const showtimeText = eventElement.find('.see-showtime').text().trim();
          const startTime = showtimeText || '8:00PM'; // Default if not found
          
          // End time is often not specified, use a reasonable default
          const endTime = ''; // We'll leave this blank if not specified
          
          // Get price information
          const agesPriceText = eventElement.find('.ages-price').text().trim();
          const priceMatch = agesPriceText.match(/\$(\d+\.\d+|\d+)/);
          let price = 0;
          
          if (priceMatch && priceMatch[1]) {
            price = parseFloat(priceMatch[1]);
          }
          
          // Get event description/header
          const eventHeader = eventElement.find('.event-header').text().trim();
          const supportingTalent = eventElement.find('.supporting-talent').text().trim();
          
          // Combine information for a description
          let description = eventHeader;
          if (supportingTalent) {
            description += ` Supporting: ${supportingTalent}`;
          }
          
          if (eventUrl) {
            description += ` More info: ${eventUrl}`;
          }
          
          // Extract genre information
          const genreText = eventElement.find('.genre').text().trim();
          const detectedGenres: string[] = [];
          
          if (genreText) {
            // Map the displayed genre to our schema genres
            const genreMap: Record<string, string> = {
              'rock': 'Rock',
              'indie': 'Indie',
              'electronic': 'Electronic',
              'house': 'Electronic',
              'techno': 'Electronic',
              'dj': 'DJ',
              'folk': 'Folk',
              'acoustic': 'Acoustic',
              'jazz': 'Jazz',
              'blues': 'Blues',
              'punk': 'Punk',
              'hip hop': 'Hip Hop',
              'hip-hop': 'Hip Hop',
              'rap': 'Hip Hop',
              'pop': 'Pop',
              'r&b': 'R&B',
              'soul': 'R&B',
              'metal': 'Rock',
              'country': 'Folk'
            };
            
            const lowerGenre = genreText.toLowerCase();
            let matched = false;
            
            for (const [keyword, genre] of Object.entries(genreMap)) {
              if (lowerGenre.includes(keyword)) {
                detectedGenres.push(genre);
                matched = true;
                break;
              }
            }
            
            // If no match found in our mapping, use the original genre
            if (!matched) {
              // Try to capitalize first letter of each word
              const formattedGenre = genreText.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
              detectedGenres.push(formattedGenre);
            }
          }
          
          // If no genres detected, infer from title/description
          if (detectedGenres.length === 0) {
            const genreKeywords: Record<string, string[]> = {
              'Rock': ['rock', 'indie', 'alternative', 'punk', 'metal'],
              'Electronic': ['electronic', 'techno', 'house', 'dj', 'edm', 'dance'],
              'Folk': ['folk', 'acoustic', 'singer-songwriter', 'country'],
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
            id: index + 2000, // Temporary ID, will be replaced when saved to storage
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
        } catch (eventError: any) {
          log(`Error processing event: ${eventError.message}`, 'scraper');
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
}