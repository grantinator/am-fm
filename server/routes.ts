import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema, eventFormSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadsDir = path.join(process.cwd(), "dist/public/uploads");
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      // Create unique filename with original extension
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
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
  app.post("/api/events", upload.single("image"), async (req, res) => {
    try {
      // Parse event data from form
      const eventData = JSON.parse(req.body.eventData);
      
      // Add imageUrl if an image was uploaded
      if (req.file) {
        eventData.imageUrl = `/uploads/${req.file.filename}`;
      }

      // Validate event data
      const result = insertEventSchema.safeParse(eventData);
      if (!result.success) {
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
