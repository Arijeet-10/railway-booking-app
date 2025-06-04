
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

// Mock data for train search results - Indian context
const MOCK_TRAINS: Train[] = [
  { id: 'T001', trainName: 'Rajdhani Express', trainNumber: '12301', origin: 'New Delhi (NDLS)', destination: 'Mumbai Central (MMCT)', departureTime: '17:00', arrivalTime: '09:00', duration: '16h 00m', price: 2500, availableClasses: ['economy', 'business'] },
  { id: 'T002', trainName: 'Shatabdi Express', trainNumber: '12002', origin: 'Chennai Egmore (MS)', destination: 'Bengaluru Cantt (BNC)', departureTime: '06:00', arrivalTime: '11:00', duration: '5h 00m', price: 1200, availableClasses: ['economy', 'business', 'first'] },
  { id: 'T003', trainName: 'Deccan Queen', trainNumber: '12124', origin: 'Pune Jn (PUNE)', destination: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', departureTime: '07:15', arrivalTime: '10:25', duration: '3h 10m', price: 450, availableClasses: ['economy'] },
  { id: 'T004', trainName: 'Coromandel Express', trainNumber: '12841', origin: 'Kolkata Shalimar (SHM)', destination: 'Chennai Central (MAS)', departureTime: '14:50', arrivalTime: '17:00', duration: '26h 10m', price: 1800, availableClasses: ['economy', 'business'] },
  { id: 'T005', trainName: 'Kacheguda Express', trainNumber: '12786', origin: 'KSR Bengaluru City Junction (SBC)', destination: 'Hyderabad Deccan Nampally (HYB)', departureTime: '18:20', arrivalTime: '05:40', duration: '11h 20m', price: 950, availableClasses: ['economy', 'business'] },
  { id: 'T006', trainName: 'Ashram Express', trainNumber: '12915', origin: 'Ahmedabad Jn (ADI)', destination: 'Jaipur Jn (JP)', departureTime: '19:30', arrivalTime: '05:45', duration: '10h 15m', price: 800, availableClasses: ['economy'] },
  { id: 'T007', trainName: 'Tejas Express', trainNumber: '82501', origin: 'Lucknow Charbagh NR (LKO)', destination: 'New Delhi (NDLS)', departureTime: '06:10', arrivalTime: '12:25', duration: '6h 15m', price: 1500, availableClasses: ['business', 'first'] },
  { id: 'T008', trainName: 'North East Express', trainNumber: '12506', origin: 'Anand Vihar Terminal (ANVT)', destination: 'Kamakhya Jn (KYQ)', departureTime: '07:40', arrivalTime: '16:25', duration: '32h 45m', price: 1100, availableClasses: ['economy', 'business'] },
  { id: 'T009', trainName: 'Nagpur Pune Superfast', trainNumber: '12136', origin: 'Nagpur Jn (NGP)', destination: 'Pune Jn (PUNE)', departureTime: '18:00', arrivalTime: '09:45', duration: '15h 45m', price: 1050, availableClasses: ['economy'] },
  { id: 'T010', trainName: 'Marudhar Express', trainNumber: '14854', origin: 'Jaipur Jn (JP)', destination: 'Varanasi Jn (BSB)', departureTime: '13:45', arrivalTime: '06:15', duration: '16h 30m', price: 700, availableClasses: ['economy', 'business'] },
  { id: 'T011', trainName: 'Kalka Mail', trainNumber: '12311', origin: 'Kolkata Howrah Jn (HWH)', destination: 'Kalka (KLK)', departureTime: '19:40', arrivalTime: '04:30', duration: '32h 50m', price: 1750, availableClasses: ['economy', 'business', 'first'] },
  { id: 'T012', trainName: 'Jammu Rajdhani', trainNumber: '12425', origin: 'New Delhi (NDLS)', destination: 'Jammu Tawi (JAT)', departureTime: '20:40', arrivalTime: '05:00', duration: '8h 20m', price: 2200, availableClasses: ['business', 'first'] },
  { id: 'T013', trainName: 'Saraighat Express', trainNumber: '12345', origin: 'Kolkata Howrah Jn (HWH)', destination: 'Guwahati (GHY)', departureTime: '15:50', arrivalTime: '09:50', duration: '18h 00m', price: 1300, availableClasses: ['economy', 'business'] },
  { id: 'T014', trainName: 'Duronto Express', trainNumber: '12273', origin: 'Kolkata Howrah Jn (HWH)', destination: 'New Delhi (NDLS)', departureTime: '08:35', arrivalTime: '06:00', duration: '21h 25m', price: 2800, availableClasses: ['first', 'business'] },
  { id: 'T015', trainName: 'Gitanjali Express', trainNumber: '12860', origin: 'Kolkata Howrah Jn (HWH)', destination: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', departureTime: '13:50', arrivalTime: '21:20', duration: '31h 30m', price: 1900, availableClasses: ['economy', 'business'] },
];

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
        variant: "default", // Changed from destructive to default as it's a valid search outcome
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
            { city: 'New Delhi', hint: 'India Gate', description: "Explore the capital city of India." }, 
            { city: 'Mumbai', hint: 'Gateway of India', description: "Discover the financial capital." }, 
            { city: 'Jaipur', hint: 'Hawa Mahal', description: "Experience the Pink City's charm." }
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
                <CardTitle>{dest.city}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{dest.description}</p>
              </CardContent>
              <CardFooter>
                {/* This button could also trigger a search for this city as destination */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleTrainSearch({origin: "Any Station", destination: dest.city, date: new Date()})}
                >
                  Explore Trains to {dest.city}
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
         {!searchPerformed && displayedTrains.length === 0 && ( // Should not happen if initial is MOCK_TRAINS
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
