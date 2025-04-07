import axios from 'axios';
import * as cheerio from 'cheerio';
import { VenueScraper, ScraperResult } from './base-scraper';
import { EventWithGenres } from '@shared/schema';

export class KilowattScraper extends VenueScraper {
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
      const response = await axios.get(this.venueUrl);
      const $ = cheerio.load(response.data);
      const events: EventWithGenres[] = [];
      
      // Find all event listings on the page
      $('.entry-content .event').each((index, element) => {
        const dateText = $(element).find('.date').text().trim();
        const titleElement = $(element).find('.title');
        const title = titleElement.text().trim();
        const descriptionElements = $(element).find('p');
        let description = '';
        
        // Skip the first p (usually the date/time info) and get the rest for description
        if (descriptionElements.length > 1) {
          descriptionElements.slice(1).each((i, el) => {
            description += $(el).text().trim() + ' ';
          });
        }
        
        // Extract date parts
        const dateMatch = dateText.match(/([A-Za-z]+) (\d+)(th|nd|rd|st)?,? (\d{4})?/);
        if (!dateMatch) return; // Skip if date can't be parsed
        
        const month = dateMatch[1];
        const day = dateMatch[2];
        const year = dateMatch[4] || new Date().getFullYear().toString();
        
        // Extract time
        const timeText = $(element).find('.date').text();
        const timeMatch = timeText.match(/(\d+):?(\d+)? ?(am|pm|AM|PM)/);
        let startTime = '';
        
        if (timeMatch) {
          const hour = timeMatch[1];
          const minute = timeMatch[2] || '00';
          const ampm = timeMatch[3].toLowerCase();
          startTime = `${hour}:${minute} ${ampm}`;
        }
        
        // Try to extract price
        const priceText = $(element).text();
        const priceMatch = priceText.match(/\$(\d+)/);
        const price = priceMatch ? priceMatch[1] : '';
        
        // Try to detect musical genre from description (simplified approach)
        const genreKeywords: Record<string, string[]> = {
          'Rock': ['rock', 'indie', 'alternative', 'punk', 'metal'],
          'Electronic': ['electronic', 'techno', 'house', 'dj', 'edm', 'dance'],
          'Folk': ['folk', 'acoustic', 'singer-songwriter'],
          'Jazz': ['jazz', 'blues', 'soul'],
          'Hip Hop': ['hip hop', 'hip-hop', 'rap', 'hiphop'],
          'Other': []
        };
        
        // Detect genres from description
        const detectedGenres: string[] = [];
        const descriptionLower = description.toLowerCase();
        
        for (const [genre, keywords] of Object.entries(genreKeywords)) {
          for (const keyword of keywords) {
            if (descriptionLower.includes(keyword) || title.toLowerCase().includes(keyword)) {
              detectedGenres.push(genre);
              break;
            }
          }
        }
        
        // If no genre detected, use "Other"
        if (detectedGenres.length === 0) {
          detectedGenres.push('Other');
        }
        
        // Create event object
        const event: EventWithGenres = {
          id: index + 1000, // Temporary ID, will be replaced when saved to storage
          title,
          description: description.trim(),
          date: new Date(`${month} ${day}, ${year}`),
          startTime,
          endTime: '',
          venueName: this.venueName,
          venueAddress: this.venueAddress,
          neighborhood: this.neighborhood,
          price: price ? parseInt(price) : 0,
          imageUrl: '',
          attendees: 0,
          createdAt: new Date(),
          genres: Array.from(new Set(detectedGenres)) // Remove duplicates
        };
        
        // Try to extract image URL if available
        const imgElement = $(element).find('img');
        if (imgElement.length > 0) {
          const imgSrc = imgElement.attr('src');
          if (imgSrc) {
            event.imageUrl = imgSrc;
          }
        }
        
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