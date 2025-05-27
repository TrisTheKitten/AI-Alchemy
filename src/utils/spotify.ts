
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "YOUR_SPOTIFY_CLIENT_ID"; 
const REDIRECT_URI = "http:

const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token"; 
const RESPONSE_TYPE = "code"; 
const SCOPES = [
  "user-read-private", 
  "user-read-email", 
  "playlist-modify-public", 
  "playlist-modify-private",
  "playlist-read-private",
  "user-top-read",
  "user-library-modify"
];


const generateRandomString = (length: number): string => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const sha256 = async (plain: string): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64urlencode = (a: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(a);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\
    .replace(/=+$/, '');
};

const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const hashed = await sha256(codeVerifier);
  return base64urlencode(hashed);
};


export const spotifyAuth = {
  
  getAuthUrl: async () => {
    const codeVerifier = generateRandomString(64);
    
    sessionStorage.setItem('spotify_code_verifier', codeVerifier);
    console.log('Spotify Auth: Code verifier SET in sessionStorage:', codeVerifier);
    
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    return `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPES.join("%20")}&code_challenge_method=S256&code_challenge=${codeChallenge}`;
  },

  
  exchangeCodeForToken: async (code: string) => {
    console.log('Spotify Auth: Attempting to GET code verifier from sessionStorage.');
    const codeVerifier = sessionStorage.getItem('spotify_code_verifier');
    console.log('Spotify Auth: Code verifier RETRIEVED from sessionStorage:', codeVerifier);
    if (!codeVerifier) {
      throw new Error("Code verifier not found in sessionStorage.");
    }

    const payload = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    };

    const response = await fetch(TOKEN_ENDPOINT, payload);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to exchange code for token: ${response.status} ${JSON.stringify(errorData)}`);
    }
    const data = await response.json();
    sessionStorage.removeItem('spotify_code_verifier'); 
    return data; 
  },

  
  getCodeFromUrl: () => {
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get('code');
  },

  
  getErrorFromUrl: () => {
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get('error');
  },

  
  saveToken: (tokenData: { access_token: string, expires_in: number, refresh_token?: string }) => {
    const expiresAt = Date.now() + tokenData.expires_in * 1000;
    localStorage.setItem("spotify_token", tokenData.access_token);
    localStorage.setItem("spotify_token_expires", expiresAt.toString());
    if (tokenData.refresh_token) {
      localStorage.setItem("spotify_refresh_token", tokenData.refresh_token);
    }
  },

  
  getToken: () => {
    const token = localStorage.getItem("spotify_token");
    const expiration = localStorage.getItem("spotify_token_expires");
    
    if (!token || !expiration) return null;
    
    const isExpired = Date.now() > parseInt(expiration);
    if (isExpired) {
      spotifyAuth.clearToken();
      return null;
    }
    
    return token;
  },

  
  clearToken: () => {
    localStorage.removeItem("spotify_token");
    localStorage.removeItem("spotify_token_expires");
  }
};


export const spotifyApi = {
  
  getCurrentUser: async () => {
    const token = spotifyAuth.getToken();
    if (!token) throw new Error("No Spotify token found");
    
    const response = await fetch("https:
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        spotifyAuth.clearToken();
        throw new Error("Spotify token expired");
      }
      throw new Error("Failed to fetch user profile");
    }
    
    return response.json();
  },

  
  getTopTracks: async (limit = 10, time_range = "medium_term") => {
    const token = spotifyAuth.getToken();
    if (!token) throw new Error("No Spotify token found");

    const response = await fetch(`https:
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        spotifyAuth.clearToken();
        throw new Error("Spotify token expired. Please login again.");
      }
      if (response.status === 403) {
        spotifyAuth.clearToken();
        throw new Error("Spotify permission denied (403). Please re-login to grant necessary permissions.");
      }
      throw new Error("Failed to fetch top tracks");
    }
    return response.json();
  },

  
  getTopArtists: async (limit = 10, time_range = "medium_term") => {
    const token = spotifyAuth.getToken();
    if (!token) throw new Error("No Spotify token found");

    const response = await fetch(`https:
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        spotifyAuth.clearToken();
        throw new Error("Spotify token expired. Please login again.");
      }
      if (response.status === 403) {
        spotifyAuth.clearToken();
        throw new Error("Spotify permission denied (403). Please re-login to grant necessary permissions.");
      }
      throw new Error("Failed to fetch top artists");
    }
    return response.json();
  },

  
  getUserPlaylists: async (limit = 20) => {
    const token = spotifyAuth.getToken();
    if (!token) throw new Error("No Spotify token found");

    const response = await fetch(`https:
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        spotifyAuth.clearToken();
        throw new Error("Spotify token expired. Please login again.");
      }
      if (response.status === 403) {
        spotifyAuth.clearToken();
        throw new Error("Spotify permission denied (403). Please re-login to grant necessary permissions.");
      }
      throw new Error("Failed to fetch user playlists");
    }
    return response.json();
  },

  
  getPlaylistTracks: async (playlistId: string, limit = 50) => {
    const token = spotifyAuth.getToken();
    if (!token) throw new Error("No Spotify token found");

    const response = await fetch(`https:
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        spotifyAuth.clearToken();
        throw new Error("Spotify token expired. Please login again.");
      }
      
      throw new Error(`Failed to fetch playlist tracks for playlist ${playlistId}`);
    }
    return response.json(); 
  },

  
  createPlaylist: async (userId: string, name: string, description: string) => {
    const token = spotifyAuth.getToken();
    if (!token) throw new Error("No Spotify token found");
    
    const response = await fetch(`https:
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        description,
        public: false
      })
    });
    
    if (!response.ok) throw new Error("Failed to create playlist");
    
    return response.json();
  },

  
  addTracksToPlaylist: async (playlistId: string, trackUris: string[]) => {
    const token = spotifyAuth.getToken();
    if (!token) throw new Error("No Spotify token found");
    
    const response = await fetch(`https:
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        uris: trackUris
      })
    });
    
    if (!response.ok) throw new Error("Failed to add tracks to playlist");
    
    return response.json();
  },

  
  searchTracks: async (query: string, limit = 1) => { 
    const token = spotifyAuth.getToken();
    if (!token) throw new Error("No Spotify token found");
    
    const response = await fetch(`https:
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error("Failed to search tracks");
    
    const data = await response.json();
    return data.tracks?.items || []; 
  },

  
  searchArtists: async (artistName: string, limit = 1) => {
    const token = spotifyAuth.getToken();
    if (!token) throw new Error("No Spotify token found");

    const response = await fetch(`https:
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Spotify API Error Searching Artists:", errorBody);
      throw new Error(`Failed to search artists: ${artistName}. Status: ${response.status}. Body: ${errorBody}`);
    }

    const data = await response.json();
    return data.artists?.items || []; 
  },

  
  deletePlaylist: async (playlistId: string) => {
    const token = spotifyAuth.getToken();
    if (!token) throw new Error("No Spotify token found");
    
    const response = await fetch(`https:
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        spotifyAuth.clearToken();
        throw new Error("Spotify token expired. Please login again.");
      }
      if (response.status === 403) {
        throw new Error("You don't have permission to delete this playlist.");
      }
      if (response.status === 404) {
        throw new Error("Playlist not found.");
      }
      throw new Error("Failed to delete playlist");
    }
    
    return true;
  },

  
  searchPodcasts: async (query: string, limit = 10) => {
    const token = spotifyAuth.getToken();
    if (!token) throw new Error("No Spotify token found");
    
    const response = await fetch(`https:
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        spotifyAuth.clearToken();
        throw new Error("Spotify token expired. Please login again.");
      }
      throw new Error("Failed to search podcasts");
    }
    
    const data = await response.json();
    return data.shows?.items || [];
  },

  
  getPodcastEpisodes: async (showId: string, limit = 20) => {
    const token = spotifyAuth.getToken();
    if (!token) throw new Error("No Spotify token found");
    
    const response = await fetch(`https:
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        spotifyAuth.clearToken();
        throw new Error("Spotify token expired. Please login again.");
      }
      throw new Error("Failed to get podcast episodes");
    }
    
    const data = await response.json();
    return data.items || [];
  },

  
  followShows: async (showIds: string[]) => {
    const token = spotifyAuth.getToken();
    if (!token) throw new Error("No Spotify token found");
    
    const response = await fetch(`https:
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        spotifyAuth.clearToken();
        throw new Error("Spotify token expired. Please login again.");
      }
      if (response.status === 403) {
        throw new Error("Insufficient permissions. Please re-login to grant library access.");
      }
      const errorText = await response.text();
      console.error("Follow shows error:", response.status, errorText);
      throw new Error(`Failed to follow shows: ${response.status}`);
    }
    
    return true;
  }
};
