import { Link, useLocation } from "wouter";
import { Home, Compass, Heart, User } from "lucide-react";

export default function MobileNavigation() {
  const [location] = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
      <div className="flex justify-around">
        <Link href="/">
          <button className={`flex flex-col items-center py-2 px-4 ${location === "/" ? "text-primary" : "text-slate-500"}`}>
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Discover</span>
          </button>
        </Link>
        <button className="flex flex-col items-center py-2 px-4 text-slate-500">
          <Compass className="h-5 w-5" />
          <span className="text-xs mt-1">Near Me</span>
        </button>
        <button className="flex flex-col items-center py-2 px-4 text-slate-500">
          <Heart className="h-5 w-5" />
          <span className="text-xs mt-1">Saved</span>
        </button>
        <button className="flex flex-col items-center py-2 px-4 text-slate-500">
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </nav>
  );
}
