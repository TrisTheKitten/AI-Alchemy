import React from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  isLoggedIn: boolean;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, onLogout }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-header h-16">
      <div className="max-w-full mx-auto px-6 flex items-center justify-between h-full">
        <div className="flex items-center">
          <div className="flex items-center space-x-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-primary opacity-70 animate-pulse" style={{ animationDelay: '0ms', animationDuration: '1.5s' }}></div>
            <div className="h-3 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms', animationDuration: '1.5s' }}></div>
            <div className="h-2 w-1.5 rounded-full bg-primary opacity-80 animate-pulse" style={{ animationDelay: '600ms', animationDuration: '1.5s' }}></div>
          </div>
          <span className="ml-3 text-xl font-light tracking-wide">
            <span className="bg-gradient-to-r from-[#1DB954] via-[#1ED760] to-[#1DB954] bg-clip-text text-transparent font-medium">
              SongAlchemy
            </span>
          </span>
        </div>
        
        {isLoggedIn && (
          <Button 
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-foreground/80 hover:text-foreground hover:bg-white/5 transition-colors duration-200"
          >
            <LogOut className="h-4 w-4 mr-2 opacity-70" />
            <span className="text-sm font-light">Sign Out</span>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
