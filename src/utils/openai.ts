import { generatePlaylistSuggestionsWithGemini, generatePodcastSuggestionsWithGemini } from './gemini';

const cleanAndParseJSON = (rawContent: string): { suggested_tracks: Array<{ trackName: string; artistName: string }>; playlist_title: string; description: string } => {
  let content = rawContent.trim();
  
  // Remove markdown code blocks
  if (content.startsWith("```json")) {
    content = content.substring(7);
  } else if (content.startsWith("```")) {
    content = content.substring(3);
  }
  
  if (content.endsWith("```")) {
    content = content.substring(0, content.length - 3);
  }
  
  content = content.trim();
  
  // Remove invisible characters and normalize whitespace
  content = content
    // Remove BOM and other invisible characters  
    .replace(/\u200B/g, '')
    .replace(/\u200C/g, '')
    .replace(/\u200D/g, '')
    .replace(/\uFEFF/g, '')
    // Replace non-breaking spaces with regular spaces
    .replace(/\u00A0/g, ' ')
    // Replace curly quotes with straight quotes
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    // Remove zero-width characters
    .replace(/\u2060/g, '')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  
  // Try to find JSON object boundaries
  const jsonStart = content.indexOf('{');
  const jsonEnd = content.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    content = content.substring(jsonStart, jsonEnd + 1);
  }
  
  // Common JSON fixes
  content = content
    // Fix trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix missing commas between properties
    .replace(/("\s*:\s*"[^"]*")\s*\n\s*(")/g, '$1,\n  $2')
    .replace(/("\s*:\s*\[[^\]]*\])\s*\n\s*(")/g, '$1,\n  $2')
    // Fix missing commas between array items
    .replace(/}\s*\n\s*{/g, '},\n    {')
    // Fix unescaped quotes in strings
    .replace(/"([^"]*)"([^"]*)"([^",\]:])/g, '"$1\\"$2"$3');
  
  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error("JSON parsing failed. Cleaned content:", content);
    console.error("Content length:", content.length);
    console.error("Content bytes:", [...content].map(c => c.charCodeAt(0)));
    
    // Try a more aggressive approach - rebuild the JSON structure
    try {
      // Extract just the values using regex patterns
      const trackMatches = content.match(/"trackName":\s*"([^"]+)",\s*"artistName":\s*"([^"]+)"/g);
      const titleMatch = content.match(/"playlist_title":\s*"([^"]+)"/);
      const descMatch = content.match(/"description":\s*"([^"]+)"/);
      
      if (trackMatches && titleMatch && descMatch) {
        const tracks = trackMatches.map(match => {
          const trackMatch = match.match(/"trackName":\s*"([^"]+)",\s*"artistName":\s*"([^"]+)"/);
          return {
            trackName: trackMatch?.[1] || '',
            artistName: trackMatch?.[2] || ''
          };
        });
        
        return {
          suggested_tracks: tracks,
          playlist_title: titleMatch[1],
          description: descMatch[1]
        };
      }
    } catch (regexError) {
      console.error("Regex extraction also failed:", regexError);
    }
    
    throw new Error(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
  }
};

