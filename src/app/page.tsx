
import TrainSearchForm from '@/components/trains/train-search-form';
import { TrainCard } from '@/components/trains/train-card';
import type { Train } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock data for train search results - Indian context
const MOCK_TRAINS: Train[] = [
  { id: 'T001', trainName: 'Rajdhani Express', trainNumber: '12301', origin: 'New Delhi', destination: 'Mumbai Central', departureTime: '17:00', arrivalTime: '09:00', duration: '16h 00m', price: 2500, availableClasses: ['economy', 'business'] },
  { id: 'T002', trainName: 'Shatabdi Express', trainNumber: '12002', origin: 'Chennai Egmore', destination: 'Bengaluru Cantt', departureTime: '06:00', arrivalTime: '11:00', duration: '5h 00m', price: 1200, availableClasses: ['economy', 'business', 'first'] },
  { id: 'T003', trainName: 'Deccan Queen', trainNumber: '12124', origin: 'Pune Jn', destination: 'Mumbai CST', departureTime: '07:15', arrivalTime: '10:25', duration: '3h 10m', price: 450, availableClasses: ['economy'] },
];

export default function HomePage() {
  const searchResults: Train[] = MOCK_TRAINS; 

  return (
    <div className="space-y-8">
      <section className="bg-card p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-headline font-bold text-primary mb-4">Find Your Next Journey Across India</h1>
        <p className="text-lg text-card-foreground mb-6">
          Search for trains, check availability, and book your tickets hassle-free with Indian Rail Connect.
        </p>
        <TrainSearchForm />
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
                <Button variant="outline" className="w-full">Explore Trains to {dest.city}</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

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
