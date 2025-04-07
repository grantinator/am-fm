import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { EventWithGenres } from "@shared/schema";
import { format } from "date-fns";

// Get all events
export function useEvents() {
  return useQuery<EventWithGenres[]>({
    queryKey: ["/api/events"],
  });
}

// Get a single event by ID
export function useEvent(id: number) {
  return useQuery<EventWithGenres>({
    queryKey: ["/api/events", id],
    enabled: !!id,
  });
}

// Create a new event
export function useCreateEvent() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/events", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create event");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });
}

// Mark attendance for an event
export function useAttendEvent() {
  return useMutation({
    mutationFn: async (eventId: number) => {
      return apiRequest("POST", `/api/events/${eventId}/attend`, {});
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });
}

// Format date for display
export function formatEventDate(date: Date | string) {
  const eventDate = typeof date === "string" ? new Date(date) : date;
  return format(eventDate, "EEE, MMM d").toUpperCase();
}
