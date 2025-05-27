import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-6 px-6 md:px-12 border-t border-border/60 bg-background text-muted-foreground">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between text-sm">
        <p>
          <a 
            href="https://buymeacoffee.com/tristhekitten" 
            target="_blank" 
            rel="noreferrer" 
            className="hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring rounded-sm inline-flex items-center gap-1 py-2 px-3"
          >
            ☕ Buy me a coffee
          </a>
        </p>
        <p className="mt-2 sm:mt-0">
          <a 
            href="https://github.com/TrisTheKitten/AiAlchemy"
            target="_blank" 
            rel="noreferrer" 
            className="hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring rounded-sm py-2 px-3"
          >
            View on GitHub
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
