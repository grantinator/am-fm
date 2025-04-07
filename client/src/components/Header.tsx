import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";
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
      <header className="header fixed w-full top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <Music className="text-primary text-2xl" />
              <h1 className="text-xl font-bold gradient-text">poopee</h1>
            </div>
          </Link>
          <Button
            onClick={openModal}
            className="bg-primary hover:bg-primary/90 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="hidden md:inline">Add Show</span>
          </Button>
        </div>
      </header>

      <AddShowModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}
