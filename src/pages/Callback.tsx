import React, { useEffect } from "react";
import { spotifyAuth } from "@/utils/spotify";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";

// Log sessionStorage immediately when the module is loaded
console.log("Callback.tsx: spotify_code_verifier in sessionStorage on module load:", sessionStorage.getItem('spotify_code_verifier'));

const Callback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const error = spotifyAuth.getErrorFromUrl();
      if (error) {
        console.error("Spotify authentication error:", error);
        toast.error(`Spotify login failed: ${error}. Please try again.`);
        navigate("/");
        return;
      }

      const code = spotifyAuth.getCodeFromUrl();
      
      if (code) {
        try {
          const tokenData = await spotifyAuth.exchangeCodeForToken(code);
          spotifyAuth.saveToken(tokenData);
          
          // Remove code from URL query parameters by replacing the current state
          window.history.replaceState({}, document.title, window.location.pathname);
          
          navigate("/dashboard");
          toast.success("Successfully logged in with Spotify!");
        } catch (exchangeError) {
          console.error("Authentication failed during token exchange:", exchangeError);
          toast.error("Authentication failed. Could not get access token. Please try again.");
          navigate("/");
        }
      } else {
        // This case should ideally not be reached if there was no error and no code.
        // It might indicate an unexpected redirect from Spotify.
        console.error("Authentication failed: No authorization code received and no error reported.");
        toast.error("Authentication failed. Please try again.");
        navigate("/");
      }
    };
    
    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 border-4 border-t-spotify rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-2xl font-semibold mb-2">Logging you in...</h1>
        <p className="text-muted-foreground">Please wait while we authenticate your Spotify account</p>
      </div>
    </div>
  );
};

export default Callback;
