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
      <nav className="fixed bottom-0 left-0 right-0 mobile-nav md:hidden z-40" style={{
        backgroundColor: "var(--primary-accent)",
        borderTop: "2px solid var(--subtle-accent)"
      }}>
        <div className="flex justify-around">
          <Link href="/">
            <button className="flex flex-col items-center py-3 px-4" style={{
              color: location === "/" ? "var(--secondary-bg)" : "var(--secondary-bg, #FFFDF5)",
              opacity: location === "/" ? 1 : 0.7,
              fontFamily: "var(--font-body)"
            }}>
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1">Home</span>
            </button>
          </Link>
          
          <button 
            onClick={openModal}
            className="flex flex-col items-center py-3 px-4 relative"
            style={{ color: "var(--secondary-bg)", fontFamily: "var(--font-body)" }}
          >
            <div className="absolute -top-5 rounded-full p-2" style={{
              backgroundColor: "var(--subtle-accent)",
              color: "var(--text-color)"
            }}>
              <PlusCircle className="h-5 w-5" />
            </div>
            <span className="text-xs mt-6">Add Show</span>
          </button>
          
          <Link href="/events/1">
            <button className="flex flex-col items-center py-3 px-4" style={{
              color: location.startsWith("/events/") ? "var(--secondary-bg)" : "var(--secondary-bg, #FFFDF5)",
              opacity: location.startsWith("/events/") ? 1 : 0.7,
              fontFamily: "var(--font-body)"
            }}>
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
