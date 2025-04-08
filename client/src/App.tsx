import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import Header from "@/components/Header";
import MobileNavigation from "@/components/MobileNavigation";
import Home from "@/pages/Home";
import EventDetail from "@/pages/EventDetail";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/events/:id" component={EventDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen bg-[#120017]">
        <Header />
        <main className="flex-grow container mx-auto px-4 pt-0 pb-20 md:pb-8">
          <Router />
        </main>
        <MobileNavigation />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
