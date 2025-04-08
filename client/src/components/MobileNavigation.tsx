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
        backgroundColor: "#120017",
        borderTop: "1px solid #ffe89e"
      }}>
        <div className="flex justify-around">
          <Link href="/">
            <button className="flex flex-col items-center py-3 px-4" style={{
              color: location === "/" ? "#ff6a00" : "#ffe89e",
              fontFamily: "Inter, sans-serif"
            }}>
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1">Home</span>
            </button>
          </Link>
          
          <button 
            onClick={openModal}
            className="flex flex-col items-center py-3 px-4 relative"
            style={{ color: "#ffe89e", fontFamily: "Inter, sans-serif" }}
          >
            <div className="absolute -top-5 border border-solid border-[#ffe89e] rounded-sm p-2" style={{
              backgroundColor: "transparent",
              color: "#ffe89e"
            }}>
              <PlusCircle className="h-5 w-5" />
            </div>
            <span className="text-xs mt-6">Add Show</span>
          </button>
          
          <Link href="/events/1">
            <button className="flex flex-col items-center py-3 px-4" style={{
              color: location.startsWith("/events/") ? "#ff6a00" : "#ffe89e",
              fontFamily: "Inter, sans-serif"
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
