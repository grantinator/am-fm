import { useState } from "react";
import EventCard from "./EventCard";
import { useFilteredEvents, useSearchEvents } from "@/hooks/use-events";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventList() {
  const { events, isLoading } = useFilteredEvents();
  const { data: searchResults, isLoading: searchLoading, query } = useSearchEvents();
  
  // Use search results if there's a query, otherwise use filtered events
  const displayedEvents = query && searchResults ? searchResults : events;
  const isLoadingEvents = isLoading || searchLoading;
  
  if (isLoadingEvents) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
            <Skeleton className="w-full h-48" />
            <div className="p-4">
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/4" />
                <div className="flex space-x-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (displayedEvents.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-bold text-slate-800 mb-2">No events found</h3>
        <p className="text-slate-600">
          {query
            ? "No events match your search. Try with different keywords."
            : "No events match your current filters. Try with different criteria."}
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayedEvents.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
