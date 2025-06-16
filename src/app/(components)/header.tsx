import { useState } from 'react';
import Logo from '@/components/Logo';
import NavLink from '@/components/NavLink';
import AuthButton from './auth-button';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AppHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-card/90 backdrop-blur-md sticky top-0 z-50 shadow-lg transition-all duration-300 border-b border-primary/10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Logo className="h-8 w-auto text-primary group-hover:scale-105 transition-transform duration-200" aria-label="Indian Rail Connect Logo" />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4" aria-label="Main navigation">
          <NavLink
            href="/"
            className="relative px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors duration-200 group"
          >
            Search Trains
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
          </NavLink>
          <NavLink
            href="/smart-suggestions"
            className="relative px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors duration-200 group"
          >
            Smart Suggestions
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
          </NavLink>
        </nav>

        {/* Right-side Actions (Desktop) */}
        <div className="flex items-center space-x-3">
          <ThemeToggleButton className="p-2 rounded-full hover:bg-primary/10 transition-colors duration-200" />
          <AuthButton className="px-4 py-2 text-sm font-medium" />
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden p-2 hover:bg-primary/10 transition-colors duration-200"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5 text-primary" /> : <Menu className="h-5 w-5 text-primary" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden bg-card/90 backdrop-blur-md border-t border-primary/10 transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <nav className="container mx-auto px-4 py-4 flex flex-col space-y-3" aria-label="Mobile navigation">
          <NavLink
            href="/"
            className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Search Trains
          </NavLink>
          <NavLink
            href="/smart-suggestions"
            className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Smart Suggestions
          </NavLink>
          {/* Mobile Menu Actions */}
          <div className="flex items-center space-x-3 pt-2">
            <ThemeToggleButton
              className="p-2 rounded-full hover:bg-primary/10 transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <AuthButton
              className="px-4 py-2 text-sm font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;