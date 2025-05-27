import React, { useEffect, useState } from 'react';
import { spotifyApi } from '@/utils/spotify';
import { Button } from "@/components/ui/button";
import { Loader2, Music, AlertTriangle } from 'lucide-react'; // For loading and error states

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string, images: { url: string }[] };
  external_urls: { spotify: string };
  duration_ms: number;
}

interface PlaylistTrackItem {
  track: Track | null; // Track can be null if not available (e.g. removed by user)
}

interface PlaylistTracksProps {  playlistId: string;  playlistName: string;  addToVibeReference: (text: string) => void;}

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
};

const PlaylistTracks: React.FC<PlaylistTracksProps> = ({ playlistId, playlistName, addToVibeReference }) => {
  const [tracks, setTracks] = useState<PlaylistTrackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTracks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await spotifyApi.getPlaylistTracks(playlistId);
        setTracks(data.items || []);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred while fetching playlist tracks.');
        }
        console.error("Error fetching playlist tracks:", err);
      }
      setIsLoading(false);
    };

    if (playlistId) {
      fetchTracks();
    }
  }, [playlistId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-foreground/70">
        <Loader2 className="h-10 w-10 animate-spin mb-4" />
        <p>Loading tracks for {playlistName}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500">
        <AlertTriangle className="h-10 w-10 mb-4" />
        <p>Error loading tracks: {error}</p>
        <p className="text-sm text-foreground/50 mt-1">Please try again or select a different playlist.</p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return <p className="text-foreground/70">No tracks found in {playlistName}.</p>;
  }

  return (
    <div className="space-y-3">
      {tracks.map(({ track }, index) => {
        if (!track) return null; // Skip if track is null (e.g., deleted or unavailable)
        return (
          <div 
            key={track.id + index}
            className="relative group/item flex items-center justify-between p-4 bg-transparent backdrop-blur-sm border border-white/10 hover:border-white/20 hover:backdrop-blur-md rounded-xl transition-all duration-300"
          >
            <div className="flex items-center gap-4 flex-grow min-w-0">
              <span className="text-sm text-foreground/50 w-6 text-right">{index + 1}</span>
              {track.album.images[0]?.url ? (
                <img 
                  src={track.album.images[0].url} 
                  alt={track.album.name} 
                  className="w-12 h-12 rounded object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center">
                  <Music className="w-6 h-6 text-foreground/50" />
                </div>
              )}
              <div className="overflow-hidden flex-grow">
                <a 
                  href={track.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-medium text-foreground/90 hover:text-primary truncate block hover:underline"
                >
                  {track.name}
                </a>
                <p className="text-xs text-foreground/60 truncate">
                  {track.artists.map(a => a.name).join(', ')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 ml-4 flex-shrink-0">
              <p className="text-sm text-foreground/60 hidden md:block truncate w-48">
                {track.album.name}
              </p>
              <p className="text-sm text-foreground/60 w-12 text-right">
                {formatDuration(track.duration_ms)}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const trackInfo = `${track.name} by ${track.artists.map(a => a.name).join(", ")}`;
                  addToVibeReference(trackInfo);
                }}
                className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 backdrop-blur-sm bg-transparent hover:bg-transparent border border-white/30 hover:border-white/60 text-white/80 hover:text-white px-2 py-1 text-xs rounded-md"
              >
                Add to Vibe Reference
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlaylistTracks; 