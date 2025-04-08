import { useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAttendEvent } from "@/hooks/use-events";
import { EventWithGenres } from "@shared/schema";
import { X, MapPin, Bookmark, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface EventDetailModalProps {
  event: EventWithGenres;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventDetailModal({
  event,
  isOpen,
  onClose,
}: EventDetailModalProps) {
  const { toast } = useToast();
  const attendEvent = useAttendEvent();
  const [isAttending, setIsAttending] = useState(false);

  const handleAttend = async () => {
    if (isAttending) return;

    try {
      await attendEvent.mutateAsync(event.id);
      setIsAttending(true);
      toast({
        title: "Success!",
        description: "You're now attending this event",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    }
  };

  // Format the date from ISO to display format
  const eventDate = new Date(event.date);
  const formattedDate = format(eventDate, "EEEE, MMMM d, yyyy");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <img
            src={
              event.imageUrl ||
              "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=400&q=80"
            }
            alt={event.title}
            className="w-full object-cover h-64"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 rounded-full"
            style={{ 
              backgroundColor: "var(--primary-accent)", 
              color: "var(--secondary-bg)" 
            }}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-0 left-0 right-0 p-4"
            style={{ 
              background: "linear-gradient(to top, var(--primary-accent), transparent)",
              color: "var(--secondary-bg)"
            }}>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-header)" }}>{event.title}</h2>
            <p className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-1" /> {event.venueName},{" "}
              {event.neighborhood}
            </p>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: "2px solid var(--subtle-accent)" }}>
            <div>
              <p className="font-medium" style={{ color: "var(--primary-accent)" }}>{formattedDate}</p>
              <p style={{ color: "var(--text-color)" }}>
                {event.startTime}
                {event.endTime ? ` - ${event.endTime}` : ""}
              </p>
            </div>
            <Button
              style={{
                backgroundColor: isAttending ? "var(--subtle-accent)" : "var(--primary-accent)",
                color: "var(--secondary-bg)",
                fontFamily: "var(--font-body)",
                fontWeight: 600
              }}
              onClick={handleAttend}
              disabled={attendEvent.isPending || isAttending}
            >
              <Bookmark className="h-4 w-4 mr-1" />{" "}
              {isAttending ? "Saved" : "Save"}
            </Button>
          </div>

          {event.description && (
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-2" style={{ 
                fontFamily: "var(--font-header)",
                color: "var(--primary-accent)"
              }}>
                About this show
              </h3>
              <p className="text-sm" style={{ color: "var(--text-color)" }}>{event.description}</p>
            </div>
          )}

          <div className="mb-4">
            <h3 className="font-bold text-lg mb-2" style={{ 
              fontFamily: "var(--font-header)",
              color: "var(--primary-accent)"
            }}>
              Venue Information
            </h3>
            <p className="text-sm mb-2 flex items-center" style={{ color: "var(--text-color)" }}>
              <MapPin className="h-4 w-4 mr-1" style={{ color: "var(--primary-accent)" }} /> {event.venueAddress}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2" style={{ 
              fontFamily: "var(--font-header)",
              color: "var(--primary-accent)"
            }}>Attendees</h3>
            <div className="flex -space-x-2 mb-2">
              {/* Show avatars for the first 4 attendees */}
              {[...Array(Math.min(4, event.attendees || 0))].map((_, i) => (
                <Avatar key={i} className="h-8 w-8 border-2" style={{ borderColor: "var(--secondary-bg)" }}>
                  <AvatarFallback style={{ 
                    backgroundColor: "var(--subtle-accent)",
                    color: "var(--text-color)"
                  }} className="text-xs">
                    {String.fromCharCode(65 + i)}
                  </AvatarFallback>
                </Avatar>
              ))}

              {/* If there are more than 4 attendees, show a count */}
              {(event.attendees || 0) > 4 && (
                <div 
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2"
                  style={{ 
                    backgroundColor: "var(--primary-accent)",
                    borderColor: "var(--secondary-bg)"
                  }}
                >
                  <span className="text-xs font-medium" style={{ color: "var(--secondary-bg)" }}>
                    +{(event.attendees || 0) - 4}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm flex items-center" style={{ color: "var(--text-color)" }}>
              <Users className="h-4 w-4 mr-1" style={{ color: "var(--subtle-accent)" }} /> {event.attendees || 0}{" "}
              {event.attendees === 1 ? "person is" : "people are"} attending
              this show
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-1">
            {event.genres.map((genre) => (
              <Badge 
                key={genre} 
                variant="outline" 
                className="badge-custom text-xs whitespace-nowrap"
                style={{
                  backgroundColor: "var(--subtle-accent)",
                  color: "var(--text-color)",
                  border: "none"
                }}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
