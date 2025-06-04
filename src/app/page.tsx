import TrainSearchForm from '@/components/trains/train-search-form';
import { TrainCard } from '@/components/trains/train-card';
import type { Train } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

// Mock data for train search results
const MOCK_TRAINS: Train[] = [
  { id: 'T001', trainName: 'Capital Express', trainNumber: '12001', origin: 'New York', destination: 'Washington D.C.', departureTime: '08:00', arrivalTime: '11:30', duration: '3h 30m', price: 75, availableClasses: ['economy', 'business'] },
  { id: 'T002', trainName: 'Coastal Liner', trainNumber: '12002', origin: 'Los Angeles', destination: 'San Francisco', departureTime: '10:00', arrivalTime: '18:00', duration: '8h 00m', price: 120, availableClasses: ['economy', 'business', 'first'] },
  { id: 'T003', trainName: 'Metro Shuttle', trainNumber: '12003', origin: 'Chicago', destination: 'Milwaukee', departureTime: '14:30', arrivalTime: '16:00', duration: '1h 30m', price: 30, availableClasses: ['economy'] },
];

// This page will be server-rendered, but the form interactions and search results display might involve client components or state.
// For now, we'll display mock results after a "search".
export default function HomePage() {
  // In a real app, this would be stateful and fetched based on form submission.
  const searchResults: Train[] = MOCK_TRAINS; // Replace with actual search logic later

  return (
    <div className="space-y-8">
      <section className="bg-card p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-headline font-bold text-primary mb-4">Find Your Next Journey</h1>
        <p className="text-lg text-card-foreground mb-6">
          Search for trains, check availability, and book your tickets hassle-free with RailEase.
        </p>
        <TrainSearchForm />
      </section>
      
      <Separator />

      <section>
        <h2 className="text-3xl font-headline font-semibold mb-6 text-center md:text-left">Popular Destinations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { city: 'New York', hint: 'city skyline' }, 
            { city: 'Paris', hint: 'Eiffel Tower' }, 
            { city: 'Tokyo', hint: 'city street' }
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
                <p className="text-muted-foreground">Explore the vibrant city of {dest.city}.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Explore Trains to {dest.city}</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* This part would typically show after a search */}
      {searchResults.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-center md:text-left">Available Trains</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((train) => (
              <TrainCard key={train.id} train={train} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Need to create these components next:
// - TrainSearchForm
// - TrainCard
// - (Potentially a separate page or modal for search results)
// For now, Card, CardHeader etc. are from ShadCN
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

