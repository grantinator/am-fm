import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { eventFormSchema, EventFormData, neighborhoods, genres } from "@shared/schema";
import { useCreateEvent } from "@/hooks/use-events";
import { X, Upload, Image } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddShowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddShowModal({ isOpen, onClose }: AddShowModalProps) {
  const { toast } = useToast();
  const createEvent = useCreateEvent();
  
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      date: new Date(),
      startTime: "",
      endTime: "",
      venueName: "",
      venueAddress: "",
      neighborhood: "",
      description: "",
      genres: [],
      price: 0,
    },
    mode: "onChange", // Validate on change for immediate feedback
  });
  
  // Watch for genres changes in the form
  useEffect(() => {
    // Initialize the form with any selected genres
    if (selectedGenres.length > 0) {
      form.setValue("genres", selectedGenres);
    }
    
    // Setup a subscription to watch for genre changes
    const subscription = form.watch((value, { name }) => {
      // If the genres field changed in the form, update our local state
      if (name === "genres") {
        const formGenres = value.genres as string[] | undefined;
        if (formGenres && formGenres.length > 0 && JSON.stringify(formGenres) !== JSON.stringify(selectedGenres)) {
          setSelectedGenres(formGenres);
        }
      }
    });
    
    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, [form, selectedGenres]);
  
  const onSubmit = async (data: EventFormData) => {
    try {
      // Debug form validation
      console.log("Form submission data:", {
        ...data,
        date: data.date instanceof Date ? data.date.toISOString() : data.date,
        genres: data.genres || selectedGenres,
        image: data.image ? data.image.name : null
      });
      
      if (form.formState.errors) {
        console.error("Validation errors:", form.formState.errors);
      }
      
      // Check if genres are empty and manually set them if needed
      if (!data.genres || data.genres.length === 0) {
        if (selectedGenres.length > 0) {
          // If we have selected genres in state but not in form data, use those
          form.setValue("genres", selectedGenres);
          data.genres = selectedGenres;
        }
      }
      
      const formData = new FormData();
      
      // Add image if exists
      if (data.image) {
        formData.append("image", data.image);
      }
      
      // Ensure date is a proper Date object
      let dateObj = data.date;
      if (typeof dateObj === 'string') {
        dateObj = new Date(dateObj);
        // Validate date
        if (isNaN(dateObj.getTime())) {
          console.error("Invalid date:", dateObj);
          throw new Error("Invalid date format");
        }
      }
      
      console.log("Date before submission:", dateObj);
      
      // Prepare form data with properly formatted date
      const eventData = {
        ...data,
        date: dateObj,
        // Use the form's genres directly (they should be synced with selectedGenres)
        genres: data.genres,
      };
      
      // Add event data as JSON
      formData.append("eventData", JSON.stringify(eventData));
      
      // Submit the form
      await createEvent.mutateAsync(formData);
      
      toast({
        title: "Success!",
        description: "Your show has been posted",
      });
      
      // Close modal and reset form
      onClose();
      form.reset();
      setSelectedGenres([]);
      setImagePreview(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create show. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleGenreChange = (genre: string) => {
    // Check if this genre is already selected
    const isSelected = selectedGenres.includes(genre);
    
    // Update the selected genres array based on whether the genre was checked or unchecked
    const updatedGenres = isSelected
      ? selectedGenres.filter(g => g !== genre) // Remove genre if already selected
      : [...selectedGenres, genre];             // Add genre if not already selected
    
    // Update state and form
    setSelectedGenres(updatedGenres);
    form.setValue("genres", updatedGenres);
    
    // Force validation update
    form.trigger("genres");
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("image", file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ fontFamily: "var(--font-header)", color: "var(--primary-accent)" }}>Add a Local Show</DialogTitle>
          <DialogDescription style={{ color: "var(--text-color)", fontFamily: "var(--font-body)" }}>
            Share details about an upcoming local concert
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Show Name */}
          <div className="space-y-2">
            <Label htmlFor="title" style={{ color: "var(--primary-accent)", fontFamily: "var(--font-body)", fontWeight: 600 }}>Show Name/Title *</Label>
            <Input
              id="title"
              placeholder="e.g. The Midnight Drifters w/ Ghost Notes"
              {...form.register("title")}
              style={{ borderColor: "var(--subtle-accent)", background: "var(--secondary-bg)" }}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
            )}
          </div>
          
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                {...form.register("date", {
                  setValueAs: (value: string) => new Date(value),
                })}
              />
              {form.formState.errors.date && (
                <p className="text-sm text-red-500">{form.formState.errors.date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Time *</Label>
              <Input
                id="startTime"
                type="time"
                {...form.register("startTime")}
              />
              {form.formState.errors.startTime && (
                <p className="text-sm text-red-500">{form.formState.errors.startTime.message}</p>
              )}
            </div>
          </div>
          
          {/* Venue */}
          <div className="space-y-2">
            <Label htmlFor="venueName">Venue Name *</Label>
            <Input
              id="venueName"
              placeholder="e.g. Bottom of the Hill"
              {...form.register("venueName")}
            />
            {form.formState.errors.venueName && (
              <p className="text-sm text-red-500">{form.formState.errors.venueName.message}</p>
            )}
          </div>
          
          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="venueAddress">Address *</Label>
            <Input
              id="venueAddress"
              placeholder="e.g. 1233 17th Street, San Francisco, CA 94107"
              {...form.register("venueAddress")}
            />
            {form.formState.errors.venueAddress && (
              <p className="text-sm text-red-500">{form.formState.errors.venueAddress.message}</p>
            )}
          </div>
          
          {/* Neighborhood */}
          <div className="space-y-2">
            <Label htmlFor="neighborhood">Neighborhood</Label>
            <Select
              onValueChange={(value) => form.setValue("neighborhood", value)}
              defaultValue={form.getValues("neighborhood") || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select neighborhood" />
              </SelectTrigger>
              <SelectContent>
                {/* Convert readonly tuple to regular array to avoid runtime errors */}
                {Array.from(neighborhoods).map((neighborhood) => (
                  <SelectItem key={neighborhood} value={neighborhood}>
                    {neighborhood}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.neighborhood && (
              <p className="text-sm text-red-500">{form.formState.errors.neighborhood.message}</p>
            )}
          </div>
          
          {/* Event Type/Genre */}
          <div className="space-y-2">
            <Label>Music Type/Genre *</Label>
            <div className="grid grid-cols-3 gap-2">
              {Array.from(genres).map((genre) => (
                <div key={genre} className="flex items-center space-x-2">
                  <Checkbox
                    id={`genre-${genre}`}
                    checked={selectedGenres.includes(genre)}
                    onCheckedChange={() => handleGenreChange(genre)}
                  />
                  <label
                    htmlFor={`genre-${genre}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {genre}
                  </label>
                </div>
              ))}
            </div>
            {form.formState.errors.genres && (
              <p className="text-sm text-red-500">{form.formState.errors.genres.message}</p>
            )}
          </div>
          
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Event Photo/Poster *</Label>
            <div 
              className="border-2 border-dashed rounded-md px-6 py-8 text-center"
              style={{ 
                borderColor: "var(--subtle-accent)", 
                backgroundColor: "var(--secondary-bg)",
                cursor: "pointer"
              }}
              onClick={() => document.getElementById("event-image")?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mx-auto max-h-48 object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-0 right-0 rounded-full p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      form.setValue("image", undefined);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <Image className="mx-auto h-12 w-12" style={{ color: "var(--primary-accent)" }} />
                  </div>
                  <p className="text-sm mb-2" style={{ color: "var(--text-color)" }}>Drag and drop an image here, or click to browse</p>
                  <p className="text-xs" style={{ color: "var(--subtle-accent)" }}>Recommended size: 800x600px. Max file size: 5MB</p>
                </>
              )}
              <input
                type="file"
                id="event-image"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
              {!imagePreview && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  style={{
                    borderColor: "var(--primary-accent)",
                    color: "var(--primary-accent)",
                    backgroundColor: "var(--secondary-bg)",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById("event-image")?.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select Image
                </Button>
              )}
            </div>
            {form.formState.errors.image && (
              <p className="text-sm text-red-500">{form.formState.errors.image.message}</p>
            )}
          </div>
          
          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Ticket Price ($)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              placeholder="0 for free shows"
              {...form.register("price", {
                valueAsNumber: true,
              })}
            />
            {form.formState.errors.price && (
              <p className="text-sm text-red-500">{form.formState.errors.price.message}</p>
            )}
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell people about this show..."
              rows={4}
              {...form.register("description")}
            />
          </div>
          
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            style={{
              backgroundColor: "var(--primary-accent)",
              color: "var(--secondary-bg)",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
            disabled={createEvent.isPending}
          >
            {createEvent.isPending ? "Posting..." : "Post Show"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
