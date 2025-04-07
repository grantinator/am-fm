import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchEvents } from "@/hooks/use-events";
import { Music } from "lucide-react";
import AddShowModal from "./AddShowModal";

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { query, setQuery } = useSearchEvents();

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <header className="bg-white shadow-md fixed w-full top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <Music className="text-primary text-2xl" />
              <h1 className="text-xl font-bold text-primary">SF Local Shows</h1>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <button 
              type="button" 
              className="md:hidden text-slate-600" 
              onClick={toggleSearch}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <div className="hidden md:block relative">
              <Input
                type="text"
                placeholder="Search shows..."
                className="pl-10 pr-4 py-2 rounded-full"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Button 
              onClick={openModal}
              className="bg-primary hover:bg-primary/90 text-white rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden md:inline">Add Show</span>
            </Button>
          </div>
        </div>
        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="px-4 py-2 bg-white border-t border-gray-200 md:hidden">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search shows..."
                className="w-full pl-10 pr-4 py-2 rounded-full"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}
      </header>

      <AddShowModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}