// OpenAI API utility
export const generatePlaylistSuggestions = async (
  apiKey: string, 
  selectedModel: string, 
  prompt: string, 
  playlistSize: number, 
  vibeReferenceText?: string,
  advancedSettings?: {
    acoustic: number; // 0 (acoustic) to 1 (electronic)
    energetic: number; // 0 (mellow) to 1 (energetic)
    happy: number;     // 0 (sad) to 1 (happy)
    danceable: number; // 0 (chill) to 1 (danceable)
    popular: number;   // 0 (obscure) to 1 (popular)
  }
) => {
  if (!apiKey) {
    throw new Error(`${selectedModel === 'openai' ? 'OpenAI' : 'Gemini'} API key not found. Please add your API key in settings.`);
  }

  if (selectedModel === 'gemini') {
    // Call the Gemini utility function
    return await generatePlaylistSuggestionsWithGemini(
      apiKey, 
      prompt, 
      playlistSize, 
      vibeReferenceText, 
      advancedSettings
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini-2025-04-14", 
        messages: [
          {
            role: "system",
            content: `You are a sophisticated music curator AI, adept at creating highly personalized Spotify playlists. Your goal is to generate a playlist that deeply resonates with the user's specific request, avoiding generic selections.

Based on the user's prompt${vibeReferenceText ? `, drawing inspiration from the vibe reference '${vibeReferenceText}'` : ''}, and strictly adhering to the advanced audio characteristics, provide the following in JSON format:

1.  A list of ${playlistSize + 3} track suggestions. Each suggestion must be an object with "trackName" and "artistName" properties (e.g., [{ "trackName": "Bohemian Rhapsody", "artistName": "Queen" }]). Name this list "suggested_tracks".
    *   **Prioritize Relevance:** Each track must strongly align with the user's prompt, including genre, mood, and any specific keywords.
    *   **Embrace Uniqueness:** Avoid overly popular or common songs unless they are exceptionally fitting. Seek out hidden gems and diverse artists.
    *   **Ensure Variety:** The list should feature a mix of artists and sounds that collectively satisfy the user's request. Do not repeat artists unless absolutely necessary and justified by the prompt.
2.  A concise and creative playlist title that captures the essence of the prompt. Name this "playlist_title".
3.  A compelling one-sentence description for the playlist, reflecting its unique character. Name this "description".

${vibeReferenceText ? `The vibe reference '${vibeReferenceText}' should serve as an inspirational starting point, but the user's prompt is the definitive guide for the playlist's direction and specific track choices.` : ''}
${advancedSettings ? `
CRITICAL: The following user-defined audio characteristics are MANDATORY and must be precisely reflected in EVERY track selection (values range from 0 to 1, where 0.5 is balanced):

🎵 **Acousticness Level: ${advancedSettings.acoustic.toFixed(2)}** ${advancedSettings.acoustic < 0.3 ? '→ PRIORITIZE: Acoustic instruments, unplugged versions, folk, singer-songwriter tracks' : advancedSettings.acoustic > 0.7 ? '→ PRIORITIZE: Electronic, synthesized, digital production, EDM, techno elements' : '→ BALANCED: Mix of acoustic and electronic elements'}

⚡ **Energy Level: ${advancedSettings.energetic.toFixed(2)}** ${advancedSettings.energetic < 0.3 ? '→ PRIORITIZE: Slow tempo, relaxed, calm, ambient, downtempo tracks' : advancedSettings.energetic > 0.7 ? '→ PRIORITIZE: High tempo, intense, driving, upbeat, powerful tracks' : '→ BALANCED: Moderate energy and tempo'}

😊 **Emotional Tone: ${advancedSettings.happy.toFixed(2)}** ${advancedSettings.happy < 0.3 ? '→ PRIORITIZE: Melancholic, sad, somber, minor keys, emotional tracks' : advancedSettings.happy > 0.7 ? '→ PRIORITIZE: Uplifting, joyful, optimistic, major keys, cheerful tracks' : '→ BALANCED: Neutral to slightly positive emotional tone'}

💃 **Danceability: ${advancedSettings.danceable.toFixed(2)}** ${advancedSettings.danceable < 0.3 ? '→ PRIORITIZE: Non-rhythmic, contemplative, ballads, irregular beats' : advancedSettings.danceable > 0.7 ? '→ PRIORITIZE: Strong beats, club-ready, rhythmic, groove-heavy tracks' : '→ BALANCED: Moderate rhythm and beat emphasis'}

🎯 **Popularity: ${advancedSettings.popular.toFixed(2)}** ${advancedSettings.popular < 0.3 ? '→ PRIORITIZE: Underground, indie, unknown artists, B-sides, deep cuts' : advancedSettings.popular > 0.7 ? '→ PRIORITIZE: Chart hits, mainstream artists, well-known tracks' : '→ BALANCED: Mix of known and lesser-known tracks'}

Every single track MUST match these specifications. If a track doesn't align with these precise characteristics, DO NOT include it. These audio features are non-negotiable and take absolute priority over all other considerations.` : ''}

IMPORTANT: Respond with ONLY valid JSON. Ensure proper comma placement, no trailing commas, and proper string escaping. Do not include any explanatory text before or after the JSON object.

Example format:
{
  "suggested_tracks": [
    { "trackName": "Song Name", "artistName": "Artist Name" }
  ],
  "playlist_title": "Your Playlist Title",
  "description": "Your playlist description"
}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to parse error response from OpenAI" }));
      console.error("OpenAI API Error:", errorData);
      throw new Error(`Failed to get response from OpenAI. Status: ${response.status}. Message: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log("Raw OpenAI response content:", content);

    try {
      const parsedJson = cleanAndParseJSON(content);
      
      if (!parsedJson.suggested_tracks || !Array.isArray(parsedJson.suggested_tracks)) {
        throw new Error("Response missing or invalid 'suggested_tracks' array");
      }
      
      return {
        suggested_tracks: parsedJson.suggested_tracks || [],
        playlist_title: parsedJson.playlist_title || "Generated Playlist",
        description: parsedJson.description || "A playlist generated from your prompt."
      };
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", parseError);
      console.error("Raw content for debugging:", content);
      
      // Fallback response structure
      return {
        suggested_tracks: [],
        playlist_title: "Generated Playlist",
        description: "A playlist generated from your prompt based on the description."
      };
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to analyze your prompt with AI: ${error.message}`);
    }
    throw new Error("Failed to analyze your prompt with AI due to an unknown error.");
  }
};

const cleanPodcastJSON = (rawContent: string): string => {
  let content = rawContent.trim();
  
  // Remove markdown code blocks
  if (content.startsWith("```json")) {
    content = content.substring(7);
  } else if (content.startsWith("```")) {
    content = content.substring(3);
  }
  
  if (content.endsWith("```")) {
    content = content.substring(0, content.length - 3);
  }
  
  content = content.trim();
  
  // Remove invisible characters and normalize whitespace
  content = content
    // Remove BOM and other invisible characters  
    .replace(/\u200B/g, '')
    .replace(/\u200C/g, '')
    .replace(/\u200D/g, '')
    .replace(/\uFEFF/g, '')
    // Replace non-breaking spaces with regular spaces
    .replace(/\u00A0/g, ' ')
    // Replace curly quotes with straight quotes
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    // Replace em dashes and en dashes
    .replace(/[\u2013\u2014]/g, '-')
    // Replace ellipsis
    .replace(/\u2026/g, '...')
    // Remove zero-width characters
    .replace(/\u2060/g, '')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Fix any remaining problematic characters in strings
    .replace(/[^\x20-\x7E\n\r\t]/g, (match) => {
      // Keep common punctuation and replace others with safe alternatives
      const charCode = match.charCodeAt(0);
      if (charCode >= 0x2000 && charCode <= 0x206F) return ' '; // General punctuation
      if (charCode >= 0x2070 && charCode <= 0x209F) return ''; // Superscripts/subscripts
      if (charCode >= 0x20A0 && charCode <= 0x20CF) return '$'; // Currency symbols
      return ''; // Remove other problematic characters
    });
  
  // Try to find JSON object boundaries
  const jsonStart = content.indexOf('{');
  const jsonEnd = content.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    content = content.substring(jsonStart, jsonEnd + 1);
  }
  
  // Common JSON fixes
  content = content
    // Fix trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix missing commas between properties
    .replace(/("\s*:\s*"[^"]*")\s*\n\s*(")/g, '$1,\n  $2')
    .replace(/("\s*:\s*\[[^\]]*\])\s*\n\s*(")/g, '$1,\n  $2')
    // Fix missing commas between array items
    .replace(/}\s*\n\s*{/g, '},\n    {')
    // Fix unescaped quotes in strings - more robust pattern
    .replace(/"([^"\\]*)\\?"([^"\\]*)"([^",\]}\n:])/g, '"$1\\"$2"$3')
    // Fix any remaining unescaped quotes
    .replace(/([^\\])"([^"]*)"([^",\]}\n:])/g, '$1\\"$2"$3');
  
  return content;
};

