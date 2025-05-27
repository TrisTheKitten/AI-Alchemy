import React, { useState, useEffect, useCallback } from "react";
import { spotifyAuth, spotifyApi } from "@/utils/spotify";
import { useNavigate } from "react-router-dom";
import PlaylistGenerator from "@/components/PlaylistGenerator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import { toast } from "@/components/ui/sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlaylistTracks from "@/components/PlaylistTracks";

interface SpotifyUser {
  id: string;
  display_name: string;
  email?: string;
  images?: { url: string; height: number | null; width: number | null }[];
}

interface SelectedPlaylist {
  id: string;
  name: string;
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState<string>("");
  const [vibeReferenceText, setVibeReferenceText] = useState<string>("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<SelectedPlaylist | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    const token = spotifyAuth.getToken();
    
    if (!token) {
      navigate("/");
      setLoading(false);
      return;
    }
    
    try {
      const userData = await spotifyApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Error fetching user in Dashboard:", error);
      let errorMessage = "Authentication failed. Please login again.";
      if (error instanceof Error) {
        if (error.message.includes("403")) {
          errorMessage = "Spotify permission issue. Please re-login.";
        } else if (error.message.includes("token expired")) {
          errorMessage = "Your session has expired. Please login again.";
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
      spotifyAuth.clearToken();
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = () => {
    spotifyAuth.clearToken();
    setUser(null);
    toast.info("You have been logged out.");
    navigate("/");
  };

  const handleAddToPrompt = (text: string) => {
    setPrompt(prev => prev ? `${prev}, ${text}` : text);
    toast.info(`Added "${text}" to prompt!`);
  };

  const handleAddToVibeReference = (text: string) => {
    setVibeReferenceText(prev => prev ? `${prev}, ${text}` : text);
    toast.info(`Added "${text}" as vibe reference!`);
  };

  const handlePlaylistClick = (playlistId: string, playlistName: string) => {
    setSelectedPlaylist({ id: playlistId, name: playlistName });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Loading your experience...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header isLoggedIn={!!user} onLogout={handleLogout} />
      <div className="flex flex-1 pt-16">
        <Sidebar addToVibeReference={handleAddToVibeReference} onPlaylistClick={handlePlaylistClick} />
        <main className="flex-1 overflow-y-auto pl-16 md:pl-60 transition-all duration-300 [.sidebar-collapsed_&]:pl-16">
          <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-full">
            {user && !selectedPlaylist && (
              <div className="mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Welcome, <span className="text-primary">{user.display_name}</span>!
                </h1>
                <p className="text-muted-foreground mt-2 text-base">
                  Discover and create unique playlists tailored to your taste.
                </p>
              </div>
            )}
            
            {selectedPlaylist ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold">{selectedPlaylist.name}</h2>
                  <Button onClick={() => setSelectedPlaylist(null)} variant="outline" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Generator
                  </Button>
                </div>
                <div className="mb-6">
                  <Button
                    onClick={() => window.open(`https://open.spotify.com/playlist/${selectedPlaylist.id}`, '_blank')}
                    variant="link"
                    className="text-[#1DB954] hover:text-[#1ed760] font-medium p-0 h-auto underline-offset-4 hover:underline flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.481.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Listen on Spotify
                  </Button>
                </div>
                <PlaylistTracks 
                  playlistId={selectedPlaylist.id} 
                  playlistName={selectedPlaylist.name} 
                  addToVibeReference={handleAddToVibeReference} 
                />
              </div>
            ) : (
              <PlaylistGenerator 
                promptText={prompt} 
                onPromptChange={setPrompt} 
                vibeReferenceText={vibeReferenceText} 
                onVibeReferenceChange={setVibeReferenceText} 
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
