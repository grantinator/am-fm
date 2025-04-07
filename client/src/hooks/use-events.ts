import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { EventWithGenres, EventFormData } from "@shared/schema";
import { format, isSameDay, isThisWeek, isToday } from "date-fns";

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

// Search events
export function useSearchEvents(initialQuery = "") {
  const [query, setQuery] = useState(initialQuery);
  
  const searchResults = useQuery<EventWithGenres[]>({
    queryKey: ["/api/events/search", query],
    enabled: query.length > 0,
  });
  
  return {
    query,
    setQuery,
    ...searchResults,
  };
}

// Filter events
export function useFilteredEvents() {
  const [filters, setFilters] = useState<{
    neighborhood?: string;
    genre?: string;
    timeframe?: "all" | "today" | "thisWeekend";
  }>({
    timeframe: "all",
  });
  
  const { data: allEvents, isLoading } = useEvents();
  
  // Apply filters client-side for more responsive UI
  const filteredEvents = !allEvents ? [] : allEvents.filter(event => {
    // Filter by neighborhood
    if (filters.neighborhood && event.neighborhood !== filters.neighborhood) {
      return false;
    }
    
    // Filter by genre
    if (filters.genre && !event.genres.includes(filters.genre)) {
      return false;
    }
    
    // Filter by timeframe
    if (filters.timeframe === "today" && !isToday(new Date(event.date))) {
      return false;
    }
    
    if (filters.timeframe === "thisWeekend") {
      const date = new Date(event.date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday
      return isThisWeek(date) && isWeekend;
    }
    
    return true;
  });
  
  return {
    events: filteredEvents,
    isLoading,
    filters,
    setFilters,
  };
}

// Format date for display
export function formatEventDate(date: Date | string) {
  const eventDate = typeof date === "string" ? new Date(date) : date;
  
  // Return different formats based on how soon the event is
  if (isToday(eventDate)) {
    return "TODAY";
  } else if (isSameDay(eventDate, new Date(Date.now() + 86400000))) {
    return "TOMORROW";
  } else if (isThisWeek(eventDate)) {
    return "THIS WEEKEND";
  }
  
  // Default format: "FRI, MAY 12"
  return format(eventDate, "EEE, MMM d").toUpperCase();
}
