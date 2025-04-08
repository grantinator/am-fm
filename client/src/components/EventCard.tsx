import { useState } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventWithGenres } from "@shared/schema";
import { formatEventDate } from "@/hooks/use-events";
import { Heart, MapPin, Users } from "lucide-react";
import EventDetailModal from "./EventDetailModal";

interface EventCardProps {
  event: EventWithGenres;
}

export default function EventCard({ event }: EventCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleCardClick = () => {
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
  };

  // Format event date for display
  const formattedDate = formatEventDate(event.date);

  // Get label for date badges based on our theme
  const getDateLabelStyle = () => {
    const baseStyle = "absolute top-4 left-4 text-xs font-bold px-3 py-1.5 rounded-full shadow-md";
    
    if (formattedDate === "TODAY") {
      return `${baseStyle} bg-[var(--primary-accent)] text-[var(--secondary-bg)]`;
    } else if (formattedDate === "TOMORROW") {
      return `${baseStyle} bg-[var(--subtle-accent)] text-[var(--primary-accent)]`;
    } else if (formattedDate === "THIS WEEKEND") {
      return `${baseStyle} bg-[var(--primary-accent)] text-[var(--secondary-bg)]`;
    }
    return `${baseStyle} bg-[var(--subtle-accent)] text-[var(--primary-accent)]`;
  };

  return (
    <>
      <Card
        className="card cursor-pointer w-full"
        onClick={handleCardClick}
      >
        <div className="relative">
          <img
            src={
              event.imageUrl ||
              "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=333&q=80"
            }
            alt={event.title}
            className="w-full h-52 sm:h-56 object-cover rounded-t-[16px]"
          />
          {formattedDate && (
            <div className={getDateLabelStyle()}>
              {formattedDate}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-white/90 hover:bg-white text-[var(--primary-accent)] hover:text-[var(--link-hover-color)] rounded-full w-9 h-9 shadow-sm"
            onClick={handleLikeClick}
          >
            {isLiked ? (
              <Heart className="h-5 w-5 fill-[var(--primary-accent)] text-[var(--primary-accent)]" />
            ) : (
              <Heart className="h-5 w-5" />
            )}
          </Button>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className="w-full">
              <p className="text-sm font-semibold mb-2 tracking-wide" style={{ color: "var(--primary-accent)" }}>
                {format(new Date(event.date), "EEE, MMM d").toUpperCase()} • {event.startTime}
              </p>
              <h3 className="event-title mb-2">{event.title}</h3>
              <p className="event-subtitle mb-3 flex items-center">
                <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" style={{ color: "var(--primary-accent)" }} />
                {event.venueName}, {event.neighborhood}
              </p>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-[var(--subtle-accent)] flex items-center justify-between">
            <span className="event-detail flex items-center">
              <Users className="h-4 w-4 mr-1.5 flex-shrink-0" style={{ color: "var(--primary-accent)" }} />
              {event.attendees || 0} going
            </span>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {event.genres.map((genre, index) => (
                <Badge
                  key={`${event.id}-${genre}-${index}`}
                  variant="outline"
                  className="badge-custom"
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {showDetailModal && (
        <EventDetailModal
          event={event}
          isOpen={showDetailModal}
          onClose={closeDetailModal}
        />
      )}
    </>
  );
}
