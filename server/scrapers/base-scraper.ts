import { log } from '../vite';
import { EventWithGenres } from '@shared/schema';

export interface ScraperResult {
  success: boolean;
  events: EventWithGenres[];
  error?: string;
}

export abstract class VenueScraper {
  protected venueName: string;
  protected venueAddress: string;
  protected venueUrl: string;
  protected neighborhood: string;

  constructor(
    venueName: string,
    venueAddress: string,
    venueUrl: string,
    neighborhood: string
  ) {
    this.venueName = venueName;
    this.venueAddress = venueAddress;
    this.venueUrl = venueUrl;
    this.neighborhood = neighborhood;
  }

  abstract scrape(): Promise<ScraperResult>;

  protected logSuccess(eventCount: number): void {
    log(`Scraped ${eventCount} events from ${this.venueName}`, 'scraper');
  }

  protected logError(error: Error): ScraperResult {
    log(`Error scraping ${this.venueName}: ${error.message}`, 'scraper');
    return {
      success: false,
      events: [],
      error: error.message
    };
  }
}