import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [_, setLocation] = useLocation();

  const handleGoBack = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center">
      <Card className="card w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center mb-6">
            <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">404 Page Not Found</h1>
            <div className="h-1 w-24 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full my-4"></div>
            <p className="text-white/70">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button 
            onClick={handleGoBack}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Home className="h-4 w-4 mr-2" /> Back to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
