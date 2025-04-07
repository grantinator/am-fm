import { useEffect } from "react";
import { useLocation } from "wouter";
import { useEvents } from "@/hooks/use-events";
import EventList from "@/components/EventList";

export default function Home() {
  const [_, setLocation] = useLocation();
  const { data: events, isLoading, error } = useEvents();

  // Redirect to event detail if we have a hash in the URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#event-')) {
      const eventId = hash.replace('#event-', '');
      setLocation(`/events/${eventId}`);
    }
  }, [setLocation]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Events</h2>
        <p className="text-slate-600">There was a problem fetching events. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:max-w-2xl sm:mx-auto">
      <EventList />
    </div>
  );
}
