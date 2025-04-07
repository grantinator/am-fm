import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Event schema for concerts
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  venueName: text("venue_name").notNull(),
  venueAddress: text("venue_address").notNull(),
  neighborhood: text("neighborhood"),
  description: text("description"),
  imageUrl: text("image_url"),
  price: integer("price").default(0), // Added price field
  attendees: integer("attendees").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Arrays in drizzle must be defined as column type with .array() method
export const eventGenres = pgTable("event_genres", {
  eventId: integer("event_id").notNull().references(() => events.id),
  genre: text("genre").notNull(),
});

// Create insert schema
export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  attendees: true,
  createdAt: true,
});

// Add additional validation
export const eventFormSchema = insertEventSchema.extend({
  genres: z.array(z.string()).min(1, "At least one genre is required"),
  image: z.instanceof(File, { message: "Event image is required" }).optional(),
});

// Types
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type EventWithGenres = Event & { genres: string[] };
export type EventFormData = z.infer<typeof eventFormSchema>;

// Neighborhood and genre options
export const neighborhoods = [
  "Mission",
  "Castro",
  "Hayes Valley",
  "SoMa",
  "Potrero Hill",
  "NoPa",
  "Tenderloin",
  "Haight",
  "Richmond",
  "Sunset",
  "Marina",
  "North Beach",
  "Financial District",
  "Chinatown",
  "Other"
] as const;

export const genres = [
  "Rock",
  "Indie",
  "Electronic",
  "Jazz",
  "Punk",
  "Hip Hop",
  "Folk",
  "Classical",
  "R&B",
  "Soul",
  "Blues",
  "Metal",
  "Pop",
  "Experimental",
  "Acoustic"
] as const;

export const neighborhoodSchema = z.enum(neighborhoods);
export const genreSchema = z.enum(genres);
