"use client";

import TrainSearchForm, { type TrainSearchFormValues } from '@/components/trains/train-search-form';
import { TrainCard } from '@/components/trains/train-card';
import type { Train } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Ticket, ShieldCheck, MapPin, ArrowRight } from 'lucide-react';
import { MOCK_TRAINS } from '@/lib/mock-data';
import Link from 'next/link';

// Data for new UI sections
const features = [
  { icon: Ticket, title: "Easy Booking", description: "A seamless, user-friendly booking experience in just a few clicks." },
  { icon: MapPin, title: "Live Tracking", description: "Track your train in real-time and get accurate status updates." },
  { icon: ShieldCheck, title: "Secure Payments", description: "100% secure and PCI-compliant payment gateway for all transactions." },
];

const popularRoutes = [
    { name: "Mumbai to Delhi", image: "/delhi.jpg", searchParams: "origin=Mumbai(CST)&destination=New%20Delhi(NDLS)" },
    { name: "Bangalore to Chennai", image: "/chennai.jpg", searchParams: "origin=Bangalore(SBC)&destination=Chennai(MAS)" },
    { name: "Kolkata to Puri", image: "/kolkata.png", searchParams: "origin=Kolkata(HWH)&destination=Puri(PURI)" },
];

export default function HomePage() {
  const [displayedTrains, setDisplayedTrains] = useState<Train[]>(MOCK_TRAINS.slice(0, 6)); // Show a few trains by default
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null); // Ref for scrolling

  const handleTrainSearch = (values: TrainSearchFormValues) => {
    const { origin, destination } = values;
    const results = MOCK_TRAINS.filter(train => 
      train.origin.toLowerCase() === origin.toLowerCase() && 
      train.destination.toLowerCase() === destination.toLowerCase()
    );

    setDisplayedTrains(results);
    setSearchPerformed(true);
    setSearchQuery(`from ${origin.split('(')[0]} to ${destination.split('(')[0]}`);

    if (results.length > 0) {
      toast({ title: "Search Complete", description: `Showing ${results.length} train(s) for your route.` });
    } else {
      toast({ title: "No Trains Found", description: `No direct trains found for your selected route.`, variant: "default" });
    }
    
    // Scroll to results for a better UX
    setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="space-y-12 bg-gradient-to-b from-slate-50 to-white pb-12">
      {/* --- Hero Section --- */}
      <section className="relative h-[60vh] min-h-[500px] w-full text-white flex flex-col items-center justify-center">
        <Image src="/train-hero.jpg" alt="Train journey in India" layout="fill" objectFit="cover" className="brightness-50 z-0" />
        <div className="relative z-10 text-center p-4">
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline mb-4">Your Journey, Your Way</h1>
            <p className="text-lg md:text-xl text-slate-200 mb-8 max-w-2xl mx-auto">
                Effortlessly book train tickets across India. Simple, fast, and reliable.
            </p>
            <Card className="max-w-4xl mx-auto bg-background/80 backdrop-blur-sm text-card-foreground">
                <CardContent className="p-4 sm:p-6">
                    <TrainSearchForm onSearch={handleTrainSearch} />
                </CardContent>
            </Card>
        </div>
      </section>

      {/* --- Features Section --- */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">Why Book With Us?</h2>
            <p className="text-muted-foreground">The best platform for all your train travel needs.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
                <div key={index} className="text-center p-6">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                        <feature.icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                </div>
            ))}
        </div>
      </section>

      {/* --- Popular Routes Section --- */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">Popular Routes</h2>
            <p className="text-muted-foreground">Explore top routes booked by our travelers.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularRoutes.map((route, index) => (
                <Link key={index} href={`/?${route.searchParams}`} passHref>
                    <Card className="overflow-hidden group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1">
                        <div className="relative h-40 w-full">
                           <Image src={route.image} alt={route.name} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                {route.name} <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </Link>
            ))}
        </div>
      </section>

      <Separator className="container" />

      {/* --- Search Results / Available Trains Section --- */}
      <section ref={resultsRef} className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6 text-center">
          {searchPerformed ? `Search Results: ${searchQuery}` : "Recently Added Trains"}
        </h2>
        {displayedTrains.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedTrains.map((train) => (
              <TrainCard key={train.id} train={train} />
            ))}
          </div>
        ) : (
          <Alert className="max-w-2xl mx-auto">
            <Search className="h-4 w-4" />
            <AlertTitle>No Trains Found</AlertTitle>
            <AlertDescription>
              We couldn't find any direct trains for this route. Please try modifying your search or check for different dates.
            </AlertDescription>
          </Alert>
        )}
      </section>
    </div>
  );
}