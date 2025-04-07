import { useMemo } from "react";
import { format } from "date-fns";
import { useEvents } from "@/hooks/use-events";
import { Skeleton } from "@/components/ui/skeleton";
import { EventWithGenres } from "@shared/schema";
import EventCard from "./EventCard";

export default function EventList() {
  const { data: allEvents, isLoading } = useEvents();
  
  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, EventWithGenres[]> = {};
    
    if (allEvents) {
      // Sort events by date
      const sortedEvents = [...allEvents].sort((a, b) => 
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
  }, [allEvents]);
  
  if (isLoading) {
    return (
      <div className="space-y-6 w-full">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden w-full">
            <Skeleton className="w-full h-48" />
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
  
  if (!allEvents || allEvents.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-bold text-slate-800 mb-2">No events found</h3>
        <p className="text-slate-600">No upcoming shows found. Check back later!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8 w-full">
      {Object.entries(eventsByDate).map(([dateKey, dateEvents]) => (
        <div key={dateKey} className="space-y-4 w-full">
          <h2 className="font-bold text-xl text-slate-800 border-b border-gray-200 pb-2 w-full">
            {format(new Date(dateKey), 'MMMM d, yyyy')}
          </h2>
          
          <div className="space-y-4 w-full">
            {dateEvents.map((event) => (
              <div key={event.id} className="w-full">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
