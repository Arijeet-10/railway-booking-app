"use client";

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, UserCircle, Ticket, Lightbulb, Loader2, BarChart3 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const AuthButton = ({ className, onClick }) => {
  const { user, loading, rawUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged out", description: "You have been successfully logged out." });
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: "Could not log you out. Please try again.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled className={className}>
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </Button>
    );
  }

  if (user) {
    const initial = user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={`relative h-10 w-10 rounded-full group ${className}`} onClick={onClick}>
            <Avatar className="h-10 w-10 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-200">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-medium">
                {initial}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60 bg-card/90 backdrop-blur-md border-primary/10 rounded-xl shadow-xl mt-2" align="end" forceMount>
          <DropdownMenuLabel className="font-normal px-4 py-3">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold text-foreground truncate">{user.displayName || "User Profile"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-primary/10" />
          <DropdownMenuItem asChild className="group px-4 py-2">
            <Link href="/profile" className="flex items-center text-sm text-foreground hover:text-primary transition-colors duration-200">
              <UserCircle className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-transform duration-200" />
              Profile
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="group px-4 py-2">
            <Link href="/bookings" className="flex items-center text-sm text-foreground hover:text-primary transition-colors duration-200">
              <Ticket className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-transform duration-200" />
              My Bookings
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="group px-4 py-2">
            <Link href="/analytics" className="flex items-center text-sm text-foreground hover:text-primary transition-colors duration-200">
              <BarChart3 className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-transform duration-200" />
              Analytics
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="group px-4 py-2">
            <Link href="/smart-suggestions" className="flex items-center text-sm text-foreground hover:text-primary transition-colors duration-200">
              <Lightbulb className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-transform duration-200" />
              Smart Suggestions
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-primary/10" />
          {!rawUser?.emailVerified && (
            <DropdownMenuItem disabled className="text-xs text-destructive px-4 py-2">
              Email not verified
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive/10 px-4 py-2 group"
          >
            <LogOut className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
            Log out
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-destructive to-destructive scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={`space-x-2 ${className}`} onClick={onClick}>
      <Button
        asChild
        variant="outline"
        className="px-4 py-2 text-sm font-medium border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all duration-200"
      >
        <Link href="/login">Login</Link>
      </Button>
      <Button
        asChild
        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
      >
        <Link href="/signup">Sign Up</Link>
      </Button>
    </div>
  );
};

export default AuthButton;