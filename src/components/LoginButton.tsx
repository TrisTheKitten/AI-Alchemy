import React from "react";
import { spotifyAuth } from "@/utils/spotify";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { LogIn } from 'lucide-react';

const LoginButton: React.FC = () => {
  const handleLogin = async () => {
    // Check if CLIENT_ID has been set
    // This check needs to be done before calling getAuthUrl or by checking CLIENT_ID from spotify.ts if it's exported
    // For now, we assume CLIENT_ID check is implicitly handled by getAuthUrl redirecting to Spotify or erroring out
    // A more direct check of import.meta.env.VITE_SPOTIFY_CLIENT_ID might be better here if needed.
    
    try {
      const authUrl = await spotifyAuth.getAuthUrl(); // Await the async call
      // The check for "YOUR_SPOTIFY_CLIENT_ID" in authUrl is less direct now.
      // It's better to check CLIENT_ID directly if it's configured.
      // If VITE_SPOTIFY_CLIENT_ID is not set, the authUrl will contain YOUR_SPOTIFY_CLIENT_ID
      // as a fallback from spotify.ts, so this check can still be useful.
      if (authUrl.includes("YOUR_SPOTIFY_CLIENT_ID")) { 
        toast.error("Spotify Client ID is not configured. Please set VITE_SPOTIFY_CLIENT_ID in .env file.");
        return;
      }
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error getting Spotify auth URL:", error);
      toast.error("Could not initiate Spotify login. Check console.");
    }
  };

  return (
    <Button 
      onClick={handleLogin}
      // Spotify's buttons are often bold and have a slight upward transform on hover/active.
      // Keeping the existing green, ensuring text is white and legible.
      className="bg-primary hover:bg-primary/85 text-primary-foreground px-8 py-3 text-base font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-primary"
    >
      <LogIn className="mr-2.5 h-5 w-5" />
      Login with Spotify
    </Button>
  );
};

export default LoginButton;
