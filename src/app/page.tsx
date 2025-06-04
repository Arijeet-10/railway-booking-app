
"use client";

import TrainSearchForm, { type TrainSearchFormValues } from '@/components/trains/train-search-form';
import { TrainCard } from '@/components/trains/train-card';
import type { Train } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search } from 'lucide-react';
import { MOCK_TRAINS } from '@/lib/mock-data'; // Import MOCK_TRAINS

export default function HomePage() {
  const [displayedTrains, setDisplayedTrains] = useState<Train[]>(MOCK_TRAINS);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const { toast } = useToast();

  const handleTrainSearch = (values: TrainSearchFormValues) => {
    const { origin, destination } = values;
    // Date is available in values.date if needed for filtering later
    
    const results = MOCK_TRAINS.filter(train => {
      // Case-insensitive and exact match based on autocomplete values
      const originMatch = train.origin.toLowerCase() === origin.toLowerCase();
      const destinationMatch = train.destination.toLowerCase() === destination.toLowerCase();
      return originMatch && destinationMatch;
    });

    setDisplayedTrains(results);
    setSearchPerformed(true);

    if (results.length > 0) {
      toast({
        title: "Search Results Updated",
        description: `Showing trains from ${origin} to ${destination}.`,
      });
    } else {
      toast({
        title: "No Trains Found",
        description: `No trains found for the route from ${origin} to ${destination}. Please try different stations.`,
        variant: "default", 
      });
    }
  };

  return (
    <div className="space-y-8">
      <section className="bg-card p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-headline font-bold text-primary mb-4">Find Your Next Journey Across India</h1>
        <p className="text-lg text-card-foreground mb-6">
          Search for trains, check availability, and book your tickets hassle-free with Indian Rail Connect.
        </p>
        <TrainSearchForm onSearch={handleTrainSearch} />
      </section>
      
      <Separator />

      <section>
        <h2 className="text-3xl font-headline font-semibold mb-6 text-center md:text-left">Popular Destinations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { city: 'New Delhi (NDLS)', hint: 'India Gate', description: "Explore the capital city of India." }, 
            { city: 'Mumbai Central (MMCT)', hint: 'Gateway of India', description: "Discover the financial capital." }, 
            { city: 'Jaipur Jn (JP)', hint: 'Hawa Mahal', description: "Experience the Pink City's charm." }
          ].map(dest => (
            <Card key={dest.city} className="overflow-hidden hover:shadow-xl transition-shadow">
              <Image 
                src={`https://placehold.co/600x400.png`} 
                alt={dest.city} 
                width={600} 
                height={400} 
                className="w-full h-48 object-cover"
                data-ai-hint={dest.hint}
              />
              <CardHeader>
                <CardTitle>{dest.city.split('(')[0].trim()}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{dest.description}</p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleTrainSearch({origin: "Any Station", destination: dest.city, date: new Date()})}
                >
                  Explore Trains to {dest.city.split('(')[0].trim()}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-center md:text-left">
          {searchPerformed ? "Search Results" : "Available Trains"}
        </h2>
        {searchPerformed && displayedTrains.length === 0 && (
          <Alert>
            <Search className="h-4 w-4" />
            <AlertTitle>No Trains Found</AlertTitle>
            <AlertDescription>
              We couldn&apos;t find any trains matching your search criteria for the specified route. Please try different stations or dates.
            </AlertDescription>
          </Alert>
        )}
        {displayedTrains.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedTrains.map((train) => (
              <TrainCard key={train.id} train={train} />
            ))}
          </div>
        )}
         {!searchPerformed && displayedTrains.length === 0 && ( 
             <Alert>
                <Search className="h-4 w-4" />
                <AlertTitle>No Trains Listed</AlertTitle>
                <AlertDescription>
                  There are currently no trains listed. Please try a search.
                </AlertDescription>
            </Alert>
         )}
      </section>
    </div>
  );
}
