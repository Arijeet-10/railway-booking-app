
import Logo from '@/components/Logo';
import NavLink from '@/components/NavLink';
import AuthButton from './auth-button';
import { ThemeToggleButton } from '@/components/theme-toggle-button';

const AppHeader = () => {
  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Logo />
        <nav className="hidden md:flex items-center space-x-2">
          <NavLink href="/">Search Trains</NavLink>
          <NavLink href="/smart-suggestions">Smart Suggestions</NavLink>
          {/* More links can be added here */}
        </nav>
        <div className="flex items-center space-x-2">
          <ThemeToggleButton />
          <AuthButton />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
