import { useMemo } from "react";
import { format } from "date-fns";
import { useEvents } from "@/hooks/use-events";
import { Skeleton } from "@/components/ui/skeleton";
import { EventWithGenres } from "@shared/schema";
import EventCard from "./EventCard";

export default function EventList() {
  const { data: allEvents, isLoading } = useEvents();

  // Group events by date, only showing future events
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, EventWithGenres[]> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of today
    
    if (allEvents) {
      // Filter out past events and sort by date
      const futureEvents = allEvents.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0); // Set to beginning of event day
        return eventDate >= today;
      });
      
      const sortedEvents = [...futureEvents].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Group by date, using the original event date for key
      sortedEvents.forEach(event => {
        const eventDate = new Date(event.date);
        const dateKey = format(eventDate, 'yyyy-MM-dd');
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
          <div key={i} className="card rounded-lg overflow-hidden w-full" style={{ 
            backgroundColor: "var(--secondary-bg)",
            borderLeft: "4px solid var(--primary-accent)"
          }}>
            <Skeleton className="w-full h-48" style={{ backgroundColor: "var(--subtle-accent)", opacity: 0.2 }} />
            <div className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" style={{ backgroundColor: "var(--subtle-accent)", opacity: 0.3 }} />
              <Skeleton className="h-4 w-2/3 mb-1" style={{ backgroundColor: "var(--subtle-accent)", opacity: 0.2 }} />
              <Skeleton className="h-4 w-1/2" style={{ backgroundColor: "var(--subtle-accent)", opacity: 0.2 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!allEvents || allEvents.length === 0 || Object.keys(eventsByDate).length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-bold mb-2" style={{ color: "var(--primary-accent)" }}>No upcoming events</h3>
        <p style={{ color: "var(--text-color)" }}>No upcoming shows found. Check back later or add your own show!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">
      {Object.entries(eventsByDate).map(([dateKey, dateEvents]) => (
        <div key={dateKey} className="space-y-4 w-full">
          <h2 className="date-header font-bold text-xl pb-2 w-full" style={{ 
            fontFamily: "var(--font-header)", 
            color: "var(--primary-accent)",
            borderBottom: "2px solid var(--subtle-accent)",
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}>
            {/* Use the date from the first event in the group */}
            {format(new Date(dateEvents[0].date), 'MMMM d, yyyy')}
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