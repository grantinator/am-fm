import { useState } from "react";
import { Link } from "wouter";
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
  
  // Get label color based on date
  const getLabelColor = () => {
    if (formattedDate === "TODAY") {
      return "bg-primary";
    } else if (formattedDate === "TOMORROW") {
      return "bg-teal-500";
    } else if (formattedDate === "THIS WEEKEND") {
      return "bg-blue-500";
    }
    return "bg-gray-500";
  };
  
  return (
    <>
      <Card className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer" onClick={handleCardClick}>
        <div className="relative">
          <img 
            src={event.imageUrl || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=333&q=80"} 
            alt={event.title} 
            className="w-full h-48 object-cover"
          />
          {formattedDate && (
            <div className={`absolute top-3 left-3 ${getLabelColor()} text-white text-sm font-bold px-2 py-1 rounded-md`}>
              {formattedDate}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-white bg-opacity-70 hover:bg-opacity-100 text-slate-700 hover:text-pink-500 rounded-full w-8 h-8"
            onClick={handleLikeClick}
          >
            {isLiked ? (
              <Heart className="h-5 w-5 fill-pink-500 text-pink-500" />
            ) : (
              <Heart className="h-5 w-5" />
            )}
          </Button>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-primary mb-1">
                {format(new Date(event.date), "EEE, MMM d").toUpperCase()} • {event.startTime}
              </p>
              <h3 className="font-bold text-slate-800 text-lg mb-1">{event.title}</h3>
              <p className="text-slate-500 text-sm flex items-center">
                <MapPin className="h-4 w-4 mr-1" /> {event.venueName}, {event.neighborhood}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-slate-600 text-sm flex items-center">
              <Users className="h-4 w-4 mr-1" /> {event.attendees || 0} going
            </span>
            <div className="flex space-x-1">
              {event.genres.map((genre) => (
                <Badge key={genre} variant="outline" className="bg-gray-100 text-slate-600 text-xs">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
      
      {showDetailModal && (
        <EventDetailModal event={event} isOpen={showDetailModal} onClose={closeDetailModal} />
      )}
    </>
  );
}
