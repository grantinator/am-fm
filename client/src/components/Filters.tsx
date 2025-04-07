import { Button } from "@/components/ui/button";
import { useFilteredEvents } from "@/hooks/use-events";
import { MapPin, Guitar, Music } from "lucide-react";

export default function Filters() {
  const { filters, setFilters } = useFilteredEvents();

  const handleTimeframeFilter = (timeframe: "all" | "today" | "thisWeekend") => {
    setFilters({
      ...filters,
      timeframe,
    });
  };

  const handleNeighborhoodFilter = (neighborhood?: string) => {
    setFilters({
      ...filters,
      neighborhood,
    });
  };

  const handleGenreFilter = (genre?: string) => {
    setFilters({
      ...filters,
      genre,
    });
  };

  return (
    <div className="mb-5 pt-2 overflow-x-auto scrollbar-hide">
      <div className="flex space-x-2 w-max min-w-full pb-2">
        <Button
          variant={filters.timeframe === "all" ? "default" : "outline"}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filters.timeframe === "all" ? "bg-primary text-white" : ""
          }`}
          onClick={() => handleTimeframeFilter("all")}
        >
          All Shows
        </Button>
        <Button
          variant={filters.timeframe === "today" ? "default" : "outline"}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filters.timeframe === "today" ? "bg-primary text-white" : ""
          }`}
          onClick={() => handleTimeframeFilter("today")}
        >
          Today
        </Button>
        <Button
          variant={filters.timeframe === "thisWeekend" ? "default" : "outline"}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filters.timeframe === "thisWeekend" ? "bg-primary text-white" : ""
          }`}
          onClick={() => handleTimeframeFilter("thisWeekend")}
        >
          This Weekend
        </Button>
        <Button
          variant={filters.neighborhood === "Mission" ? "default" : "outline"}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filters.neighborhood === "Mission" ? "bg-primary text-white" : ""
          }`}
          onClick={() => handleNeighborhoodFilter(filters.neighborhood === "Mission" ? undefined : "Mission")}
        >
          <MapPin className="h-4 w-4 mr-1" /> Mission
        </Button>
        <Button
          variant={filters.neighborhood === "Castro" ? "default" : "outline"}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filters.neighborhood === "Castro" ? "bg-primary text-white" : ""
          }`}
          onClick={() => handleNeighborhoodFilter(filters.neighborhood === "Castro" ? undefined : "Castro")}
        >
          <MapPin className="h-4 w-4 mr-1" /> Castro
        </Button>
        <Button
          variant={filters.genre === "Rock" ? "default" : "outline"}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filters.genre === "Rock" ? "bg-primary text-white" : ""
          }`}
          onClick={() => handleGenreFilter(filters.genre === "Rock" ? undefined : "Rock")}
        >
          <Guitar className="h-4 w-4 mr-1" /> Rock
        </Button>
        <Button
          variant={filters.genre === "Jazz" ? "default" : "outline"}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filters.genre === "Jazz" ? "bg-primary text-white" : ""
          }`}
          onClick={() => handleGenreFilter(filters.genre === "Jazz" ? undefined : "Jazz")}
        >
          <Music className="h-4 w-4 mr-1" /> Jazz
        </Button>
      </div>
    </div>
  );
}
