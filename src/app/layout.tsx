
"use client"; // Add "use client" if managing state for chatbot trigger

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/useAuth'; 
import AppHeader from '@/app/(components)/header'; 
import { ThemeProvider } from 'next-themes';
import ChatbotTrigger from '@/components/chatbot/ChatbotTrigger';
import ChatbotSheet from '@/components/chatbot/ChatbotSheet';
import { useState } from 'react';

// export const metadata: Metadata = { // Metadata cannot be used in client component
//   title: 'Indian Rail Connect',
//   description: 'Book your Indian Railways train tickets with ease.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Indian Rail Connect</title>
        <meta name="description" content="Book your Indian Railways train tickets with ease." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppHeader />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="bg-muted text-muted-foreground py-6 text-center">
              <p>&copy; {new Date().getFullYear()} Indian Rail Connect. All rights reserved.</p>
            </footer>
            <Toaster />
            <ChatbotTrigger setIsChatOpen={setIsChatOpen} />
            <ChatbotSheet isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
