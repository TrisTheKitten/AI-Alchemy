import React, { useEffect, useState } from "react";
import { spotifyApi } from "@/utils/spotify";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Trash2, ChevronDown, ChevronRight } from "lucide-react";

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  external_urls: { spotify: string };
}

interface Artist {
  id: string;
  name: string;
  images: { url: string }[];
  external_urls: { spotify: string };
}

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  external_urls: { spotify: string };
  owner: { display_name: string };
}

interface SpotifyUser {
  id: string;
  display_name: string;
  images: { url: string }[];
  external_urls: { spotify: string };
  followers: { total: number };
}

const INITIAL_VISIBLE_COUNT = 4;


const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const Sidebar: React.FC<{ 
  addToVibeReference: (text: string) => void;
  onPlaylistClick: (playlistId: string, playlistName: string) => void; 
}> = ({ addToVibeReference, onPlaylistClick }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [visibleTracksCount, setVisibleTracksCount] = useState(INITIAL_VISIBLE_COUNT);
  const [allTracksFetched, setAllTracksFetched] = useState(false);

  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [visibleArtistsCount, setVisibleArtistsCount] = useState(INITIAL_VISIBLE_COUNT);
  const [allArtistsFetched, setAllArtistsFetched] = useState(false);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [visiblePlaylistsCount, setVisiblePlaylistsCount] = useState(INITIAL_VISIBLE_COUNT);
  const [allPlaylistsFetched, setAllPlaylistsFetched] = useState(false);

  const [currentUser, setCurrentUser] = useState<SpotifyUser | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown states
  const [isTracksCollapsed, setIsTracksCollapsed] = useState(false);
  const [isArtistsCollapsed, setIsArtistsCollapsed] = useState(false);
  const [isPlaylistsCollapsed, setIsPlaylistsCollapsed] = useState(false);

  useEffect(() => {
    const fetchData = async (initialLoad = true) => {
      if (initialLoad) {
        setIsLoading(true);
        setError(null);
        setTopTracks([]);
        setVisibleTracksCount(INITIAL_VISIBLE_COUNT);
        setAllTracksFetched(false);
        setTopArtists([]);
        setVisibleArtistsCount(INITIAL_VISIBLE_COUNT);
        setAllArtistsFetched(false);
        setPlaylists([]);
        setVisiblePlaylistsCount(INITIAL_VISIBLE_COUNT);
        setAllPlaylistsFetched(false);
      }
      try {
        const tracksLimit = 20;
        const artistsLimit = 20;
        const playlistsLimit = 20;

        
        if (initialLoad || !currentUser) {
          const userData = await spotifyApi.getCurrentUser();
          setCurrentUser(userData);
        }

        await delay(300);

        if (!allTracksFetched || (initialLoad && topTracks.length === 0)) {
          const tracksData = await spotifyApi.getTopTracks(tracksLimit);
          const newTracks = tracksData.items || [];
          setTopTracks(newTracks);
          if (newTracks.length < tracksLimit) {
            setAllTracksFetched(true);
          }
        }

        await delay(1200); 

        if (!allArtistsFetched || (initialLoad && topArtists.length === 0)) {
          const artistsData = await spotifyApi.getTopArtists(artistsLimit);
          const newArtists = artistsData.items || [];
          setTopArtists(newArtists);
          if (newArtists.length < artistsLimit) {
            setAllArtistsFetched(true);
          }
        }

        await delay(1200); 

        if (!allPlaylistsFetched || (initialLoad && playlists.length === 0)) {
          const playlistsData = await spotifyApi.getUserPlaylists(playlistsLimit);
          const newPlaylists = playlistsData.items || [];
          setPlaylists(newPlaylists);
          if (newPlaylists.length < playlistsLimit) {
            setAllPlaylistsFetched(true);
          }
        }

      } catch (err) {
        if (err instanceof Error) {
          setError(err.message.includes("token expired") || err.message.includes("403") 
            ? "Please re-login to view your personalized data."
            : "Unable to load your content.");
        } else {
          setError("An unknown error occurred.");
        }
      }
      if (initialLoad) {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleTracksVisibility = () => {
    if (visibleTracksCount < topTracks.length) {
      setVisibleTracksCount(topTracks.length);
    } else {
      setVisibleTracksCount(INITIAL_VISIBLE_COUNT);
    }
  };

  const handleToggleArtistsVisibility = () => {
    if (visibleArtistsCount < topArtists.length) {
      setVisibleArtistsCount(topArtists.length);
    } else {
      setVisibleArtistsCount(INITIAL_VISIBLE_COUNT);
    }
  };

  const handleTogglePlaylistsVisibility = () => {
    if (visiblePlaylistsCount < playlists.length) {
      setVisiblePlaylistsCount(playlists.length);
    } else {
      setVisiblePlaylistsCount(INITIAL_VISIBLE_COUNT);
    }
  };

  const handleDeletePlaylist = async (playlistId: string, playlistName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${playlistName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await spotifyApi.deletePlaylist(playlistId);
      setPlaylists(prev => prev.filter(playlist => playlist.id !== playlistId));
      toast.success(`"${playlistName}" has been deleted successfully.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete playlist";
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`fixed top-28 z-30 p-3 rounded-full bg-gradient-to-br from-white/10 via-white/5 to-transparent hover:from-[#1DB954]/20 hover:via-[#1ED760]/15 hover:to-[#1DB954]/10 transition-all duration-500 backdrop-blur-xl border border-white/20 hover:border-[#1DB954]/50 shadow-2xl hover:shadow-[0_0_30px_rgba(29,185,84,0.3)] hover:scale-110 active:scale-95 group before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-[#1DB954]/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 ${isCollapsed ? 'left-2' : 'left-52'}`}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg 
          className={`w-5 h-5 text-white/80 transition-all duration-300 group-hover:text-[#1DB954] group-hover:drop-shadow-[0_0_8px_rgba(29,185,84,0.6)] relative z-10 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <aside className={`${isCollapsed ? 'w-16' : 'w-60'} glass-sidebar h-screen fixed top-0 left-0 pt-24 pb-10 overflow-y-auto transition-all duration-300`}>
        <div className={`px-6 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
        <div className="mt-10">
          <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent mb-8"></div>
          
          {}
          {currentUser && (
            <section className="mb-8">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[#1DB95410] via-[#1ED76010] to-[#1DB95410] border border-gradient-to-r border-[#1DB95420]">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 flex-shrink-0">
                  {currentUser.images && currentUser.images.length > 0 ? (
                    <img
                      src={currentUser.images[0].url}
                      alt={currentUser.display_name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1DB954] to-[#1ED760] flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {currentUser.display_name || 'Spotify User'}
                  </p>
                  <p className="text-xs text-white/60">
                    {currentUser.followers?.total ? `${currentUser.followers.total.toLocaleString()} followers` : 'Spotify Premium'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(currentUser.external_urls.spotify, '_blank')}
                  className="text-green-400 hover:text-green-300 hover:bg-green-400/10 p-2 h-8 w-8 shrink-0"
                  title="Open Spotify Profile"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.481.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </Button>
              </div>
            </section>
          )}
          
          <section className="mb-10">
            <button
              onClick={() => setIsTracksCollapsed(!isTracksCollapsed)}
              className="flex items-center gap-2 w-full text-left mb-4 hover:text-foreground/70 transition-colors"
            >
              <ChevronRight 
                className={`w-3 h-3 text-foreground/50 transition-transform duration-300 ${
                  isTracksCollapsed ? 'rotate-0' : 'rotate-90'
                }`} 
              />
              <h3 className="text-xs font-light uppercase text-foreground/50 tracking-wider">
                Top Tracks
              </h3>
            </button>

            <div 
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                isTracksCollapsed 
                  ? 'max-h-0 opacity-0' 
                  : 'max-h-[2000px] opacity-100'
              }`}
            >
              <div className="pb-2">
                {isLoading && topTracks.length === 0 ? (
                  <div className="space-y-3">
                    {[...Array(INITIAL_VISIBLE_COUNT)].map((_, i) => (
                      <div key={i} className="h-[46px] bg-white/5 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : error ? (
                  <p className="text-foreground/40 text-xs">{error}</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {topTracks.slice(0, visibleTracksCount).map((track) => (
                        <div key={track.id} className="relative group/item">
                          <a
                            href={track.external_urls.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 transition-all duration-300 p-1 rounded-md hover:bg-white/10"
                          >
                            <div className="w-10 h-10 overflow-hidden rounded bg-white/5 flex-shrink-0">
                              {track.album.images[0]?.url && (
                                <img
                                  src={track.album.images[0]?.url}
                                  alt={track.name}
                                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                              )}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm text-foreground/80 font-light group-hover:text-foreground truncate">
                                {track.name}
                              </p>
                              <p className="text-xs text-foreground/50 truncate">
                                {track.artists.map(a => a.name).join(", ")}
                              </p>
                            </div>
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const trackInfo = `${track.name} by ${track.artists.map(a => a.name).join(", ")}`;
                              addToVibeReference(trackInfo);
                            }}
                            className="absolute top-1/2 right-1 transform -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-all duration-300 backdrop-blur-sm bg-transparent hover:bg-transparent border border-white/30 hover:border-white/60 text-white/80 hover:text-white px-2 py-1 text-xs rounded-md"
                          >
                            Add to Vibe Reference
                          </Button>
                        </div>
                      ))}
                    </div>
                    {topTracks.length > INITIAL_VISIBLE_COUNT && (
                      <Button
                        variant="link"
                        onClick={handleToggleTracksVisibility}
                        className="text-xs text-foreground/60 hover:text-foreground mt-2 pl-0"
                      >
                        {visibleTracksCount < topTracks.length ? 
                          (allTracksFetched ? `See all ${topTracks.length} tracks` : "See more") : 
                          "See less"}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="mb-10">
            <button
              onClick={() => setIsArtistsCollapsed(!isArtistsCollapsed)}
              className="flex items-center gap-2 w-full text-left mb-4 hover:text-foreground/70 transition-colors"
            >
              <ChevronRight 
                className={`w-3 h-3 text-foreground/50 transition-transform duration-300 ${
                  isArtistsCollapsed ? 'rotate-0' : 'rotate-90'
                }`} 
              />
              <h3 className="text-xs font-light uppercase text-foreground/50 tracking-wider">
                Top Artists
              </h3>
            </button>
            
            <div 
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                isArtistsCollapsed 
                  ? 'max-h-0 opacity-0' 
                  : 'max-h-[2000px] opacity-100'
              }`}
            >
              <div className="pb-2">
                {isLoading && topArtists.length === 0 ? (
                  <div className="space-y-3">
                    {[...Array(INITIAL_VISIBLE_COUNT)].map((_, i) => (
                      <div key={i} className="h-[38px] bg-white/5 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : error ? (
                  <p className="text-foreground/40 text-xs">{error}</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {topArtists.slice(0, visibleArtistsCount).map((artist) => (
                        <div key={artist.id} className="relative group/item">
                          <a
                            href={artist.external_urls.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 transition-all duration-300 p-1 rounded-md hover:bg-white/10"
                          >
                            <div className="w-8 h-8 overflow-hidden rounded-full bg-white/5 flex-shrink-0">
                              {artist.images[0]?.url && (
                                <img
                                  src={artist.images[0]?.url}
                                  alt={artist.name}
                                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                              )}
                            </div>
                            <p className="text-sm text-foreground/80 font-light group-hover:text-foreground truncate">
                              {artist.name}
                            </p>
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToVibeReference(artist.name);
                            }}
                            className="absolute top-1/2 right-1 transform -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-all duration-300 backdrop-blur-sm bg-transparent hover:bg-transparent border border-white/30 hover:border-white/60 text-white/80 hover:text-white px-2 py-1 text-xs rounded-md"
                          >
                            Add to Vibe Reference
                          </Button>
                        </div>
                      ))}
                    </div>
                    {topArtists.length > INITIAL_VISIBLE_COUNT && (
                      <Button
                        variant="link"
                        onClick={handleToggleArtistsVisibility}
                        className="text-xs text-foreground/60 hover:text-foreground mt-2 pl-0"
                      >
                        {visibleArtistsCount < topArtists.length ? 
                          (allArtistsFetched ? `See all ${topArtists.length} artists` : "See more") : 
                          "See less"}
                      </Button>
                    )}
                  </>
                )}
                             </div>
             </div>
           </section>

          <section>
            <button
              onClick={() => setIsPlaylistsCollapsed(!isPlaylistsCollapsed)}
              className="flex items-center gap-2 w-full text-left mb-4 hover:text-foreground/70 transition-colors"
            >
              <ChevronRight 
                className={`w-3 h-3 text-foreground/50 transition-transform duration-300 ${
                  isPlaylistsCollapsed ? 'rotate-0' : 'rotate-90'
                }`} 
              />
              <h3 className="text-xs font-light uppercase text-foreground/50 tracking-wider">
                Your Playlists
              </h3>
            </button>
            
            <div 
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                isPlaylistsCollapsed 
                  ? 'max-h-0 opacity-0' 
                  : 'max-h-[2000px] opacity-100'
              }`}
            >
              <div className="pb-2">
                {isLoading && playlists.length === 0 ? (
                  <div className="space-y-3">
                    {[...Array(INITIAL_VISIBLE_COUNT)].map((_, i) => (
                      <div key={i} className="h-[46px] bg-white/5 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : error ? (
                  <p className="text-foreground/40 text-xs">{error}</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {playlists.slice(0, visiblePlaylistsCount).map((playlist) => (
                        <div key={playlist.id} className="relative group/item">
                          <button
                            onClick={() => onPlaylistClick(playlist.id, playlist.name)}
                            className="group w-full flex items-center gap-3 transition-all duration-300 p-1 rounded-md hover:bg-white/10 text-left"
                          >
                            <div className="w-10 h-10 overflow-hidden rounded bg-white/5 flex-shrink-0">
                              {playlist.images && playlist.images.length > 0 && playlist.images[0]?.url ? (
                                <img
                                  src={playlist.images[0]?.url}
                                  alt={playlist.name}
                                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                              ) : (
                                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm text-foreground/80 font-light group-hover:text-foreground truncate">
                                {playlist.name}
                              </p>
                              <p className="text-xs text-foreground/50 truncate">
                                By {playlist.owner.display_name}
                              </p>
                            </div>
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeletePlaylist(playlist.id, playlist.name, e)}
                            className="absolute top-1/2 right-1 transform -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-all duration-300 backdrop-blur-sm bg-transparent hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 p-2 h-8 w-8 rounded-md"
                            title="Delete playlist"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {playlists.length > INITIAL_VISIBLE_COUNT && (
                      <Button
                        variant="link"
                        onClick={handleTogglePlaylistsVisibility}
                        className="text-xs text-foreground/60 hover:text-foreground mt-2 pl-0"
                      >
                        {visiblePlaylistsCount < playlists.length ? 
                          (allPlaylistsFetched ? `See all ${playlists.length} playlists` : "See more") : 
                          "See less"}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar; 