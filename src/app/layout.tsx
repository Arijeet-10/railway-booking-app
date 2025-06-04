import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/useAuth'; // Will be created
import AppHeader from '@/app/(components)/header'; // Will be created

export const metadata: Metadata = {
  title: 'RailEase',
  description: 'Book your train tickets with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <AuthProvider>
          <AppHeader />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="bg-muted text-muted-foreground py-6 text-center">
            <p>&copy; {new Date().getFullYear()} RailEase. All rights reserved.</p>
          </footer>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
