import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Music, PlusCircle } from "lucide-react";
import AddShowModal from "./AddShowModal";

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <header className="fixed w-full top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <Music className="h-7 w-7" style={{ color: 'var(--primary-accent)' }} />
              <h1 className="text-2xl font-bold" style={{ 
                fontFamily: 'var(--font-header)',
                color: 'var(--text-color)',
                letterSpacing: '-0.01em'
              }}>poopee</h1>
            </div>
          </Link>
          <Button
            onClick={openModal}
            className="add-show-btn rounded-full shadow-md"
            style={{
              padding: "0.5rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <PlusCircle className="h-5 w-5" />
            <span className="hidden md:inline">Add Show</span>
          </Button>
        </div>
      </header>

      <AddShowModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}
