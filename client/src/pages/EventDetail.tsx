import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useEvent } from "@/hooks/use-events";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowLeft, MapPin, Bookmark, Users, Map } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function EventDetail() {
  const { id } = useParams();
  const [_, setLocation] = useLocation();
  const eventId = parseInt(id || '0');
  
  const { data: event, isLoading, error } = useEvent(eventId);
  
  // Redirect back to home if event not found
  useEffect(() => {
    if (!isLoading && !event && !error) {
      setLocation("/");
    }
  }, [event, isLoading, error, setLocation]);
  
  const handleBack = () => {
    setLocation("/");
  };
  
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Events
        </Button>
        <Skeleton className="w-full h-64 rounded-lg mb-4" />
        <Skeleton className="w-3/4 h-8 mb-2" />
        <Skeleton className="w-1/2 h-6 mb-6" />
        <div className="space-y-4">
          <Skeleton className="w-full h-24" />
          <Skeleton className="w-full h-40" />
          <Skeleton className="w-full h-20" />
        </div>
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Event Not Found</h2>
        <p className="text-white/70 mb-6">The event you're looking for doesn't exist or has been removed.</p>
        <Button onClick={handleBack}>Back to Events</Button>
      </div>
    );
  }
  
  // Format the date from ISO to display format
  const eventDate = new Date(event.date);
  const formattedDate = format(eventDate, "EEEE, MMMM d, yyyy");
  
  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={handleBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Events
      </Button>
      
      <div className="card rounded-lg overflow-hidden">
        <div className="relative">
          <img
            src={event.imageUrl || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=400&q=80"}
            alt={event.title}
            className="w-full object-cover h-64"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 text-white">
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <p className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-1" /> {event.venueName}, {event.neighborhood}
            </p>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-4 border-b border-purple-800/30 pb-4">
            <div>
              <p className="text-primary font-medium">{formattedDate}</p>
              <p className="event-subtitle">
                {event.startTime}{event.endTime ? ` - ${event.endTime}` : ""}
              </p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Bookmark className="h-4 w-4 mr-1" /> Save
            </Button>
          </div>
          
          {event.description && (
            <div className="mb-4">
              <h2 className="event-title text-lg mb-2">About this show</h2>
              <p className="event-detail text-sm">{event.description}</p>
            </div>
          )}
          
          <div className="mb-4">
            <h2 className="event-title text-lg mb-2">Venue Information</h2>
            <p className="event-detail text-sm mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-1" /> {event.venueAddress}
            </p>
            <div className="bg-purple-950/60 rounded-md h-48 flex items-center justify-center text-white/50 border border-purple-800/30">
              <div className="text-center">
                <Map className="h-8 w-8 mx-auto mb-2" />
                <p>Interactive map will be displayed here</p>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h2 className="event-title text-lg mb-2">Attendees</h2>
            <div className="flex -space-x-2 mb-2">
              {/* Show avatars for the first 4 attendees */}
              {[...Array(Math.min(4, event.attendees || 0))].map((_, i) => (
                <Avatar key={i} className="h-8 w-8 border-2 border-purple-900">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {String.fromCharCode(65 + i)}
                  </AvatarFallback>
                </Avatar>
              ))}
              
              {/* If there are more than 4 attendees, show a count */}
              {(event.attendees || 0) > 4 && (
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 border-2 border-purple-900">
                  <span className="text-xs font-medium text-white">+{(event.attendees || 0) - 4}</span>
                </div>
              )}
            </div>
            <p className="event-detail text-sm flex items-center">
              <Users className="h-4 w-4 mr-1" /> {event.attendees || 0} {event.attendees === 1 ? "person is" : "people are"} attending this show
            </p>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-1">
            {event.genres.map((genre) => (
              <Badge key={genre} variant="outline" className="bg-purple-950/60 text-purple-300 border-purple-800/30 text-xs">
                {genre}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