export const generatePodcastSuggestions = async (
  apiKey: string,
  selectedModel: string,
  prompt: string,
  playlistSize: number
) => {
  if (!apiKey) {
    throw new Error(`${selectedModel === 'openai' ? 'OpenAI' : 'Gemini'} API key not found. Please add your API key in settings.`);
  }

  if (selectedModel === 'gemini') {
    return await generatePodcastSuggestionsWithGemini(apiKey, prompt, playlistSize);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini-2025-04-14",
        messages: [
          {
            role: "system",
            content: `You are an expert podcast curator AI, specialized in creating personalized podcast playlists. Your goal is to recommend podcasts that perfectly match the user's interests and preferences.

Based on the user's interests and preferences, provide the following in JSON format:

1. A list of ${playlistSize} podcast suggestions. Each suggestion must be an object with "podcastName" and "description" properties (e.g., [{ "podcastName": "Serial", "description": "Investigative journalism podcast that tells one story over multiple episodes" }]). Name this list "suggested_podcasts".
   * **Prioritize Relevance:** Each podcast must strongly align with the user's stated interests and preferences.
   * **Ensure Variety:** Include different types of podcasts (interview-style, narrative, educational, etc.) that collectively satisfy the user's interests.
   * **Quality Focus:** Recommend well-produced, popular, and highly-rated podcasts in the specified categories.
   * **Current Recommendations:** Focus on podcasts that are currently active or have significant back catalogs worth exploring.

2. A concise and engaging playlist title that captures the essence of the user's interests. Name this "playlist_title".

3. A compelling one-sentence description for the playlist, explaining what makes this collection special. Name this "description".

IMPORTANT: Respond with ONLY valid JSON. Ensure proper comma placement, no trailing commas, and proper string escaping. Do not include any explanatory text before or after the JSON object.

Example format:
{
  "suggested_podcasts": [
    { "podcastName": "Podcast Name", "description": "Brief description of what this podcast is about" }
  ],
  "playlist_title": "Your Playlist Title",
  "description": "Your playlist description"
}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to parse error response from OpenAI" }));
      console.error("OpenAI API Error:", errorData);
      throw new Error(`Failed to get response from OpenAI. Status: ${response.status}. Message: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log("Raw OpenAI podcast response content:", content);

    try {
      const cleanedContent = cleanPodcastJSON(content);
      const parsedJson = JSON.parse(cleanedContent);
      
      if (!parsedJson.suggested_podcasts || !Array.isArray(parsedJson.suggested_podcasts)) {
        throw new Error("Response missing or invalid 'suggested_podcasts' array");
      }
      
      return {
        suggested_podcasts: parsedJson.suggested_podcasts || [],
        playlist_title: parsedJson.playlist_title || "Generated Podcast Playlist",
        description: parsedJson.description || "A podcast playlist generated from your interests."
      };
    } catch (parseError) {
      console.error("Failed to parse OpenAI podcast response as JSON:", parseError);
      console.error("Raw content for debugging:", content);
      
      return {
        suggested_podcasts: [],
        playlist_title: "Generated Podcast Playlist",
        description: "A podcast playlist generated from your interests."
      };
    }
  } catch (error) {
    console.error("Error calling OpenAI API for podcasts:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to analyze your podcast interests with AI: ${error.message}`);
    }
    throw new Error("Failed to analyze your podcast interests with AI due to an unknown error.");
  }
};


