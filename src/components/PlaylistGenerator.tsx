import React, { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { spotifyApi, spotifyAuth } from "@/utils/spotify";
import { generatePlaylistSuggestions, generatePodcastSuggestions } from "@/utils/openai";
import { Progress } from "@/components/ui/progress";
import { Info, Loader2, Music, RotateCcw, Save, Send, Sparkles, Pencil, ChevronDown, X, Share2, Check, Mic, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlaylistSettings {
  playlistSize: number;
}

interface Track {
  id: string;
  name: string;
  artists: string[];
  album: string;
  albumArt: string;
  uri: string;
}

interface Podcast {
  id: string;
  name: string;
  description: string;
  publisher: string;
  images: { url: string }[];
  uri: string;
}

interface PodcastEpisode {
  id: string;
  name: string;
  description: string;
  release_date: string;
  duration_ms: number;
  uri: string;
  images: { url: string }[];
}

interface OpenAISuggestedTrack {
  trackName: string;
  artistName: string;
}

interface SpotifyImage {
  url: string;
  height?: number;
  width?: number;
}

interface SpotifyAlbumSimple {
  name: string;
  images: SpotifyImage[];
}

interface SpotifyArtistSimple {
  name: string;
  id?: string;
}

interface SpotifyTrackFull {
  id: string;
  name: string;
  artists: SpotifyArtistSimple[];
  album: SpotifyAlbumSimple;
  uri: string;
  popularity?: number;
  type: 'track';
}

interface ArtistSearchResult {
  id: string;
  name: string;
  type: 'artist';
  uri: string;
  images?: SpotifyImage[];
}


interface PlaylistGeneratorProps {
  promptText: string;
  onPromptChange: (value: string) => void;
  vibeReferenceText: string;
  onVibeReferenceChange: (value: string) => void;
}

const PlaylistGenerator: React.FC<PlaylistGeneratorProps> = ({ promptText, onPromptChange, vibeReferenceText, onVibeReferenceChange }) => {
  const [activeTab, setActiveTab] = useState("music");
  const [settings, setSettings] = useState<PlaylistSettings>({
    playlistSize: 10,
  });
  const [generatedTracks, setGeneratedTracks] = useState<Track[]>([]);
  const [generatedPodcasts, setGeneratedPodcasts] = useState<Podcast[]>([]);
  const [playlistTitle, setPlaylistTitle] = useState("My AI Playlist");
  const [playlistDescription, setPlaylistDescription] = useState("Created with SongAlchemy");
  const [podcastPrompt, setPodcastPrompt] = useState("");
  const [podcastPlaylistSize, setPodcastPlaylistSize] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const TOTAL_STEPS = 2;

  const [openAIKey, setOpenAIKey] = useState(
    localStorage.getItem("openai_api_key") || ""
  );
  const [geminiAPIKey, setGeminiAPIKey] = useState(
    localStorage.getItem("gemini_api_key") || ""
  );
  const [selectedModel, setSelectedModel] = useState(
    localStorage.getItem("selected_ai_model") || "openai"
  );
  const [isPlaylistSaved, setIsPlaylistSaved] = useState(false);
  const [savedPlaylistId, setSavedPlaylistId] = useState<string | null>(null);
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  
  const [vibeSearchQuery, setVibeSearchQuery] = useState("");
  const [vibeSearchResults, setVibeSearchResults] = useState<(SpotifyTrackFull | ArtistSearchResult)[]>([]);
  const [isVibeSearching, setIsVibeSearching] = useState(false);
  const [showVibeResultsDropdown, setShowVibeResultsDropdown] = useState(false);
  const vibeSearchInputRef = useRef<HTMLDivElement>(null);

  
  const [acousticElectronicValue, setAcousticElectronicValue] = useState(50);
  const [mellowEnergeticValue, setMellowEnergeticValue] = useState(50);
  const [sadHappyValue, setSadHappyValue] = useState(50);
  const [chillDanceableValue, setChillDanceableValue] = useState(50);
  const [obscurePopularValue, setObscurePopularValue] = useState(50);
  const [advancedSettingsEnabled, setAdvancedSettingsEnabled] = useState(true);

  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [dialogPlaylistTitle, setDialogPlaylistTitle] = useState("");
  const [dialogPlaylistDescription, setDialogPlaylistDescription] = useState("");
  
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Podcast episodes modal state
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [podcastEpisodes, setPodcastEpisodes] = useState<PodcastEpisode[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [showEpisodesModal, setShowEpisodesModal] = useState(false);

  
  const promptSuggestions = [
    "High-energy electronic music for coding sessions...",
    "Acoustic chill vibes for a rainy afternoon...",
    "90s hip-hop anthems for a throwback party...",
    "Epic orchestral scores for intense focus...",
    "Upbeat indie pop for a summer road trip..."
  ];
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const suggestionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (openAIKey) {
      localStorage.setItem("openai_api_key", openAIKey);
    } else {
      localStorage.removeItem("openai_api_key");
    }
  }, [openAIKey]);

  useEffect(() => {
    if (geminiAPIKey) {
      localStorage.setItem("gemini_api_key", geminiAPIKey);
    } else {
      localStorage.removeItem("gemini_api_key");
    }
  }, [geminiAPIKey]);

  useEffect(() => {
    localStorage.setItem("selected_ai_model", selectedModel);
  }, [selectedModel]);



  useEffect(() => {
    
    if (!promptText) {
      suggestionIntervalRef.current = setInterval(() => {
        setCurrentSuggestionIndex(prevIndex => (prevIndex + 1) % promptSuggestions.length);
      }, 3000); 
    } else {
      
      if (suggestionIntervalRef.current) {
        clearInterval(suggestionIntervalRef.current);
        suggestionIntervalRef.current = null;
      }
      
      
    }

    return () => {
      if (suggestionIntervalRef.current) {
        clearInterval(suggestionIntervalRef.current);
      }
    };
  }, [promptText, promptSuggestions.length]); 

  
  useEffect(() => {
    if (!vibeSearchQuery.trim()) {
      setVibeSearchResults([]);
      if (document.activeElement !== vibeSearchInputRef.current?.querySelector('input#vibeSearch')) {
         setShowVibeResultsDropdown(false);
      } else if (!vibeSearchQuery) {
         setVibeSearchResults([]);
      }
      return;
    }

    const handleSearch = async () => {
      setIsVibeSearching(true);
      if (!showVibeResultsDropdown) setShowVibeResultsDropdown(true);
      try {
        const combinedResults: (SpotifyTrackFull | ArtistSearchResult)[] = [];

        
        const trackResults = await spotifyApi.searchTracks(vibeSearchQuery, 3); 
        if (trackResults && trackResults.length > 0) {
          const tracksWithType = trackResults.map(track => ({ ...track, type: 'track' as const }));
          combinedResults.push(...tracksWithType);
        }

        
        const artistResults = await spotifyApi.searchArtists(vibeSearchQuery, 2); 
        if (artistResults && artistResults.length > 0) {
          const artistsWithType = artistResults.map(artist => ({
            id: artist.id,
            name: artist.name,
            type: 'artist' as const,
            uri: artist.uri,
            images: artist.images,
          } as ArtistSearchResult));
          combinedResults.push(...artistsWithType);
        }
        
        setVibeSearchResults(combinedResults);
      } catch (error) {
        console.error("Error searching Spotify:", error);
        toast.error("Failed to search Spotify. Check API key and console.");
        setVibeSearchResults([]);
      }
      setIsVibeSearching(false);
    };

    const debounceTimeout = setTimeout(() => {
      handleSearch();
    }, 500); 

    return () => clearTimeout(debounceTimeout);
  }, [vibeSearchQuery, showVibeResultsDropdown]); 


  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vibeSearchInputRef.current && !vibeSearchInputRef.current.contains(event.target as Node)) {
        setShowVibeResultsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSettingChange = (key: keyof PlaylistSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleVibeResultSelect = (item: SpotifyTrackFull | ArtistSearchResult) => {
    let referenceText = "";
    if (item.type === "track") {
      const track = item as SpotifyTrackFull;
      referenceText = `${track.name} by ${track.artists.map(a => a.name).join(", ")}`;
    } else if (item.type === "artist") {
      const artist = item as ArtistSearchResult;
      referenceText = `${artist.name} (Artist)`;
    }
    onVibeReferenceChange(referenceText);
    setVibeSearchQuery(""); 
    setVibeSearchResults([]);
    setShowVibeResultsDropdown(false);
  };

  const resetAdvancedSettings = () => {
    setAcousticElectronicValue(50);
    setMellowEnergeticValue(50);
    setSadHappyValue(50);
    setChillDanceableValue(50);
    setObscurePopularValue(50);
    toast.info("Advanced settings reset to balanced defaults");
  };

  const generatePlaylist = async () => {
    if (!promptText.trim() && !vibeReferenceText.trim()) {
      toast.warning("Please enter a playlist vibe or add a vibe reference.");
      return;
    }
    if (!openAIKey.trim() && selectedModel === "openai") {
      toast.error("OpenAI API Key is missing. Please add it in Settings.");
      return;
    }
    if (!geminiAPIKey.trim() && selectedModel === "gemini") {
      toast.error("Gemini API Key is missing. Please add it in Settings.");
      return;
    }

    
    const advancedSettings = advancedSettingsEnabled ? {
      acoustic: acousticElectronicValue / 100, 
      energetic: mellowEnergeticValue / 100,
      happy: sadHappyValue / 100,
      danceable: chillDanceableValue / 100,
      popular: obscurePopularValue / 100,
    } : undefined;

    setIsGenerating(true);
    setCurrentStep(0);
    setGeneratedTracks([]);
    setIsPlaylistSaved(false);
    setSavedPlaylistId(null);
    toast("Crafting your playlist...", { icon: <Loader2 className="animate-spin text-primary" /> });
    try {
      setCurrentStep(1);
      const currentApiKey = selectedModel === 'openai' ? openAIKey : geminiAPIKey;
      const suggestions = await generatePlaylistSuggestions(
        currentApiKey, 
        selectedModel, 
        promptText, 
        settings.playlistSize, 
        vibeReferenceText,
        advancedSettings 
      );
      setPlaylistTitle(suggestions.playlist_title || "AI Generated Playlist");
      setPlaylistDescription(suggestions.description || "Created with SongAlchemy");
      toast.success("Track ideas ready! Finding them on Spotify...");
      setCurrentStep(2);
      const trackPromises = suggestions.suggested_tracks
        .map(async (suggestedTrack: OpenAISuggestedTrack) => {
          try {
            const searchQuery = `${suggestedTrack.trackName} ${suggestedTrack.artistName}`;
            const searchResults: SpotifyTrackFull[] = await spotifyApi.searchTracks(searchQuery, 1);
            if (searchResults.length > 0) {
              const spotifyTrack = searchResults[0];
              return {
                id: spotifyTrack.id,
                name: spotifyTrack.name,
                artists: spotifyTrack.artists.map((artist) => artist.name),
                album: spotifyTrack.album.name,
                albumArt: spotifyTrack.album.images[0]?.url || "",
                uri: spotifyTrack.uri,
              };
            } else { return null; }
          } catch (searchError) { return null; }
        });
      const spotifyFetchedTracks = (await Promise.all(trackPromises)).filter(Boolean) as Track[];
      // De-duplicate tracks by ID
      const uniqueSpotifyFetchedTracks = Array.from(new Map(spotifyFetchedTracks.map(t => [t.id, t])).values());
      const finalTracks = uniqueSpotifyFetchedTracks.slice(0, settings.playlistSize);
      setGeneratedTracks(finalTracks);
      if (finalTracks.length === 0) {
        toast.error("No tracks found on Spotify. Try a different prompt?");
      } else {
        toast.success(`Found ${finalTracks.length} tracks! Playlist ready below.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate playlist.";
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const savePlaylist = async () => {
    if (generatedTracks.length === 0) { return; }
    setIsLoadingSave(true);
    try {
      const user = await spotifyApi.getCurrentUser();
      const playlist = await spotifyApi.createPlaylist(user.id, playlistTitle, playlistDescription);
      await spotifyApi.addTracksToPlaylist(playlist.id, generatedTracks.map((track) => track.uri));
      toast.success("Playlist saved to your Spotify!", { icon: <Save className="text-primary"/> });
      setIsPlaylistSaved(true);
      setSavedPlaylistId(playlist.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save playlist.";
      toast.error(errorMessage);
    } finally {
      setIsLoadingSave(false);
    }
  };

  const listenOnSpotify = () => savedPlaylistId && window.open(`https://open.spotify.com/playlist/${savedPlaylistId}`, '_blank');

  const resetGenerator = () => {
    onPromptChange("");
    onVibeReferenceChange("");
    setGeneratedTracks([]); setPlaylistTitle("My AI Playlist");
    setPlaylistDescription("Created with SongAlchemy"); setIsPlaylistSaved(false);
    setSavedPlaylistId(null); setIsGenerating(false); setCurrentStep(0);
    toast.info("Generator reset.");
  };

  const handleOpenEditDialog = () => {
    setDialogPlaylistTitle(playlistTitle);
    setDialogPlaylistDescription(playlistDescription);
    setIsEditDialogOpen(true);
  };

  const handleSavePlaylistDetails = () => {
    setPlaylistTitle(dialogPlaylistTitle);
    setPlaylistDescription(dialogPlaylistDescription);
    setIsEditDialogOpen(false);
    toast.success("Playlist details updated!");
  };

  const sharePlaylist = async () => {
    if (generatedTracks.length === 0) {
      toast.error("No playlist to share. Generate a playlist first!");
      return;
    }

    setIsSharing(true);
    
    try {
      let playlistIdToShare = savedPlaylistId;
      
      
      if (!isPlaylistSaved || !savedPlaylistId) {
        toast.info("Saving playlist to Spotify first...");
        
        const user = await spotifyApi.getCurrentUser();
        const playlist = await spotifyApi.createPlaylist(user.id, playlistTitle, playlistDescription);
        await spotifyApi.addTracksToPlaylist(playlist.id, generatedTracks.map((track) => track.uri));
        
        setIsPlaylistSaved(true);
        setSavedPlaylistId(playlist.id);
        playlistIdToShare = playlist.id;
        
        toast.success("Playlist saved to Spotify!");
      }
      
      
      const spotifyShareUrl = `https://open.spotify.com/playlist/${playlistIdToShare}`;
      
      await navigator.clipboard.writeText(spotifyShareUrl);
      
      setShareSuccess(true);
      toast.success("Spotify playlist link copied to clipboard!");
      
      setTimeout(() => {
        setShareSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error("Failed to share playlist:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create shareable link. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSharing(false);
    }
  };

  const surpriseMe = async () => {
    if (!openAIKey.trim() && selectedModel === "openai") {
      toast.error("OpenAI API Key is missing. Please add it in Settings.");
      return;
    }
    if (!geminiAPIKey.trim() && selectedModel === "gemini") {
      toast.error("Gemini API Key is missing. Please add it in Settings.");
      return;
    }

    const randomPrompts = [
      "Discover eclectic indie folk tracks with haunting vocals and intricate guitar work",
      "Unearth forgotten gems of 80s synth-pop with dreamy melodies and nostalgic vibes",
      "Find hidden treasures of modern jazz fusion with complex rhythms and improvisation",
      "Explore underground electronic beats with experimental soundscapes and ambient textures",
      "Curate rare soul and R&B tracks with powerful vocals and groovy basslines",
      "Seek out obscure post-rock instrumentals with cinematic builds and emotional crescendos",
      "Discover unique world music blends with traditional instruments and modern production",
      "Find lesser-known alternative rock anthems with raw energy and poetic lyrics",
      "Explore experimental hip-hop with innovative production and thought-provoking verses",
      "Uncover hidden psychedelic rock gems with mind-bending effects and cosmic themes",
      "Discover avant-garde classical crossover pieces with unconventional arrangements",
      "Find underground punk revival tracks with fierce energy and rebellious spirit",
      "Explore niche ambient techno with deep bass and hypnotic rhythms",
      "Seek out rare blues revival artists with authentic storytelling and soulful guitar",
      "Discover modern baroque pop with intricate orchestration and elegant melodies"
    ];

    const genres = [
      "alternative rock", "indie pop", "electronic", "jazz", "blues", "folk", "ambient", 
      "post-rock", "psychedelic", "world music", "experimental", "neo-soul", "art pop",
      "shoegaze", "dream pop", "krautrock", "downtempo", "trip-hop", "new wave"
    ];

    const moods = [
      "melancholic", "euphoric", "contemplative", "energetic", "mysterious", "nostalgic",
      "ethereal", "intense", "playful", "haunting", "uplifting", "introspective", "dreamy",
      "fierce", "serene", "dramatic", "whimsical", "brooding", "ecstatic", "meditative"
    ];

    const timeStamp = Date.now();
    const randomIndex = (timeStamp + Math.floor(Math.random() * 1000)) % randomPrompts.length;
    const randomGenre = genres[Math.floor(Math.random() * genres.length)];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    
    const surprisePrompt = `${randomPrompts[randomIndex]} with a ${randomMood} ${randomGenre} vibe. Focus exclusively on songs with vocals - no instrumentals, podcasts, or spoken word content. Timestamp: ${timeStamp}`;

    onVibeReferenceChange("");

    setIsGenerating(true);
    setCurrentStep(0);
    setGeneratedTracks([]);
    setIsPlaylistSaved(false);
    setSavedPlaylistId(null);
    toast("🎲 Rolling the dice for your surprise playlist...", { icon: <Sparkles className="animate-spin text-primary" /> });

    try {
      setCurrentStep(1);
      const currentApiKey = selectedModel === 'openai' ? openAIKey : geminiAPIKey;
      const suggestions = await generatePlaylistSuggestions(
        currentApiKey,
        selectedModel,
        surprisePrompt,
        settings.playlistSize,
        "",
        advancedSettingsEnabled ? {
          acoustic: Math.random(),
          energetic: Math.random(),
          happy: Math.random(),
          danceable: Math.random(),
          popular: Math.random() * 0.7
        } : undefined
      );

      setPlaylistTitle(suggestions.playlist_title || "Surprise AI Playlist");
      setPlaylistDescription(suggestions.description || "A surprising musical journey crafted by AI");
      toast.success("🎉 Surprise tracks ready! Finding them on Spotify...");
      
      setCurrentStep(2);
      const trackPromises = suggestions.suggested_tracks
        .map(async (suggestedTrack: OpenAISuggestedTrack) => {
          try {
            const searchQuery = `${suggestedTrack.trackName} ${suggestedTrack.artistName}`;
            const searchResults: SpotifyTrackFull[] = await spotifyApi.searchTracks(searchQuery, 1);
            if (searchResults.length > 0) {
              const spotifyTrack = searchResults[0];
              return {
                id: spotifyTrack.id,
                name: spotifyTrack.name,
                artists: spotifyTrack.artists.map((artist) => artist.name),
                album: spotifyTrack.album.name,
                albumArt: spotifyTrack.album.images[0]?.url || "",
                uri: spotifyTrack.uri,
              };
            } else { return null; }
          } catch (searchError) { return null; }
        });

      const spotifyFetchedTracks = (await Promise.all(trackPromises)).filter(Boolean) as Track[];
      // De-duplicate tracks by ID
      const uniqueSpotifyFetchedTracks = Array.from(new Map(spotifyFetchedTracks.map(t => [t.id, t])).values());
      const finalTracks = uniqueSpotifyFetchedTracks.slice(0, settings.playlistSize);
      setGeneratedTracks(finalTracks);

      if (finalTracks.length === 0) {
        toast.error("No tracks found on Spotify. Let's try another surprise!");
      } else {
        toast.success(`🎊 Surprise! Found ${finalTracks.length} amazing tracks for you!`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate surprise playlist.";
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePodcastPlaylist = async () => {
    if (!podcastPrompt.trim()) {
      toast.error("Please describe your podcast interests");
      return;
    }

    // Check for Spotify token first
    const spotifyToken = spotifyAuth.getToken();
    if (!spotifyToken) {
      toast.error("Please log in to Spotify to search for podcasts.");
      // Optionally, you could trigger the Spotify login flow here
      // e.g., window.location.href = await spotifyAuth.getAuthUrl();
      return;
    }

    const apiKey = selectedModel === 'openai' ? openAIKey : geminiAPIKey;
    if (!apiKey) {
      toast.error(`Please enter your ${selectedModel === 'openai' ? 'OpenAI' : 'Gemini'} API key`);
      return;
    }

    setIsGenerating(true);
    setCurrentStep(0);
    setGeneratedPodcasts([]);

    try {
      setCurrentStep(1);
      const suggestions = await generatePodcastSuggestions(
        apiKey,
        selectedModel,
        podcastPrompt,
        podcastPlaylistSize
      );

      setPlaylistTitle(suggestions.playlist_title);
      setPlaylistDescription(suggestions.description);

      setCurrentStep(2);
      const foundPodcasts: Podcast[] = [];

      for (const suggestion of suggestions.suggested_podcasts) {
        try {
          const searchResults = await spotifyApi.searchPodcasts(suggestion.podcastName, 1);
          if (searchResults.length > 0) {
            const podcast = searchResults[0];
            foundPodcasts.push({
              id: podcast.id,
              name: podcast.name,
              description: podcast.description || suggestion.description,
              publisher: podcast.publisher,
              images: podcast.images || [],
              uri: podcast.uri
            });
          }
        } catch (error) {
          console.error(`Error searching for podcast "${suggestion.podcastName}":`, error);
        }
      }

      // De-duplicate podcasts by ID
      const uniquePodcasts = Array.from(new Map(foundPodcasts.map(p => [p.id, p])).values());
      setGeneratedPodcasts(uniquePodcasts);
      
      if (uniquePodcasts.length === 0) {
        toast.error("No podcasts found on Spotify. Try different interests or check your Spotify connection.");
      } else {
        toast.success(`Found ${uniquePodcasts.length} podcasts for your interests!`);
      }

    } catch (error) {
      console.error("Error generating podcast playlist:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate podcast playlist");
    } finally {
      setIsGenerating(false);
      setCurrentStep(0);
    }
  };

  const resetPodcastGenerator = () => {
    setPodcastPrompt("");
    setGeneratedPodcasts([]);
    setPlaylistTitle("My AI Playlist");
    setPlaylistDescription("Created with SongAlchemy");
  };

  const handlePodcastClick = async (podcast: Podcast) => {
    setSelectedPodcast(podcast);
    setShowEpisodesModal(true);
    setIsLoadingEpisodes(true);
    
    try {
      const showId = podcast.uri.split(':').pop();
      if (showId) {
        const episodes = await spotifyApi.getPodcastEpisodes(showId, 20);
        setPodcastEpisodes(episodes);
      }
    } catch (error) {
      console.error("Error fetching episodes:", error);
      toast.error("Failed to load episodes");
    } finally {
      setIsLoadingEpisodes(false);
    }
  };

  
  const commonCardClasses = "border backdrop-blur-sm bg-transparent transition-all duration-300 shadow-none border-gradient-to-r from-[#1DB95450] via-[#1ED76050] to-[#1DB95450] hover:from-[#1DB95480] hover:via-[#1ED76080] hover:to-[#1DB95480]";
  const commonInputClasses = "bg-transparent border-gradient-to-r from-[#1DB95440] via-[#1ED76040] to-[#1DB95440] focus:from-[#1DB95470] focus:via-[#1ED76070] focus:to-[#1DB95470] focus:ring-1 focus:ring-[#1ED76050] placeholder:text-white/50 text-white";

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-black/20 backdrop-blur-md border border-white/10">
          <TabsTrigger 
            value="music" 
            className="flex items-center gap-2 data-[state=active]:bg-[#1DB954]/20 data-[state=active]:text-white text-white/60"
          >
            <Music className="h-4 w-4" />
            Music Playlists
          </TabsTrigger>
          <TabsTrigger 
            value="podcast" 
            className="flex items-center gap-2 data-[state=active]:bg-[#1DB954]/20 data-[state=active]:text-white text-white/60"
          >
            <Mic className="h-4 w-4" />
            Podcast Playlists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="music" className="space-y-8">
          <Card className={`shadow-xl relative ${commonCardClasses}`}>
            <CardHeader className="pb-6 border-b border-gradient-to-r from-[#1DB95420] via-[#1ED76020] to-[#1DB95420]">
              <CardTitle className="text-2xl font-bold text-white/90 flex items-center">
                Create a New Music Playlist
              </CardTitle>
              <CardDescription className="text-white/60 pt-1">
                Describe the vibe, and let AI curate a music playlist for you on Spotify.
              </CardDescription>
            </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-1.5">
            <Label htmlFor="prompt" className="text-sm font-medium text-white/70">Your Playlist Vibe</Label>
            <Textarea
              id="prompt"
              value={promptText}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder={promptSuggestions[currentSuggestionIndex]}
              className="min-h-[100px] w-full rounded-lg border-2 px-4 py-3 text-sm ring-offset-background transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-transparent backdrop-blur-xl border-gradient-to-r from-[#1DB954]/30 via-[#1ED760]/20 to-[#1DB954]/30 hover:from-[#1DB954]/40 hover:via-[#1ED760]/30 hover:to-[#1DB954]/40 focus:from-[#1DB954]/60 focus:via-[#1ED760]/50 focus:to-[#1DB954]/60 focus:border-[#1ED760]/70 focus:ring-[#1ED760]/30 focus:shadow-lg focus:shadow-[#1DB954]/20 placeholder:text-white/40 text-white/90 resize-none overflow-hidden hover:shadow-md hover:shadow-[#1DB954]/10 selection:bg-[#1DB954]/30"
              disabled={isGenerating}
            />
          </div>
          <div className="space-y-1.5 relative" ref={vibeSearchInputRef}>
            <Label htmlFor="vibeSearch" className="text-sm font-medium text-white/70">
              Vibe Reference (Search Song/Artist)
            </Label>
            {vibeReferenceText && (
              <div className="flex items-center justify-between p-2 mt-1 rounded-md bg-black/30 backdrop-blur-md border border-white/10 text-white/80 text-sm">
                <span className="truncate pr-2">{vibeReferenceText}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto text-white/60 hover:text-white flex-shrink-0"
                  onClick={() => {
                    onVibeReferenceChange(""); 
                    setVibeSearchQuery(""); 
                    setShowVibeResultsDropdown(false);
                  }}
                  aria-label="Clear vibe reference"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Input
              id="vibeSearch"
              type="text"
              value={vibeSearchQuery}
              onChange={(e) => setVibeSearchQuery(e.target.value)}
              onFocus={() => setShowVibeResultsDropdown(true)}
              placeholder="Search Spotify for a song or artist..."
              className={`flex w-full mt-1 rounded-md border bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/50 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gradient-to-r from-[#1DB95440] via-[#1ED76040] to-[#1DB95440] focus:from-[#1DB95470] focus:via-[#1ED76070] focus:to-[#1DB95470] focus:ring-1 focus:ring-[#1ED76050]`}
              disabled={isGenerating}
              autoComplete="off"
            />
            {showVibeResultsDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-black/30 backdrop-blur-md border border-white/10 rounded-md shadow-lg max-h-60 overflow-y-auto vibe-results-dropdown">
                {isVibeSearching && (
                  <div className="p-3 text-sm text-center text-white/70 flex items-center justify-center">
                    <Loader2 className="inline w-4 h-4 mr-2 animate-spin" /> Searching...
                  </div>
                )}
                {!isVibeSearching && vibeSearchResults.length === 0 && vibeSearchQuery.trim() && (
                  <p className="p-3 text-sm text-center text-white/70">No results found for "{vibeSearchQuery}".</p>
                )}
                {!isVibeSearching && vibeSearchResults.length === 0 && !vibeSearchQuery.trim() && (
                  <p className="p-3 text-sm text-center text-white/60">Start typing to search for songs or artists.</p>
                )}
                {!isVibeSearching && vibeSearchResults.map((item) => (
                  <div
                    key={item.uri || item.id} 
                    className="p-3 hover:bg-white/20 cursor-pointer text-white/90"
                    onClick={() => handleVibeResultSelect(item)}
                    role="option"
                    aria-selected="false"
                  >
                    {item.type === "track" ? (
                      <>
                        <div className="font-medium text-sm truncate">{(item as SpotifyTrackFull).name}</div>
                        <div className="text-xs text-white/60 truncate">
                          {(item as SpotifyTrackFull).artists.map(a => a.name).join(", ")}
                          { (item as SpotifyTrackFull).album && (item as SpotifyTrackFull).album.name && ` - Album: ${(item as SpotifyTrackFull).album.name}` }
                        </div>
                      </>
                    ) : (
                      <div className="font-medium text-sm truncate">
                        {(item as ArtistSearchResult).name}
                        <span className="text-xs text-white/60"> (Artist)</span>
                        { (item as ArtistSearchResult).images && (item as ArtistSearchResult).images?.[0]?.url && 
                          <img src={(item as ArtistSearchResult).images[0].url} alt={(item as ArtistSearchResult).name} className="w-6 h-6 rounded-full inline-block ml-2"/>
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-white/50 flex items-center pt-1">
              <Info className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              Search or use suggestions from 'Top Tracks/Artists' for your vibe reference.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="playlistSize" className="text-sm font-medium text-white/70">Playlist Length: {settings.playlistSize} songs</Label>
            <Slider
              id="playlistSize"
              min={5}
              max={50}
              step={1}
              value={[settings.playlistSize]}
              onValueChange={(value) => handleSettingChange("playlistSize", value[0])}
              className="[&>span:first-child]:h-1.5 [&>span:first-child]:bg-gradient-to-r [&>span:first-child]:from-[#1DB95420] [&>span:first-child]:via-[#1ED76020] [&>span:first-child]:to-[#1DB95420] [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-[#1DB954] [&>span:first-child>span]:via-[#1ED760] [&>span:first-child>span]:to-[#1DB954]"
              disabled={isGenerating}
            />
          </div>

          {}
          <Accordion type="single" collapsible className="w-full mb-6">
            <AccordionItem value="advanced-settings">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                <div className="flex items-center">
                  
                  Advanced Settings
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={advancedSettingsEnabled}
                      onCheckedChange={setAdvancedSettingsEnabled}
                      className="data-[state=checked]:bg-[#1DB954] data-[state=unchecked]:bg-white/20"
                    />
                    <Label className="text-sm text-white/70">
                      Enable Advanced Settings
                    </Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAdvancedSettings}
                    disabled={!advancedSettingsEnabled}
                    className="h-8 px-3 text-xs bg-transparent border-white/20 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </div>
                <div className={advancedSettingsEnabled ? "space-y-6" : "space-y-6 opacity-50 pointer-events-none"}>
                  <div>
                    <div className="flex justify-between text-xs text-white/60 mb-2">
                      <span>Acoustic</span>
                      <span>Electronic</span>
                    </div>
                  <Slider
                    defaultValue={[acousticElectronicValue]}
                    onValueChange={(value) => setAcousticElectronicValue(value[0])}
                    max={100}
                    step={1}
                    className="[&>span:first-child]:h-2 [&>span:first-child]:bg-gradient-to-r [&>span:first-child]:from-[#1DB95420] [&>span:first-child]:via-[#1ED76020] [&>span:first-child]:to-[#1DB95420] [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-[#1DB954] [&>span:first-child>span]:via-[#1ED760] [&>span:first-child>span]:to-[#1DB954] [&_[role=slider]]:border-2 [&_[role=slider]]:border-[#1DB954] [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-[#1DB954] [&_[role=slider]]:to-[#1ED760] [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-[#1DB954]/30"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-white/60 mb-2">
                    <span>Mellow</span>
                    <span>Energetic</span>
                  </div>
                  <Slider
                    defaultValue={[mellowEnergeticValue]}
                    onValueChange={(value) => setMellowEnergeticValue(value[0])}
                    max={100}
                    step={1}
                    className="[&>span:first-child]:h-2 [&>span:first-child]:bg-gradient-to-r [&>span:first-child]:from-[#1DB95420] [&>span:first-child]:via-[#1ED76020] [&>span:first-child]:to-[#1DB95420] [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-[#1DB954] [&>span:first-child>span]:via-[#1ED760] [&>span:first-child>span]:to-[#1DB954] [&_[role=slider]]:border-2 [&_[role=slider]]:border-[#1DB954] [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-[#1DB954] [&_[role=slider]]:to-[#1ED760] [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-[#1DB954]/30"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-white/60 mb-2">
                    <span>Sad</span>
                    <span>Happy</span>
                  </div>
                  <Slider
                    defaultValue={[sadHappyValue]}
                    onValueChange={(value) => setSadHappyValue(value[0])}
                    max={100}
                    step={1}
                    className="[&>span:first-child]:h-2 [&>span:first-child]:bg-gradient-to-r [&>span:first-child]:from-[#1DB95420] [&>span:first-child]:via-[#1ED76020] [&>span:first-child]:to-[#1DB95420] [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-[#1DB954] [&>span:first-child>span]:via-[#1ED760] [&>span:first-child>span]:to-[#1DB954] [&_[role=slider]]:border-2 [&_[role=slider]]:border-[#1DB954] [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-[#1DB954] [&_[role=slider]]:to-[#1ED760] [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-[#1DB954]/30"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-white/60 mb-2">
                    <span>Chill</span>
                    <span>Danceable</span>
                  </div>
                  <Slider
                    defaultValue={[chillDanceableValue]}
                    onValueChange={(value) => setChillDanceableValue(value[0])}
                    max={100}
                    step={1}
                    className="[&>span:first-child]:h-2 [&>span:first-child]:bg-gradient-to-r [&>span:first-child]:from-[#1DB95420] [&>span:first-child]:via-[#1ED76020] [&>span:first-child]:to-[#1DB95420] [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-[#1DB954] [&>span:first-child>span]:via-[#1ED760] [&>span:first-child>span]:to-[#1DB954] [&_[role=slider]]:border-2 [&_[role=slider]]:border-[#1DB954] [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-[#1DB954] [&_[role=slider]]:to-[#1ED760] [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-[#1DB954]/30"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-white/60 mb-2">
                    <span>Obscure</span>
                    <span>Popular</span>
                  </div>
                  <Slider
                    defaultValue={[obscurePopularValue]}
                    onValueChange={(value) => setObscurePopularValue(value[0])}
                    max={100}
                    step={1}
                    className="[&>span:first-child]:h-2 [&>span:first-child]:bg-gradient-to-r [&>span:first-child]:from-[#1DB95420] [&>span:first-child]:via-[#1ED76020] [&>span:first-child]:to-[#1DB95420] [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-[#1DB954] [&>span:first-child>span]:via-[#1ED760] [&>span:first-child>span]:to-[#1DB954] [&_[role=slider]]:border-2 [&_[role=slider]]:border-[#1DB954] [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-[#1DB954] [&_[role=slider]]:to-[#1ED760] [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-[#1DB954]/30"
                  />
                </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mb-6">
            <Label className="text-sm font-medium text-white/70 mb-3 block">Select AI Model</Label>
            <RadioGroup value={selectedModel} onValueChange={setSelectedModel} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ease-in-out group hover:scale-[1.02] ${selectedModel === 'openai' ? 'border-[#1DB954]/60 bg-[#1DB954]/10 shadow-lg shadow-[#1DB954]/20' : 'border-white/20 hover:border-[#1DB954]/40 hover:bg-[#1DB954]/5'}`}>
                <RadioGroupItem value="openai" id="openai-model" className="sr-only" />
                <Label htmlFor="openai-model" className="cursor-pointer w-full h-full flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white/90 text-sm">OpenAI</span>
                    <div className={`w-4 h-4 rounded-full border-2 transition-all ${selectedModel === 'openai' ? 'border-[#1DB954] bg-[#1DB954]' : 'border-white/40'}`}>
                      {selectedModel === 'openai' && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                    </div>
                  </div>
                  <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">GPT-4.1 mini</span>
                </Label>
              </div>
              <div className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ease-in-out group hover:scale-[1.02] ${selectedModel === 'gemini' ? 'border-[#1DB954]/60 bg-[#1DB954]/10 shadow-lg shadow-[#1DB954]/20' : 'border-white/20 hover:border-[#1DB954]/40 hover:bg-[#1DB954]/5'}`}>
                <RadioGroupItem value="gemini" id="gemini-model" className="sr-only" />
                <Label htmlFor="gemini-model" className="cursor-pointer w-full h-full flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white/90 text-sm">Gemini</span>
                    <div className={`w-4 h-4 rounded-full border-2 transition-all ${selectedModel === 'gemini' ? 'border-[#1DB954] bg-[#1DB954]' : 'border-white/40'}`}>
                      {selectedModel === 'gemini' && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                    </div>
                  </div>
                  <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">Gemini 2.5 Flash</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {selectedModel === 'openai' && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="openaiKey" className="text-sm font-medium text-white/70">OpenAI API Key</Label>
                <p className="text-xs text-white/50 flex items-center pt-1">
                  <Info className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                  Your key is stored only in your browser's local storage.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  id="openaiKey"
                  type="password"
                  value={openAIKey}
                  onChange={(e) => setOpenAIKey(e.target.value)}
                  placeholder="Enter your OpenAI API key (sk-...)"
                  className={commonInputClasses}
                />
              </div>
            </div>
          )}

          {selectedModel === 'gemini' && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="geminiKey" className="text-sm font-medium text-white/70">Gemini API Key</Label>
                <p className="text-xs text-white/50 flex items-center pt-1">
                  <Info className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                  Your key is stored only in your browser's local storage.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  id="geminiKey"
                  type="password"
                  value={geminiAPIKey}
                  onChange={(e) => setGeminiAPIKey(e.target.value)}
                  placeholder="Enter your Google GenAI API key"
                  className={commonInputClasses}
                />
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="space-y-2">
              <Progress 
                value={(currentStep / TOTAL_STEPS) * 100} 
                variant="spotify"
                size="md"
                showPercentage={true}
              />
              <p className="text-xs text-center text-muted-foreground">
                {currentStep === 0 && "Analyzing your request..."}
                {currentStep === 1 && "Searching for tracks..."}
                {currentStep === 2 && "Finalizing your playlist..."}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-5 border-t border-gradient-to-r from-[#1DB95420] via-[#1ED76020] to-[#1DB95420]">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button 
              onClick={generatePlaylist} 
              disabled={isGenerating}
              size="lg"
              className="group relative w-full sm:w-auto bg-gradient-to-r from-[#1DB954] via-[#1ED760] to-[#1DB954] hover:from-[#1ED760] hover:via-[#1DB954] hover:to-[#1ED760] text-white font-semibold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#1DB954]/40 border-0 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              <div className="relative z-10 flex items-center">
                {isGenerating ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-5 w-5 opacity-90 group-hover:animate-pulse transition-all duration-300" />
                )}
                <span className="tracking-wide">Generate Playlist</span>
              </div>
            </Button>
            <Button 
              onClick={surpriseMe} 
              disabled={isGenerating}
              size="lg"
              className="group relative w-full sm:w-auto bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#8B5CF6] hover:from-[#A855F7] hover:via-[#8B5CF6] hover:to-[#A855F7] text-white font-semibold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#8B5CF6]/40 border-0 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              <div className="relative z-10 flex items-center">
                {isGenerating ? (
                  <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-5 w-5 opacity-90 group-hover:animate-pulse transition-all duration-300" />
                )}
                <span className="tracking-wide">Surprise Me</span>
              </div>
            </Button>
          </div>
          {(generatedTracks.length > 0 || promptText) && (
             <Button 
              variant="outline"
              size="lg"
              onClick={resetGenerator} 
              disabled={isGenerating}
              className="w-full sm:w-auto bg-transparent hover:bg-transparent border border-gradient-to-r from-[#1DB95430] via-[#1ED76030] to-[#1DB95430] hover:from-[#1DB95460] hover:via-[#1ED76060] hover:to-[#1DB95460] text-white/70 hover:text-white/90 transition-all duration-300"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </CardFooter>
      </Card>

      {generatedTracks.length > 0 && (
        <Card className={`shadow-lg ${commonCardClasses}`}>
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-semibold tracking-tight text-white">
                {playlistTitle}
              </CardTitle>
              <CardDescription className="text-white/70 mt-1">
                {playlistDescription}
              </CardDescription>
            </div>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleOpenEditDialog} className="text-white/70 hover:text-white">
                  <Pencil className="h-5 w-5" />
                  <span className="sr-only">Edit Playlist Details</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-700 text-white">
                <DialogHeader>
                  <DialogTitle>Edit Playlist Details</DialogTitle>
                  <DialogDescription className="text-neutral-400">
                    Make changes to your playlist name and description here. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="playlistNameDialog" className="text-right text-neutral-300">
                      Name
                    </Label>
                    <Input
                      id="playlistNameDialog"
                      value={dialogPlaylistTitle}
                      onChange={(e) => setDialogPlaylistTitle(e.target.value)}
                      className={`col-span-3 ${commonInputClasses}`}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="playlistDescriptionDialog" className="text-right text-neutral-300">
                      Description
                    </Label>
                    <Textarea
                      id="playlistDescriptionDialog"
                      value={dialogPlaylistDescription}
                      onChange={(e) => setDialogPlaylistDescription(e.target.value)}
                      className={`col-span-3 min-h-[100px] ${commonInputClasses}`}
                      placeholder="Tell us a little about your playlist..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                     <Button type="button" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 hover:text-white">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="button" onClick={handleSavePlaylistDetails} className="bg-green-600 hover:bg-green-700 text-white">
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedTracks.map((track, index) => (
                <div key={`${track.id}-${index}`} className="flex items-center space-x-4 p-4 rounded-xl backdrop-blur-lg bg-transparent hover:backdrop-blur-xl border border-white/5 hover:border-white/15 transition-all duration-300 ease-in-out group shadow-lg hover:shadow-2xl hover:shadow-[#1DB954]/20">
                  <img 
                    src={track.albumArt || "https://via.placeholder.com/40x40?text=♪"}
                    alt={track.name} 
                    className="w-10 h-10 rounded object-cover border border-white/30 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 group-hover:text-white truncate" title={track.name}>{track.name}</p>
                    <p className="text-xs text-white/50 group-hover:text-white/70 truncate" title={track.artists.join(", ")}>{track.artists.join(", ")}</p>
                  </div>
                  <p className="text-xs text-white/50 hidden md:block truncate w-1/4" title={track.album}>{track.album}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`https://open.spotify.com/track/${track.id}`, '_blank')}
                    className="text-green-400 hover:text-green-300 hover:bg-green-400/10 p-2 h-8 w-8 shrink-0"
                    title="View on Spotify"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.481.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center pt-6">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button 
                onClick={isPlaylistSaved ? listenOnSpotify : savePlaylist}
                disabled={isLoadingSave}
                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingSave ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : isPlaylistSaved ? 'Listen on Spotify' : 'Save to Spotify'}
              </Button>
              <Button 
                onClick={sharePlaylist}
                disabled={isSharing}
                variant="outline"
                className="w-full sm:w-auto bg-transparent hover:bg-white/10 border-white/20 hover:border-white/40 text-white/80 hover:text-white transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/20 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sharing...
                  </>
                ) : shareSuccess ? (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" /> Share Playlist
                  </>
                )}
              </Button>
            </div>
            {isPlaylistSaved && savedPlaylistId && (
              <a
                href={`https://open.spotify.com/playlist/${savedPlaylistId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 sm:mt-0 text-sm text-green-400 hover:text-green-300 underline"
              >
                View your playlist on Spotify
              </a>
            )}
          </CardFooter>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="podcast" className="space-y-8">
          <Card className={`shadow-xl relative ${commonCardClasses}`}>
            <CardHeader className="pb-6 border-b border-gradient-to-r from-[#1DB95420] via-[#1ED76020] to-[#1DB95420]">
              <CardTitle className="text-2xl font-bold text-white/90 flex items-center">
                Create a New Podcast Playlist
              </CardTitle>
              <CardDescription className="text-white/60 pt-1">
                Describe your interests, and let AI curate a podcast playlist for you on Spotify.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-1.5">
                <Label htmlFor="podcastPrompt" className="text-sm font-medium text-white/70">Your Podcast Interests</Label>
                <Textarea
                  id="podcastPrompt"
                  value={podcastPrompt}
                  onChange={(e) => setPodcastPrompt(e.target.value)}
                  placeholder="e.g., True crime stories, tech interviews, comedy shows, business insights, science discussions..."
                  className="min-h-[100px] w-full rounded-lg border-2 px-4 py-3 text-sm ring-offset-background transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-transparent backdrop-blur-xl border-gradient-to-r from-[#1DB954]/30 via-[#1ED760]/20 to-[#1DB954]/30 hover:from-[#1DB954]/40 hover:via-[#1ED760]/30 hover:to-[#1DB954]/40 focus:from-[#1DB954]/60 focus:via-[#1ED760]/50 focus:to-[#1DB954]/60 focus:border-[#1ED760]/70 focus:ring-[#1ED760]/30 focus:shadow-lg focus:shadow-[#1DB954]/20 placeholder:text-white/40 text-white/90 resize-none overflow-hidden hover:shadow-md hover:shadow-[#1DB954]/10 selection:bg-[#1DB954]/30"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="podcastLength" className="text-sm font-medium text-white/70">Playlist Length: {podcastPlaylistSize} podcasts</Label>
                <Slider
                  id="podcastLength"
                  min={1}
                  max={30}
                  step={1}
                  value={[podcastPlaylistSize]}
                  onValueChange={(value) => setPodcastPlaylistSize(value[0])}
                  className="[&>span:first-child]:h-1.5 [&>span:first-child]:bg-gradient-to-r [&>span:first-child]:from-[#1DB95420] [&>span:first-child]:via-[#1ED76020] [&>span:first-child]:to-[#1DB95420] [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-[#1DB954] [&>span:first-child>span]:via-[#1ED760] [&>span:first-child>span]:to-[#1DB954]"
                />
              </div>

              <div className="mb-6">
                <Label className="text-sm font-medium text-white/70 mb-3 block">Select AI Model</Label>
                <RadioGroup value={selectedModel} onValueChange={setSelectedModel} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ease-in-out group hover:scale-[1.02] ${selectedModel === 'openai' ? 'border-[#1DB954]/60 bg-[#1DB954]/10 shadow-lg shadow-[#1DB954]/20' : 'border-white/20 hover:border-[#1DB954]/40 hover:bg-[#1DB954]/5'}`}>
                    <RadioGroupItem value="openai" id="openai-model-podcast" className="sr-only" />
                    <Label htmlFor="openai-model-podcast" className="cursor-pointer w-full h-full flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white/90 text-sm">OpenAI</span>
                        <div className={`w-4 h-4 rounded-full border-2 transition-all ${selectedModel === 'openai' ? 'border-[#1DB954] bg-[#1DB954]' : 'border-white/40'}`}>
                          {selectedModel === 'openai' && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                        </div>
                      </div>
                      <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">GPT-4.1 mini</span>
                    </Label>
                  </div>
                  <div className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ease-in-out group hover:scale-[1.02] ${selectedModel === 'gemini' ? 'border-[#1DB954]/60 bg-[#1DB954]/10 shadow-lg shadow-[#1DB954]/20' : 'border-white/20 hover:border-[#1DB954]/40 hover:bg-[#1DB954]/5'}`}>
                    <RadioGroupItem value="gemini" id="gemini-model-podcast" className="sr-only" />
                    <Label htmlFor="gemini-model-podcast" className="cursor-pointer w-full h-full flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white/90 text-sm">Gemini</span>
                        <div className={`w-4 h-4 rounded-full border-2 transition-all ${selectedModel === 'gemini' ? 'border-[#1DB954] bg-[#1DB954]' : 'border-white/40'}`}>
                          {selectedModel === 'gemini' && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                        </div>
                      </div>
                      <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">Gemini 2.5 Flash</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {selectedModel === 'openai' && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="openaiKeyPodcast" className="text-sm font-medium text-white/70">OpenAI API Key</Label>
                    <p className="text-xs text-white/50 flex items-center pt-1">
                      <Info className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      Your key is stored only in your browser's local storage.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="openaiKeyPodcast"
                      type="password"
                      value={openAIKey}
                      onChange={(e) => setOpenAIKey(e.target.value)}
                      placeholder="Enter your OpenAI API key (sk-...)"
                      className={commonInputClasses}
                    />
                  </div>
                </div>
              )}

              {selectedModel === 'gemini' && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="geminiKeyPodcast" className="text-sm font-medium text-white/70">Gemini API Key</Label>
                    <p className="text-xs text-white/50 flex items-center pt-1">
                      <Info className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      Your key is stored only in your browser's local storage.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="geminiKeyPodcast"
                      type="password"
                      value={geminiAPIKey}
                      onChange={(e) => setGeminiAPIKey(e.target.value)}
                      placeholder="Enter your Google GenAI API key"
                      className={commonInputClasses}
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-5 border-t border-gradient-to-r from-[#1DB95420] via-[#1ED76020] to-[#1DB95420]">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button 
                  onClick={generatePodcastPlaylist}
                  disabled={isGenerating}
                  size="lg"
                  className="group relative w-full sm:w-auto bg-gradient-to-r from-[#1DB954] via-[#1ED760] to-[#1DB954] hover:from-[#1ED760] hover:via-[#1DB954] hover:to-[#1ED760] text-white font-semibold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#1DB954]/40 border-0 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                  <div className="relative z-10 flex items-center">
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Mic className="mr-2 h-5 w-5 opacity-90 group-hover:animate-pulse transition-all duration-300" />
                    )}
                    <span className="tracking-wide">
                      {isGenerating ? "Generating..." : "Generate Podcast Playlist"}
                    </span>
                  </div>
                </Button>
              </div>
              <Button 
                onClick={resetPodcastGenerator}
                disabled={isGenerating}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-transparent hover:bg-transparent border border-gradient-to-r from-[#1DB95430] via-[#1ED76030] to-[#1DB95430] hover:from-[#1DB95460] hover:via-[#1ED76060] hover:to-[#1DB95460] text-white/70 hover:text-white/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </CardFooter>
          </Card>

          {isGenerating && (
            <div className="space-y-2">
              <Progress 
                value={(currentStep / TOTAL_STEPS) * 100} 
                variant="spotify"
                size="md"
                showPercentage={true}
              />
              <p className="text-xs text-center text-muted-foreground">
                {currentStep === 0 && "Analyzing your podcast interests..."}
                {currentStep === 1 && "Analyzing your podcast interests..."}
                {currentStep === 2 && "Finding podcasts on Spotify..."}
              </p>
            </div>
          )}

          {generatedPodcasts.length > 0 && (
            <Card className={`shadow-lg ${commonCardClasses}`}>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold tracking-tight text-white">
                  {playlistTitle}
                </CardTitle>
                <CardDescription className="text-white/70 mt-1">
                  {playlistDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generatedPodcasts.map((podcast, index) => (
                    <div
                      key={podcast.id}
                      className="flex items-start space-x-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                      onClick={() => handlePodcastClick(podcast)}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#1DB954] to-[#1ED760] rounded-lg flex items-center justify-center">
                          {podcast.images.length > 0 ? (
                            <img
                              src={podcast.images[0].url}
                              alt={podcast.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Mic className="h-8 w-8 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {podcast.name}
                        </h3>
                        <p className="text-sm text-white/60 mb-1">
                          by {podcast.publisher}
                        </p>
                        <p className="text-sm text-white/70 line-clamp-2">
                          {podcast.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          onClick={async () => {
                            try {
                              const showId = podcast.uri.split(':').pop();
                              if (showId) {
                                await spotifyApi.followShows([showId]);
                                toast.success(`Following ${podcast.name}!`);
                              }
                            } catch (error) {
                              const errorMessage = error instanceof Error ? error.message : "Failed to follow podcast.";
                              toast.error(errorMessage);
                            }
                          }}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          Follow
                        </Button>
                        <Button
                          onClick={() => window.open(podcast.uri, '_blank')}
                          size="sm"
                          variant="outline"
                          className="bg-transparent border-[#1DB954]/50 hover:bg-[#1DB954]/20 text-white/80 hover:text-white"
                        >
                          Listen
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-5 border-t border-gradient-to-r from-[#1DB95420] via-[#1ED76020] to-[#1DB95420]">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button 
                    onClick={async () => {
                      try {
                        const showIds = generatedPodcasts.map((podcast) => {
                          const uriParts = podcast.uri.split(':');
                          return uriParts[uriParts.length - 1];
                        });
                        await spotifyApi.followShows(showIds);
                        toast.success("All podcasts followed in your Spotify library!");
                      } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : "Failed to follow podcasts on Spotify.";
                        toast.error(errorMessage);
                      }
                    }}
                    className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 shadow-md hover:shadow-lg"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Follow All on Spotify
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}

          {/* Episodes Modal */}
          <Dialog open={showEpisodesModal} onOpenChange={setShowEpisodesModal}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] bg-neutral-900 border-neutral-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white">
                  {selectedPodcast?.name} Episodes
                </DialogTitle>
                <DialogDescription className="text-neutral-400">
                  Click any episode to listen on Spotify
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 max-h-[60vh] overflow-y-auto">
                {isLoadingEpisodes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1DB954]" />
                    <span className="ml-2 text-white/70">Loading episodes...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {podcastEpisodes.map((episode) => (
                      <div
                        key={episode.id}
                        className="flex items-start space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                        onClick={() => window.open(episode.uri, '_blank')}
                      >
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#1DB954] to-[#1ED760] rounded-lg flex items-center justify-center">
                            {episode.images?.length > 0 ? (
                              <img
                                src={episode.images[0].url}
                                alt={episode.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Mic className="h-6 w-6 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate">
                            {episode.name}
                          </h4>
                          <p className="text-xs text-white/60 mb-1">
                            {new Date(episode.release_date).toLocaleDateString()}
                            {episode.duration_ms && ` • ${Math.round(episode.duration_ms / 60000)} min`}
                          </p>
                          <p className="text-xs text-white/70 line-clamp-2">
                            {episode.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlaylistGenerator;
