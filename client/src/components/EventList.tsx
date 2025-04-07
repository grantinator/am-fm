import { useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { useEvents, useSearchEvents } from "@/hooks/use-events";
import { Skeleton } from "@/components/ui/skeleton";
import { EventWithGenres } from "@shared/schema";
import { Link } from "wouter";

export default function EventList() {
  const { data: allEvents, isLoading } = useEvents();
  const { data: searchResults, isLoading: searchLoading, query } = useSearchEvents();
  
  // Use search results if there's a query, otherwise use all events
  const events = query && searchResults ? searchResults : allEvents || [];
  const isLoadingEvents = isLoading || searchLoading;
  
  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, EventWithGenres[]> = {};
    
    if (events) {
      // Sort events by date
      const sortedEvents = [...events].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Group by date
      sortedEvents.forEach(event => {
        const dateKey = format(new Date(event.date), 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
      });
    }
    
    return grouped;
  }, [events]);
  
  if (isLoadingEvents) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
            <Skeleton className="w-full h-28" />
            <div className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (events.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-bold text-slate-800 mb-2">No events found</h3>
        <p className="text-slate-600">
          {query
            ? "No events match your search. Try with different keywords."
            : "No upcoming shows found. Check back later!"}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {Object.entries(eventsByDate).map(([dateKey, dateEvents]) => (
        <div key={dateKey} className="space-y-4">
          <h2 className="font-bold text-xl text-slate-800 border-b border-gray-200 pb-2">
            {format(new Date(dateKey), 'MMMM d, yyyy')}
          </h2>
          
          <div className="space-y-4">
            {dateEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800 mb-1">{event.title}</h3>
                        <p className="text-primary text-sm">{event.startTime} • {event.venueName}</p>
                        <p className="text-slate-500 text-sm mt-1 flex items-center">
                          {event.neighborhood}
                        </p>
                      </div>
                      {event.imageUrl && (
                        <img 
                          src={event.imageUrl} 
                          alt={event.title} 
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-slate-600 text-sm">
                        {event.attendees || 0} attending
                      </span>
                      <div className="text-xs text-slate-500">
                        {event.genres.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
