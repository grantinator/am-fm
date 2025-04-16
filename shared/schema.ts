import { pgTable, text, date, bigint, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// export const users = pgTable("users", {
//   id: serial("id").primaryKey(),
//   username: text("username").notNull().unique(),
//   password: text("password").notNull(),
// });

// export const insertUserSchema = createInsertSchema(users).pick({
//   username: true,
//   password: true,
// });

// export type InsertUser = z.infer<typeof insertUserSchema>;
// export type User = typeof users.$inferSelect;

// Event schema for concerts
export const events = pgTable("events", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  eventDate: date("event_date").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  venueName: text("venue_name"),
  venueAddress: text("venue_address").notNull(),
  neighborhood: text("neighborhood"),
  imageUri: text("image_uri"),
  ticket_price: numeric("ticket_price", { scale: 10, precision: 2 }),
  attendees: integer("attendees").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Arrays in drizzle must be defined as column type with .array() method
export const eventGenres = pgTable("event_genres", {
  eventId: integer("event_id").notNull().references(() => events.id),
  genre: text("genre").notNull(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  createdAt: true,
  imageUri: true,
});

// Types
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type EventWithGenres = Event & { genres: string[] };

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
