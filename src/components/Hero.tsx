import React, { useState, useEffect } from "react";
import LoginButton from "./LoginButton";
import { HeroGeometric } from "./ui/shape-landing-hero";

const AnimatedText: React.FC = () => {
  const words = ["playlist", "soundtrack", "mixtape", "vibe", "experience"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        setTimeout(() => {
          setIsAnimating(false);
        }, 50);
      }, 400);
    }, 4000);

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span className="relative inline-block min-w-[140px] text-center">
      <span 
        className={`gradient-text transition-all duration-500 ease-out inline-block ${
          isAnimating 
            ? 'opacity-0 transform -translate-y-4 scale-95 blur-sm' 
            : 'opacity-100 transform translate-y-0 scale-100 blur-0'
        }`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {words[currentWordIndex]}
      </span>
    </span>
  );
};

const Hero: React.FC = () => {
  return (
    <div className="relative">
      <HeroGeometric 
        badge="built with love by Tris"
        title1="Create the perfect"
        title2={
          <span className="whitespace-nowrap">
            <AnimatedText /> with AI
          </span>
        }
      />
      
      <div className="absolute bottom-8 left-0 right-0 z-20 animate-fade-in flex justify-center" style={{ animationDelay: "1200ms" }}>
        <LoginButton />
      </div>
    </div>
  );
};

export default Hero;
