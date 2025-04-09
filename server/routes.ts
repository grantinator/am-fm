
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema, eventFormSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";

// Define custom request type that includes file property
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
      // Use a persistent uploads directory at the project root level
      const uploadsDir = path.join(process.cwd(), "persistent_uploads");
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    },
    filename: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      // Create unique filename with original extension
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all events
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve events" });
    }
  });

  // Get single event by ID
  app.get("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve event" });
    }
  });

  // Create new event with image upload
  app.post("/api/events", upload.single("image"), async (req: MulterRequest, res) => {
    try {
      // Parse event data from form
      const eventData = JSON.parse(req.body.eventData);
      
      // Add imageUrl if an image was uploaded
      if (req.file) {
        // Ensure the path starts with a leading slash
        eventData.imageUrl = `/uploads/${req.file.filename}`;
        console.log('Image URL set to:', eventData.imageUrl);
      }
      
      // Combine date and time into a single Date object
      if (eventData.date && eventData.startTime) {
        const dateStr = typeof eventData.date === 'string' ? eventData.date : eventData.date.toISOString().split('T')[0];
        const [hours, minutes] = eventData.startTime.split(':');
        
        // Create date object combining the date and time
        const combinedDate = new Date(dateStr);
        combinedDate.setHours(parseInt(hours), parseInt(minutes));
        
        if (isNaN(combinedDate.getTime())) {
          console.error('Invalid date/time format:', { date: eventData.date, time: eventData.startTime });
          return res.status(400).json({ 
            message: "Invalid date/time format", 
            errors: { date: { _errors: ["Invalid date/time format"] } }
          });
        }
        
        eventData.date = combinedDate;
      } else if (typeof eventData.date === 'object' && eventData.date !== null) {
        // If it's a date-like object from JSON, convert to proper Date
        if ('toISOString' in eventData.date) {
          // It's already a Date object
        } else {
          // It's a date-like object (with year, month, day properties)
          try {
            eventData.date = new Date(eventData.date);
          } catch (e) {
            console.error('Error converting date object:', e);
            return res.status(400).json({ 
              message: "Invalid date object", 
              errors: { date: { _errors: ["Invalid date format"] } }
            });
          }
        }
      }
      
      // Log the date for debugging
      console.log('Processed date:', eventData.date);

      // Validate event data
      const result = insertEventSchema.safeParse(eventData);
      if (!result.success) {
        console.log('Validation errors:', JSON.stringify(result.error.format(), null, 2));
        return res.status(400).json({ 
          message: "Invalid event data", 
          errors: result.error.format() 
        });
      }

      // Extract genres
      const { genres, ...validatedEvent } = eventData;
      
      // Create the event in storage
      const createdEvent = await storage.createEvent(validatedEvent, genres || []);
      
      res.status(201).json(createdEvent);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  // Filter events by neighborhood
  app.get("/api/events/filter/neighborhood/:neighborhood", async (req, res) => {
    try {
      const { neighborhood } = req.params;
      const events = await storage.getEventsByNeighborhood(neighborhood);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to filter events by neighborhood" });
    }
  });

  // Filter events by genre
  app.get("/api/events/filter/genre/:genre", async (req, res) => {
    try {
      const { genre } = req.params;
      const events = await storage.getEventsByGenre(genre);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to filter events by genre" });
    }
  });

  // Filter events by date range
  app.get("/api/events/filter/date", async (req, res) => {
    try {
      const startDateStr = req.query.startDate as string;
      const endDateStr = req.query.endDate as string | undefined;
      
      if (!startDateStr) {
        return res.status(400).json({ message: "Start date is required" });
      }
      
      const startDate = new Date(startDateStr);
      const endDate = endDateStr ? new Date(endDateStr) : undefined;
      
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ message: "Invalid start date" });
      }
      
      if (endDate && isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid end date" });
      }
      
      const events = await storage.getEventsByDate(startDate, endDate);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to filter events by date" });
    }
  });

  // Search events
  app.get("/api/events/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const events = await storage.searchEvents(query);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to search events" });
    }
  });

  // Increment attendees for an event
  app.post("/api/events/:id/attend", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      await storage.incrementAttendees(id);
      const updatedEvent = await storage.getEvent(id);
      
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(updatedEvent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update attendance" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
