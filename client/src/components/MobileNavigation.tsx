import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Music, PlusCircle } from "lucide-react";
import AddShowModal from "./AddShowModal";

export default function MobileNavigation() {
  const [location] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 header border-t border-purple-900/30 md:hidden z-40">
        <div className="flex justify-around">
          <Link href="/">
            <button className={`flex flex-col items-center py-3 px-4 ${location === "/" ? "text-primary" : "text-white/70"}`}>
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1">Home</span>
            </button>
          </Link>
          
          <button 
            onClick={openModal}
            className="flex flex-col items-center py-3 px-4 text-primary relative"
          >
            <div className="absolute -top-5 bg-primary text-white rounded-full p-2">
              <PlusCircle className="h-5 w-5" />
            </div>
            <span className="text-xs mt-6">Add Show</span>
          </button>
          
          <Link href="/events/1">
            <button className={`flex flex-col items-center py-3 px-4 ${location.startsWith("/events/") ? "text-primary" : "text-white/70"}`}>
              <Music className="h-5 w-5" />
              <span className="text-xs mt-1">Featured</span>
            </button>
          </Link>
        </div>
      </nav>
      
      <AddShowModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}
