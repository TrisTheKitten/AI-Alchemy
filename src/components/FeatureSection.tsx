import React from "react";
import { useId } from "react";

const FeatureSection: React.FC = () => {
  return (
    <div className="py-20 lg:py-40 bg-gradient-to-br from-slate-900 via-green-950/30 to-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
          Generate playlists with the power of AI
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 md:gap-2">
          {grid.map((feature) => (
            <div
              key={feature.title}
              className="relative bg-gradient-to-b from-card to-background p-6 rounded-3xl overflow-hidden border border-border/20 group transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:border-primary/30 hover:-translate-y-1 before:absolute before:inset-0 before:opacity-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:group-hover:opacity-100 before:transition-opacity before:duration-300"
            >
              <Grid size={20} />
              <p className="text-base font-bold text-foreground relative z-20 group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </p>
              <p className="text-muted-foreground mt-4 text-base font-normal relative z-20 group-hover:text-muted-foreground/90 transition-colors duration-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const grid = [
  {
    title: "Describe Your Vibe",
    description:
      "Use natural language to describe any mood, activity, or feeling you want to soundtrack.",
  },
  {
    title: "AI-Powered Curation",
    description:
      "Our AI analyzes your prompt to understand moods and musical elements that match your description.",
  },
  {
    title: "Fine-tune Your Experience",
    description:
      "Adjust parameters like energy, danceability and popularity to refine your playlist to perfection.",
  },
  {
    title: "Save to Spotify",
    description:
      "Keep your generated playlist by saving it directly to your Spotify account with a single click.",
  },
  {
    title: "Discover New Music",
    description:
      "Expand your musical horizons with AI-suggested tracks that match your taste but might be new to you.",
  },
  {
    title: "Mood Analysis",
    description:
      "Our algorithm interprets emotional cues in your prompts to create playlists that truly reflect your desired mood.",
  },
  {
    title: "Genre Blending",
    description:
      "Seamlessly mix multiple genres and eras to create unique playlist experiences that cross musical boundaries.",
  },
  {
    title: "Playlist Sharing",
    description:
      "Share your AI-generated playlists with friends or on social media with easy export and sharing options.",
  },
];

const Grid = ({
  pattern,
  size,
}: {
  pattern?: number[][];
  size?: number;
}) => {
  // Generate random patterns with unique coordinates to avoid duplicate key errors
  const p = pattern ?? [
    [7, 1],
    [8, 2],
    [9, 3],
    [10, 4],
    [11, 5],
  ];
  return (
    <div className="pointer-events-none absolute left-1/2 top-0  -ml-20 -mt-2 h-full w-full [mask-image:linear-gradient(white,transparent)]">
      <div className="absolute inset-0 bg-gradient-to-r  [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] dark:from-zinc-900/30 from-zinc-100/30 to-zinc-300/30 dark:to-zinc-900/30 opacity-100">
        <GridPattern
          width={size ?? 20}
          height={size ?? 20}
          x="-12"
          y="4"
          squares={p}
          className="absolute inset-0 h-full w-full  mix-blend-overlay dark:fill-white/10 dark:stroke-white/10 stroke-black/10 fill-black/10"
        />
      </div>
    </div>
  );
};

interface GridPatternProps {
  width: number;
  height: number;
  x: string;
  y: string;
  squares?: number[][];
  className?: string;
  [key: string]: unknown;
}

function GridPattern({ width, height, x, y, squares, ...props }: GridPatternProps) {
  const patternId = useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([squareX, squareY]: [number, number]) => (
            <rect
              strokeWidth="0"
              key={`${squareX}-${squareY}`}
              width={width + 1}
              height={height + 1}
              x={squareX * width}
              y={squareY * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}

export default FeatureSection;
