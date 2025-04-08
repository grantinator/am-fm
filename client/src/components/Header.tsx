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
      <header className="fixed w-full top-0 z-50" style={{ 
        backgroundColor: "var(--primary-accent)",
        borderBottom: "2px solid var(--subtle-accent)"
      }}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <Music className="h-6 w-6" style={{ color: 'var(--secondary-bg)' }} />
              <h1 className="text-xl font-bold" style={{ 
                fontFamily: 'var(--font-header)',
                color: 'var(--secondary-bg)',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>poopee</h1>
            </div>
          </Link>
          <Button
            onClick={openModal}
            className="rounded-full"
            style={{
              backgroundColor: "var(--secondary-bg)",
              color: "var(--primary-accent)",
              border: "none",
              fontFamily: "var(--font-body)",
              fontWeight: 600
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Add Show</span>
          </Button>
        </div>
      </header>

      <AddShowModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}
