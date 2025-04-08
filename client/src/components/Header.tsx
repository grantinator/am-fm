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
      <header className="relative w-full z-50 py-8">
        <div className="container mx-auto px-4 flex justify-between items-center" style={{ gap: '1rem' }}>
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              {/* Moon and star icons from the design, now grouped with text */}
              <span className="text-[#ffe89e] text-3xl">☾</span>
              <span className="text-[#ffe89e] text-xl">★</span>
              <h1 className="text-4xl font-bold" style={{ 
                fontFamily: 'Playfair Display, serif',
                color: '#ffe89e',
                letterSpacing: '0.03em',
                textTransform: 'lowercase'
              }}>poopee</h1>
            </div>
          </Link>
          <div className="flex justify-end">
            <Button
              onClick={openModal}
              className="add-show-btn"
              style={{
                padding: "0.5rem 1.25rem",
                backgroundColor: 'transparent',
                color: '#ffe89e',
                borderColor: '#ffe89e',
                fontFamily: 'Inter, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
                border: '1px solid #ffe89e',
                borderRadius: '0.25rem'
              }}
            >
              ADD SHOW
            </Button>
          </div>
        </div>

      </header>

      <AddShowModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}
