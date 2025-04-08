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
    const baseStyle = "absolute top-3 left-3 text-sm font-bold px-2 py-1 rounded-md";
    
    if (formattedDate === "TODAY") {
      return `${baseStyle} bg-[var(--primary-accent)] text-[var(--secondary-bg)]`;
    } else if (formattedDate === "TOMORROW") {
      return `${baseStyle} bg-[var(--subtle-accent)] text-[var(--text-color)]`;
    } else if (formattedDate === "THIS WEEKEND") {
      return `${baseStyle} bg-[var(--primary-accent)] text-[var(--secondary-bg)]`;
    }
    return `${baseStyle} bg-[var(--subtle-accent)] text-[var(--text-color)]`;
  };

  return (
    <>
      <Card
        className="card rounded-lg overflow-hidden cursor-pointer w-full shadow-md"
        onClick={handleCardClick}
      >
        <div className="relative">
          <img
            src={
              event.imageUrl ||
              "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=333&q=80"
            }
            alt={event.title}
            className="w-full h-48 sm:h-52 object-cover"
          />
          {formattedDate && (
            <div className={getDateLabelStyle()}>
              {formattedDate}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-[var(--secondary-bg)] hover:bg-[var(--bg-color)] text-[var(--primary-accent)] hover:text-[var(--link-hover-color)] rounded-full w-8 h-8"
            onClick={handleLikeClick}
          >
            {isLiked ? (
              <Heart className="h-5 w-5 fill-[var(--primary-accent)] text-[var(--primary-accent)]" />
            ) : (
              <Heart className="h-5 w-5" />
            )}
          </Button>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="w-full">
              <p className="text-sm font-medium mb-1" style={{ color: "var(--primary-accent)" }}>
                {format(new Date(event.date), "EEE, MMM d").toUpperCase()} •{" "}
                {event.startTime}
              </p>
              <h3 className="event-title text-lg mb-1">{event.title}</h3>
              <p className="event-subtitle text-sm flex items-center">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" style={{ color: "var(--primary-accent)" }} />{" "}
                {event.venueName}, {event.neighborhood}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="event-detail text-sm flex items-center">
              <Users className="h-4 w-4 mr-1 flex-shrink-0" style={{ color: "var(--subtle-accent)" }} />{" "}
              {event.attendees || 0} going
            </span>
            <div className="flex flex-wrap gap-1 justify-end">
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
