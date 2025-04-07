import { log } from '../vite';
import { VenueScraper, ScraperResult } from './base-scraper';
import { KilowattScraper } from './kilowatt-scraper';
import { IStorage } from '../storage';
import { EventWithGenres } from '@shared/schema';
import cron from 'node-cron';

export class VenueScraperManager {
  private scrapers: VenueScraper[];
  private storage: IStorage;
  private isScraping: boolean = false;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.scrapers = [
      new KilowattScraper(),
      // Add more venue scrapers here as they're created
    ];
  }

  // Run all scrapers once
  async scrapeAll(): Promise<ScraperResult[]> {
    if (this.isScraping) {
      log('Scraping already in progress, skipping this run', 'scraper');
      return [];
    }

    this.isScraping = true;
    log('Starting scrape of all venues', 'scraper');
    
    try {
      const results = await Promise.all(
        this.scrapers.map(scraper => scraper.scrape())
      );
      
      // Save all scraped events to storage
      for (const result of results) {
        if (result.success && result.events.length > 0) {
          await this.saveEvents(result.events);
        }
      }
      
      log(`Completed scraping ${this.scrapers.length} venues`, 'scraper');
      return results;
    } catch (error: any) {
      log(`Error in scrape manager: ${error.message}`, 'scraper');
      return [{
        success: false,
        events: [],
        error: error.message
      }];
    } finally {
      this.isScraping = false;
    }
  }

  // Schedule recurring scraping
  scheduleRecurring(cronPattern: string = '0 */6 * * *') { // Default: every 6 hours
    log(`Scheduling venue scraping with pattern: ${cronPattern}`, 'scraper');
    
    // Run immediately on startup
    setTimeout(() => {
      this.scrapeAll().catch(err => 
        log(`Initial scrape failed: ${err.message}`, 'scraper')
      );
    }, 5000); // Wait 5 seconds after server start
    
    // Schedule recurring scrapes
    return cron.schedule(cronPattern, () => {
      this.scrapeAll().catch(err => 
        log(`Scheduled scrape failed: ${err.message}`, 'scraper')
      );
    });
  }

  // Save events to storage
  private async saveEvents(events: EventWithGenres[]): Promise<void> {
    let savedCount = 0;
    
    for (const event of events) {
      try {
        // Create event without ID (storage will assign one)
        const { id, ...eventWithoutId } = event;
        
        // Check if this event already exists (simple check by title and date)
        const allEvents = await this.storage.getAllEvents();
        const exists = allEvents.some(e => 
          e.title === event.title && 
          e.date.toDateString() === event.date.toDateString() &&
          e.venueName === event.venueName
        );
        
        if (!exists) {
          await this.storage.createEvent(eventWithoutId, event.genres);
          savedCount++;
        }
      } catch (error: any) {
        log(`Error saving event "${event.title}": ${error.message}`, 'scraper');
      }
    }
    
    log(`Saved ${savedCount} new events to storage`, 'scraper');
  }
}